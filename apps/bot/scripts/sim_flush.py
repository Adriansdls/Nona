#!/usr/bin/env python3
"""
Flush pending case_notifications for a sim session WITHOUT running the full bot daemon.

Mirrors channels.telegram._flush_notifications routing: real send only to
SIM_REAL_DELIVERY_ALLOWLIST (and not is_simulated); everyone else bulk-marked sent
with no API call. Throttled real sends. Lets deterministic sim runs deliver the
founder's real DMs on demand.

Usage: uv run python scripts/sim_flush.py
"""
from __future__ import annotations

import sys
import time

import httpx
import pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))
from _sim_common import load_env, get_db
import os

load_env()
from agent import sim_config  # noqa: E402

MAX_REAL = 50
PER_SEND_SLEEP = 0.05


def main() -> int:
    db = get_db()
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    pending = (db.table("case_notifications")
               .select("*").is_("sent_at", "null").eq("channel", "telegram")
               .limit(500).execute().data or [])
    sim_ids, real_sent, real_fail = [], 0, 0
    for n in pending:
        tid = n.get("telegram_id")
        if not tid:
            continue
        real = sim_config.is_real_recipient(tid) and not n.get("is_simulated")
        if not real:
            sim_ids.append(n["id"])
            continue
        if real_sent >= MAX_REAL or not token:
            db.table("case_notifications").update({"rate_limit_flag": True}).eq("id", n["id"]).execute()
            continue
        try:
            r = httpx.post(f"https://api.telegram.org/bot{token}/sendMessage",
                           json={"chat_id": tid, "text": n["message"]}, timeout=10.0)
            if r.json().get("ok"):
                db.table("case_notifications").update({"sent_at": "now()"}).eq("id", n["id"]).execute()
                real_sent += 1
                time.sleep(PER_SEND_SLEEP)
            else:
                real_fail += 1
                print(f"  real send failed tid={tid}: {r.json().get('description')}")
        except Exception as exc:
            real_fail += 1
            print(f"  real send error tid={tid}: {str(exc)[:80]}")
    if sim_ids:
        # chunked bulk-mark
        for i in range(0, len(sim_ids), 100):
            db.table("case_notifications").update({"sent_at": "now()"}).in_("id", sim_ids[i:i+100]).execute()
    print(f"FLUSH DONE: real_sent={real_sent} real_failed={real_fail} sim_recorded={len(sim_ids)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
