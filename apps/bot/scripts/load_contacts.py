#!/usr/bin/env python3
"""
Task A — load real canil/vet contact emails into the KB.

The WP18 two-tier alert ("canis e veterinários avisados") only fires to rows that
have an email. Prod today has 0 emails → the alert reaches nobody. This loader
fills them from a hand-curated CSV so the value prop becomes TRUE for the pilot
municipalities, and the dashboard's honest status can show real "✓ confirmado".

Workflow:
  1. Open apps/bot/data/pilot_contacts.csv — rows are pre-filled with the real
     canil/vet names/phones for the pilot municipalities (Faro, Loulé, Lagos,
     Albufeira). Fill the `email` column from each org's public contact page.
  2. Dry-run to preview:   python scripts/load_contacts.py --dry-run
  3. Apply:                python scripts/load_contacts.py

Idempotent: upserts by (name, municipality) and ONLY touches rows that have an
email in the CSV (blank-email rows are skipped, never wiping existing data).
Sets last_verified_at so the agent knows the contact is field-verified.

CSV columns: kind,municipality,name,phone,email,source
  kind = canil | vet   → routes to kb_canils / kb_vets

Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (falls back to SUPABASE_SERVICE_KEY)
"""
from __future__ import annotations

import argparse
import csv
import os
import sys
from datetime import datetime, timezone

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

DEFAULT_CSV = os.path.join(os.path.dirname(__file__), "..", "data", "pilot_contacts.csv")
TABLE_FOR_KIND = {"canil": "kb_canils", "vet": "kb_vets"}


def _db():
    url = os.environ["SUPABASE_URL"]
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ["SUPABASE_SERVICE_KEY"]
    return create_client(url, key)


def load_rows(csv_path: str) -> list[dict]:
    with open(csv_path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", default=DEFAULT_CSV)
    ap.add_argument("--dry-run", action="store_true", help="preview, no writes")
    args = ap.parse_args()

    rows = load_rows(args.csv)
    now = datetime.now(timezone.utc).isoformat()

    # Only rows with a real email; group by target table.
    actionable = [r for r in rows if (r.get("email") or "").strip()]
    skipped = len(rows) - len(actionable)

    if not actionable:
        print(f"No rows with an email yet ({skipped} blank). "
              f"Fill the `email` column in {os.path.relpath(args.csv)} and re-run.")
        return 0

    print(f"{len(actionable)} contact(s) with email · {skipped} blank (skipped)")
    for r in actionable:
        kind = (r.get("kind") or "").strip().lower()
        table = TABLE_FOR_KIND.get(kind)
        if not table:
            print(f"  ! unknown kind '{kind}' for {r.get('name')} — skipped")
            continue
        print(f"  {kind:5} · {r['municipality']:10} · {r['name']} → {r['email'].strip()}")

    if args.dry_run:
        print("\n(dry-run — no writes)")
        return 0

    db = _db()
    applied = 0
    for r in actionable:
        kind = (r.get("kind") or "").strip().lower()
        table = TABLE_FOR_KIND.get(kind)
        if not table:
            continue
        record = {
            "municipality": r["municipality"].strip(),
            "name": r["name"].strip(),
            "email": r["email"].strip(),
            "source": (r.get("source") or "pilot").strip(),
            "last_verified_at": now,
        }
        phone = (r.get("phone") or "").strip()
        if phone:
            record["phone"] = phone
        db.table(table).upsert(record, on_conflict="name,municipality").execute()
        applied += 1

    print(f"\n✓ {applied} contact(s) upserted. WP18 alert now reaches them.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
