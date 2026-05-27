"""
Tool definitions and executors for the SalvaCão Claude agent.
"""
from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from typing import Any

import httpx

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Conversation state
# ---------------------------------------------------------------------------

@dataclass
class ConvState:
    """Conversation state persisted in bot_conversations.state JSONB."""
    flow: str = "idle"   # idle | reporting | found | sighting | done
    draft: dict[str, Any] = field(default_factory=dict)
    staged_photos: list[str] = field(default_factory=list)
    history: list[dict] = field(default_factory=list)
    locale: str = "pt"
    created_case_slug: str | None = None
    telegram_id: int | None = None

    @classmethod
    def from_json(cls, data: dict) -> "ConvState":
        return cls(
            flow=data.get("flow", "idle"),
            draft=data.get("draft", {}),
            staged_photos=data.get("staged_photos", []),
            history=data.get("history", []),
            locale=data.get("locale", "pt"),
            created_case_slug=data.get("created_case_slug"),
            telegram_id=data.get("telegram_id"),
        )

    def to_json(self) -> dict:
        return {
            "flow": self.flow,
            "draft": self.draft,
            "staged_photos": self.staged_photos,
            "history": self.history,
            "locale": self.locale,
            "created_case_slug": self.created_case_slug,
            "telegram_id": self.telegram_id,
        }


# ---------------------------------------------------------------------------
# Tool definitions (sent to Anthropic)
# ---------------------------------------------------------------------------

TOOL_DEFINITIONS = [
    {
        "name": "record_facts",
        "description": (
            "Store facts about the dog case as you learn them. Call this every time the user "
            "provides information. Keys use snake_case matching the case schema: "
            "dog_name, breed, sex, size, primary_color, secondary_color, distinctive_marks, "
            "has_chip, chip_last_3, last_seen_at, last_seen_municipality, last_seen_zone_approx, "
            "reporter_name, reporter_email, reporter_phone, reporter_contact_public, "
            "type (perdido|encontrado), suspected_theft, context, description."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "facts": {
                    "type": "object",
                    "description": "Key-value pairs to merge into the draft case.",
                }
            },
            "required": ["facts"],
        },
    },
    {
        "name": "search_lost_dogs_by_photo",
        "description": (
            "Run ML visual similarity search against all active 'perdido' cases. "
            "Call this immediately when a user reports seeing a dog (avistamento flow) "
            "and has uploaded at least one photo. "
            "Also call this at the start of an 'encontrado' flow after the first photo is uploaded. "
            "Returns the top matching cases with similarity scores. "
            "YOU decide whether a match is strong enough — a score above 60 is promising, "
            "above 75 is strong. Consider breed, color, distinctive marks, and municipality "
            "alongside the score. If no good match, proceed to create an 'encontrado' case."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "municipality": {
                    "type": "string",
                    "description": "Municipality where the dog was seen. Narrows the search.",
                },
                "limit": {
                    "type": "integer",
                    "default": 5,
                },
            },
            "required": [],
        },
    },
    {
        "name": "attach_sighting_to_case",
        "description": (
            "Attach a sighting to an existing perdido case after confirming a match. "
            "Use this when search_lost_dogs_by_photo returned a strong match and you've "
            "confirmed (or are confident enough) that this is the same dog. "
            "The user does NOT need to confirm the case ID — you make that call based on "
            "the evidence."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "case_id": {
                    "type": "string",
                    "description": "UUID of the matching case from search results.",
                },
                "case_slug": {
                    "type": "string",
                    "description": "Slug of the matched case (for the confirmation message).",
                },
                "municipality": {"type": "string"},
                "zone_approx": {
                    "type": "string",
                    "description": "Neighborhood/area — never exact address.",
                },
                "seen_at": {
                    "type": "string",
                    "description": "ISO 8601 datetime.",
                },
                "description": {"type": "string"},
                "seemed_injured": {"type": "boolean"},
                "was_moving": {"type": "boolean"},
                "direction": {"type": "string"},
            },
            "required": ["case_id", "case_slug", "municipality", "zone_approx", "seen_at", "description"],
        },
    },
    {
        "name": "create_case",
        "description": (
            "Submit the accumulated draft as a new case. Use for: "
            "(1) perdido — owner reporting their missing dog, "
            "(2) encontrado — no strong ML match found for a seen/found dog. "
            "ONLY call after all required fields are in the draft AND user has confirmed. "
            "Required: type, breed, sex, size, primary_color, last_seen_at, "
            "last_seen_municipality, last_seen_zone_approx, reporter_name, reporter_email."
        ),
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "get_case",
        "description": "Fetch public details of a case by slug. Use to look up a specific case.",
        "input_schema": {
            "type": "object",
            "properties": {
                "slug": {"type": "string"},
            },
            "required": ["slug"],
        },
    },
]


