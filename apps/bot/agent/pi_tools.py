"""
PI agent tool definitions and stub executors.

WP2: executors log intent to case_agent_events / case_notifications.
WP4: notify_canil, notify_vet, request_volunteer_alert → real email/API.
WP5: post_to_channel → real Facebook/WhatsApp post.
"""
from __future__ import annotations

import json
import os
import pathlib
import sys
from typing import TYPE_CHECKING, Any

sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))

from supabase import Client

if TYPE_CHECKING:
    from agent.harness import CaseHarness

PI_TOOL_DEFINITIONS: list[dict[str, Any]] = [
    {
        "name": "send_owner_brief",
        "description": (
            "Send a message to the dog owner. "
            "Use for: day-1 action brief, phase-specific guidance (never chase in survival phase), "
            "escalation notification, daily update. "
            "Be direct and actionable — not reassuring filler."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "message": {"type": "string", "description": "Message to owner in PT-PT. Max 400 chars."},
                "guidance_type": {
                    "type": "string",
                    "enum": ["day1_brief", "phase_guidance", "escalation", "daily_update", "resolution"],
                },
            },
            "required": ["message", "guidance_type"],
        },
    },
    {
        "name": "notify_canil",
        "description": (
            "Notify a shelter that a dog matching this case may arrive or has been reported. "
            "Use KB data from the context block — call with real canil name and municipality. "
            "Do NOT call the same canil twice (check ACTIONS ALREADY TAKEN)."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "municipality": {"type": "string"},
                "canil_name": {"type": "string", "description": "Exact name from KB"},
                "canil_phone": {"type": "string"},
                "dog_description": {"type": "string", "description": "Concise description for duty officer"},
            },
            "required": ["municipality", "canil_name", "dog_description"],
        },
    },
    {
        "name": "notify_vet",
        "description": (
            "Alert nearby vet clinics — dog may be found injured and brought in. "
            "Use KB vet data from context. Do NOT call same vet twice."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "municipality": {"type": "string"},
                "vet_name": {"type": "string"},
                "vet_phone": {"type": "string"},
                "dog_description": {"type": "string"},
            },
            "required": ["municipality", "vet_name", "dog_description"],
        },
    },
    {
        "name": "post_to_channel",
        "description": (
            "Post case to a community channel (Facebook group, WhatsApp, Telegram). "
            "Use KB channels from context. Include breed, colour, zone, case URL. "
            "Do NOT post to same channel twice."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "channel_name": {"type": "string"},
                "channel_type": {"type": "string", "enum": ["facebook_group", "whatsapp", "telegram"]},
                "post_content": {"type": "string", "description": "Post text in PT. Include case URL."},
                "breed_specific": {"type": "boolean", "description": "True if posting to a breed-specific group"},
            },
            "required": ["channel_name", "channel_type", "post_content"],
        },
    },
    {
        "name": "record_owner_guidance",
        "description": (
            "Record phase-specific guidance the owner MUST follow. "
            "Examples: scent anchor instructions (panic phase), "
            "never-chase protocol (survival phase for fearful dogs), "
            "humane trap deployment (survival 48h+), "
            "physical shelter visit every 48h (Lord 2007: 2.1x recovery rate)."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "guidance_type": {
                    "type": "string",
                    "enum": ["scent_anchor", "never_chase", "humane_trap", "shelter_visit",
                             "feeding_station", "gnr_report", "chip_check"],
                },
                "instructions": {"type": "string", "description": "Specific instructions in PT, max 300 chars"},
                "urgency": {"type": "string", "enum": ["immediate", "within_24h", "within_48h"]},
            },
            "required": ["guidance_type", "instructions", "urgency"],
        },
    },
    {
        "name": "request_volunteer_alert",
        "description": (
            "Alert registered volunteers within radius of last-seen point. "
            "Use in panic phase or when new sighting received."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "municipality": {"type": "string"},
                "zone_approx": {"type": "string"},
                "radius_km": {"type": "number"},
                "urgency": {"type": "string", "enum": ["immediate", "normal"]},
            },
            "required": ["municipality", "radius_km"],
        },
    },
    {
        "name": "update_case_assessment",
        "description": (
            "Write the agent's current assessment and next planned actions to the case record. "
            "Call ONCE at the end of every run — summarises what was done and what comes next. "
            "This is the PI's case file entry."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "assessment": {"type": "string", "description": "Current situation in 2-3 sentences PT"},
                "actions_taken": {
                    "type": "array", "items": {"type": "string"},
                    "description": "What was done this run",
                },
                "next_planned": {
                    "type": "array", "items": {"type": "string"},
                    "description": "Scheduled next actions",
                },
                "confidence": {"type": "string", "enum": ["high", "medium", "low"]},
            },
            "required": ["assessment", "actions_taken", "next_planned"],
        },
    },
]


