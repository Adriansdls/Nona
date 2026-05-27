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


async def _main_async() -> None:
    _check_env()

    from channels.telegram import build_application
    from intel.server import create_intel_app
    import uvicorn

    bot_app = build_application()
    fastapi_app = create_intel_app()

    port = int(os.environ.get("INTEL_PORT", "8080"))
    config = uvicorn.Config(fastapi_app, host="0.0.0.0", port=port, log_level="info")
    server = uvicorn.Server(config)

    log.info(
        "SalvaCão bot + intel service starting",
        web_app_url=os.environ.get("WEB_APP_URL", "http://localhost:3001"),
        intel_port=port,
    )

    async with bot_app:
        await bot_app.updater.start_polling(  # type: ignore[union-attr]
            drop_pending_updates=True,
            allowed_updates=["message", "callback_query"],
        )
        await bot_app.start()
        await server.serve()  # blocks until SIGINT/SIGTERM
        await bot_app.updater.stop()  # type: ignore[union-attr]
        await bot_app.stop()


def main() -> None:
    asyncio.run(_main_async())


if __name__ == "__main__":
    main()
