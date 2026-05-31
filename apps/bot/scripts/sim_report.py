#!/usr/bin/env python3
"""
Sandbox simulation report — North Star + KPIs + safety + rate-limit model.

Reads source='sim' data and computes the metrics the founder cares about, plus a
gate-correctness safety check (hard cases must produce ZERO crowd alerts) and a
Telegram rate-limit model (what real-world delivery of all these DMs would cost).

Usage: uv run python scripts/sim_report.py [--json]
"""
from __future__ import annotations

import argparse
import json
import sys
from collections import defaultdict
from datetime import datetime, timezone

import pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))
from _sim_common import load_env, get_db

UTC = timezone.utc
TG_GLOBAL_LIMIT = 30  # messages/sec global per bot


def _parse_ts(s):
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        return None


def main() -> int:
    load_env()
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()
    db = get_db()

    cases = db.table("cases").select("id,breed,behavioral_profile,created_at").eq("source", "sim").execute().data or []
    case_ids = [c["id"] for c in cases]
    notifs = db.table("case_notifications").select("*").in_("case_id", case_ids).execute().data if case_ids else []
    sightings = db.table("sightings").select("id,case_id,coords_approx,created_at").eq("source", "sim").execute().data or []
    events = db.table("case_agent_events").select("case_id,tool,action,outcome").in_("case_id", case_ids).execute().data if case_ids else []

    hard_cats = {"galgo", "podenco"}
    def is_hard(c):
        bp = c.get("behavioral_profile") or {}
        return (bp.get("breed_category") in hard_cats) or (bp.get("temperament") == "xenophobic")
    hard_ids = {c["id"] for c in cases if is_hard(c)}
    soft_ids = {c["id"] for c in cases if c["id"] not in hard_ids}

    # Notifications
    vol_notifs = [n for n in notifs if n.get("distance_km") is not None or n.get("telegram_id")]
    sim_notifs = [n for n in notifs if n.get("is_simulated")]
    real_notifs = [n for n in notifs if not n.get("is_simulated")]
    dists = [float(n["distance_km"]) for n in notifs if n.get("distance_km") is not None]

    # SAFETY: hard cases must have 0 volunteer/broadcast notifications
    hard_alerts = [n for n in notifs if n.get("case_id") in hard_ids]
    gate_blocks = [e for e in events if "GATE BLOCKED" in str(e.get("outcome", ""))]

    # Funnel
    sightings_by_case = defaultdict(int)
    for s in sightings:
        sightings_by_case[s["case_id"]] += 1
    with_coords = sum(1 for s in sightings if s.get("coords_approx"))

    # Rate-limit model: if every notification were a REAL DM, how long + breaches?
    total_dms = len(notifs)
    model_seconds = total_dms / TG_GLOBAL_LIMIT if total_dms else 0
    breach = total_dms > TG_GLOBAL_LIMIT

    # Time-to-first-volunteer-alert (soft cases): case.created_at -> first notif.created_at
    alert_latencies = []
    notif_by_case = defaultdict(list)
    for n in notifs:
        notif_by_case[n["case_id"]].append(n)
    for c in cases:
        if c["id"] in soft_ids:
            ct = _parse_ts(c.get("created_at"))
            ns = [_parse_ts(n.get("created_at")) for n in notif_by_case.get(c["id"], [])]
            ns = [t for t in ns if t and ct]
            if ns:
                alert_latencies.append((min(ns) - ct).total_seconds())
    median_latency = sorted(alert_latencies)[len(alert_latencies)//2] if alert_latencies else None

    report = {
        "scale": {
            "sim_cases": len(cases),
            "hard_cases": len(hard_ids),
            "soft_cases": len(soft_ids),
        },
        "distance_alert": {
            "total_notifications": len(notifs),
            "with_distance": len(dists),
            "avg_distance_km": round(sum(dists)/len(dists), 1) if dists else None,
            "max_distance_km": round(max(dists), 1) if dists else None,
            "real_deliveries": len(real_notifs),
            "simulated_records": len(sim_notifs),
        },
        "engagement": {
            "sightings_total": len(sightings),
            "sightings_with_coords": with_coords,
            "cases_with_sighting": len(sightings_by_case),
        },
        "timing": {
            "median_time_to_first_alert_s": round(median_latency, 1) if median_latency is not None else None,
        },
        "safety_gate": {
            "hard_cases": len(hard_ids),
            "hard_case_alerts_LEAKED": len(hard_alerts),   # MUST be 0
            "gate_blocks_logged": len(gate_blocks),
            "PASS": len(hard_alerts) == 0,
        },
        "rate_limit_model": {
            "telegram_global_limit_per_s": TG_GLOBAL_LIMIT,
            "total_dms_if_all_real": total_dms,
            "modeled_delivery_seconds": round(model_seconds, 1),
            "would_breach_global_limit": breach,
            "deferred_by_throttle": sum(1 for n in notifs if n.get("rate_limit_flag")),
        },
    }

    if args.json:
        print(json.dumps(report, indent=2))
        return 0

    print("=== SIM SESSION REPORT ===\n")
    print(f"SCALE: {report['scale']['sim_cases']} cases "
          f"({report['scale']['hard_cases']} hard / {report['scale']['soft_cases']} soft)")
    d = report["distance_alert"]
    print(f"\nDISTANCE ALERT")
    print(f"  notifications:        {d['total_notifications']}  (with distance: {d['with_distance']})")
    print(f"  avg / max distance:   {d['avg_distance_km']} km / {d['max_distance_km']} km")
    print(f"  real DMs / sim records: {d['real_deliveries']} / {d['simulated_records']}")
    e = report["engagement"]
    print(f"\nENGAGEMENT")
    print(f"  sightings:            {e['sightings_total']}  (with coords: {e['sightings_with_coords']})")
    print(f"  cases with ≥1 sighting: {e['cases_with_sighting']}")
    print(f"\nTIMING")
    print(f"  median time→first alert: {report['timing']['median_time_to_first_alert_s']} s")
    s = report["safety_gate"]
    flag = "✅ PASS" if s["PASS"] else "❌ FAIL — HARD-CASE ALERT LEAKED"
    print(f"\nSAFETY GATE  {flag}")
    print(f"  hard cases: {s['hard_cases']}  leaked alerts: {s['hard_case_alerts_LEAKED']} (must be 0)  gate-blocks logged: {s['gate_blocks_logged']}")
    r = report["rate_limit_model"]
    print(f"\nRATE-LIMIT MODEL (if every DM were real)")
    print(f"  total DMs: {r['total_dms_if_all_real']}  modeled delivery: {r['modeled_delivery_seconds']}s "
          f" breach>{TG_GLOBAL_LIMIT}/s: {r['would_breach_global_limit']}  throttle-deferred: {r['deferred_by_throttle']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
