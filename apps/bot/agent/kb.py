"""
Knowledge base read/write helpers.
All KB tables are agent-writable — agents discover new resources and write them back.
"""
from __future__ import annotations

from typing import Any

from supabase import Client


def lookup_canils(db: Client, municipality: str) -> list[Any]:
    rows = db.table('kb_canils') \
        .select('*') \
        .ilike('municipality', f'%{municipality}%') \
        .execute()
    return rows.data or []  # type: ignore[return-value]


def lookup_vets(db: Client, municipality: str) -> list[Any]:
    rows = db.table('kb_vets') \
        .select('*') \
        .ilike('municipality', f'%{municipality}%') \
        .execute()
    return rows.data or []  # type: ignore[return-value]


def lookup_channels(
    db: Client,
    municipality: str,
    breed_category: str | None = None,
) -> list[Any]:
    q = db.table('kb_channels') \
        .select('*') \
        .ilike('municipality', f'%{municipality}%')
    if breed_category:
        q = q.or_(f'breed_focus.is.null,breed_focus.eq.{breed_category}')
    return q.execute().data or []  # type: ignore[return-value]


def record_discovery(db: Client, kind: str, data: dict) -> None:
    """Write agent-discovered resource to KB. Idempotent on (name, municipality)."""
    table_map = {'canil': 'kb_canils', 'vet': 'kb_vets', 'channel': 'kb_channels'}
    table = table_map.get(kind)
    if not table:
        return
    payload = {k: v for k, v in data.items() if k != 'type'}
    payload['source'] = 'agent_discovered'
    db.table(table).upsert(payload, on_conflict='name,municipality').execute()
