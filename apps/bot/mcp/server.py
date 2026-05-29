"""
MCP server exposing the Nona knowledge base as tools.

Runs on SSE transport, port 8081 (internal only — not exposed publicly).
Any agent can call these tools via MCP client without importing Python modules.
Wraps agent/kb.py functions — single source of truth for KB access.
"""
from __future__ import annotations

import os
from typing import Any

from fastmcp import FastMCP
from supabase import Client, create_client

# Inline KB helpers to avoid relative import issues when started as __main__
import sys
import pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))
from agent.kb import lookup_canils, lookup_channels, lookup_vets, record_discovery  # noqa: E402

mcp = FastMCP("salvacao-knowledge")


def _db() -> Client:
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )


@mcp.tool()
def get_canils(municipality: str) -> list[Any]:
    """
    Return shelters (canils) for an Algarve municipality from the live KB.
    Call before notifying a shelter — includes name, phone, hours, hold_period_days.
    """
    return lookup_canils(_db(), municipality)


@mcp.tool()
def get_vets(municipality: str) -> list[Any]:
    """
    Return vet clinics for an Algarve municipality from the live KB.
    Call before notifying vets — includes name, phone, address.
    """
    return lookup_vets(_db(), municipality)


@mcp.tool()
def get_channels(municipality: str, breed_category: str | None = None) -> list[Any]:
    """
    Return broadcast channels (Facebook groups, WhatsApp, Telegram) for a municipality.
    breed_category filters to breed-specific groups (e.g. 'sighthound') plus general ones.
    """
    return lookup_channels(_db(), municipality, breed_category)


@mcp.tool()
def save_discovery(kind: str, data: dict[str, Any]) -> str:
    """
    Persist a newly discovered resource to the KB.
    kind must be 'canil', 'vet', or 'channel'.
    Idempotent on (name, municipality) — safe to call even if resource already exists.
    Call whenever you find a resource not already in the KB.
    """
    record_discovery(_db(), kind, data)
    return f"Saved {kind}: {data.get('name', '?')} in {data.get('municipality', '?')}"


@mcp.tool()
async def discover_contacts(municipality: str, kind: str) -> dict[str, Any]:
    """
    WS1: discover canis/vets for a municipality via Google Places, extract their email
    from their website, and register them to the KB. kind is 'canil' or 'vet'.
    Use to curate a municipality's contacts (e.g. "find and register the canis for Tavira").
    Needs GOOGLE_PLACES_API_KEY. Returns counts {registered, with_email}.
    """
    from agent.places import discover_contacts_with_email
    orgs = await discover_contacts_with_email(municipality, kind)
    db = _db()
    registered = 0
    with_email = 0
    for org in orgs:
        record_discovery(db, kind, {
            "municipality": municipality, "name": org["name"], "phone": org.get("phone"),
            "email": org.get("email"), "address": org.get("address"),
            "lat": org.get("lat") if kind == "vet" else None,
            "lng": org.get("lng") if kind == "vet" else None, "source": "places",
        })
        registered += 1
        if org.get("email"):
            with_email += 1
    return {"registered": registered, "with_email": with_email, "municipality": municipality}


@mcp.tool()
def mark_stale(kind: str, name: str, municipality: str) -> str:
    """
    WS1: flag a KB contact as stale (email bounced / phone dead). Nulls the email so the
    alert stops using it. kind is 'canil', 'vet', or 'channel'.
    """
    table = {"canil": "kb_canils", "vet": "kb_vets", "channel": "kb_channels"}.get(kind)
    if not table:
        return f"unknown kind: {kind}"
    _db().table(table).update({"email": None, "source": "stale"}) \
        .ilike("name", f"%{name}%").eq("municipality", municipality).execute()
    return f"Marked stale: {name} in {municipality}"
