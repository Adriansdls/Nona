#!/usr/bin/env python3
"""
Purge all sandbox simulation data (source='sim'). Restores the DB to pre-sim state.

Deletes children first (notifications, agent events, sightings, images) then cases,
then sim_volunteers and sim kb_channels/kb_geography rows.

Usage:
  uv run python scripts/sim_purge.py --dry-run
  uv run python scripts/sim_purge.py
"""
from __future__ import annotations

import argparse
import sys

import pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))
from _sim_common import load_env, get_db, SIM_MUNIS


def main() -> int:
    load_env()
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    db = get_db()

    cases = db.table("cases").select("id").eq("source", "sim").execute().data or []
    case_ids = [c["id"] for c in cases]
    vols = db.table("sim_volunteers").select("id", count="exact").eq("source", "sim").execute()
    chans = db.table("kb_channels").select("id", count="exact").eq("source", "sim").execute()

    print(f"Would delete: {len(case_ids)} cases, {vols.count} sim_volunteers, "
          f"{chans.count} sim channels, kb_geography for {list(SIM_MUNIS)}")
    if args.dry_run:
        print("(dry-run — nothing deleted)")
        return 0

    # children of cases (case_images/case_agent_events/case_notifications/sightings
    # cascade via FK ON DELETE CASCADE; delete explicitly to be safe where no cascade)
    for cid in case_ids:
        for tbl in ("case_notifications", "case_agent_events", "sightings", "case_images"):
            try:
                db.table(tbl).delete().eq("case_id", cid).execute()
            except Exception:
                pass
        db.table("cases").delete().eq("id", cid).execute()

    # stray sim sightings not tied to a sim case
    db.table("sightings").delete().eq("source", "sim").execute()
    db.table("sim_volunteers").delete().eq("source", "sim").execute()
    db.table("kb_channels").delete().eq("source", "sim").execute()
    for m in SIM_MUNIS:
        db.table("kb_geography").delete().eq("municipality", m).execute()

    # verify
    rem = db.table("cases").select("id", count="exact").eq("source", "sim").execute().count
    remv = db.table("sim_volunteers").select("id", count="exact").eq("source", "sim").execute().count
    print(f"PURGE DONE. remaining sim cases={rem} sim volunteers={remv}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
