#!/usr/bin/env python3
"""
Run the sandbox simulation: create cases, drive the agent, simulate volunteer responses.

For each case: direct DB insert (source='sim', NEVER the web route → no email/FB leak),
with a pre-seeded behavioral_profile so the action gate is correct from minute 0.
Then run the PI agent. Modes:
  --deterministic : call post_to_channel + request_volunteer_alert directly (no LLM cost,
                    reproducible) — proves the mechanics.
  --llm           : run the real PI agent (run_case_agent) — tests real tool selection.
After each case, simulate volunteer responses (acks + sightings with coords) per persona.

Usage:
  uv run python scripts/sim_run.py --cases 20 --deterministic
  uv run python scripts/sim_run.py --cases 10 --llm
"""
from __future__ import annotations

import argparse
import asyncio
import random
import sys
import uuid
from datetime import datetime, timedelta, timezone

import pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))

from _sim_common import load_env, get_db, point, SIM_MUNIS, SIM_SOURCE

UTC = timezone.utc
_RESP_RNG = random.Random()  # entropy-seeded; decoupled from --seed case generation

# (breed, breed_category, temperament, escape_trigger, expect_broadcast)
CASE_TEMPLATES = [
    ("Labrador",        "mixed",   "gregarious", "opportunistic", True),
    ("Golden Retriever","mixed",   "gregarious", "opportunistic", True),
    ("Rafeiro",         "mixed",   "gregarious", "opportunistic", True),
    ("Galgo Espanhol",  "galgo",   "xenophobic", "blind_panic",   False),  # gate BLOCKED
    ("Podenco",         "podenco", "aloof",      "prey_drive",    False),  # gate BLOCKED
]
COLORS = ["castanho", "preto", "dourado", "branco", "tricolor"]


def _make_case(db, template, muni, backdate_h=None):
    breed, cat, temp, trig, _ = template
    clng, clat = SIM_MUNIS[muni]
    lng = clng + random.gauss(0, 0.03)
    lat = clat + random.gauss(0, 0.03)
    last_seen = datetime.now(UTC) - timedelta(hours=backdate_h or random.uniform(0.2, 2))
    slug = f"sim-{breed.lower().split()[0]}-{muni.lower()}-{uuid.uuid4().hex[:6]}"
    bp = {"breed_category": cat, "temperament": temp, "escape_trigger": trig}
    row = {
        "slug": slug, "type": "perdido", "status": "ativo", "sensitivity": "publico",
        "dog_name": f"Sim{random.randint(100,999)}", "breed": breed,
        "sex": random.choice(["macho", "femea"]), "size": random.choice(["pequeno","medio","grande"]),
        "primary_color": random.choice(COLORS),
        "last_seen_at": last_seen.isoformat(),
        "last_seen_municipality": muni, "last_seen_zone_approx": f"Zona {muni}",
        "last_seen_coords_approx": point(round(lng,5), round(lat,5)),
        "description": "Caso de simulação.", "reporter_name": "Dono Sim",
        "reporter_email": "sim@salvacao.local", "behavioral_profile": bp,
        "source": SIM_SOURCE,
    }
    return db.table("cases").insert(row).execute().data[0]["id"], template


async def _drive_agent(db, case_id, mode):
    from agent.harness import CaseHarness
    from agent.pi_tools import execute_pi_tool
    h = CaseHarness(case_id, db)
    muni = h.case.get("last_seen_municipality")
    if mode == "deterministic":
        # call the two alert tools directly; gate enforcement inside handles hard cases
        await execute_pi_tool("post_to_channel",
                              {"channel_name": f"Grupo Sim {muni}", "channel_type": "telegram"}, h, db)
        await execute_pi_tool("request_volunteer_alert",
                              {"municipality": muni, "radius_km": 15, "urgency": "immediate"}, h, db)
    else:
        from agent.case_agent import run_case_agent
        await run_case_agent(case_id, db, trigger="case_created")


def _simulate_responses(db, case_id):
    """Synthetic volunteers ack + occasionally report a sighting near the case."""
    case = db.table("cases").select("last_seen_municipality,last_seen_coords_approx").eq("id", case_id).single().execute().data
    muni = case["last_seen_municipality"]
    notifs = (db.table("case_notifications")
              .select("telegram_id,distance_km").eq("case_id", case_id)
              .eq("is_simulated", True).execute().data or [])
    vols = {v["telegram_id"]: v for v in (db.table("sim_volunteers")
            .select("telegram_id,home_coords,response_rate,sighting_rate,photo_rate")
            .eq("municipality", muni).execute().data or [])}
    acks = sightings = 0
    for n in notifs:
        v = vols.get(n["telegram_id"])
        if not v:
            continue
        # Use entropy RNG (not the seeded case-gen stream) so responses aren't
        # correlated with deterministic case generation.
        if _RESP_RNG.random() < float(v.get("response_rate", 0)):
            acks += 1
        if _RESP_RNG.random() < float(v.get("sighting_rate", 0)):
            from agent.pi_tools import _parse_point
            vc = _parse_point(v.get("home_coords")) or (37.1, -8.1)
            slat = vc[0] + _RESP_RNG.gauss(0, 0.01)
            slng = vc[1] + _RESP_RNG.gauss(0, 0.01)
            db.table("sightings").insert({
                "case_id": case_id, "seen_at": datetime.now(UTC).isoformat(),
                "municipality": muni, "zone_approx": f"Avist. sim {muni}",
                "coords_approx": point(round(slng,5), round(slat,5)),
                "description": "Avistamento simulado.", "credibility": "pendente",
                "is_public": False, "source": SIM_SOURCE,
            }).execute()
            sightings += 1
    return acks, sightings


async def main() -> int:
    load_env()
    ap = argparse.ArgumentParser()
    ap.add_argument("--cases", type=int, default=20)
    ap.add_argument("--deterministic", action="store_true")
    ap.add_argument("--llm", action="store_true")
    ap.add_argument("--seed", type=int, default=7)
    args = ap.parse_args()
    mode = "llm" if args.llm else "deterministic"
    random.seed(args.seed)
    db = get_db()

    munis = list(SIM_MUNIS)
    total_acks = total_sightings = 0
    for i in range(args.cases):
        tmpl = CASE_TEMPLATES[i % len(CASE_TEMPLATES)]
        muni = munis[i % len(munis)]
        case_id, tmpl = _make_case(db, tmpl, muni)
        await _drive_agent(db, case_id, mode)
        a, s = _simulate_responses(db, case_id)
        total_acks += a; total_sightings += s
        gate = "BROADCAST" if tmpl[4] else "GATE-BLOCKED(hard)"
        print(f"  case {i+1}/{args.cases} [{tmpl[0]} {muni}] {gate} acks={a} sightings={s}")

    print(f"SIM RUN DONE ({mode}): {args.cases} cases, {total_acks} acks, {total_sightings} sightings.")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