# ---------------------------------------------------------------------------
# Tool executors
# ---------------------------------------------------------------------------

async def execute_tool(
    name: str,
    inputs: dict[str, Any],
    state: ConvState,
    web_app_url: str,
    internal_token: str,
    supabase_client: Any = None,
) -> tuple[str, ConvState]:
    try:
        if name == "record_facts":
            return await _record_facts(inputs, state)
        elif name == "search_lost_dogs_by_photo":
            return await _search_lost_dogs_by_photo(inputs, state, web_app_url, internal_token)
        elif name == "attach_sighting_to_case":
            return await _attach_sighting_to_case(inputs, web_app_url, internal_token)
        elif name == "create_case":
            return await _create_case(state, web_app_url, internal_token)
        elif name == "get_case":
            return await _get_case(inputs, web_app_url)
        else:
            return f"Unknown tool: {name}", state
    except Exception as e:
        logger.exception("Tool %s failed", name)
        return f"Tool error: {e}", state


async def _record_facts(inputs: dict, state: ConvState) -> tuple[str, ConvState]:
    facts = inputs.get("facts", {})
    state.draft.update(facts)
    return f"Recorded: {', '.join(facts.keys())}", state


async def _search_lost_dogs_by_photo(
    inputs: dict, state: ConvState, web_app_url: str, internal_token: str
) -> tuple[str, ConvState]:
    if not state.staged_photos:
        return "No staged photos available — ask the user to send a photo first.", state

    payload: dict[str, Any] = {"stagedPhotoPath": state.staged_photos[0], "limit": inputs.get("limit", 5)}
    if inputs.get("municipality"):
        payload["municipality"] = inputs["municipality"]

    async with httpx.AsyncClient(timeout=35) as client:
        resp = await client.post(
            f"{web_app_url}/api/bot/search-similar",
            json=payload,
            headers={"x-internal-token": internal_token},
        )

    if resp.status_code != 200:
        return f"Search failed: {resp.status_code}", state

    body = resp.json()
    matches = body.get("data", [])
    fallback = body.get("fallback", False)

    if fallback:
        return (
            "ML service unavailable. No visual matches possible right now. "
            "Proceed to create an 'encontrado' case with the available information.",
            state,
        )

    if not matches:
        return (
            "No visually similar lost dogs found in the database. "
            "Proceed to create an 'encontrado' case.",
            state,
        )

    lines = [f"Found {len(matches)} potential match(es):"]
    for m in matches:
        name = m.get("dogName") or "Sem nome"
        breed = m.get("breed", "")
        color = m.get("primaryColor", "")
        municipality = m.get("lastSeenMunicipality", "")
        days = m.get("daysMissing", "?")
        score = m.get("similarityScore", 0)
        marks = ", ".join(m.get("distinctiveMarks") or []) or "none"
        lines.append(
            f"- [{score}% match] {name} ({breed}, {color}), "
            f"missing {days} days in {municipality}. "
            f"Distinctive marks: {marks}. "
            f"Case ID: {m['caseId']} / slug: {m['slug']}"
        )

    return "\n".join(lines), state


