#!/usr/bin/env python3
"""
Nona full-stack real-time monitor.

Tracks EVERYTHING across all WP layers:
  - case_agent_events     → PI agent tool calls, phase transitions (WP9/10/12/13)
  - case_agent_assessments → PI assessment + next planned action
  - case_notifications    → emails/telegram to owner, canils, vets, volunteers
  - sightings             → new sightings with WP12 reliability score
  - cases                 → new case creation + slug

Usage:
    python scripts/monitor.py
    python scripts/monitor.py --case <uuid>
    python scripts/monitor.py --since 60   # last 60 minutes
    python scripts/monitor.py --interval 2

Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (falls back to production defaults)
"""
from __future__ import annotations

import argparse
import os
import sys
import time
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://rirpcbddqbvtjrirrsqi.supabase.co")
SUPABASE_KEY = os.environ.get(
    "SUPABASE_SERVICE_ROLE_KEY",
    os.environ.get(
        "SUPABASE_SERVICE_KEY",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpcnBjYmRkcWJ2dGpyaXJyc3FpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTgyODU4OSwiZXhwIjoyMDk1NDA0NTg5fQ.F90CKsjpor5B9ffhC1QeNG7vq3wqOk0qlVb1ehiGoss",
    ),
)

# ── ANSI ─────────────────────────────────────────────────────────────────────
R    = "\033[0m";  BOLD = "\033[1m";  DIM  = "\033[2m"
RED  = "\033[91m"; YEL  = "\033[93m"; GRN  = "\033[92m"
CYN  = "\033[96m"; MAG  = "\033[95m"; BLU  = "\033[94m"
WHT  = "\033[97m"; ORG  = "\033[33m"

# WP tool → friendly label + colour
_TOOL_MAP: dict[str, tuple[str, str]] = {
    "record_behavioral_profile":    ("WP8 behavioral profile",       MAG),
    "update_behavioral_assessment": ("WP9 Bayesian belief update",   MAG),
    "send_field_guide":             ("WP12 field guide sent",        YEL),
    "score_sighting_wp12":          ("WP12 sighting scored",         YEL),
    "feeding_station_guidance":     ("WP12 feeding station",         YEL),
    "trap_guidance":                ("WP12 trap guidance",           YEL),
    "send_environment_advisory":    ("WP10 env advisory sent",       BLU),
    "query_geography":              ("WP13 geo query",               GRN),
    "notify_canil":                 ("canil notified",               ORG),
    "notify_vet":                   ("vet notified",                 ORG),
    "request_volunteer_alert":      ("volunteers alerted",           ORG),
    "send_owner_message":           ("owner message sent",           CYN),
    "send_owner_brief":             ("owner daily brief",            CYN),
    "update_case_assessment":       ("assessment written",           WHT),
    "expand_shelter_radius":        ("shelter radius expanded",      ORG),
    "cold_case_assessment":         ("cold case assessment",         RED),
    "post_to_social":               ("social post",                  BLU),
    "create_volunteer_task":        ("volunteer task created",       ORG),
}

def _ts(iso: str) -> str:
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return dt.astimezone().strftime("%H:%M:%S")
    except Exception:
        return iso[:8]

def _label(tool: str) -> tuple[str, str]:
    return _TOOL_MAP.get(tool, (tool, CYN))

def _print_case(row: dict) -> None:
    ts   = _ts(row.get("created_at", ""))
    slug = row.get("slug", "—")
    breed = row.get("breed", "?")
    muni  = row.get("last_seen_municipality", "?")
    dog   = row.get("dog_name") or ""
    mode  = row.get("type", "perdido")
    color = GRN if mode == "encontrado" else RED
    print(f"\n{BOLD}{color}{'─'*80}{R}")
    print(f"{BOLD}{color}  NEW CASE  {R}{DIM}{ts}{R}  {WHT}{slug}{R}  {BOLD}{dog or breed}{R} · {breed} · {muni}")
    print(f"{BOLD}{color}{'─'*80}{R}\n")

def _print_event(row: dict) -> None:
    ts      = _ts(row.get("created_at", ""))
    case_id = str(row.get("case_id", ""))[:8]
    tool    = str(row.get("tool_used") or "")
    action  = str(row.get("action_type") or "")
    detail  = str(row.get("detail") or "")[:100]
    phase   = str(row.get("phase") or "")
    label, color = _label(tool) if tool else (action, CYN)
    phase_str = f" {DIM}[{phase}]{R}" if phase else ""
    print(f"  {DIM}{ts}{R}  {color}▸ {label}{R}{phase_str}  {DIM}{case_id}…{R}  {detail}")

def _print_assessment(row: dict) -> None:
    ts         = _ts(row.get("created_at", ""))
    case_id    = str(row.get("case_id", ""))[:8]
    summary    = str(row.get("summary") or "")[:180]
    next_act   = str(row.get("next_action") or "")[:100]
    confidence = row.get("confidence_score")
    conf_str   = f" {YEL}conf={confidence:.2f}{R}" if confidence else ""
    print(f"\n  {DIM}{ts}{R}  {MAG}{BOLD}ASSESSMENT{R}  {DIM}{case_id}…{R}{conf_str}")
    print(f"    {summary}")
    if next_act:
        print(f"    {DIM}→ next: {next_act}{R}")

def _print_notification(row: dict) -> None:
    ts      = _ts(row.get("created_at", ""))
    case_id = str(row.get("case_id", ""))[:8]
    channel = str(row.get("channel", ""))
    sent    = row.get("sent_at")
    msg     = str(row.get("message") or "")[:140]
    status  = f"{GRN}SENT{R}" if sent else f"{YEL}PENDING{R}"
    ch_color = CYN if channel == "email" else YEL if channel == "telegram" else BLU
    print(f"  {DIM}{ts}{R}  {ch_color}NOTIF [{channel}]{R}  {status}  {DIM}{case_id}…{R}  {msg}")

