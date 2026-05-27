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


def post_to_telegram_channel(chat_id: str, text: str) -> bool:
    """
    Post to a Telegram channel or group.
    chat_id: @channelname or numeric -100XXXX stored in kb_channels.url.
    Bot must be admin of the channel.
    """
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


def format_broadcast_post(case: dict, channel_name: str) -> str:
    """Format a lost dog broadcast post in PT-PT for community channels."""
    dog_name = case.get("dog_name") or "Cão sem nome"
    breed = case.get("breed", "raça desconhecida")
    color = case.get("primary_color", "")
    municipality = case.get("last_seen_municipality", "Algarve")
    zone = case.get("last_seen_zone_approx", "")
    slug = case.get("slug", "")
    case_url = f"{_APP_URL}/pt/caso/{slug}"
    zone_str = f" ({zone})" if zone else ""

    return (
        f"🐕 *CÃO PERDIDO — {municipality.upper()}*\n\n"
        f"*{dog_name}* · {breed} · {color}\n"
        f"Visto pela última vez em {municipality}{zone_str}.\n\n"
        f"Se viste este cão, por favor contacta através do link:\n"
        f"{case_url}\n\n"
        f"Qualquer informação ajuda. Obrigado 🙏"
    )
