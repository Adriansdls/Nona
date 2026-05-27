"""
CaseHarness — phase-aware context builder for the PI agent.

Guides without forcing:
- Phase-filtered tool palette (panic/survival/recovery subsets)
- Context injection (what's been tried, KB snapshot, escalation signals)
- Write-back hooks (tool result with new resource → auto-insert to KB)
- System-level escalation check (not agent logic)
- No-duplicate guard (skip_if_done)
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from uuid import UUID

import pathlib
import sys
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))

from supabase import Client

from intel.models import BehavioralPhase  # noqa: E402
from intel.tools import compute_behavioral_phase  # noqa: E402
from agent.kb import lookup_canils, lookup_vets, record_discovery  # noqa: E402

UTC = timezone.utc

_PHASE_TOOL_PALETTE: dict[BehavioralPhase, list[str]] = {
    BehavioralPhase.panic: [
        'notify_canils',
        'notify_vets',
        'post_channel',
        'send_owner_brief',
        'geo_alert_volunteers',
        'create_poster',
    ],
    BehavioralPhase.survival: [
        'notify_canils',
        'notify_vets',
        'post_channel',
        'send_owner_brief',
        'geo_alert_volunteers',
        'feeding_station_guidance',
        'trap_guidance',
        'create_poster',
        'schedule_shelter_visit_reminder',
    ],
    BehavioralPhase.recovery: [
        'notify_canils',
        'notify_vets',
        'post_channel',
        'send_owner_brief',
        'cross_post_regional',
        'expand_shelter_radius',
        'cold_case_assessment',
        'create_poster',
    ],
}

_PHASE_IMPLICATIONS: dict[BehavioralPhase, str] = {
    BehavioralPhase.panic: (
        "PANIC PHASE (0-24h): dog still in familiar territory, high mobility, fear-driven. "
        "Priority: immediate broadcast, canil notification, volunteer alert. "
        "Owner must NOT chase — scent anchor at escape point."
    ),
    BehavioralPhase.survival: (
        "SURVIVAL PHASE (24h-7d): dog seeking shelter/food, territory contracting. "
        "Priority: feeding station, humane trap, physical shelter visits every 48h. "
        "Owner must visit canil in person (not call) — 2.1x recovery rate (Lord 2007)."
    ),
    BehavioralPhase.recovery: (
        "RECOVERY PHASE (7d+): range contracted, possible adoption by finder. "
        "Priority: expand shelter radius to 60km, cross-post regional networks, "
        "check adoption listings. Cold case assessment required."
    ),
}


class CaseHarness:
    def __init__(self, case_id: str | UUID, supabase: Client) -> None:
        self._db = supabase
        self.case = self._load_case(str(case_id))
        self.phase = compute_behavioral_phase(self._hours_elapsed())
        self._done_actions: set[str] = self._load_done_actions()

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    def _load_case(self, case_id: str) -> dict:
        row = self._db.table('cases').select('*').eq('id', case_id).single().execute()
        return row.data  # type: ignore[return-value]

    def _hours_elapsed(self) -> float:
        last_seen = datetime.fromisoformat(self.case['last_seen_at'])
        if last_seen.tzinfo is None:
            last_seen = last_seen.replace(tzinfo=UTC)
        return (datetime.now(UTC) - last_seen).total_seconds() / 3600

    def _load_done_actions(self) -> set[str]:
        rows = self._db.table('case_agent_events') \
            .select('action') \
            .eq('case_id', self.case['id']) \
            .execute()
        return {str(r['action']) for r in (rows.data or [])}  # type: ignore[index,call-overload]

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def skip_if_done(self, action: str) -> bool:
        """No-duplicate guard — True means action already logged, skip it."""
        return action in self._done_actions

    def tool_palette(self) -> list[str]:
        """Tool names appropriate for current behavioral phase."""
        return _PHASE_TOOL_PALETTE[self.phase]

    def build_context_block(self) -> str:
        """
        Structured block injected into the agent's user message.
        Contains: phase + implications, hours elapsed, actions tried, KB snapshot.
        """
        hours = self._hours_elapsed()
        tried = sorted(self._done_actions) or ['none']
        municipality = self.case.get('last_seen_municipality', 'Algarve')

        canils = lookup_canils(self._db, municipality)
        canils_str = '; '.join(
            f"{c['name']} ({c.get('phone') or '?'}, {c.get('hours') or '?'})"
            for c in canils[:3]
        ) or 'none in KB'

        vets = lookup_vets(self._db, municipality)
        vets_str = '; '.join(
            f"{v['name']} ({v.get('phone') or '?'})"
            for v in vets[:3]
        ) or 'none in KB'

        # Case flags — prompt PI agent to act on theft/chip status
        flag_lines: list[str] = []
        if self.case.get('suspected_theft'):
            flag_lines.append('SUSPECTED_THEFT=true — trigger gnr_report guidance immediately')
        has_chip = self.case.get('has_chip')
        if has_chip is False:
            flag_lines.append('HAS_CHIP=false — trigger chip_check guidance (SICAFE registration)')
        elif has_chip is None:
            flag_lines.append('HAS_CHIP=unknown — confirm chip status with owner')
        flags_str = '; '.join(flag_lines) or 'none'

        escalation_note = ''
        if self.should_escalate():
            escalation_note = '\nESCALATION: 48h+ elapsed, no sightings — widen radius, add channels.\n'

        return (
            f"CASE: {self.case['slug']} | {self.case.get('breed', '?')} | "
            f"{self.case.get('primary_color', '?')} | {municipality}\n"
            f"HOURS ELAPSED: {hours:.1f}h\n"
            f"PHASE: {self.phase.value.upper()} — {_PHASE_IMPLICATIONS[self.phase]}\n"
            f"ACTIONS ALREADY TAKEN: {', '.join(tried)}\n"
            f"LOCAL CANILS IN KB: {canils_str}\n"
            f"LOCAL VETS IN KB: {vets_str}\n"
            f"CASE FLAGS: {flags_str}\n"
            f"AVAILABLE TOOLS THIS PHASE: {', '.join(self.tool_palette())}"
            f"{escalation_note}"
        )

    def log_action(
        self,
        action: str,
        tool: str,
        outcome: str,
        resources_discovered: dict | None = None,
    ) -> None:
        """
        1. Insert to case_agent_events.
        2. If resources_discovered contains a new entity → write-back to KB.
        3. Update in-memory done set.
        """
        self._db.table('case_agent_events').insert({
            'case_id': self.case['id'],
            'action': action,
            'tool': tool,
            'outcome': outcome,
            'resources_discovered': json.dumps(resources_discovered) if resources_discovered else None,
            'phase': self.phase.value,
            'agent_state': self.case.get('agent_state', 'active'),
        }).execute()

        if resources_discovered:
            kind = resources_discovered.get('type')
            if kind in ('canil', 'vet', 'channel'):
                record_discovery(self._db, kind, resources_discovered)

        self._done_actions.add(action)

    def should_escalate(self) -> bool:
        """
        System-level escalation check — not agent logic.
        True when 48h+ elapsed AND no sightings exist for this case.
        """
        if self._hours_elapsed() < 48:
            return False
        result = (
            self._db.table('sightings')
            .select('id', count='exact', head=True)  # type: ignore[arg-type]
            .eq('case_id', self.case['id'])
            .execute()
        )
        return (result.count or 0) == 0

    def set_agent_state(self, state: str) -> None:
        self._db.table('cases') \
            .update({'agent_state': state}) \
            .eq('id', self.case['id']) \
            .execute()
        self.case['agent_state'] = state
