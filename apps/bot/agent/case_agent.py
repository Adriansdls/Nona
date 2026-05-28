"""
CaseAgent — the PI detective assigned to each case.

Owns the case end-to-end. Acts without waiting for the owner.
Runs on: case INSERT, sighting INSERT, 6h escalation sweep, or manual trigger.
"""
from __future__ import annotations

import json
import logging
import os
import pathlib
import sys
from datetime import datetime, timedelta, timezone

sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))

import anthropic
from supabase import Client

from agent.harness import CaseHarness
from agent.pi_tools import PI_TOOL_DEFINITIONS, execute_pi_tool

log = logging.getLogger(__name__)

MAX_TURNS = 10
MODEL = "claude-sonnet-4-6"
THROTTLE_MINUTES = 30

_PI_SYSTEM_PROMPT = """És um investigador privado especializado em recuperação de cães perdidos no Algarve.

Tens um caso. Ninguém mais vai agir. Tens de agir TU.

## Identidade

Não és um assistente. Não esperas por permissão. Não pedes confirmação.
Quando vês uma acção por fazer, fazes-a. Registas o que fizeste. Avalias o resultado.
Se uma acção já foi feita (em ACTIONS ALREADY TAKEN), não repetes.

## O que fazes neste ciclo

1. Lê o contexto do caso: CASE, HOURS ELAPSED, BEHAVIORAL PHASE (WP9), ACTION GATE, ACTIONS ALREADY TAKEN.
2. PRIMEIRO: lê o ACTION GATE. Se CROWD_RESPONSE: BLOCKED, nunca alertas voluntários para convergir na zona.
   Se SIGHTING_BROADCAST: BLOCKED ou PRIVATE, nunca partilhas localização em canais públicos.
   Se NAME_CALLING: BLOCKED, sempre incluis esta instrução ao dono nas mensagens.
3. Decides quais acções ainda não foram feitas e que devem ser feitas agora.
4. Chamas as ferramentas correspondentes — sem pedir aprovação.
5. Terminas SEMPRE com update_case_assessment: o que fizeste, o que planeias a seguir.

## Action Gate — regras críticas (WP9)

O ACTION GATE é o mecanismo mais importante do sistema. Causa mortes quando ignorado.
- Galgo ou cão xenofóbico: protocolo passivo OBRIGATÓRIO. Crowd convergence → deslocação fatal.
  Caso documentado: galgo deslocado 7 milhas em 1 hora por grupo de socorro bem-intencionado.
- CROWD_RESPONSE BLOCKED: máximo 1-2 pessoas silenciosas. Nunca grupos.
- SIGHTING BLOCKED/PRIVATE: avistamentos só para coordenador, nunca redes sociais.
- NAME_CALLING BLOCKED: chamar o nome condiciona o cão a fugir — mesmo do dono.
- Estação de alimentação + câmara = acção correta para qualquer cão com action gate activo.

Quando o dono reporta "chamei o nome mas o cão fugiu" → usa update_behavioral_assessment
com add_conditioning_events=["name_conditioned"] imediatamente.

## Prioridades por fase (WP9 phases)

PHASE_1_ACUTE (primeiras horas — apenas cães gregários/oportunistas):
Velocidade máxima. Notifica canils, vets, voluntários. Posta grupos locais.
Envia ao dono: instruções de âncora de odor + "nunca perseguir".

PHASE_2_SURVIVAL (survival mode — galgo desde minuto 0, outros após 4-72h):
Protocolo passivo. Estação de alimentação + câmara. Armadilha humana.
Dono NÃO deve procurar activamente — estação de alimentação substitui a busca.
Dono deve ir FISICAMENTE ao canil cada 48h (Lord 2007 JAVMA: 2.1× mais recuperações).

PHASE_3_ENTRENCHED (7d+):
Raio expandido a 60km. Cross-posting regional. Cold case assessment.
Cão provavelmente adoptado informalmente — verificar adopções recentes.

## Regras

- Nunca repitas a mesma acção (verifica ACTIONS ALREADY TAKEN antes de agir).
- Usa os dados reais do KB: "Canil Municipal de Lagos, 282 780 900" — nunca "o canil local".
- Sê directo nas mensagens ao dono — fora de filler.
- ACTION GATE vem antes de tudo — nunca violares os bloqueios.
- Toda a comunicação ao dono em PT-PT, tom profissional mas humano.
"""