async def _attach_sighting_to_case(
    inputs: dict, web_app_url: str, internal_token: str
) -> tuple[str, ConvState]:
    case_id = inputs["case_id"]
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            f"{web_app_url}/api/sightings/{case_id}",
            json={
                "seenAt": inputs["seen_at"],
                "municipality": inputs["municipality"],
                "zoneApprox": inputs["zone_approx"],
                "description": inputs["description"],
                "seemedInjured": inputs.get("seemed_injured"),
                "wasMoving": inputs.get("was_moving"),
                "direction": inputs.get("direction"),
            },
            headers={"x-internal-token": internal_token},
        )
    if resp.status_code not in (200, 201):
        return f"Failed to attach sighting: {resp.text}", None  # type: ignore[return-value]

    slug = inputs["case_slug"]
    return json.dumps({"success": True, "case_slug": slug}), None  # type: ignore[return-value]


async def _create_case(
    state: ConvState, web_app_url: str, internal_token: str
) -> tuple[str, ConvState]:
    draft = state.draft
    required = [
        "type", "breed", "sex", "size", "primary_color",
        "last_seen_at", "last_seen_municipality", "last_seen_zone_approx",
        "reporter_name", "reporter_email",
    ]
    missing = [f for f in required if not draft.get(f)]
    if missing:
        return f"Cannot create case — missing: {', '.join(missing)}", state

    payload = {
        "type": draft["type"],
        "breed": draft["breed"],
        "sex": draft.get("sex", "desconhecido"),
        "size": draft["size"],
        "primaryColor": draft["primary_color"],
        "secondaryColor": draft.get("secondary_color"),
        "dogName": draft.get("dog_name"),
        "distinctiveMarks": draft.get("distinctive_marks", []),
        "ageEstimate": draft.get("age_estimate"),
        "hasChip": draft.get("has_chip"),
        "chipLast3": draft.get("chip_last_3"),
        "lastSeenAt": draft["last_seen_at"],
        "lastSeenMunicipality": draft["last_seen_municipality"],
        "lastSeenZoneApprox": draft["last_seen_zone_approx"],
        "description": draft.get("description", "Reportado via Telegram."),
        "context": draft.get("context"),
        "suspectedTheft": draft.get("suspected_theft", False),
        "reporterName": draft["reporter_name"],
        "reporterEmail": draft["reporter_email"],
        "reporterPhone": draft.get("reporter_phone"),
        "reporterContactPublic": draft.get("reporter_contact_public"),
        "reporterTelegramId": str(state.telegram_id) if state.telegram_id else None,
        "stagedPhotos": state.staged_photos,
        "privacyAccepted": True,
        "photoPermission": True,
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{web_app_url}/api/bot/cases",
            json=payload,
            headers={"x-internal-token": internal_token},
        )

    if resp.status_code not in (200, 201):
        logger.error("create_case failed: %s %s", resp.status_code, resp.text)
        return f"Failed to create case: {resp.text}", state

    result = resp.json()
    slug = result.get("data", {}).get("slug", "")
    state.created_case_slug = slug
    state.flow = "done"
    return json.dumps({"success": True, "slug": slug}), state


async def _get_case(inputs: dict, web_app_url: str) -> tuple[str, ConvState]:
    slug = inputs["slug"]
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(f"{web_app_url}/api/cases/{slug}")
    if resp.status_code == 404:
        return f"No case found with slug '{slug}'.", None  # type: ignore[return-value]
    if resp.status_code != 200:
        return f"Error: {resp.status_code}", None  # type: ignore[return-value]
    data = resp.json().get("data", {})
    return (
        f"{data.get('dogName') or 'Unnamed'} ({data.get('breed')}), "
        f"status={data.get('status')}, id={data.get('id')}, slug={data.get('slug')}"
    ), None  # type: ignore[return-value]
