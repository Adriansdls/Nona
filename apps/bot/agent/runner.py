"""
PI Agent runner — Supabase Realtime subscriber + 6h escalation sweep.

Started alongside the Telegram bot and Intel FastAPI server in main.py.
Two concurrent coroutines:
  _realtime_listener — reacts to cases/sightings INSERT events
  _escalation_loop   — sweeps active cases every 6h
"""
from __future__ import annotations

import asyncio
import logging
import os
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))

from supabase import create_client

from agent.case_agent import run_case_agent

log = logging.getLogger(__name__)

_ESCALATION_INTERVAL_H = 6
_ACTIVE_STATES = ["new", "active", "planning"]


async def _escalation_loop(db_url: str, db_key: str) -> None:
    """Every 6h: re-run PI agent for all non-resolved, non-cold cases."""
    while True:
        await asyncio.sleep(_ESCALATION_INTERVAL_H * 3600)
        try:
            db = create_client(db_url, db_key)
            rows = (
                db.table("cases")
                .select("id")
                .in_("agent_state", _ACTIVE_STATES)
                .neq("status", "resolvido")
                .execute()
            )
            count = len(rows.data or [])
            log.info("Escalation sweep", count=count)
            for row in rows.data or []:
                await run_case_agent(row["id"], db, trigger="escalation_sweep")
        except Exception as exc:
            log.error("Escalation sweep failed", error=str(exc))


async def _realtime_listener(db_url: str, db_key: str) -> None:
    """
    Subscribe to Supabase Realtime INSERT events on cases + sightings.
    On each event, trigger a PI agent run for the affected case.
    """
    from realtime import AsyncRealtimeClient

    realtime_url = (
        db_url.replace("https://", "wss://").replace("http://", "ws://")
        + "/realtime/v1"
    )

    client = AsyncRealtimeClient(realtime_url, db_key)
    db = create_client(db_url, db_key)

    def on_case_created(payload: dict) -> None:
        case_id = (payload.get("record") or {}).get("id")
        if case_id:
            log.info("Realtime: new case", case_id=case_id)
            asyncio.create_task(run_case_agent(case_id, db, trigger="case_created"))

    def on_sighting_added(payload: dict) -> None:
        case_id = (payload.get("record") or {}).get("case_id")
        if case_id:
            log.info("Realtime: new sighting", case_id=case_id)
            asyncio.create_task(run_case_agent(case_id, db, trigger="sighting_added"))

    ch_cases = client.channel("pi-cases")
    ch_cases.on_postgres_changes(
        "INSERT", schema="public", table="cases", callback=on_case_created
    )

    ch_sightings = client.channel("pi-sightings")
    ch_sightings.on_postgres_changes(
        "INSERT", schema="public", table="sightings", callback=on_sighting_added
    )

    await client.connect()
    await ch_cases.subscribe()
    await ch_sightings.subscribe()
    log.info("PI Agent realtime listener active")

    # Heartbeat to keep WebSocket alive on Fly.io
    while True:
        await asyncio.sleep(25)
        try:
            await client.send_heartbeat()
        except Exception as exc:
            log.warning("Realtime heartbeat failed — reconnecting", error=str(exc))
            try:
                await client.connect()
            except Exception as exc2:
                log.error("Realtime reconnect failed", error=str(exc2))


async def start_runner() -> None:
    """Start both the realtime listener and escalation loop."""
    db_url = os.environ["SUPABASE_URL"]
    db_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

    log.info("Starting PI Agent runner")
    await asyncio.gather(
        _realtime_listener(db_url, db_key),
        _escalation_loop(db_url, db_key),
    )
