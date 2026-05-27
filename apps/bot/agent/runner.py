"""
PI Agent runner — Supabase Realtime subscriber + escalation/cold/nightly jobs.

Started alongside the Telegram bot and Intel FastAPI server in main.py.
Three concurrent coroutines:
  _realtime_listener    — reacts to cases/sightings INSERT events
  _escalation_loop      — sweeps active cases every 6h; checks cold case transitions
  _nightly_rematch_loop — attribute-based perdido ↔ encontrado matching at 2am UTC
"""
from __future__ import annotations

import asyncio
import logging
import os
import pathlib
import sys
from datetime import datetime, timedelta, timezone

sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))

from supabase import create_client

from agent.case_agent import run_case_agent

log = logging.getLogger(__name__)

_ESCALATION_INTERVAL_H = 6
_ACTIVE_STATES = ["new", "active", "planning"]

UTC = timezone.utc


async def _cold_case_check(db_url: str, db_key: str) -> None:
    """
    Transition cases to 'cold' when 7d+ elapsed with zero sightings.
    Triggers PI agent with cold_case trigger to run recovery playbook.
    """
    try:
        db = create_client(db_url, db_key)
        rows = (
            db.table("cases")
            .select("id,last_seen_at,agent_state")
            .in_("agent_state", ["active", "escalated"])
            .neq("status", "resolvido")
            .execute()
        )
        for row in rows.data or []:
            last_seen = datetime.fromisoformat(row["last_seen_at"])
            if last_seen.tzinfo is None:
                last_seen = last_seen.replace(tzinfo=UTC)
            hours = (datetime.now(UTC) - last_seen).total_seconds() / 3600
            if hours < 168:  # < 7 days
                continue

            scount = (
                db.table("sightings")
                .select("id", count="exact", head=True)
                .eq("case_id", row["id"])
                .execute()
            )
            if (scount.count or 0) > 0:
                continue

            db.table("cases").update({"agent_state": "cold"}).eq("id", row["id"]).execute()
            log.info("Case transitioned to cold", case_id=row["id"], hours=hours)
            await run_case_agent(row["id"], db, trigger="cold_case")

    except Exception as exc:
        log.error("Cold case check failed", error=str(exc))


async def _escalation_loop(db_url: str, db_key: str) -> None:
    """Every 6h: re-run PI agent for active cases + check cold case transitions."""
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

        # Also check for cases that should transition to cold
        await _cold_case_check(db_url, db_key)


async def _nightly_rematch_loop(db_url: str, db_key: str) -> None:
    """Run attribute-based re-matching at 2am UTC every day."""
    from jobs.matching import run_nightly_rematch

    while True:
        now = datetime.now(UTC)
        # Next 2am UTC
        target = (now + timedelta(days=1)).replace(hour=2, minute=0, second=0, microsecond=0)
        await asyncio.sleep((target - now).total_seconds())
        try:
            db = create_client(db_url, db_key)
            count = await run_nightly_rematch(db)
            log.info("Nightly re-match done", new_matches=count)
        except Exception as exc:
            log.error("Nightly re-match failed", error=str(exc))


async def _realtime_listener(db_url: str, db_key: str) -> None:
    """
    Subscribe to Supabase Realtime INSERT events on cases + sightings.
    On sighting INSERT: also triggers neighboring case agents (geo intelligence).
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
        record = payload.get("record") or {}
        case_id = record.get("case_id")
        municipality = record.get("municipality")

        if case_id:
            log.info("Realtime: new sighting", case_id=case_id)
            asyncio.create_task(run_case_agent(case_id, db, trigger="sighting_added"))

        # Cross-case geo intelligence: alert other active cases in same zone
        if municipality:
            try:
                nearby = (
                    db.table("cases")
                    .select("id")
                    .eq("status", "ativo")
                    .ilike("last_seen_municipality", f"%{municipality}%")
                    .not_.eq("id", case_id or "")
                    .limit(5)
                    .execute()
                )
                for row in nearby.data or []:
                    asyncio.create_task(
                        run_case_agent(row["id"], db, trigger="geo_sighting_nearby")
                    )
            except Exception as exc:
                log.warning("Geo sighting cross-check failed", error=str(exc))

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
    """Start realtime listener, escalation loop, and nightly re-match."""
    db_url = os.environ["SUPABASE_URL"]
    db_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

    log.info("Starting PI Agent runner")
    await asyncio.gather(
        _realtime_listener(db_url, db_key),
        _escalation_loop(db_url, db_key),
        _nightly_rematch_loop(db_url, db_key),
    )
