"""
Supabase storage operations for the bot.

Staging flow:
  1. Bot downloads photo from Telegram
  2. Bot uploads to case-images-original/staging/<telegram_id>/<filename>
  3. When create_case() fires, the API route moves staging → original/<case_id>/...
"""
from __future__ import annotations

import os
import uuid

from supabase import create_client, Client

STAGING_BUCKET = "case-images-original"
STAGING_PREFIX = "staging"


def get_supabase() -> Client:
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )


async def upload_staging_photo(
    telegram_id: int, image_bytes: bytes, content_type: str = "image/jpeg"
) -> str:
    """
    Upload a photo to the staging area.
    Returns the storage path (not a URL — the case creation API uses the path).
    """
    ext = "jpg" if content_type == "image/jpeg" else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    path = f"{STAGING_PREFIX}/{telegram_id}/{filename}"

    client = get_supabase()
    client.storage.from_(STAGING_BUCKET).upload(
        path=path,
        file=image_bytes,
        file_options={"content-type": content_type, "upsert": "true"},
    )
    return path


async def load_conversation(telegram_id: int) -> dict:
    """Load conversation state from DB. Returns empty dict if not found."""
    client = get_supabase()
    result = (
        client.table("bot_conversations")
        .select("state, locale")
        .eq("telegram_id", telegram_id)
        .maybe_single()
        .execute()
    )
    if result.data:
        return result.data["state"] or {}
    return {}


async def save_conversation(telegram_id: int, state_dict: dict, locale: str = "pt") -> None:
    """Upsert conversation state to DB."""
    client = get_supabase()
    client.table("bot_conversations").upsert(
        {
            "telegram_id": telegram_id,
            "state": state_dict,
            "locale": locale,
            "last_message_at": "now()",
        },
        on_conflict="telegram_id",
    ).execute()


async def check_rate_limit(telegram_id: int, daily_max: int = 5) -> bool:
    """
    Returns True if the user is under the daily case creation limit.
    Increments the counter atomically.
    """
    client = get_supabase()
    result = (
        client.table("bot_rate_limits")
        .select("case_count")
        .eq("telegram_id", telegram_id)
        .eq("date", "CURRENT_DATE")
        .maybe_single()
        .execute()
    )
    current = result.data["case_count"] if result.data else 0
    if current >= daily_max:
        return False
    # Upsert incremented count
    client.table("bot_rate_limits").upsert(
        {"telegram_id": telegram_id, "date": "CURRENT_DATE", "case_count": current + 1},
        on_conflict="telegram_id,date",
    ).execute()
    return True


async def clear_conversation(telegram_id: int) -> None:
    """Reset conversation state (used on /cancelar)."""
    client = get_supabase()
    client.table("bot_conversations").upsert(
        {
            "telegram_id": telegram_id,
            "state": {},
            "locale": "pt",
            "last_message_at": "now()",
        },
        on_conflict="telegram_id",
    ).execute()