async def run_case_agent(
    case_id: str,
    db: Client,
    trigger: str = "manual",
) -> None:
    """
    Run one PI agent cycle for a case.

    Args:
        trigger: 'case_created' | 'sighting_added' | 'escalation_sweep' | 'manual'
    """
    try:
        harness = CaseHarness(case_id, db)
    except Exception as exc:
        log.error("CaseHarness load failed", case_id=case_id, error=str(exc))
        return

    if harness.case.get("agent_state") == "resolved":
        return

    # Throttle: skip if agent ran in the last THROTTLE_MINUTES (except initial case_created)
    if trigger != "case_created":
        recent = (
            db.table("case_agent_events")
            .select("created_at")
            .eq("case_id", case_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if recent.data:
            last_at = datetime.fromisoformat(recent.data[0]["created_at"])
            if last_at.tzinfo is None:
                last_at = last_at.replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) - last_at < timedelta(minutes=THROTTLE_MINUTES):
                log.info("Agent throttled — ran recently", case_id=case_id, trigger=trigger)
                return

    harness.set_agent_state("planning")

    context_block = harness.build_context_block()
    trigger_note = {
        "case_created": "TRIGGER: Caso acabou de ser criado. Este é o ciclo do Dia 1. Age agora.",
        "sighting_added": "TRIGGER: Novo avistamento registado. Re-analisa e ajusta o plano.",
        "escalation_sweep": "TRIGGER: Verificação de escalada periódica. Avalia progresso e age se necessário.",
        "cold_case": "TRIGGER: Caso entrou em fase COLD (7d+ sem avistamentos). Executa cold_case_assessment e expand_shelter_radius. Não desistas — cães em recuperação continuam a ser encontrados.",
        "geo_sighting_nearby": "TRIGGER: Novo avistamento noutra caso na mesma zona. Verifica se é relevante para este caso (mesma raça/cor?) e age em conformidade.",
        "daily_briefing": "TRIGGER: Briefing diário das 9h. Envia ao dono um resumo do que foi feito nas últimas 24h e o que está planeado a seguir. Usa send_owner_brief. Não repitas acções já feitas hoje.",
        "manual": "TRIGGER: Ciclo manual.",
    }.get(trigger, f"TRIGGER: {trigger}")

    user_message = f"{context_block}\n\n{trigger_note}"

    client = anthropic.AsyncAnthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    messages: list[dict] = [{"role": "user", "content": user_message}]

    # Phase-filtered palette + assessment always available
    palette = set(harness.tool_palette())
    palette.add("update_case_assessment")
    active_tools = [t for t in PI_TOOL_DEFINITIONS if t["name"] in palette]

    log.info(
        "PI agent starting",
        case_id=case_id,
        trigger=trigger,
        phase=harness.phase.value,
        tools=len(active_tools),
    )

    for turn in range(MAX_TURNS):
        response = await client.messages.create(
            model=MODEL,
            max_tokens=2048,
            system=_PI_SYSTEM_PROMPT,
            messages=messages,  # type: ignore[arg-type]
            tools=active_tools,  # type: ignore[arg-type]
        )

        if response.stop_reason == "end_turn":
            log.info("PI agent end_turn", case_id=case_id, turns=turn + 1)
            break

        if response.stop_reason == "tool_use":
            messages.append({"role": "assistant", "content": response.content})
            tool_results = []
            for block in response.content:
                if block.type != "tool_use":
                    continue
                try:
                    result = await execute_pi_tool(
                        block.name,
                        block.input,  # type: ignore[arg-type]
                        harness,
                        db,
                    )
                except Exception as exc:
                    result = json.dumps({"error": str(exc)})
                    log.error("PI tool error", tool=block.name, error=str(exc))
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": result,
                })
            messages.append({"role": "user", "content": tool_results})

    new_state = "escalated" if harness.should_escalate() else "active"
    harness.set_agent_state(new_state)
    log.info("PI agent done", case_id=case_id, agent_state=new_state, trigger=trigger)
