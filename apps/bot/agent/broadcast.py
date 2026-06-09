"""
Channel broadcast helpers for the PI agent.

Telegram channels: real post via Bot API (chat_id stored in kb_channels.url).
Facebook groups: generate share URL + formatted content → owner notification.
WhatsApp: generate share URL → owner notification.
"""
from __future__ import annotations

import logging
import os
import urllib.parse

import httpx

log = logging.getLogger(__name__)

_APP_URL = os.environ.get("WEB_APP_URL", "https://salvacao.pt")
_SIM_MODE = os.environ.get("SIMULATION_MODE", "").lower() in ("1", "true", "yes")


def post_to_telegram_channel(chat_id: str, text: str) -> bool:
    """
    Post to a Telegram channel or group.
    chat_id: @channelname or numeric -100XXXX stored in kb_channels.url.
    Bot must be admin of the channel.
    """
    if _SIM_MODE:
        log.info("[SIM] Telegram channel post suppressed", chat_id=chat_id, text_preview=text[:120])
        return True

    # Sandbox allowlist guard: when an allowlist is configured, only post to those
    # chats (the founder's private group) — never a real community channel.
    from agent import sim_config
    allowlist = sim_config.real_allowlist()
    if allowlist:
        cid = str(chat_id).strip()
        chat_int = int(cid) if cid.lstrip("-").isdigit() else None
        if chat_int is None or chat_int not in allowlist:
            log.info("[SIM] channel post suppressed (not in allowlist)", chat_id=chat_id)
            return True

    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    if not token:
        log.warning("TELEGRAM_BOT_TOKEN not set — Telegram channel post skipped")
        return False
    try:
        resp = httpx.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={"chat_id": chat_id, "text": text, "parse_mode": "Markdown"},
            timeout=10.0,
        )
        data = resp.json()
        if not data.get("ok"):
            log.warning("Telegram channel post failed", chat_id=chat_id, description=data.get("description"))
            return False
        return True
    except Exception as exc:
        log.error("Telegram channel post error", chat_id=chat_id, error=str(exc))
        return False


def make_facebook_share_url(text: str, case_url: str) -> str:
    """
    Generate a Facebook Share Dialog URL.
    Owner taps → Facebook opens with case URL pre-filled.
    """
    params = urllib.parse.urlencode({"u": case_url, "quote": text[:400]})
    return f"https://www.facebook.com/sharer/sharer.php?{params}"


def make_whatsapp_share_url(text: str, case_url: str) -> str:
    """Generate a WhatsApp share URL with pre-filled text + case link."""
    content = urllib.parse.quote(f"{text}\n\n{case_url}")
    return f"https://wa.me/?text={content}"


def get_broadcast_tag(case: dict) -> str | None:
    """Determine broadcast warning tag from case action gate.

    Returns 'do_not_approach' for hard cases (galgo, xenophobic, survival/entrenched,
    crowd-conditioned) where crowd convergence risks fatal displacement.
    """
    bp = case.get("behavioral_profile") or {}
    gate = bp.get("action_gate") or {}
    if gate.get("broadcast_sighting_location") == "blocked":
        return "do_not_approach"
    return None


def format_broadcast_post(case: dict, channel_name: str, warning_tag: str | None = None) -> str:
    """Format a lost dog broadcast post in PT-PT for community channels.

    Args:
        warning_tag: Optional safety warning (e.g., "do_not_approach") for hard cases.
            When set, the post includes a clear instruction not to chase/approach.
            If None, auto-computed from the case's action gate.
    """
    if warning_tag is None:
        warning_tag = get_broadcast_tag(case)

    dog_name = case.get("dog_name") or "Cão sem nome"
    breed = case.get("breed", "raça desconhecida")
    color = case.get("primary_color", "")
    municipality = case.get("last_seen_municipality", "Algarve")
    zone = case.get("last_seen_zone_approx", "")
    slug = case.get("slug", "")
    case_url = f"{_APP_URL}/pt/caso/{slug}"
    zone_str = f" ({zone})" if zone else ""

    # Base post
    lines = [
        f"🐕 *CÃO PERDIDO — {municipality.upper()}*",
        "",
        f"*{dog_name}* · {breed} · {color}",
        f"Visto pela última vez em {municipality}{zone_str}.",
    ]

    # Hard-case warning — replaces the generic "contact us" with explicit safety instruction
    if warning_tag == "do_not_approach":
        lines.extend([
            "",
            "⚠️ *NÃO APROXIMAR*",
            "Este cão está em pânico. Aviste mas *NÃO persiga*.",
            f"Contacta pelo link: {case_url}",
        ])
    else:
        lines.extend([
            "",
            f"Se viste este cão, por favor contacta através do link:",
            case_url,
        ])

    lines.append("")
    lines.append("Qualquer informação ajuda. Obrigado 🙏")

    return "\n".join(lines)
