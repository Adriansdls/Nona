"""Shared helpers for the sandbox simulation scripts."""
from __future__ import annotations

import os
import pathlib

_BOT = pathlib.Path(__file__).parent.parent

# Invented region — NEVER a real Algarve municipality, so real kb_canils/kb_vets/
# kb_channels never match and no real org can be contacted.
SIM_MUNIS = {
    "Simlandia-Norte": (-8.30, 37.30),
    "Simlandia-Sul":   (-8.10, 37.05),
    "Simlandia-Este":  (-7.80, 37.15),
}
SIM_SOURCE = "sim"


def load_env() -> None:
    """Load .env.sim, then .env.local, then .env (first wins) into os.environ."""
    for name in (".env.sim", ".env.local", ".env"):
        p = _BOT / name
        if not p.exists():
            continue
        for line in open(p):
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())


def get_db():
    from supabase import create_client
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])


def point(lng: float, lat: float) -> str:
    """Postgres point literal (lng,lat) — matches cases.last_seen_coords_approx."""
    return f"({lng},{lat})"
