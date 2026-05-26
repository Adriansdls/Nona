"""
SalvaCão Telegram bot entry point.

Run with:
  uv run python main.py

Or in development:
  uv run python -m watchfiles main:main apps/ agent/ channels/
"""
from __future__ import annotations

import asyncio
import logging
import os
import sys

from dotenv import load_dotenv

load_dotenv()

import structlog

structlog.configure(
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
)
log = structlog.get_logger()


def _check_env() -> None:
    required = [
        "TELEGRAM_BOT_TOKEN",
        "ANTHROPIC_API_KEY",
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "INTERNAL_API_TOKEN",
    ]
    missing = [k for k in required if not os.environ.get(k)]
    if missing:
        log.error("Missing required environment variables", missing=missing)
        sys.exit(1)

    if not os.environ.get("OPENAI_API_KEY"):
        log.warning(
            "OPENAI_API_KEY not set — voice transcription will fail. "
            "Set it to enable Whisper."
        )


def main() -> None:
    _check_env()

    from channels.telegram import build_application

    app = build_application()

    log.info(
        "SalvaCão bot starting",
        web_app_url=os.environ.get("WEB_APP_URL", "http://localhost:3001"),
    )

    app.run_polling(
        drop_pending_updates=True,  # ignore backlog from while bot was offline
        allowed_updates=["message", "callback_query"],
    )


if __name__ == "__main__":
    main()
