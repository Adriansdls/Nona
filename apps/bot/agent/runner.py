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
import logging  # noqa: F401  (kept for any stdlib level constants)
import structlog
import os
import pathlib
import sys
from datetime import datetime, timedelta, timezone

sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))

from supabase import create_client

from agent.case_agent import run_case_agent

# structlog logger — accepts key/value kwargs (log.error("msg", error=...)); the
# stdlib getLogger this replaced raised TypeError on those kwargs, which crashed the
# realtime listener's own error handlers and drove the bot into a restart loop.
log = structlog.get_logger(__name__)

_ESCALATION_INTERVAL_H = 6
_CLASSIFIEDS_SCAN_INTERVAL_H = int(os.environ.get("CLASSIFIEDS_SCAN_INTERVAL_H", "6"))
_ACTIVE_STATES = ["new", "active", "planning"]

# New-case sweep: the RELIABLE minute-0 trigger. Supabase Realtime (the listener
# below) proved unreliable in prod — it connects, logs "active", then its internal
# listen task dies silently, so case INSERTs never fire the agent. This polling
# sweep is the deterministic fallback that guarantees a freshly created case
# (agent_state='new') gets its case_created agent run within a few seconds.
_NEW_CASE_SWEEP_INTERVAL_S = int(os.environ.get("NEW_CASE_SWEEP_INTERVAL_S", "15"))
_NEW_SIGHTING_SWEEP_INTERVAL_S = int(os.environ.get("NEW_SIGHTING_SWEEP_INTERVAL_S", "20"))

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


async def _daily_briefing_loop(db_url: str, db_key: str) -> None:
    """Send daily owner briefing for all active cases at 9am UTC."""
    while True:
        now = datetime.now(UTC)
        target = (now + timedelta(days=1)).replace(hour=9, minute=0, second=0, microsecond=0)
        await asyncio.sleep((target - now).total_seconds())
        try:
            db = create_client(db_url, db_key)
            rows = (
                db.table("cases")
                .select("id")
                .in_("agent_state", _ACTIVE_STATES + ["escalated", "cold"])
                .neq("status", "resolvido")
                .execute()
            )
            count = len(rows.data or [])
            log.info("Daily briefing sweep", count=count)
            for row in rows.data or []:
                await run_case_agent(row["id"], db, trigger="daily_briefing")
        except Exception as exc:
            log.error("Daily briefing sweep failed", error=str(exc))


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

    # Keep the task alive. AsyncRealtimeClient runs its OWN heartbeat task once
    # connected — the previous code called client.send_heartbeat() which does not
    # exist on this client (AttributeError → crash loop). Only call it if present.
    heartbeat = getattr(client, "send_heartbeat", None)
    while True:
        await asyncio.sleep(25)
        if not callable(heartbeat):
            continue  # client self-heartbeats; nothing to do
        try:
            await heartbeat()
        except Exception as exc:
            log.warning("Realtime heartbeat failed — reconnecting", error=str(exc))
            try:
                await client.connect()
            except Exception as exc2:
                log.error("Realtime reconnect failed", error=str(exc2))


async def _new_case_sweep(db_url: str, db_key: str) -> None:
    """
    Reliable minute-0 trigger: poll for freshly created cases (agent_state='new')
    and run the PI agent with the case_created trigger. This does NOT depend on
    Supabase Realtime, which proved deaf in prod.

    A case is claimed by flipping agent_state 'new'->'planning' before the agent
    runs, so it is never picked up twice (and run_case_agent re-affirms 'planning').
    Only recent cases (<24h) are auto-fired here; older stuck cases are handled by
    the 6h escalation sweep.
    """
    while True:
        await asyncio.sleep(_NEW_CASE_SWEEP_INTERVAL_S)
        try:
            db = create_client(db_url, db_key)
            since = (datetime.now(UTC) - timedelta(hours=24)).isoformat()
            rows = (
                db.table("cases")
                .select("id")
                .eq("agent_state", "new")
                .neq("status", "resolvido")
                .gte("created_at", since)
                .order("created_at")
                .limit(20)
                .execute()
            )
            for row in rows.data or []:
                cid = row["id"]
                # Claim it so a subsequent sweep can't double-fire.
                db.table("cases").update({"agent_state": "planning"}).eq("id", cid).execute()
                log.info("New-case sweep: triggering agent", case_id=cid)
                await run_case_agent(cid, db, trigger="case_created")
        except Exception as exc:
            log.error("New-case sweep failed", error=str(exc))


async def _new_sighting_sweep(db_url: str, db_key: str) -> None:
    """
    Reliable fallback for the sighting->agent re-plan when Supabase Realtime goes
    deaf mid-process (documented in _realtime_listener). Polls for sightings
    inserted SINCE this process started and fires the sighting_added trigger for any
    not yet swept. Start-time gating avoids re-processing pre-existing sightings on
    restart; an in-process seen-set avoids double-firing within a run. run_case_agent
    is effectively idempotent (action gate + skip_if_done), so an occasional overlap
    with the realtime listener is harmless.
    """
    started_at = datetime.now(UTC)
    seen: set[str] = set()
    while True:
        await asyncio.sleep(_NEW_SIGHTING_SWEEP_INTERVAL_S)
        try:
            db = create_client(db_url, db_key)
            rows = (
                db.table("sightings")
                .select("id, case_id, created_at")
                .gte("created_at", started_at.isoformat())
                .order("created_at")
                .limit(30)
                .execute()
            )
            for row in rows.data or []:
                sid = row["id"]
                cid = row.get("case_id")
                if not cid or sid in seen:
                    continue
                seen.add(sid)
                log.info("New-sighting sweep: triggering agent", sighting_id=sid, case_id=cid)
                await run_case_agent(cid, db, trigger="sighting_added")
            if len(seen) > 5000:
                seen.clear()  # bound memory; start-time gate still prevents re-sweeps
        except Exception as exc:
            log.error("New-sighting sweep failed", error=str(exc))


async def _classifieds_scan_loop(db_url: str, db_key: str) -> None:
    """Scan classifieds sites (OLX, CustoJusto) every CLASSIFIEDS_SCAN_INTERVAL_H hours."""
    while True:
        await asyncio.sleep(_CLASSIFIEDS_SCAN_INTERVAL_H * 3600)
        try:
            from jobs.classifieds_scanner import run_classifieds_scan
            db = create_client(db_url, db_key)
            result = await run_classifieds_scan(db)
            log.info("Classifieds scan complete", **result)
        except Exception as exc:
            log.error("Classifieds scan failed", error=str(exc))


async def start_runner() -> None:
    """Start realtime listener, new-case sweep, escalation loop, classifieds scan, and nightly re-match."""
    db_url = os.environ["SUPABASE_URL"]
    db_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

    log.info("Starting PI Agent runner")
    await asyncio.gather(
        _realtime_listener(db_url, db_key),   # best-effort (Realtime unreliable)
        _new_case_sweep(db_url, db_key),      # reliable minute-0 trigger (new cases)
        _new_sighting_sweep(db_url, db_key),  # reliable fallback (new sightings)
        _escalation_loop(db_url, db_key),
        _nightly_rematch_loop(db_url, db_key),
        _daily_briefing_loop(db_url, db_key),
        _classifieds_scan_loop(db_url, db_key),
    )
