#!/usr/bin/env python3
"""
Seed the sandbox simulation world (all tagged source='sim').

Creates:
  * kb_geography rows for the invented sim municipalities (so the agent's WP13
    lookup succeeds without touching real territory data).
  * kb_channels telegram rows pointing ONLY at the founder's private group chat_id.
  * N synthetic volunteers gaussian-clustered around the sim town centers, varied
    radius + behavior personas (is_simulated=true, negative synthetic telegram_ids).
  * 1 REAL volunteer = the founder (is_simulated=false, real telegram_id) so a human
    receives an actual "X km away" DM.

Usage:
  uv run python scripts/sim_seed.py --volunteers 200 \
      --founder-telegram-id 8675525324 --group-chat-id -1003865248366
"""
from __future__ import annotations

import argparse
import random
import sys

from _sim_common import load_env, get_db, point, SIM_MUNIS, SIM_SOURCE

PERSONAS = [
    # (response_rate, sighting_rate, photo_rate, delay_mean_s, label)
    (0.70, 0.45, 0.70, 60,  "eager"),
    (0.40, 0.20, 0.50, 120, "average"),
    (0.15, 0.05, 0.30, 300, "passive"),
]


def main() -> int:
    load_env()
    ap = argparse.ArgumentParser()
    ap.add_argument("--volunteers", type=int, default=200)
    ap.add_argument("--founder-telegram-id", type=int, default=None)
    ap.add_argument("--group-chat-id", type=int, default=None,
                    help="founder's private group chat_id for channel broadcasts")
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()
    random.seed(args.seed)
    db = get_db()

    # 1. kb_geography for sim munis — clone a real row's exact shape (Faro) so we
    #    never drift from the live schema; just swap municipality + drop timestamps.
    template = db.table("kb_geography").select("*").eq("municipality", "Faro").single().execute().data
    for k in ("created_at", "updated_at"):
        template.pop(k, None)
    for m in SIM_MUNIS:
        row = dict(template)
        row["municipality"] = m
        try:
            db.table("kb_geography").upsert(row, on_conflict="municipality").execute()
        except Exception as exc:
            print(f"  geo upsert warn ({m}): {str(exc)[:80]}")
    print(f"  geography: {len(SIM_MUNIS)} sim munis (cloned from Faro)")

    # 2. kb_channels — telegram, pointing only at the founder's private group.
    if args.group_chat_id:
        for m in SIM_MUNIS:
            db.table("kb_channels").upsert({
                "municipality": m, "channel_type": "telegram",
                "name": f"Grupo Sim {m}", "url": str(args.group_chat_id),
                "source": SIM_SOURCE,
            }, on_conflict="name,municipality").execute()
        print(f"  channels: {len(SIM_MUNIS)} telegram rows -> group {args.group_chat_id}")
    else:
        print("  (no --group-chat-id: skipping channel seed; broadcast will have no target)")

    # 3. Synthetic volunteers, gaussian-clustered per muni.
    rows = []
    syn_tid = -500000
    per_muni = max(1, args.volunteers // len(SIM_MUNIS))
    for m, (clng, clat) in SIM_MUNIS.items():
        for _ in range(per_muni):
            syn_tid -= 1
            lng = clng + random.gauss(0, 0.06)   # ~6km spread
            lat = clat + random.gauss(0, 0.06)
            rr, sr, pr, delay, persona = random.choice(PERSONAS)
            rows.append({
                "telegram_id": syn_tid,
                "display_name": f"SimVol {abs(syn_tid)}",
                "home_coords": point(round(lng, 5), round(lat, 5)),
                "municipality": m,
                "radius_km": round(random.uniform(3, 15), 1),
                "active": True, "is_simulated": True,
                "response_rate": rr, "sighting_rate": sr, "photo_rate": pr,
                "response_delay_mean_s": delay,
                "persona": {"label": persona}, "source": SIM_SOURCE,
            })
    # batch insert
    for i in range(0, len(rows), 100):
        db.table("sim_volunteers").insert(rows[i:i + 100]).execute()
    print(f"  synthetic volunteers: {len(rows)}")

    # 4. Real founder volunteer (wide radius so most cases reach them).
    if args.founder_telegram_id:
        clng, clat = SIM_MUNIS["Simlandia-Sul"]
        db.table("sim_volunteers").upsert({
            "telegram_id": args.founder_telegram_id,
            "display_name": "Founder (REAL)",
            "home_coords": point(clng, clat),
            "municipality": "Simlandia-Sul",
            "radius_km": 50.0, "active": True, "is_simulated": False,
            "response_rate": 0.0, "sighting_rate": 0.0, "photo_rate": 0.0,
            "response_delay_mean_s": 0, "persona": {"label": "real_founder"},
            "source": SIM_SOURCE,
        }, on_conflict="telegram_id").execute()
        print(f"  real founder volunteer: tid={args.founder_telegram_id} (radius 50km)")

    print("SIM SEED DONE.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
