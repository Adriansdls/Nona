"""
FastAPI server for the search intel service.

POST /intel → run_intel_agent → SearchIntel | InsufficientData
"""
from __future__ import annotations

import asyncio
import logging
import os

from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import JSONResponse

from .agent import FALLBACK_INSUFFICIENT, run_intel_agent
from .knowledge import get_municipality_profile
from .models import CoordQuality, IntelRequest, InsufficientData, SearchIntel, TerrainHazard

INTERNAL_TOKEN = os.environ.get("INTERNAL_API_TOKEN", "")
AGENT_TIMEOUT_S = 28.0

log = logging.getLogger(__name__)


def _cap_confidence_for_centroid(intel: SearchIntel, request: IntelRequest) -> SearchIntel:
    """Downgrade confidence=high to medium when coords are centroid fallback.

    Centroid precision is ±5km — terrain data queried around a fake centroid
    cannot support high confidence regardless of what the agent claimed.
    """
    if request.coord_quality == CoordQuality.centroid_fallback and intel.confidence == "high":
        log.info("Capping confidence high→medium: centroid_fallback coords for case %s", request.case_id)
        return intel.model_copy(update={"confidence": "medium"})
    return intel


def _enforce_municipality_hazards(intel: SearchIntel, municipality: str) -> SearchIntel:
    """Post-process: ensure every critical hazard from the static profile is present.

    Static knowledge wins over LLM omission. If the model dropped a documented
    Bombeiros rescue site, we add it back. Low overhead — deterministic check.
    """
    profile = get_municipality_profile(municipality)
    if not profile:
        return intel

    existing_labels = {h.label.lower() for h in intel.hazards}
    missing = [
        h for h in profile.known_hazards
        if h.severity == "critical" and h.label.lower() not in existing_labels
    ]
    if not missing:
        return intel

    added = [
        TerrainHazard(
            label=h.label,
            note=h.note,
            severity=h.severity,  # type: ignore[arg-type]
            evidence=h.evidence,
        )
        for h in missing
    ]
    log.info("Enforced %d missing critical hazard(s) for %s", len(added), municipality)
    return intel.model_copy(update={"hazards": list(intel.hazards) + added})


def create_intel_app() -> FastAPI:
    app = FastAPI(title="SalvaCão Intel Service", version="1.0.0")

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.post("/api/v1/notify")
    async def notify_endpoint(
        request: dict,
        authorization: str = Header(...),
    ) -> JSONResponse:
        """Proxy Telegram PM notifications from the web app.

        The web app (Vercel) never touches the Telegram token — it delegates
        here so the bot remains the single owner of Telegram credentials.
        """
        if not INTERNAL_TOKEN:
            raise HTTPException(status_code=500, detail="INTERNAL_API_TOKEN not configured")
        if authorization != f"Bearer {INTERNAL_TOKEN}":
            raise HTTPException(status_code=403, detail="Forbidden")

        telegram_id = request.get("telegram_id")
        message = request.get("message")
        if not telegram_id or not message:
            return JSONResponse({"error": "telegram_id + message required"}, status_code=400)

        # Lazy-import to avoid circular deps at module load time
        from telegram import Bot
        bot = Bot(token=os.environ.get("TELEGRAM_BOT_TOKEN", ""))
        try:
            await bot.send_message(
                chat_id=str(telegram_id),
                text=message,
                parse_mode="Markdown",
                disable_web_page_preview=False,
            )
            return JSONResponse({"ok": True})
        except Exception as exc:
            log.error("Telegram notify failed", telegram_id=telegram_id, error=str(exc))
            return JSONResponse(
                {"error": "Telegram send failed", "detail": str(exc)},
                status_code=502,
            )

    @app.post("/intel")
    async def intel_endpoint(
        request: IntelRequest,
        authorization: str = Header(...),
    ) -> JSONResponse:
        if not INTERNAL_TOKEN:
            raise HTTPException(status_code=500, detail="INTERNAL_API_TOKEN not configured")
        if authorization != f"Bearer {INTERNAL_TOKEN}":
            raise HTTPException(status_code=403, detail="Forbidden")

        try:
            result = await asyncio.wait_for(
                run_intel_agent(request),
                timeout=AGENT_TIMEOUT_S,
            )
        except asyncio.TimeoutError:
            log.error("Intel agent timed out after %.0fs for case %s", AGENT_TIMEOUT_S, request.case_id)
            result = FALLBACK_INSUFFICIENT

        if isinstance(result, SearchIntel):
            result = _enforce_municipality_hazards(result, request.municipality)
            result = _cap_confidence_for_centroid(result, request)

        return JSONResponse({"data": result.model_dump()})

    return app
