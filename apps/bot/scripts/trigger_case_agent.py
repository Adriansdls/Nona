#!/usr/bin/env python3
"""
Manual one-shot trigger for the PI case agent.

Fallback for when the realtime listener doesn't fire.

Usage:
    uv run python scripts/trigger_case_agent.py --case-id <uuid>
    uv run python scripts/trigger_case_agent.py --case-id <uuid> --trigger sighting_added
"""
from __future__ import annotations

import argparse
import asyncio
import os
import pathlib
import sys

# Mirror runner.py: insert the bot package root so `from agent.*` resolves.
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))

_BOT_DIR = pathlib.Path(__file__).parent.parent


def _load_env() -> None:
    """Load .env.local then .env from apps/bot, only for keys not already set."""
    for name in (".env.local", ".env"):
        env_file = _BOT_DIR / name
        if not env_file.exists():
            continue
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, _, value = line.partition("=")
                key = key.strip()
                value = value.strip()
                if key and key not in os.environ:
                    os.environ[key] = value


def main() -> None:
    _load_env()

    p = argparse.ArgumentParser(description="Manually run the PI case agent for a given case.")
    p.add_argument("--case-id", required=True, help="UUID of the case to process")
    p.add_argument("--trigger", default="case_created", help="Trigger label (default: case_created)")
    args = p.parse_args()

    from supabase import create_client
    from agent.case_agent import run_case_agent

    db = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

    print(f"[trigger_case_agent] starting — case_id={args.case_id} trigger={args.trigger}")
    asyncio.run(run_case_agent(args.case_id, db, trigger=args.trigger))
    print(f"[trigger_case_agent] done — case_id={args.case_id} trigger={args.trigger}")


if __name__ == "__main__":
    main()
