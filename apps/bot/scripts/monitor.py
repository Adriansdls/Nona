#!/usr/bin/env python3
"""
Real-time PI agent monitor.

Tails case_agent_events, case_notifications, case_agent_assessments.
Polls every 3s. Prints color-coded output to terminal.

Usage:
    SUPABASE_URL=... SUPABASE_SERVICE_KEY=... python scripts/monitor.py
    python scripts/monitor.py --case <case_id>
    python scripts/monitor.py --since 30  # tail last 30 minutes
"""
from __future__ import annotations

import argparse
import os
import sys
import time
from datetime import datetime, timedelta, timezone

# Allow running from repo root or scripts/
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from supabase import create_client

# ── ANSI colours ────────────────────────────────────────────────────────────
R = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"
RED = "\033[91m"
YEL = "\033[93m"
GRN = "\033[92m"
CYN = "\033[96m"
MAG = "\033[95m"
BLU = "\033[94m"
WHT = "\033[97m"


def _ts(iso: str) -> str:
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return dt.astimezone().strftime("%H:%M:%S")
    except Exception:
        return iso[:8]


def _print_event(row: dict) -> None:
    ts = _ts(row.get("created_at", ""))
    case_id = str(row.get("case_id", ""))[:8]
    action = str(row.get("action_type", ""))
    tool = str(row.get("tool_used", "") or "")
    detail = str(row.get("detail", "") or "")[:120]
    phase = str(row.get("phase", "") or "")

    color = CYN if tool else BLU
    tool_str = f" [{GRN}{tool}{R}{color}]" if tool else ""
    phase_str = f" {DIM}({phase}){R}" if phase else ""
    print(f"{DIM}{ts}{R} {color}EVENT{R}{phase_str}  {WHT}{case_id}{R}{tool_str}  {action}  {DIM}{detail}{R}")


def _print_assessment(row: dict) -> None:
    ts = _ts(row.get("created_at", ""))
    case_id = str(row.get("case_id", ""))[:8]
    summary = str(row.get("summary", "") or "")[:200]
    next_action = str(row.get("next_action", "") or "")[:100]
    confidence = row.get("confidence_score")
    conf_str = f" {YEL}conf={confidence:.2f}{R}" if confidence else ""
    print(f"{DIM}{ts}{R} {MAG}ASSESS{R}  {WHT}{case_id}{R}{conf_str}  {summary}")
    if next_action:
        print(f"          {DIM}→ next: {next_action}{R}")


def _print_notification(row: dict) -> None:
    ts = _ts(row.get("created_at", ""))
    case_id = str(row.get("case_id", ""))[:8]
    channel = str(row.get("channel", ""))
    sent = row.get("sent_at")
    msg = str(row.get("message", "") or "")[:160]
    status = f"{GRN}SENT{R}" if sent else f"{YEL}PENDING{R}"
    print(f"{DIM}{ts}{R} {RED}NOTIF{R}  {WHT}{case_id}{R}  [{channel}] {status}  {DIM}{msg}{R}")


def run(case_id: str | None, since_minutes: int, poll_interval: int) -> None:
    url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
    key = (
        os.environ.get("SUPABASE_SERVICE_KEY")
        or os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    )
    if not url or not key:
        sys.exit("ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars.")

    db = create_client(url, key)
    since = datetime.now(timezone.utc) - timedelta(minutes=since_minutes)
    last_event_ts = since.isoformat()
    last_assess_ts = since.isoformat()
    last_notif_ts = since.isoformat()

    sim = os.environ.get("SIMULATION_MODE", "").lower() in ("1", "true", "yes")
    sim_badge = f" {YEL}[SIM MODE]{R}" if sim else ""

    print(f"\n{BOLD}{WHT}Nona PI Monitor{R}{sim_badge}  {DIM}polling every {poll_interval}s · Ctrl-C to stop{R}\n")
    if case_id:
        print(f"{DIM}Filtering: case_id = {case_id[:8]}…{R}\n")
    else:
        print(f"{DIM}Showing: all cases from last {since_minutes}min{R}\n")

    print(f"{'─' * 80}")
    print(f"  {CYN}EVENT{R}  = tool calls / phase transitions / actions taken")
    print(f"  {MAG}ASSESS{R} = PI agent assessment + next planned action")
    print(f"  {RED}NOTIF{R}  = owner/volunteer notifications (email/telegram/whatsapp)")
    print(f"{'─' * 80}\n")

    while True:
        try:
            # ── agent events ──────────────────────────────────────────────
            q = (
                db.table("case_agent_events")
                .select("*")
                .gt("created_at", last_event_ts)
                .order("created_at")
                .limit(50)
            )
            if case_id:
                q = q.eq("case_id", case_id)
            rows = q.execute().data or []
            for row in rows:
                _print_event(row)
                last_event_ts = row["created_at"]

            # ── assessments ───────────────────────────────────────────────
            q2 = (
                db.table("case_agent_assessments")
                .select("*")
                .gt("created_at", last_assess_ts)
                .order("created_at")
                .limit(20)
            )
            if case_id:
                q2 = q2.eq("case_id", case_id)
            rows2 = q2.execute().data or []
            for row in rows2:
                _print_assessment(row)
                last_assess_ts = row["created_at"]

            # ── notifications ─────────────────────────────────────────────
            q3 = (
                db.table("case_notifications")
                .select("*")
                .gt("created_at", last_notif_ts)
                .order("created_at")
                .limit(20)
            )
            if case_id:
                q3 = q3.eq("case_id", case_id)
            rows3 = q3.execute().data or []
            for row in rows3:
                _print_notification(row)
                last_notif_ts = row["created_at"]

        except KeyboardInterrupt:
            print(f"\n{DIM}Monitor stopped.{R}")
            return
        except Exception as exc:
            print(f"{RED}Poll error: {exc}{R}")

        time.sleep(poll_interval)


def main() -> None:
    p = argparse.ArgumentParser(description="Nona PI agent real-time monitor")
    p.add_argument("--case", default=None, help="Filter by case_id UUID")
    p.add_argument("--since", type=int, default=10, help="Tail last N minutes (default 10)")
    p.add_argument("--interval", type=int, default=3, help="Poll interval seconds (default 3)")
    args = p.parse_args()
    run(case_id=args.case, since_minutes=args.since, poll_interval=args.interval)


if __name__ == "__main__":
    main()
