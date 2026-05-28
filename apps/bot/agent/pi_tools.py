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
    {
        "name": "cold_case_assessment",
        "description": (
            "Run cold case evaluation for cases 7d+ with no sightings. "
            "Sends owner a non-defeat update with specific next steps. "
            "Use in recovery phase or on cold_case trigger."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "hours_elapsed": {"type": "number", "description": "Hours since dog was lost"},
                "summary": {"type": "string", "description": "Brief situation summary in PT"},
            },
            "required": ["hours_elapsed"],
        },
    },
    {
        "name": "expand_shelter_radius",
        "description": (
            "Notify canils in neighboring Algarve municipalities — not just the local one. "
            "Use at 7d+ (recovery phase) when local search has not returned results."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "municipality": {"type": "string", "description": "Case municipality — neighbors auto-determined"},
            },
            "required": ["municipality"],
        },
    },
    {
        "name": "feeding_station_guidance",
        "description": (
            "Send feeding station setup instructions to owner. "
            "Keeps foraging dog localized — do NOT chase. Use in survival phase. "
            "Source: Albrecht/MAR 2018 IAABC."
        ),
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "trap_guidance",
        "description": (
            "Send humane trap (jaula) deployment instructions to owner. "
            "Use after feeding station confirms dog activity in area. Survival/recovery phase. "
            "Source: Albrecht/MAR 2018 IAABC."
        ),
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "schedule_shelter_visit_reminder",
        "description": (
            "Queue reminder for owner to visit canil in person in 24-48h. "
            "Physical visit has 2.1× higher recovery rate vs phone call (Lord 2007 JAVMA). "
            "Includes specific canil name and phone from KB."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "municipality": {"type": "string"},
            },
            "required": ["municipality"],
        },
    },
    {
        "name": "cross_post_regional",
        "description": (
            "Post to all Algarve-wide community channels not yet reached for this case. "
            "Use in recovery phase to widen digital reach beyond local groups."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "post_content": {"type": "string", "description": "Post text in PT"},
            },
            "required": [],
        },
    },
    {
        "name": "update_behavioral_assessment",
        "description": (
            "WP9: Update the behavioral profile with new intelligence gathered during this run. "
            "Use when you learn new escape trigger, breed category, or conditioning events "
            "(e.g. owner reports 'chamei o nome mas o cão fugiu' → name_conditioned=true). "
            "Also call to record a sighting belief update with direction-of-travel."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "breed_category": {
                    "type": "string",
                    "enum": ["galgo", "podenco", "sighthound_other", "toy", "herding", "guardian", "scent_hound", "mixed"],
                    "description": "Override breed category if now confirmed",
                },
                "escape_trigger": {
                    "type": "string",
                    "enum": ["opportunistic", "prey_drive", "blind_panic", "wanderlust"],
                    "description": "How the dog was lost — most important variable for phase",
                },
                "temperament": {
                    "type": "string",
                    "enum": ["gregarious", "aloof", "xenophobic"],
                    "description": "Override temperament if now confirmed from owner reports",
                },
                "add_conditioning_events": {
                    "type": "array",
                    "items": {"type": "string", "enum": ["name_conditioned", "crowd_conditioned", "approach_conditioned"]},
                    "description": "Add events that permanently restrict the action gate",
                },
                "sighting_update": {
                    "type": "object",
                    "description": "If updating belief from a new sighting",
                    "properties": {
                        "sighting_id": {"type": "string"},
                        "location_approx": {"type": "string"},
                        "direction_of_travel": {"type": "string", "description": "Cardinal direction: north|south|east|west|northeast|etc"},
                        "observer_type": {"type": "string", "enum": ["camera", "owner", "volunteer", "civilian"]},
                        "conditions": {"type": "string", "enum": ["daylight", "dusk", "night", "unknown"]},
                        "crowd_broadcast_occurred": {"type": "boolean"},
                    },
                    "required": ["sighting_id", "location_approx", "observer_type"],
                },
            },
            "required": [],
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
        action = f"notified_canil_{canil_name.lower().replace(' ', '_')[:30]}"

        if harness.skip_if_done(action):
            return json.dumps({"skipped": True, "reason": "already notified"})

        # Look up email from KB
        rows = db.table("kb_canils") \
            .select("email,phone") \
            .ilike("name", f"%{canil_name}%") \
            .limit(1).execute()
        canil_email = (rows.data[0].get("email") if rows.data else None)  # type: ignore[index]

        sent = False
        if canil_email:
            from agent.email import send_canil_notification
            sent = send_canil_notification(str(canil_email), canil_name, harness.case)

        outcome = (
            f"Email sent to {canil_name} ({canil_email}): {web_url}/caso/{slug}"
            if sent else
            f"[NO EMAIL] {canil_name} has no email in KB — phone: {inputs.get('canil_phone', '?')}"
        )
        harness.log_action(action, name, outcome)
        return json.dumps({"sent": sent, "canil": canil_name, "email": canil_email})

    if name == "notify_vet":
        vet_name = str(inputs.get("vet_name", ""))
        municipality = str(inputs.get("municipality", ""))
        action = f"notified_vet_{vet_name.lower().replace(' ', '_')[:30]}"

        if harness.skip_if_done(action):
            return json.dumps({"skipped": True, "reason": "already notified"})

        rows = db.table("kb_vets") \
            .select("email,phone") \
            .ilike("name", f"%{vet_name}%") \
            .limit(1).execute()
        vet_email = (rows.data[0].get("email") if rows.data else None)  # type: ignore[index]

        sent = False
        if vet_email:
            from agent.email import send_vet_notification
            sent = send_vet_notification(str(vet_email), vet_name, harness.case)

        outcome = (
            f"Email sent to {vet_name} ({vet_email}): {web_url}/caso/{slug}"
            if sent else
            f"[NO EMAIL] {vet_name} has no email in KB — phone: {inputs.get('vet_phone', '?')}"
        )
        harness.log_action(action, name, outcome)
        return json.dumps({"sent": sent, "vet": vet_name, "email": vet_email})

    if name == "post_to_channel":
        channel_name = str(inputs.get("channel_name", ""))
        channel_type = str(inputs.get("channel_type", ""))
        post_content = str(inputs.get("post_content", ""))
        action = f"posted_channel_{channel_name.lower().replace(' ', '_')[:30]}"

        if harness.skip_if_done(action):
            return json.dumps({"skipped": True, "reason": "already posted"})

        from agent.broadcast import (
            post_to_telegram_channel,
            make_facebook_share_url,
            make_whatsapp_share_url,
            format_broadcast_post,
        )

        # Look up channel URL/chat_id from KB
        rows = db.table("kb_channels") \
            .select("url,channel_type") \
            .ilike("name", f"%{channel_name}%") \
            .limit(1).execute()
        channel_url = (rows.data[0].get("url") if rows.data else None)  # type: ignore[index]
        # Use KB channel_type if agent didn't specify
        if not channel_type and rows.data:
            channel_type = str(rows.data[0].get("channel_type", ""))  # type: ignore[index]

        formatted = post_content or format_broadcast_post(harness.case, channel_name)
        case_url = f"{web_url}/pt/caso/{slug}"
        sent = False
        owner_msg: str | None = None
        outcome = ""

        if channel_type == "telegram" and channel_url:
            sent = post_to_telegram_channel(str(channel_url), formatted)
            outcome = (
                f"Posted to Telegram channel {channel_name} ({channel_url})"
                if sent else
                f"Telegram post failed for {channel_name} ({channel_url})"
            )

        elif channel_type == "facebook_group":
            share_url = make_facebook_share_url(formatted, case_url)
            owner_msg = (
                f"📣 Por favor partilha no grupo Facebook «{channel_name}»:\n\n"
                f"{formatted}\n\n"
                f"Toca aqui para abrir o Facebook com o conteúdo pronto:\n{share_url}"
            )
            outcome = f"Facebook share URL generated for {channel_name} — owner notified"
            sent = True

        elif channel_type == "whatsapp":
            share_url = make_whatsapp_share_url(formatted, case_url)
            owner_msg = (
                f"📲 Por favor partilha no grupo WhatsApp «{channel_name}»:\n\n"
                f"{formatted}\n\n"
                f"Ou toca aqui:\n{share_url}"
            )
            outcome = f"WhatsApp share URL generated for {channel_name} — owner notified"
            sent = True

        else:
            outcome = f"[UNSUPPORTED] channel_type={channel_type!r} for {channel_name}"

        # Queue owner notification (Facebook/WhatsApp require owner to tap share)
        if owner_msg:
            telegram_id = harness.case.get("reporter_telegram_id")
            db.table("case_notifications").insert({
                "case_id": case_id,
                "channel": "telegram" if telegram_id else "log",
                "telegram_id": int(telegram_id) if telegram_id else None,
                "message": owner_msg,
                "phase": harness.phase.value,
            }).execute()

        # Update last_posted_at so agent doesn't re-post too soon
        if sent and rows.data:
            db.table("kb_channels") \
                .update({"last_posted_at": "now()"}) \
                .ilike("name", f"%{channel_name}%") \
                .execute()

        harness.log_action(action, name, outcome)
        return json.dumps({"sent": sent, "channel": channel_name, "type": channel_type})

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
        radius_km = inputs.get("radius_km", 8)
        urgency = str(inputs.get("urgency", "normal"))
        action = f"volunteer_alert_{municipality.lower()}"

        if harness.skip_if_done(action):
            return json.dumps({"skipped": True, "reason": "already alerted"})

        # Municipality-based volunteer query (geo-fenced radius in WP6)
        volunteers = (
            db.table("user_profiles")
            .select("telegram_id,municipality")
            .eq("role", "voluntario")
            .ilike("municipality", f"%{municipality}%")
            .execute()
        )

        dog_name = harness.case.get("dog_name") or "Cão"
        breed = harness.case.get("breed", "")
        color = harness.case.get("primary_color", "")
        zone = harness.case.get("last_seen_zone_approx", municipality)
        case_url = f"{web_url}/pt/caso/{slug}"
        prefix = "🚨 URGENTE" if urgency == "immediate" else "🐕 Alerta voluntário"

        message = (
            f"{prefix} — {dog_name} ({breed}, {color}) perdido em {zone}.\n"
            f"Zona: {municipality} · raio ~{radius_km}km\n"
            f"Ver caso: {case_url}"
        )

        count = 0
        for vol in (volunteers.data or []):
            tid = vol.get("telegram_id")
            if tid:
                db.table("case_notifications").insert({
                    "case_id": case_id,
                    "channel": "telegram",
                    "telegram_id": int(tid),
                    "message": message,
                    "phase": harness.phase.value,
                }).execute()
                count += 1

        harness.log_action(
            action, name,
            f"Queued volunteer alerts: {count} volunteers in {municipality}"
        )
        return json.dumps({"queued": count, "municipality": municipality})

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

    if name == "cold_case_assessment":
        action = "cold_case_assessment"
        if harness.skip_if_done(action):
            return json.dumps({"skipped": True})

        hours = int(inputs.get("hours_elapsed", 0)) or int(harness._hours_elapsed())
        scount = (
            db.table("sightings")
            .select("id", count="exact", head=True)  # type: ignore[arg-type]
            .eq("case_id", case_id)
            .execute()
        )
        n_sightings = scount.count or 0
        dog_name = harness.case.get("dog_name") or "o seu cão"
        municipality = harness.case.get("last_seen_municipality", "")
        owner_token = harness.case.get("owner_token", "")

        owner_msg = (
            f"⚠️ Actualização — {dog_name} está desaparecido há {hours // 24} dias.\n\n"
            f"Não desista. Cães são encontrados semanas e meses depois. "
            f"O mais importante agora:\n"
            f"1. Visite pessoalmente o Canil Municipal de {municipality} (não ligue — vá em pessoa)\n"
            f"2. Verifique registos de adopção dos últimos 30 dias no canil\n"
            f"3. Re-publique nos grupos Facebook da zona\n"
            f"4. Mantenha a estação de alimentação activa\n\n"
            f"Lord 2007 JAVMA: cães são encontrados 2.1× mais quando o dono vai pessoalmente ao canil.\n"
            f"🔗 Painel: {web_url}/pt/meu-caso/{owner_token}"
        )

        telegram_id = harness.case.get("reporter_telegram_id")
        db.table("case_notifications").insert({
            "case_id": case_id,
            "channel": "telegram" if telegram_id else "log",
            "telegram_id": int(telegram_id) if telegram_id else None,
            "message": owner_msg,
            "phase": harness.phase.value,
        }).execute()

        harness.log_action(
            action, name,
            f"Cold case assessment: {hours}h elapsed, {n_sightings} sightings. Owner notified."
        )
        return json.dumps({"assessed": True, "hours": hours, "sightings": n_sightings})

    if name == "expand_shelter_radius":
        action = "expand_shelter_radius"
        if harness.skip_if_done(action):
            return json.dumps({"skipped": True})

        from jobs.matching import MUNICIPALITY_ADJACENCY
        from agent.email import send_canil_notification

        municipality = str(inputs.get("municipality", "") or harness.case.get("last_seen_municipality", ""))
        neighbors = MUNICIPALITY_ADJACENCY.get(municipality, set())
        notified: list[str] = []

        for nb in sorted(neighbors):
            canils = (
                db.table("kb_canils")
                .select("name,email,phone")
                .ilike("municipality", f"%{nb}%")
                .limit(1)
                .execute()
            )
            for c in canils.data or []:
                email = c.get("email")
                if email:
                    send_canil_notification(str(email), str(c.get("name", "")), harness.case)
                    notified.append(f"{c.get('name')} ({nb})")

        harness.log_action(
            action, name,
            f"Expanded to {len(neighbors)} neighbors of {municipality}. Notified: {', '.join(notified) or 'none with email'}"
        )
        return json.dumps({"expanded_to": sorted(neighbors), "notified": notified})

    if name == "feeding_station_guidance":
        action = "guidance_feeding_station"
        if harness.skip_if_done(action):
            return json.dumps({"skipped": True})

        owner_token = harness.case.get("owner_token", "")
        instructions = (
            "🍖 ESTAÇÃO DE ALIMENTAÇÃO — instale hoje:\n\n"
            "• Tigela funda com comida húmida (atum, frango enlatado) + água fresca\n"
            "• No local exato onde o cão foi visto pela última vez\n"
            "• Visite às 6h e às 22h — horários de maior actividade canina\n"
            "• Coloque câmara de movimento (telemóvel em suporte serve)\n"
            "• NÃO espere junto à tigela — deixe a comida e afaste-se\n"
            "• Comida consumida = cão confirmado na zona\n\n"
            "Fonte: Albrecht/MAR 2018 IAABC — alimentação mantém cão localizado.\n\n"
            f"🔗 Painel: {web_url}/pt/meu-caso/{owner_token}"
        )

        telegram_id = harness.case.get("reporter_telegram_id")
        db.table("case_notifications").insert({
            "case_id": case_id,
            "channel": "telegram" if telegram_id else "log",
            "telegram_id": int(telegram_id) if telegram_id else None,
            "message": instructions,
            "phase": harness.phase.value,
        }).execute()

        harness.log_action(action, name, "Feeding station guidance sent to owner")
        return json.dumps({"sent": True})

    if name == "trap_guidance":
        action = "guidance_humane_trap"
        if harness.skip_if_done(action):
            return json.dumps({"skipped": True})

        owner_token = harness.case.get("owner_token", "")
        instructions = (
            "🪤 ARMADILHA HUMANITÁRIA — próximo passo após actividade na estação:\n\n"
            "• Use jaula metálica tipo 'live trap' (aluguel em lojas agrícolas ou câmara municipal)\n"
            "• Coloque junto à estação de alimentação, coberta com pano para parecer abrigo\n"
            "• Isca: comida do cão + t-shirt usada do dono no fundo\n"
            "• Verifique de 2 em 2h — NÃO deixe o cão preso mais de 2h\n"
            "• Ao capturar: não grite nem gesticule — aproxime-se devagar, fale baixo\n"
            "• Contacte o médico veterinário imediatamente após captura\n\n"
            "Fonte: Albrecht/MAR 2018 IAABC — armadilha é o método mais eficaz em cães assustados.\n\n"
            f"🔗 Painel: {web_url}/pt/meu-caso/{owner_token}"
        )

        telegram_id = harness.case.get("reporter_telegram_id")
        db.table("case_notifications").insert({
            "case_id": case_id,
            "channel": "telegram" if telegram_id else "log",
            "telegram_id": int(telegram_id) if telegram_id else None,
            "message": instructions,
            "phase": harness.phase.value,
        }).execute()

        harness.log_action(action, name, "Humane trap guidance sent to owner")
        return json.dumps({"sent": True})

    if name == "schedule_shelter_visit_reminder":
        action = "reminder_shelter_visit"
        if harness.skip_if_done(action):
            return json.dumps({"skipped": True})

        municipality = str(inputs.get("municipality", "") or harness.case.get("last_seen_municipality", ""))
        owner_token = harness.case.get("owner_token", "")

        canils = (
            db.table("kb_canils")
            .select("name,phone,hours")
            .ilike("municipality", f"%{municipality}%")
            .limit(1)
            .execute()
        )
        canil_info = ""
        if canils.data:
            c = canils.data[0]
            canil_info = f"\n• {c.get('name')} — Tel: {c.get('phone', '?')} · {c.get('hours', 'Seg-Sex 9h-17h')}"

        reminder = (
            f"📋 LEMBRETE — visite o canil pessoalmente nas próximas 24h:{canil_info}\n\n"
            f"Não ligue — vá em pessoa. Mostre a foto do cão. Deixe o seu número.\n"
            f"Lord 2007 JAVMA: visita pessoal tem 2.1× maior taxa de recuperação vs telefonema.\n\n"
            f"🔗 Painel: {web_url}/pt/meu-caso/{owner_token}"
        )

        telegram_id = harness.case.get("reporter_telegram_id")
        db.table("case_notifications").insert({
            "case_id": case_id,
            "channel": "telegram" if telegram_id else "log",
            "telegram_id": int(telegram_id) if telegram_id else None,
            "message": reminder,
            "phase": harness.phase.value,
        }).execute()

        harness.log_action(action, name, f"Shelter visit reminder sent for {municipality}")
        return json.dumps({"sent": True, "municipality": municipality})

    if name == "cross_post_regional":
        action = "cross_post_regional"
        if harness.skip_if_done(action):
            return json.dumps({"skipped": True})

        from agent.broadcast import format_broadcast_post, make_facebook_share_url, make_whatsapp_share_url

        post_content = str(inputs.get("post_content", "")) or format_broadcast_post(harness.case, "Algarve")
        case_url = f"{web_url}/pt/caso/{slug}"

        # Target Algarve-wide channels not yet posted to
        regional_channels = (
            db.table("kb_channels")
            .select("name,channel_type,url")
            .ilike("municipality", "%Algarve%")
            .execute()
        )

        done_posts = {a for a in harness._done_actions if a.startswith("posted_channel_")}
        posted: list[str] = []

        for ch in regional_channels.data or []:
            ch_name = str(ch.get("name", ""))
            ch_action = f"posted_channel_{ch_name.lower().replace(' ', '_')[:30]}"
            if ch_action in done_posts:
                continue

            ch_type = str(ch.get("channel_type", ""))
            ch_url = ch.get("url")

            if ch_type == "telegram" and ch_url:
                from agent.broadcast import post_to_telegram_channel
                post_to_telegram_channel(str(ch_url), post_content)
                posted.append(ch_name)
            elif ch_type == "facebook_group":
                share_url = make_facebook_share_url(post_content, case_url)
                telegram_id = harness.case.get("reporter_telegram_id")
                owner_token = harness.case.get("owner_token", "")
                msg = (
                    f"📣 Partilha no grupo «{ch_name}»:\n{post_content}\n\n"
                    f"Toca aqui: {share_url}\n"
                    f"🔗 Painel: {web_url}/pt/meu-caso/{owner_token}"
                )
                db.table("case_notifications").insert({
                    "case_id": case_id,
                    "channel": "telegram" if telegram_id else "log",
                    "telegram_id": int(telegram_id) if telegram_id else None,
                    "message": msg,
                    "phase": harness.phase.value,
                }).execute()
                posted.append(ch_name)

            # Mark as done so escalation doesn't re-post
            harness._done_actions.add(ch_action)
            db.table("kb_channels").update({"last_posted_at": "now()"}).ilike("name", f"%{ch_name}%").execute()

        harness.log_action(action, name, f"Cross-posted to regional channels: {', '.join(posted) or 'none'}")
        return json.dumps({"posted_to": posted})

    if name == "update_behavioral_assessment":
        from agent.harness import (
            compute_phase, compute_action_gate, update_belief_from_sighting
        )

        bp: dict = dict(harness.case.get("behavioral_profile") or {})
        changed_fields: list[str] = []

        # Update breed_category, escape_trigger, temperament if provided
        for field in ("breed_category", "escape_trigger", "temperament"):
            val = inputs.get(field)
            if val:
                bp[field] = str(val)
                changed_fields.append(field)

        # Add conditioning events (irreversible)
        new_events = inputs.get("add_conditioning_events") or []
        if new_events:
            ag = bp.get("action_gate") or {}
            existing = ag.get("conditioning_events") or []
            merged = list(set(existing + list(new_events)))
            if "action_gate" not in bp:
                bp["action_gate"] = {}
            bp["action_gate"]["conditioning_events"] = merged
            changed_fields.append(f"conditioning_events={merged}")

        # Sighting belief update
        su = inputs.get("sighting_update")
        if su and isinstance(su, dict):
            bp = update_belief_from_sighting(
                profile=bp,
                sighting_id=str(su.get("sighting_id", "")),
                location_approx=str(su.get("location_approx", "")),
                direction_of_travel=su.get("direction_of_travel"),
                observer_type=str(su.get("observer_type", "civilian")),
                conditions=str(su.get("conditions", "unknown")),
                crowd_broadcast=bool(su.get("crowd_broadcast_occurred", False)),
            )
            changed_fields.append(f"sighting_belief_update(lambda={bp.get('belief_distribution', {}).get('sighting_evidence', [{}])[-1].get('lambda', '?')})")

        # Recompute phase + action gate with updated values
        hours = harness._hours_elapsed()
        bc = bp.get("breed_category", "mixed")
        et = bp.get("escape_trigger", "opportunistic")
        tm = bp.get("temperament", "aloof")
        ce = (bp.get("action_gate") or {}).get("conditioning_events") or []

        phase_name, phase_1_cap = compute_phase(hours, bc, et, tm)
        new_gate = compute_action_gate(bc, phase_name, tm, et, ce)

        bp["phase_state"] = {
            "current": phase_name,
            "phase_1_cap_hours": phase_1_cap,
            "last_calculated_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
            "phase_history": (bp.get("phase_state") or {}).get("phase_history") or [],
        }
        bp["action_gate"] = new_gate

        # Write back
        db.table("cases").update({"behavioral_profile": bp}).eq("id", case_id).execute()
        harness.case["behavioral_profile"] = bp

        harness.log_action(
            "behavioral_assessment_updated",
            name,
            f"Updated: {', '.join(changed_fields) or 'phase recalc only'} → phase={phase_name}, broadcast={new_gate['broadcast_sighting_location']}"
        )
        return json.dumps({
            "updated": True,
            "phase": phase_name,
            "action_gate": {
                "broadcast": new_gate["broadcast_sighting_location"],
                "active_search_permitted": new_gate["active_search_permitted"],
                "crowd_response_blocked": new_gate["crowd_response_blocked"],
            },
            "changed_fields": changed_fields,
        })

    return json.dumps({"error": f"unknown tool: {name}"})
