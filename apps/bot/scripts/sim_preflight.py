#!/usr/bin/env python3
"""
Sandbox simulation preflight — fail-closed leak prevention.

Refuses to let a sim session start unless every real-world side-effect channel is
provably disabled or routed to the founder. Run BEFORE seeding / running a sim.

Checks:
  1. SIMULATION_MODE master flag OR a configured real-delivery allowlist.
  2. Facebook/Instagram posting disabled (META_*/FACEBOOK_* tokens unset).
  3. Email disabled or safe (RESEND_API_KEY empty, or SMTP_HOST=localhost).
  4. A sandbox bot token is configured (so we don't poll prod's bot).
  5. Prod fly bot is paused (best-effort: `fly status -a salvacao-bot`).

Exit 0 = safe to proceed. Non-zero = abort.

Usage: uv run python scripts/sim_preflight.py
"""
from __future__ import annotations

import os
import pathlib
import shutil
import subprocess
import sys

_BOT = pathlib.Path(__file__).parent.parent


def _load_env() -> None:
    for name in (".env.sim", ".env.local", ".env"):
        p = _BOT / name
        if not p.exists():
            continue
        for line in open(p):
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())


def main() -> int:
    _load_env()
    fails: list[str] = []
    warns: list[str] = []

    sim = (os.environ.get("SIMULATION_MODE", "").lower() in ("1", "true", "yes"))
    allowlist = [x for x in os.environ.get("SIM_REAL_DELIVERY_ALLOWLIST", "").split(",") if x.strip()]
    if not sim and not allowlist:
        fails.append("Neither SIMULATION_MODE=true nor SIM_REAL_DELIVERY_ALLOWLIST set "
                     "— real delivery would be unrestricted.")

    # Facebook / Instagram must be inert.
    for var in ("META_ACCESS_TOKEN", "META_PAGE_ID", "FACEBOOK_PAGE_ACCESS_TOKEN",
                "FACEBOOK_PAGE_ID", "INSTAGRAM_BUSINESS_ACCOUNT_ID"):
        if os.environ.get(var):
            fails.append(f"{var} is set — real Facebook/Instagram posting could fire. Unset it.")

    # Email must be disabled or safe.
    resend = os.environ.get("RESEND_API_KEY", "")
    smtp_host = os.environ.get("SMTP_HOST", "")
    if resend and resend != "re_placeholder" and smtp_host not in ("localhost", "127.0.0.1", ""):
        fails.append("RESEND_API_KEY is live AND SMTP_HOST is not local — real emails could send. "
                     "Set RESEND_API_KEY='' for the sim session.")
    elif resend and resend != "re_placeholder":
        warns.append("RESEND_API_KEY is set; relying on SMTP_HOST=localhost. Prefer RESEND_API_KEY='' in sim.")

    # Sandbox bot token present.
    if not os.environ.get("TELEGRAM_BOT_TOKEN"):
        warns.append("TELEGRAM_BOT_TOKEN not set — needed only if running the local bot for real delivery.")

    # Prod fly bot should be paused (best-effort).
    fly = shutil.which("fly") or shutil.which("flyctl") or os.path.expanduser("~/.fly/bin/fly")
    if fly and os.path.exists(fly):
        try:
            out = subprocess.run([fly, "machine", "list", "-a", "salvacao-bot"],
                                 capture_output=True, text=True, timeout=30).stdout
            started = [ln for ln in out.splitlines() if "started" in ln and "bot" in ln]
            if started:
                warns.append("Prod fly bot 'salvacao-bot' has STARTED machines — pause them "
                             "(`fly machine stop <id> -a salvacao-bot`) to avoid double-processing.")
        except Exception as exc:
            warns.append(f"Could not check prod fly bot status: {exc}")
    else:
        warns.append("fly CLI not found — cannot verify prod bot is paused. Verify manually.")

    print("=== SIM PREFLIGHT ===")
    print(f"SIMULATION_MODE={sim}  allowlist={allowlist or '(none)'}")
    for w in warns:
        print(f"  ⚠️  {w}")
    for f in fails:
        print(f"  ❌  {f}")
    if fails:
        print("\nPREFLIGHT FAILED — aborting. Fix the ❌ items above.")
        return 1
    print("\nPREFLIGHT OK — safe to proceed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
