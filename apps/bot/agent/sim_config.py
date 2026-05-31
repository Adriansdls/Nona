"""
Simulation delivery routing config.

Two-layer delivery for the sandbox simulation:
  * REAL  — only telegram ids in SIM_REAL_DELIVERY_ALLOWLIST (the founder's own
            id + private group chat_id) receive an actual Telegram message.
  * VIRTUAL — every other recipient (synthetic sim actors) is recorded as sent
            without any Telegram API call.

SIMULATION_MODE=true is a master override that forces EVERYTHING virtual
(preserves the original global-sim behavior).
"""
from __future__ import annotations

import os


def _truthy(val: str | None) -> bool:
    return (val or "").strip().lower() in ("1", "true", "yes")


def simulation_mode() -> bool:
    """Master override — when true, nothing is ever sent for real."""
    return _truthy(os.environ.get("SIMULATION_MODE"))


# Back-compat module constant (read once at import, like the rest of the codebase).
SIMULATION_MODE = _truthy(os.environ.get("SIMULATION_MODE"))


def real_allowlist() -> set[int]:
    """Telegram ids allowed to receive REAL messages. Read fresh from env."""
    raw = os.environ.get("SIM_REAL_DELIVERY_ALLOWLIST", "")
    out: set[int] = set()
    for part in raw.split(","):
        part = part.strip()
        if not part:
            continue
        try:
            out.add(int(part))
        except ValueError:
            continue
    return out


def is_real_recipient(tid: object) -> bool:
    """
    True only if real delivery is permitted for this telegram id:
    master sim override is OFF and the id is explicitly allowlisted.
    Empty allowlist => everything virtual.
    """
    if simulation_mode():
        return False
    try:
        tid_int = int(tid)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return False
    return tid_int in real_allowlist()
