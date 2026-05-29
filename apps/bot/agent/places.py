"""
WS1 — Contact discovery via Google Places + email extraction.

Resolves the cold-start KB problem: most Algarve municipalities have no canil/vet
contacts, so the WP18 professional-network alert reaches nobody. This finds the
orgs (Places) AND extracts an email (site scan) — because the alert filters
`email IS NOT NULL`, a row without an email is useless to it.

Uses the Places API v1 searchText (one call returns phone + website via field mask).
Email is NOT in Places → we fetch the org website + contact page and regex it.
"""
from __future__ import annotations

import os
import re
from typing import Any

import httpx

PLACES_ENDPOINT = "https://places.googleapis.com/v1/places:searchText"
# Fields we need; keeps cost down (Places bills per requested field tier).
FIELD_MASK = (
    "places.displayName,places.formattedAddress,places.nationalPhoneNumber,"
    "places.websiteUri,places.location"
)

_EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
# Junk we never want to treat as a contact email.
_EMAIL_BLOCKLIST = ("example.", "sentry.", "@2x", ".png", ".jpg", "wixpress.com")
_CONTACT_PATHS = ("", "/contactos", "/contacto", "/contactos.aspx", "/contact", "/pt/contactos")


async def discover_orgs(municipality: str, kind: str) -> list[dict[str, Any]]:
    """
    Places Text Search for canis/vets in a municipality.
    kind: 'canil' | 'vet'. Returns [{name, address, phone, website, lat, lng}].
    Returns [] if no API key (caller handles gracefully).
    """
    api_key = os.environ.get("GOOGLE_PLACES_API_KEY")
    if not api_key:
        return []

    query = (
        f"canil municipal {municipality} Algarve Portugal"
        if kind == "canil"
        else f"clínica veterinária {municipality} Algarve Portugal"
    )
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            r = await client.post(
                PLACES_ENDPOINT,
                headers={
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": api_key,
                    "X-Goog-FieldMask": FIELD_MASK,
                },
                json={"textQuery": query, "languageCode": "pt", "maxResultCount": 10},
            )
            r.raise_for_status()
            data = r.json()
    except Exception:
        return []

    out: list[dict[str, Any]] = []
    for p in data.get("places", []):
        loc = p.get("location") or {}
        out.append({
            "name": (p.get("displayName") or {}).get("text", ""),
            "address": p.get("formattedAddress", ""),
            "phone": p.get("nationalPhoneNumber"),
            "website": p.get("websiteUri"),
            "lat": loc.get("latitude"),
            "lng": loc.get("longitude"),
        })
    return [o for o in out if o["name"]]


async def extract_email(website: str | None) -> str | None:
    """
    Fetch an org website + likely contact pages and return the first plausible email.
    Reliable for câmaras (canis) whose contact email is published; hit-or-miss for vets.
    """
    if not website:
        return None
    base = website.rstrip("/")
    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
        for path in _CONTACT_PATHS:
            try:
                resp = await client.get(base + path, headers={"User-Agent": "NonaBot/1.0"})
                if resp.status_code != 200:
                    continue
                for match in _EMAIL_RE.findall(resp.text):
                    low = match.lower()
                    if any(b in low for b in _EMAIL_BLOCKLIST):
                        continue
                    return low
            except Exception:
                continue
    return None


async def discover_contacts_with_email(municipality: str, kind: str) -> list[dict[str, Any]]:
    """discover_orgs + extract_email per result. Email may be None (still stored)."""
    orgs = await discover_orgs(municipality, kind)
    for org in orgs:
        org["email"] = await extract_email(org.get("website"))
    return orgs
