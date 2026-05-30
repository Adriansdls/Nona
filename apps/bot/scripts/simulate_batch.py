#!/usr/bin/env python3
"""
Nona end-to-end simulation runner.

Submits 20 realistic lost/found dog cases against the live Vercel deployment.
Streams full SSE conversations, collects case slugs, scenarios, action gates.
Writes results to /tmp/nona_sim_results.json and tails production Supabase for PI agent events.

Usage:
    SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... python scripts/simulate_batch.py
    python scripts/simulate_batch.py --url https://nona-deploy-xxx.vercel.app --workers 4
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from typing import Any

import httpx

PROD_URL = os.environ.get("NONA_URL", "https://nona-deploy-2e7vwzlol-find-nona.vercel.app")

# 20 realistic scenarios covering all WP9/10/12/13 decision branches
SCENARIOS: list[dict[str, Any]] = [
    # ── Galgo / Podenco / Xenophobic → all gates blocked ──────────────────────
    {
        "id": 1,
        "label": "galgo_loulé_trovoada",
        "turns": [
            "Perdi a minha galga Lua em Loulé ontem durante uma trovoada. Ela é branca com manchas castanhas, nunca esteve perto de estranhos e entra em pânico com qualquer barulho. Estava solta no jardim quando fugiu.",
            "Ela tem 4 anos, nunca se perdeu antes. Estava no jardim quando caiu um trovão e saltou o muro. A zona é semi-urbana, perto da EN125.",
            "Não, nunca foi condicionada com nome. O nome dela é Lua.",
        ],
    },
    {
        "id": 2,
        "label": "podenco_silves_caça",
        "turns": [
            "O meu podenco Faísca desapareceu durante uma caçada perto de Silves há 2 dias. É castanho avermelhado, magro, muito arisco. Nunca deixou de voltar antes.",
            "Tem chip. Estava com outros cães de caça mas separou-se na encosta. Terreno de mato denso. Não atende a chamadas.",
            "Sim, às vezes fica nervoso perto de pessoas que não conhece. Quanto tempo é normal um podenco estar escondido?",
        ],
    },
    {
        "id": 3,
        "label": "galgo_vilamoura_dia5",
        "turns": [
            "O meu galgo Max desapareceu há 5 dias em Vilamoura. Já pusemos cartazes, chamámos o nome por toda a zona, fizemos grupos no Facebook. Nada.",
            "Sim, vários grupos já saíram à procura. Ele é preto e branco, muito tímido com estranhos. Já foi encontrado 3 vezes por pessoas que tentaram apanhá-lo mas ele fugiu.",
            "Temos a estação de alimentação já colocada. O que devo fazer a seguir? Estamos desesperados.",
        ],
    },
    # ── Labrador / Golden / Gregário → active search permitted ────────────────
    {
        "id": 4,
        "label": "labrador_faro_urbano",
        "turns": [
            "O meu labrador Bolinha fugiu esta manhã em Faro, perto do Forum Algarve. É castanho, 3 anos, tem chip, muito sociável. Saltou do carro quando abri a porta.",
            "Sem coleira no momento. Adora pessoas, vai facilmente ter com estranhos. Visto pela última vez a correr em direcção ao parque.",
            "Sim, já contactei a câmara. Quando devo ir ao canil?",
        ],
    },
    {
        "id": 5,
        "label": "golden_albufeira_praia",
        "turns": [
            "A nossa golden retriever Luna perdeu-se na praia de Albufeira hoje à tarde. Tem 2 anos, cor dourada, loira. Estava sem trela e correu atrás de outro cão.",
            "Época de verão, havia muita gente. Alguém pode tê-la apanhado. Tem chip.",
            "Não vimos ninguém a levá-la, mas desapareceu muito rápido. Devemos postar nas redes sociais?",
        ],
    },
    {
        "id": 6,
        "label": "labrador_portimao_dia3",
        "turns": [
            "O meu labrador Nemo está desaparecido há 3 dias em Portimão. É preto, macho, 5 anos. Desapareceu quando alguém deixou o portão aberto.",
            "Sem avistamentos. Ele é muito amigável, costuma aproximar-se de pessoas. Contactei os canils mas nada.",
            "Devo colocar uma armadilha? E onde? Aqui perto há um parque e uma zona industrial.",
        ],
    },
    # ── Serra / Terreno denso → permeability 0.65, search radius reduced ──────
    {
        "id": 7,
        "label": "pastor_aleman_monchique_denso",
        "turns": [
            "O meu pastor alemão Kaiser perdeu-se em Monchique hoje durante uma caminhada. Zona de eucalipto e mato muito denso. Ele fugiu por causa de um barulho.",
            "Tem 6 anos, chip, cor preta e castanha. Conhece bem o exterior mas nunca esteve nesta zona. Altitude de 600m.",
            "Sou turista, fico cá só até domingo. O que posso fazer antes de ir embora?",
        ],
    },
    {
        "id": 8,
        "label": "husky_alcoutim_isolado",
        "turns": [
            "O meu husky Neve desapareceu em Alcoutim há 2 dias. É branca com olhos azuis, 4 anos, muito activa. Zona muito isolada, quase sem casas.",
            "Não há sinal de telemóvel na zona. Saiu por um buraco na vedação. Terreno de monte com ribeiro seco.",
            "Há risco de incêndio na zona? E o calor está forte esta semana.",
        ],
    },
    # ── A22 bisected zones ─────────────────────────────────────────────────────
    {
        "id": 9,
        "label": "beagle_silves_a22",
        "turns": [
            "O meu beagle Mel fugiu em Silves, perto da A22. Não sei se estava a norte ou a sul quando fugiu. É castanho e branco, 2 anos, muito curioso.",
            "Fugiu de casa durante obras na rua. Muito orientado por cheiro, pode ter seguido um odor qualquer. Tem chip.",
            "A A22 é perigosa para ele? Como sei em que lado procurar?",
        ],
    },
    # ── Transport risk / tourist zones ────────────────────────────────────────
    {
        "id": 10,
        "label": "poodle_portimao_turista",
        "turns": [
            "A minha caniche Princesa desapareceu em Portimão, perto do marina. É branca, pequena, 7 anos. Estava na esplanada quando alguém se distraiu.",
            "Zona muito frequentada por turistas. Ela é muito meiga, vai facilmente com estranhos. Há muitos turistas alemães e ingleses por aqui.",
            "Pode ter sido levada por turista sem perceber que tem dono? Como devo divulgar?",
        ],
    },
    # ── Found dog (mode=found) ─────────────────────────────────────────────────
    {
        "id": 11,
        "label": "encontrado_misto_tavira",
        "mode": "found",
        "turns": [
            "Encontrei um cão abandonado em Tavira, perto do castelo. Parece ter uns 3 anos, cor caramelo, magro mas saudável. Sem coleira.",
            "Não tem chip, verifiquei no veterinário. Parece bem socializado, não tem medo de pessoas. Posso ficar com ele temporariamente.",
            "Como posso verificar se tem dono e publicar para encontrá-los?",
        ],
    },
    {
        "id": 12,
        "label": "encontrado_galgo_monchique_hiker",
        "mode": "found",
        "turns": [
            "Encontrei um galgo muito magro numa estrada de montanha em Monchique. Parece desorientado e assustado. Consegui aproximar-me devagar.",
            "Não tem chip. Está muito magro, acho que está há dias sem comer. Dei-lhe água mas não sei o que dar de comer.",
            "Tenho o cão em casa agora. Está a tremitar e recusa comida. O que faço?",
        ],
    },
    # ── Senior dog / brachycephalic / heatstroke risk ─────────────────────────
    {
        "id": 13,
        "label": "buldogue_faro_calor",
        "turns": [
            "O meu buldogue inglês Rocky perdeu-se em Faro hoje ao meio-dia. É branco com manchas, 8 anos, muito pesado. Está calor forte.",
            "Fugiu pela porta quando o carteiro chegou. Zona residencial com muito asfalto. Ele não aguenta muito calor.",
            "Estamos muito preocupados com o calor. Que sinal devo procurar se ele estiver em sofrimento?",
        ],
    },
    # ── Goatherd zone ─────────────────────────────────────────────────────────
    {
        "id": 14,
        "label": "pastor_aleman_loulé_pastores",
        "turns": [
            "A minha cadela Sombra desapareceu em Loulé, numa zona de monte com cabras e ovelhas. Pastor alemão preta, 5 anos, com chip.",
            "A zona tem muito pastoreio. Ela fugiu quando viu um rebanho de cabras e correu atrás. Não voltou.",
            "Os pastores da zona podem ter visto algo? Como os contacto?",
        ],
    },
    # ── Sighting scenarios (multi-turn with new sighting info) ─────────────────
    {
        "id": 15,
        "label": "labrador_lagos_avistamento",
        "turns": [
            "O meu labrador Rex perdeu-se em Lagos há 2 dias. Amarelo, 4 anos, chip. Fugiu por causa de fogos de artifício.",
            "Acabei de receber uma mensagem que alguém viu um cão parecido perto do mercado de Lagos esta manhã. O que faço com este avistamento?",
            "Devo ir imediatamente ao local? Levo trela e comida?",
        ],
    },
    {
        "id": 16,
        "label": "mixed_olhão_sapal",
        "turns": [
            "O meu cão Pirata desapareceu em Olhão, na zona do sapal. É um cruzamento, cor preta, 4 anos. Gosta de água.",
            "Zona de ria com muito peixe e aves. Ele pode ter entrado na zona húmida. Já foram 36 horas.",
            "Vi pegadas perto da margem. Devo seguir?",
        ],
    },
    # ── Extended missing (day 7+ / cold case) ─────────────────────────────────
    {
        "id": 17,
        "label": "malinois_sao_bras_dia10",
        "turns": [
            "O meu malinois Thor desapareceu há 10 dias em São Brás de Alportel. Cor de canela, 3 anos, muito energético. Já não sei o que fazer.",
            "Fizemos tudo: cartazes, grupos, canil, veterinários. Zero avistamentos. Começamos a perder esperança.",
            "Uma pessoa disse que pode ter sido adoptado por alguém da zona rural. Como verifico?",
        ],
    },
    # ── Multi-dog household ────────────────────────────────────────────────────
    {
        "id": 18,
        "label": "boxer_vrsa_fronteira",
        "turns": [
            "O meu boxer Bruno fugiu em Vila Real de Santo António, mesmo perto da fronteira com Espanha. É tigrado, 5 anos, muito activo. Pode ter atravessado para Espanha.",
            "Zona do rio Guadiana, muito próximo de Ayamonte. Ele foi visto a nadar no rio ontem à tarde.",
            "Como contacto as autoridades espanholas? E os canils de Huelva?",
        ],
    },
    # ── Owner already made mistakes (name calling, crowd convergence) ──────────
    {
        "id": 19,
        "label": "galgo_albufeira_erros_dono",
        "turns": [
            "O meu galgo Sombra desapareceu há 3 dias em Albufeira. Organizámos um grupo de 20 pessoas para procurar mas ele fugiu cada vez que nos aproximámos.",
            "Ontem chamei o nome dele várias vezes perto de onde foi avistado mas ele correu em direcção contrária. Também pus fogos de artifício no vídeo de partilha para chamar atenção.",
            "Agora ninguém mais o viu. Fizemos alguma coisa errada?",
        ],
    },
    # ── Refeeding syndrome risk ────────────────────────────────────────────────
    {
        "id": 20,
        "label": "podenco_lagoa_captura_dia8",
        "turns": [
            "O meu podenco Farol foi encontrado hoje depois de estar desaparecido 8 dias em Lagoa. Está muito magro e fraco. Já lhe dei uma tigela cheia de ração.",
            "Ele comeu tudo rapidamente mas agora está a tremer um pouco. É normal depois de tantos dias sem comer?",
            "Devo levá-lo ao veterinário agora ou amanhã? E posso dar-lhe mais comida?",
        ],
    },
]


def stream_intake(
    url: str, scenario: dict[str, Any], bypass_token: str
) -> dict[str, Any]:
    """Run one multi-turn conversation, return collected events."""
    mode = scenario.get("mode", "lost")
    turns = scenario["turns"]
    history: list[dict] = []
    result: dict[str, Any] = {
        "id": scenario["id"],
        "label": scenario["label"],
        "mode": mode,
        "turns": [],
        "case_slug": None,
        "owner_token": None,
        "action_gate": None,
        "scenarios": [],
        "error": None,
        "started_at": datetime.now(timezone.utc).isoformat(),
    }

    agent_name = "Beatriz"

    for turn_idx, message in enumerate(turns):
        turn_data: dict[str, Any] = {
            "user": message,
            "agent_text": "",
            "tools": [],
            "events": [],
        }
        accumulated = ""

        try:
            headers: dict[str, str] = {
                "Content-Type": "application/json",
                "x-vercel-protection-bypass": bypass_token,
            }
            with httpx.stream(
                "POST",
                f"{url}/api/intake/stream",
                headers=headers,
                json={"message": message, "mode": mode, "history": history, "agentName": agent_name},
                timeout=60.0,
            ) as resp:
                if resp.status_code != 200:
                    result["error"] = f"HTTP {resp.status_code} on turn {turn_idx}"
                    break

                buf = ""
                for chunk in resp.iter_text():
                    buf += chunk
                    lines = buf.split("\n")
                    buf = lines.pop()
                    for line in lines:
                        if not line.startswith("data: "):
                            continue
                        try:
                            evt = json.loads(line[6:])
                            etype = evt.get("type", "")
                            if etype == "text_delta":
                                accumulated += evt.get("delta", "")
                            elif etype == "tool_start":
                                turn_data["tools"].append(evt.get("tool", ""))
                            elif etype == "probability_scenarios":
                                result["scenarios"] = evt.get("scenarios", [])
                            elif etype in ("action_gate", "action_gate_card"):
                                gate = evt.get("gate") or evt.get("card")
                                if gate:
                                    result["action_gate"] = gate
                            elif etype == "case_created":
                                result["case_slug"] = evt.get("slug")
                                result["owner_token"] = evt.get("ownerToken")
                            elif etype == "done":
                                pass
                            turn_data["events"].append(etype)
                        except Exception:
                            pass

        except Exception as exc:
            result["error"] = f"turn {turn_idx}: {exc}"
            break

        turn_data["agent_text"] = accumulated
        result["turns"].append(turn_data)

        # Build history for next turn
        history.append({"role": "user", "content": message})
        history.append({"role": "assistant", "content": accumulated})

        # Brief pause between turns
        time.sleep(0.5)

    result["finished_at"] = datetime.now(timezone.utc).isoformat()
    return result


def get_bypass_token(url: str) -> str:
    """Get Vercel deployment protection bypass token via vercel CLI."""
    import subprocess
    out = subprocess.run(
        ["vercel", "curl", url, "-o", "/dev/null", "-s", "-w", "%{http_code}"],
        capture_output=True, text=True
    )
    # vercel curl sets a cookie / token — extract it from vercel config
    # Actually vercel curl handles auth internally; for programmatic use we need the token
    # Try to get it from vercel CLI output
    return ""


def wait_for_pi_agent(case_id: str, supabase_url: str, supabase_key: str, timeout: int = 90) -> list[dict]:
    """Poll case_agent_events for this case until PI agent completes or timeout."""
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
    }
    started = time.time()
    events: list[dict] = []
    seen_ids: set = set()

    while time.time() - started < timeout:
        try:
            resp = httpx.get(
                f"{supabase_url}/rest/v1/case_agent_events",
                headers=headers,
                params={"case_id": f"eq.{case_id}", "order": "created_at.asc", "limit": "50"},
                timeout=10.0,
            )
            if resp.status_code == 200:
                rows = resp.json()
                for row in rows:
                    if row.get("id") not in seen_ids:
                        events.append(row)
                        seen_ids.add(row.get("id"))
                # Check if agent finished (assessment written)
                assess_resp = httpx.get(
                    f"{supabase_url}/rest/v1/case_agent_assessments",
                    headers=headers,
                    params={"case_id": f"eq.{case_id}", "limit": "1"},
                    timeout=10.0,
                )
                if assess_resp.status_code == 200 and assess_resp.json():
                    return events
        except Exception:
            pass
        time.sleep(5)
    return events


def get_case_id_by_slug(slug: str, supabase_url: str, supabase_key: str) -> str | None:
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
    }
    try:
        resp = httpx.get(
            f"{supabase_url}/rest/v1/cases",
            headers=headers,
            params={"slug": f"eq.{slug}", "select": "id", "limit": "1"},
            timeout=10.0,
        )
        if resp.status_code == 200 and resp.json():
            return resp.json()[0]["id"]
    except Exception:
        pass
    return None


def print_result(r: dict) -> None:
    ok = "✓" if not r.get("error") else "✗"
    slug = r.get("case_slug") or "—"
    gate = r.get("action_gate") or {}
    blocked = "ALL-BLOCKED" if gate.get("crowd_response_blocked") else "OPEN"
    scenarios = r.get("scenarios", [])
    top_scenario = f"{scenarios[0]['title']} {round(scenarios[0]['probability']*100)}%" if scenarios else "—"
    tools = [t for turn in r.get("turns", []) for t in turn.get("tools", [])]
    print(
        f"  {ok} [{r['id']:02d}] {r['label']:<35} slug={slug:<30} gate={blocked:<12} "
        f"top={top_scenario:<25} tools={len(tools)}"
        + (f"\n       ERROR: {r['error']}" if r.get("error") else "")
    )


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--url", default=PROD_URL)
    p.add_argument("--workers", type=int, default=3, help="Parallel simulations (default 3, be gentle on API)")
    p.add_argument("--scenarios", default="all", help="Comma-separated IDs or 'all'")
    p.add_argument("--out", default="/tmp/nona_sim_results.json")
    p.add_argument("--wait-pi", action="store_true", help="Wait for PI agent events after case creation")
    args = p.parse_args()

    supabase_url = os.environ.get("SUPABASE_URL", "https://rirpcbddqbvtjrirrsqi.supabase.co")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", os.environ.get("SUPABASE_SERVICE_KEY", ""))

    # Get bypass token — via env, arg, or auto-extract from vercel curl --verbose
    bypass_token = os.environ.get("VERCEL_BYPASS_TOKEN", "")
    if not bypass_token:
        import subprocess, re as _re
        out = subprocess.run(
            ["vercel", "curl", args.url, "-o", "/dev/null", "--verbose"],
            capture_output=True, text=True, timeout=30,
        )
        m = _re.search(r"x-vercel-protection-bypass:\s*(\S+)", out.stderr + out.stdout)
        if m:
            bypass_token = m.group(1)
    if not bypass_token:
        print("ERROR: could not determine Vercel bypass token. Set VERCEL_BYPASS_TOKEN env var.")
        sys.exit(1)
    print(f"  Bypass token: {bypass_token[:8]}…")

    # Filter scenarios
    if args.scenarios == "all":
        selected = SCENARIOS
    else:
        ids = {int(x.strip()) for x in args.scenarios.split(",")}
        selected = [s for s in SCENARIOS if s["id"] in ids]

    print(f"\n{'═' * 90}")
    print(f"  NONA SIMULATION BATCH — {len(selected)} scenarios — {args.workers} parallel workers")
    print(f"  Target: {args.url}")
    print(f"  Simulation mode: ENABLED (emails → adrian.s.delasierra@gmail.com)")
    print(f"{'═' * 90}\n")

    results: list[dict] = []
    start_total = time.time()

    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {
            pool.submit(stream_intake, args.url, s, bypass_token): s
            for s in selected
        }
        for fut in as_completed(futures):
            r = fut.result()
            results.append(r)
            print_result(r)
            sys.stdout.flush()

    # Sort by id for clean output
    results.sort(key=lambda x: x["id"])

    # If requested, wait for PI agent events on created cases
    if args.wait_pi and supabase_key:
        print(f"\n{'─' * 90}")
        print("  Waiting for PI agent cycles (up to 90s per case)...")
        print(f"{'─' * 90}")
        for r in results:
            slug = r.get("case_slug")
            if not slug:
                continue
            case_id = get_case_id_by_slug(slug, supabase_url, supabase_key)
            if not case_id:
                print(f"  [{r['id']:02d}] {r['label']}: case_id not found for slug {slug}")
                continue
            print(f"  [{r['id']:02d}] {r['label']}: waiting for PI agent (case {case_id[:8]}…)")
            events = wait_for_pi_agent(case_id, supabase_url, supabase_key, timeout=90)
            r["pi_agent_events"] = events
            print(f"        → {len(events)} PI events collected")

    elapsed = time.time() - start_total
    created = sum(1 for r in results if r.get("case_slug"))
    errors = sum(1 for r in results if r.get("error"))

    print(f"\n{'═' * 90}")
    print(f"  DONE in {elapsed:.1f}s — {created}/{len(results)} cases created — {errors} errors")
    print(f"  Results → {args.out}")
    print(f"{'═' * 90}\n")

    with open(args.out, "w") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"  Saved {len(results)} results to {args.out}")
    print(f"\n  To watch PI agent live:  python scripts/monitor.py --since 10")
    print(f"  To review results:       python -c \"import json; r=json.load(open('{args.out}')); [print(x['label'], x.get('case_slug'), x.get('action_gate',{{}}).get('crowd_response_blocked')) for x in r]\"")


if __name__ == "__main__":
    main()