def _print_sighting(row: dict) -> None:
    ts      = _ts(row.get("created_at", ""))
    case_id = str(row.get("case_id", ""))[:8]
    score   = row.get("reliability_score")
    zone    = str(row.get("zone_approx") or "")[:60]
    rec     = str(row.get("action_recommendation") or "")
    score_color = GRN if (score or 0) >= 10 else YEL if (score or 0) >= 7 else DIM
    print(f"  {DIM}{ts}{R}  {score_color}SIGHTING score={score}/15{R}  {DIM}{case_id}…{R}  {zone}  {DIM}→ {rec}{R}")

def run(case_filter: str | None, since_minutes: int, poll_interval: int) -> None:
    try:
        from supabase import create_client
        db = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as exc:
        sys.exit(f"Supabase connect failed: {exc}")

    since = datetime.now(timezone.utc) - timedelta(minutes=since_minutes)
    cursors = {
        "cases":               since.isoformat(),
        "case_agent_events":   since.isoformat(),
        "case_agent_assessments": since.isoformat(),
        "case_notifications":  since.isoformat(),
        "sightings":           since.isoformat(),
    }

    sim = os.environ.get("SIMULATION_MODE", "").lower() in ("1", "true", "yes")
    sim_badge = f" {YEL}[SIM — emails → adrian.s.delasierra@gmail.com]{R}" if sim else ""

    print(f"\n{BOLD}{WHT}{'═'*80}{R}")
    print(f"{BOLD}{WHT}  NONA FULL-STACK MONITOR{R}{sim_badge}")
    print(f"  {DIM}WP8 behavioral · WP9 phase+gate · WP10 env · WP12 field guide+scoring · WP13 geo{R}")
    print(f"  {DIM}Polling every {poll_interval}s · Ctrl-C to stop{R}")
    if case_filter:
        print(f"  {DIM}Filter: case_id = {case_filter[:8]}…{R}")
    else:
        print(f"  {DIM}Showing: all activity from last {since_minutes}min{R}")
    print(f"{BOLD}{WHT}{'═'*80}{R}\n")
    print(f"  {RED}NEW CASE{R}  = case created via web or Telegram intake")
    print(f"  {CYN}▸ tool{R}    = PI agent tool call (WP-labelled)")
    print(f"  {MAG}ASSESS{R}   = PI agent assessment + planned next action")
    print(f"  {CYN}NOTIF{R}    = email/telegram to owner, canils, vets, volunteers")
    print(f"  {GRN}SIGHTING{R} = new sighting with WP12 reliability score (0-15)")
    print(f"\n{'─'*80}\n")

    while True:
        try:
            # ── New cases ──────────────────────────────────────────────────────
            q = db.table("cases").select(
                "id,slug,type,breed,dog_name,last_seen_municipality,created_at"
            ).gt("created_at", cursors["cases"]).order("created_at").limit(20)
            rows = q.execute().data or []
            for row in rows:
                _print_case(row)
                cursors["cases"] = row["created_at"]

            # ── PI agent events ────────────────────────────────────────────────
            q2 = (
                db.table("case_agent_events")
                .select("*").gt("created_at", cursors["case_agent_events"])
                .order("created_at").limit(100)
            )
            if case_filter:
                q2 = q2.eq("case_id", case_filter)
            rows2 = q2.execute().data or []
            for row in rows2:
                _print_event(row)
                cursors["case_agent_events"] = row["created_at"]

            # ── Assessments ────────────────────────────────────────────────────
            q3 = (
                db.table("case_agent_assessments")
                .select("*").gt("created_at", cursors["case_agent_assessments"])
                .order("created_at").limit(20)
            )
            if case_filter:
                q3 = q3.eq("case_id", case_filter)
            rows3 = q3.execute().data or []
            for row in rows3:
                _print_assessment(row)
                cursors["case_agent_assessments"] = row["created_at"]

            # ── Notifications ─────────────────────────────────────────────────
            q4 = (
                db.table("case_notifications")
                .select("*").gt("created_at", cursors["case_notifications"])
                .order("created_at").limit(30)
            )
            if case_filter:
                q4 = q4.eq("case_id", case_filter)
            rows4 = q4.execute().data or []
            for row in rows4:
                _print_notification(row)
                cursors["case_notifications"] = row["created_at"]

            # ── Sightings ─────────────────────────────────────────────────────
            q5 = (
                db.table("sightings")
                .select("id,case_id,created_at,zone_approx,reliability_score,action_recommendation")
                .gt("created_at", cursors["sightings"])
                .order("created_at").limit(20)
            )
            if case_filter:
                q5 = q5.eq("case_id", case_filter)
            rows5 = q5.execute().data or []
            for row in rows5:
                _print_sighting(row)
                cursors["sightings"] = row["created_at"]

            sys.stdout.flush()

        except KeyboardInterrupt:
            print(f"\n{DIM}Monitor stopped.{R}")
            return
        except Exception as exc:
            print(f"{RED}Poll error: {exc}{R}")

        time.sleep(poll_interval)

def main() -> None:
    p = argparse.ArgumentParser(description="Nona full-stack real-time monitor")
    p.add_argument("--case",     default=None,  help="Filter by case_id UUID")
    p.add_argument("--since",    type=int, default=10, help="Tail last N minutes (default 10)")
    p.add_argument("--interval", type=int, default=3,  help="Poll interval seconds (default 3)")
    args = p.parse_args()
    run(case_filter=args.case, since_minutes=args.since, poll_interval=args.interval)

if __name__ == "__main__":
    main()
