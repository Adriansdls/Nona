"""
Intel agent — agentic tool-use loop with Pydantic validation retry.

Call sequence enforced by system prompt:
  classify_breed → get_municipality_profile → query_terrain (×2) → get_weather_context → submit_*

Terminal tools (submit_intel, submit_insufficient_data) are parsed via Pydantic.
Validation errors are fed back as tool_result errors — Claude retries with specific field fixes.
"""
from __future__ import annotations

import json
import logging
from typing import Any

import anthropic
from pydantic import ValidationError

from .models import BehavioralPhase, CoordQuality, InsufficientData, IntelRequest, SearchIntel
from .tools import INTEL_TOOL_DEFINITIONS, compute_behavioral_phase, execute_intel_tool

log = logging.getLogger(__name__)

MAX_TURNS = 9

SYSTEM_PROMPT = """És um agente especialista em busca de cães desaparecidos no Algarve, Portugal.

## Sequência obrigatória de ferramentas

Chama as ferramentas NESTA ORDEM antes de submeter:
1. classify_breed(breed, size) — determina raio de busca e comportamento por raça
2. get_municipality_profile(municipality) — obtém riscos de terreno documentados pelos Bombeiros
3. lookup_local_resources(municipality) — canils e vets reais na zona (base de dados viva)
4. query_terrain(lat, lng, radius_km, feature_types=["wells","waterways"]) — dados OSM de água
5. query_terrain(lat, lng, radius_km, feature_types=["railway","primary_roads"]) — dados OSM de estradas
6. get_weather_context(lat, lng) — temperatura e condições actuais
7. [Opcional] discover_resources(municipality, "vet", lat, lng) — só se lookup_local_resources retornou vets vazios
8. submit_intel(...) OU submit_insufficient_data(...)

NÃO saltes passos. NÃO inventes dados de terreno.

## Regras de evidência (CRÍTICO)

- Cada zona (SearchZone) e cada risco (TerrainHazard) EXIGE pelo menos uma EvidenceRef.
- A fonte deve ser o nome da ferramenta que retornou o dado OU uma citação de estudo específico.
- Exemplos válidos: "classify_breed:podenco→sighthound", "get_municipality_profile:Lagos",
  "Overpass/OSM — waterway stream 1.4km NE", "Bombeiros de Lagos — resgate poço 12m",
  "Albrecht/MAR 2018 IAABC", "Lord et al. 2007 JAVMA 230(2):211"
- NUNCA faças afirmações sem evidência. Melhor confidence=low com evidências citadas do que
  confidence=high com afirmações genéricas.

## Regras para dados de poços OSM

Se query_terrain retornar 0 poços:
- NÃO digas "sem poços na área"
- DI: "OSM não tem dados de poços cartografados para esta área rural"
- Usa os dados de get_municipality_profile como fonte primária para riscos de poços

## Regras de confiança

- confidence=high: dados de terreno Overpass retornaram resultados E raça classificada
- confidence=medium: raça classificada mas dados Overpass escassos
- confidence=low: lacunas significativas de dados — honesto e útil, não falso

## Regras para stolen/theft

Se suspected_theft=true, adiciona a warnings:
"ATENÇÃO: Se furto suspeito, probabilidade de recuperação 70% menor (Lord et al. 2007 JAVMA).
Contactar GNR/PSP imediatamente. Não depender apenas de buscas de terreno."

## Regras para xenophobic/aloof

Se temperament=xenophobic ou sighthound:
Adiciona a warnings: "NÃO chamar o cão pelo nome — em estado de fuga/pânico, a voz familiar
aumenta a velocidade de fuga. Usar objecto branco grande em movimento lateral."

## Linguagem

Toda a output (brief, instrutions, checkpoints, hazard labels, warnings) em PORTUGUÊS EUROPEU.
Não uses PT-BR. Usa: "perdido" não "desaparecido" no brief, "á" não "a" em contexto de "para a".

## Zona de busca

Usa o raio de classify_breed como base para Zona quente (rose).
Zona morna (amber): 2× raio quente.
Zona fria (blue): 3× raio quente ou maior apenas se dados justificarem.
Máximo 3 zonas.

## submit_intel

Chama submit_intel apenas quando tiveres chamado TODAS as 5 ferramentas acima.
Se a validação falhar com erro de schema, corrige os campos específicos e resubmete.
"""


_PHASE_CONTEXT: dict[BehavioralPhase, str] = {
    BehavioralPhase.panic: (
        "FASE PÂNICO (0-24h): Alta mobilidade, movimento errático por medo. "
        "Cão em fuga activa — pode estar longe do ponto inicial. Prioridade máxima."
    ),
    BehavioralPhase.survival: (
        "FASE SOBREVIVÊNCIA (24h-7d): Território a contrair, procura de abrigo e água. "
        "Verificar esconderijos, sombra e fontes de água. Comportamento mais previsível."
    ),
    BehavioralPhase.recovery: (
        "FASE RECUPERAÇÃO (7d+): Raio contrai, possível adopção temporária por civis. "
        "Expandir procura de informação — cartazes, veterinários, associações locais."
    ),
}

_COORD_QUALITY_CONTEXT: dict[CoordQuality, str] = {
    CoordQuality.geocoded: "COORDENADAS: geocodificadas com precisão de endereço.",
    CoordQuality.centroid_fallback: (
        "COORDENADAS: centróide do município (fallback) — precisão ±5km. "
        "confidence NÃO pode ser 'high'. Indica no brief que as coordenadas são aproximadas."
    ),
    CoordQuality.unknown: "COORDENADAS: qualidade desconhecida — tratar como aproximadas.",
}