async def execute_pi_tool(
    name: str,
    inputs: dict[str, Any],
    harness: "CaseHarness",
    db: Client,
) -> str:
    case = harness.case
    case_id = case["id"]
    slug = case.get("slug", "?")
    web_url = os.environ.get("WEB_APP_URL", "https://salvacao.pt")

    if name == "send_owner_brief":
        message = str(inputs.get("message", ""))
        guidance_type = str(inputs.get("guidance_type", "daily_update"))
        telegram_id = case.get("reporter_telegram_id")
        owner_token = case.get("owner_token")

        # Append dashboard link to every owner message
        if owner_token:
            dashboard_url = f"{web_url}/pt/meu-caso/{owner_token}"
            message = f"{message}\n\n🔗 Painel: {dashboard_url}"

        db.table("case_notifications").insert({
            "case_id": case_id,
            "channel": "telegram" if telegram_id else "log",
            "telegram_id": int(telegram_id) if telegram_id else None,
            "message": message,
            "phase": harness.phase.value,
        }).execute()

        action = f"owner_brief_{guidance_type}"
        harness.log_action(action, name, f"queued: {message[:80]}")
        return json.dumps({"queued": True, "channel": "telegram" if telegram_id else "log"})

    if name == "notify_canil":
        municipality = str(inputs.get("municipality", ""))
        canil_name = str(inputs.get("canil_name", ""))
        dog_desc = str(inputs.get("dog_description", ""))
        action = f"notified_canil_{canil_name.lower().replace(' ', '_')[:30]}"

        if harness.skip_if_done(action):
            return json.dumps({"skipped": True, "reason": "already notified"})

        harness.log_action(
            action, name,
            f"[STUB] Would notify {canil_name} ({municipality}): {dog_desc[:100]} — "
            f"caso: {web_url}/caso/{slug}"
        )
        return json.dumps({"logged": True, "canil": canil_name, "real_send": "wired in WP4"})

    if name == "notify_vet":
        vet_name = str(inputs.get("vet_name", ""))
        municipality = str(inputs.get("municipality", ""))
        dog_desc = str(inputs.get("dog_description", ""))
        action = f"notified_vet_{vet_name.lower().replace(' ', '_')[:30]}"

        if harness.skip_if_done(action):
            return json.dumps({"skipped": True, "reason": "already notified"})

        harness.log_action(
            action, name,
            f"[STUB] Would notify {vet_name} ({municipality}): {dog_desc[:100]}"
        )
        return json.dumps({"logged": True, "vet": vet_name, "real_send": "wired in WP4"})

    if name == "post_to_channel":
        channel_name = str(inputs.get("channel_name", ""))
        post_content = str(inputs.get("post_content", ""))
        action = f"posted_channel_{channel_name.lower().replace(' ', '_')[:30]}"

        if harness.skip_if_done(action):
            return json.dumps({"skipped": True, "reason": "already posted"})

        harness.log_action(
            action, name,
            f"[STUB] Would post to {channel_name}: {post_content[:120]}"
        )
        return json.dumps({"logged": True, "channel": channel_name, "real_send": "wired in WP5"})

    if name == "record_owner_guidance":
        guidance_type = str(inputs.get("guidance_type", ""))
        action = f"guidance_{guidance_type}"

        if harness.skip_if_done(action):
            return json.dumps({"skipped": True, "reason": "guidance already recorded"})

        harness.log_action(
            action, name,
            f"guidance={guidance_type} urgency={inputs.get('urgency', '?')}: "
            f"{str(inputs.get('instructions', ''))[:150]}"
        )
        return json.dumps({"recorded": True, "guidance_type": guidance_type})

    if name == "request_volunteer_alert":
        municipality = str(inputs.get("municipality", "?"))
        action = f"volunteer_alert_{municipality.lower()}"

        if harness.skip_if_done(action):
            return json.dumps({"skipped": True, "reason": "already alerted"})

        harness.log_action(
            action, name,
            f"[STUB] Would alert volunteers: {municipality} "
            f"radius={inputs.get('radius_km')}km"
        )
        return json.dumps({"logged": True, "real_send": "wired in WP4"})

    if name == "update_case_assessment":
        harness.log_action(
            "case_assessment_updated", name,
            json.dumps({
                "assessment": inputs.get("assessment", ""),
                "actions_taken": inputs.get("actions_taken", []),
                "next_planned": inputs.get("next_planned", []),
                "confidence": inputs.get("confidence", "medium"),
            })
        )
        db.table("case_agent_assessments").insert({
            "case_id": case_id,
            "assessment": inputs.get("assessment"),
            "actions_taken": inputs.get("actions_taken"),
            "next_planned": inputs.get("next_planned"),
            "phase": harness.phase.value,
            "confidence": inputs.get("confidence", "medium"),
        }).execute()
        return json.dumps({"saved": True})

    return json.dumps({"error": f"unknown tool: {name}"})