def _build_user_message(request: IntelRequest) -> str:
    sightings_block = ""
    if request.sightings:
        lines = []
        for i, s in enumerate(request.sightings, 1):
            h = s.hours_ago
            h_str = "menos de 1h" if h < 1 else f"{round(h)}h atrás"
            direction = f" (direção: {s.direction})" if s.direction else ""
            desc = f' — "{s.description}"' if s.description else ""
            lines.append(f"{i}. {h_str} — {s.zone}, {s.municipality}{direction}{desc}")
        sightings_block = f"\n\nAVISTAMENTOS ({len(request.sightings)}):\n" + "\n".join(lines)
    else:
        sightings_block = "\n\nSem avistamentos confirmados."

    h = request.hours_elapsed
    h_str = "menos de 1 hora" if h < 1 else f"{round(h)} horas"
    theft_str = " [POSSÍVEL FURTO]" if request.suspected_theft else ""
    phase = compute_behavioral_phase(request.hours_elapsed)
    phase_ctx = _PHASE_CONTEXT[phase]
    coord_ctx = _COORD_QUALITY_CONTEXT[request.coord_quality]

    return f"""CASO DE BUSCA{theft_str}:
- ID: {request.case_id} | Slug: {request.slug}
- Cão: {request.breed} | Tamanho: {request.size} | Tipo: {request.type}
- Município: {request.municipality} | Zona: {request.zone_approx}
- Coordenadas: {request.lat}, {request.lng}
- Desaparecido há: {h_str}
- Descrição: {request.description or "sem informação adicional"}
- Furto suspeito: {"sim" if request.suspected_theft else "não"}

FASE COMPORTAMENTAL: {phase.value.upper()} — {phase_ctx}
{coord_ctx}
{sightings_block}

No campo behavioral_phase de submit_intel, usa: "{phase.value}"

Inicia com classify_breed, depois get_municipality_profile, depois query_terrain (×2), depois get_weather_context, depois submit_intel."""


FALLBACK_INSUFFICIENT = InsufficientData(
    reason="Falha interna no agente — máximo de iterações atingido sem submissão",
    what_was_tried=["Agente iniciou mas não completou a sequência de ferramentas"],
    what_was_missing=["Output do agente"],
    partial_context="Iniciar busca sistemática em raios concêntricos a partir do último ponto visto.",
)


MANDATORY_TOOLS = {"classify_breed", "get_municipality_profile", "lookup_local_resources", "query_terrain", "get_weather_context"}


async def run_intel_agent(request: IntelRequest) -> SearchIntel | InsufficientData:
    client = anthropic.AsyncAnthropic()
    messages: list[dict[str, Any]] = [
        {"role": "user", "content": _build_user_message(request)}
    ]
    called_tools: set[str] = set()

    for turn in range(MAX_TURNS):
        response = await client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            messages=messages,
            tools=INTEL_TOOL_DEFINITIONS,  # type: ignore[arg-type]
            tool_choice={"type": "auto"},
        )

        # Append assistant turn
        serialized_content = []
        for block in response.content:
            if hasattr(block, "model_dump"):
                serialized_content.append(block.model_dump())
            else:
                serialized_content.append(block)
        messages.append({"role": "assistant", "content": serialized_content})

        if response.stop_reason == "end_turn":
            log.warning("Intel agent ended turn without submitting intel (turn %d)", turn)
            break

        tool_results = []
        for block in response.content:
            if not hasattr(block, "type") or block.type != "tool_use":
                continue

            tool_name: str = block.name
            tool_input: dict[str, Any] = block.input  # type: ignore[assignment]
            tool_use_id: str = block.id

            if tool_name == "query_terrain" and "classify_breed" not in called_tools:
                # Dependency: query_terrain radius must come from classify_breed result.
                # Reject and force correct order.
                log.warning("Agent called query_terrain before classify_breed")
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tool_use_id,
                    "content": (
                        "Rejected: call classify_breed first to get the breed-specific radius_km. "
                        "query_terrain radius must be derived from classify_breed result, not a default."
                    ),
                    "is_error": True,
                })
                continue

            if tool_name in ("submit_intel", "submit_insufficient_data"):
                missing = MANDATORY_TOOLS - called_tools
                if missing and tool_name == "submit_intel":
                    log.warning("Agent tried submit_intel before calling: %s", missing)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": tool_use_id,
                        "content": (
                            f"Rejected: mandatory tools not yet called: {sorted(missing)}. "
                            "Call them first, then resubmit."
                        ),
                        "is_error": True,
                    })
                    continue

                model_cls = SearchIntel if tool_name == "submit_intel" else InsufficientData
                try:
                    result = model_cls.model_validate(tool_input)
                    log.info(
                        "Intel agent submitted %s on turn %d (tools called: %s)",
                        tool_name, turn, sorted(called_tools),
                    )
                    return result
                except ValidationError as exc:
                    error_json = exc.json()
                    log.warning("Pydantic validation failed for %s: %s", tool_name, error_json[:200])
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": tool_use_id,
                        "content": (
                            f"Validation failed. Fix these specific field errors and resubmit:\n"
                            f"{error_json}\n"
                            f"Resubmit {tool_name} with corrected fields."
                        ),
                        "is_error": True,
                    })
                    continue
            else:
                called_tools.add(tool_name)
                output = await execute_intel_tool(tool_name, tool_input)
                log.debug("Tool %s returned: %s", tool_name, output[:100])
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tool_use_id,
                    "content": output,
                })

        if tool_results:
            messages.append({"role": "user", "content": tool_results})

    log.error("Intel agent exhausted %d turns without submitting", MAX_TURNS)
    return FALLBACK_INSUFFICIENT
