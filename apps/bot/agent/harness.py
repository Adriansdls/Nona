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
from typing import Any

import pathlib
import sys
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))

from supabase import Client

from intel.models import BehavioralPhase  # noqa: E402
from intel.tools import compute_behavioral_phase  # noqa: E402
from agent.kb import lookup_canils, lookup_vets, lookup_channels, record_discovery  # noqa: E402

UTC = timezone.utc

# ---------------------------------------------------------------------------
# WP9: Temporal Behavioral Engine — pure compute functions
# ---------------------------------------------------------------------------

def compute_phase(
    hours_since_loss: float,
    breed_category: str,
    escape_trigger: str,
    temperament: str,
) -> tuple[str, int]:
    """
    Returns (phase_name, phase_1_cap_hours).
    Phase state machine from research: breed + trigger + temperament, NOT just time.
    """
    bc = (breed_category or "").lower()
    et = (escape_trigger or "").lower()
    tm = (temperament or "").lower()

    if bc == "galgo":
        phase_1_cap = 0  # galgos start in phase 2 immediately — zero tolerance for active search
    elif bc == "podenco" and et == "prey_drive":
        phase_1_cap = 4
    elif et == "blind_panic" or tm == "xenophobic":
        phase_1_cap = 24
    else:
        phase_1_cap = 72  # gregarious/opportunistic default

    if hours_since_loss < phase_1_cap:
        return "phase_1_acute", phase_1_cap
    elif hours_since_loss < 168:  # 7 days
        return "phase_2_survival", phase_1_cap
    else:
        return "phase_3_entrenched", phase_1_cap


def compute_action_gate(
    breed_category: str,
    phase: str,
    temperament: str,
    escape_trigger: str,
    conditioning_events: list[str],
) -> dict[str, Any]:
    """
    Action gate: separate from belief update. Conservative by default.
    Once crowd_conditioned=true, broadcast is permanently blocked.
    """
    bc = (breed_category or "").lower()
    tm = (temperament or "").lower()
    et = (escape_trigger or "").lower()
    ce = conditioning_events or []

    is_hard_case = (
        bc == "galgo"
        or tm == "xenophobic"
        or phase in ("phase_2_survival", "phase_3_entrenched")
        or (bc == "podenco" and et != "opportunistic")
        or "crowd_conditioned" in ce
    )

    rationale_parts = []
    if bc == "galgo":
        rationale_parts.append("galgo: passive_only, 72h camera minimum, conspecific lure")
    if bc == "podenco" and et != "opportunistic":
        rationale_parts.append("podenco prey_drive: wide radius, passive lure only")
    if tm == "xenophobic":
        rationale_parts.append("xenophobic: any approach triggers flight")
    if phase in ("phase_2_survival", "phase_3_entrenched"):
        rationale_parts.append(f"{phase}: survival/entrenched — passive protocol mandatory")
    if "crowd_conditioned" in ce:
        rationale_parts.append("crowd_conditioned: irreversible — calling/approach triggers flight reflex")
    if "name_conditioned" in ce:
        rationale_parts.append("name_conditioned: name now a flight trigger")

    broadcast = "blocked" if is_hard_case else "public"
    # Aloof gets private_coordinator_only even if not full is_hard_case
    if not is_hard_case and tm == "aloof":
        broadcast = "private_coordinator_only"

    return {
        "broadcast_sighting_location": broadcast,
        "active_search_permitted": not is_hard_case,
        "crowd_response_blocked": is_hard_case,
        "name_calling_blocked": is_hard_case or "name_conditioned" in ce,
        "drone_blocked": is_hard_case or bc in ("galgo", "podenco"),
        "approach_protocol": "passive_only" if is_hard_case else "calming_signals_ok",
        "conditioning_events": ce,
        "gate_rationale": "; ".join(rationale_parts) if rationale_parts else "standard protocol",
        "last_updated_at": datetime.now(UTC).isoformat(),
    }


# Lambda weight table — WiSAR-adapted for lost dogs
SIGHTING_LAMBDA = {
    "camera": 0.95,
    "owner_vetted": 0.75,
    "clear_daylight": 0.70,
    "brief_uncertain": 0.35,
    "night": 0.30,
    "secondhand": 0.25,
    "crowd_degraded": 0.20,
}


def score_sighting_lambda(
    observer_type: str,
    conditions: str,
    crowd_broadcast: bool = False,
) -> float:
    """
    Compute λ reliability weight for a sighting.
    observer_type: 'camera'|'owner'|'volunteer'|'civilian'
    conditions: 'daylight'|'dusk'|'night'|'unknown'
    """
    if crowd_broadcast:
        return SIGHTING_LAMBDA["crowd_degraded"]
    if observer_type == "camera":
        return SIGHTING_LAMBDA["camera"]
    if observer_type == "owner":
        return SIGHTING_LAMBDA["owner_vetted"]
    if conditions == "daylight":
        return SIGHTING_LAMBDA["clear_daylight"]
    if conditions == "night":
        return SIGHTING_LAMBDA["night"]
    return SIGHTING_LAMBDA["brief_uncertain"]


def update_belief_from_sighting(
    profile: dict[str, Any],
    sighting_id: str,
    location_approx: str,
    direction_of_travel: str | None,
    observer_type: str,
    conditions: str,
    crowd_broadcast: bool = False,
) -> dict[str, Any]:
    """
    Add a sighting to belief_distribution.sighting_evidence with lambda weight.
    Updates highest_probability_zone if λ ≥ 0.70.
    """
    lam = score_sighting_lambda(observer_type, conditions, crowd_broadcast)
    if lam < 0.20:
        return profile  # below noise floor, discard

    bd = profile.get("belief_distribution") or {}
    evidence = bd.get("sighting_evidence") or []
    evidence.append({
        "sighting_id": sighting_id,
        "lambda": lam,
        "location_approx": location_approx,
        "direction_of_travel": direction_of_travel,
        "incorporated_at": datetime.now(UTC).isoformat(),
    })
    bd["sighting_evidence"] = evidence
    bd["last_bayesian_update"] = datetime.now(UTC).isoformat()

    # Update highest probability zone when we have strong evidence
    if lam >= 0.70:
        bd["highest_probability_zone"] = location_approx
        if direction_of_travel:
            bd["direction_vector"] = direction_of_travel

    profile["belief_distribution"] = bd
    return profile

_PHASE_TOOL_PALETTE: dict[BehavioralPhase, list[str]] = {
    BehavioralPhase.panic: [
        'notify_canils',
        'notify_vets',
        'post_channel',
        'send_owner_brief',
        'geo_alert_volunteers',
        'create_poster',
        'update_behavioral_assessment',  # WP9: always available
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
        'update_behavioral_assessment',  # WP9: always available
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
        'update_behavioral_assessment',  # WP9: always available
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
        # WP9: recalculate behavioral phase and action gate on every init
        self._wp9_phase, self._wp9_action_gate = self._recalculate_behavioral_engine()

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    def _recalculate_behavioral_engine(self) -> tuple[str, dict]:
        """
        WP9: Compute phase + action gate from current case state.
        Writes back to behavioral_profile if phase changed.
        Returns (phase_name, action_gate_dict).
        """
        bp: dict = self.case.get("behavioral_profile") or {}
        breed_category = bp.get("breed_category") or self._infer_breed_category()
        escape_trigger = bp.get("escape_trigger", "opportunistic")
        temperament = bp.get("temperament") or self._infer_temperament()
        conditioning = (bp.get("action_gate") or {}).get("conditioning_events") or []

        hours = self._hours_elapsed()
        phase_name, phase_1_cap = compute_phase(hours, breed_category, escape_trigger, temperament)
        action_gate = compute_action_gate(breed_category, phase_name, temperament, escape_trigger, conditioning)

        # Detect phase change and write back if changed
        existing_phase = (bp.get("phase_state") or {}).get("current")
        if existing_phase != phase_name:
            phase_history = (bp.get("phase_state") or {}).get("phase_history") or []
            if existing_phase:
                phase_history.append({
                    "phase": existing_phase,
                    "exited_at": datetime.now(UTC).isoformat(),
                })
            bp["phase_state"] = {
                "current": phase_name,
                "phase_1_cap_hours": phase_1_cap,
                "last_calculated_at": datetime.now(UTC).isoformat(),
                "phase_history": phase_history,
            }
            bp["action_gate"] = action_gate
            try:
                self._db.table("cases").update({"behavioral_profile": bp}).eq("id", self.case["id"]).execute()
                self.case["behavioral_profile"] = bp
            except Exception:
                pass  # non-fatal — context block still uses computed values

        return phase_name, action_gate

    def _infer_breed_category(self) -> str:
        """Infer breed_category from breed string when not explicitly set."""
        breed = (self.case.get("breed") or "").lower()
        if any(x in breed for x in ("galgo", "greyhound", "lebrel")):
            return "galgo"
        if any(x in breed for x in ("podenco", "ibizan", "pharaoh")):
            return "podenco"
        if any(x in breed for x in ("chihuahua", "yorkie", "maltês", "toy")):
            return "toy"
        if any(x in breed for x in ("border", "pastor", "collie", "malinois")):
            return "herding"
        if any(x in breed for x in ("labrador", "golden", "retriever", "spaniel")):
            return "gun_dog"
        if any(x in breed for x in ("beagle", "basset", "bloodhound")):
            return "scent_hound"
        return "mixed"

    def _infer_temperament(self) -> str:
        """Map sociability field to temperament for action gate."""
        sociability = (self.case.get("behavioral_profile") or {}).get("sociability", "neutral")
        if sociability in ("shy",):
            return "xenophobic"
        if sociability in ("sociable", "velcro"):
            return "gregarious"
        return "aloof"

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

        # Breed-specific channels (sighthound, etc.) + general local channels
        breed_cat = self.case.get('breed_category')
        channels = lookup_channels(self._db, municipality, str(breed_cat) if breed_cat else None)
        # Also include Algarve-wide channels
        algarve_channels = lookup_channels(self._db, 'Algarve', str(breed_cat) if breed_cat else None)
        all_channels = {c['name']: c for c in (channels + algarve_channels)}.values()
        channels_str = '; '.join(
            f"{c['name']} ({c.get('channel_type', '?')})"
            for c in list(all_channels)[:5]
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

        # WP9: Action gate block
        ag = self._wp9_action_gate
        gate_lines: list[str] = []
        if ag.get("crowd_response_blocked"):
            gate_lines.append("CROWD_RESPONSE: BLOCKED — NÃO mobilizar grupos; NÃO partilhar localização publicamente")
        if ag.get("name_calling_blocked"):
            gate_lines.append("NAME_CALLING: BLOCKED — chamar o nome pode ser gatilho de fuga")
        if ag.get("drone_blocked"):
            gate_lines.append("DRONE: BLOCKED — drones causam deslocação em cães assustados")
        if not ag.get("active_search_permitted", True):
            gate_lines.append("ACTIVE_SEARCH: SUSPENDED — protocolo passivo obrigatório")
        broadcast = ag.get("broadcast_sighting_location", "public")
        if broadcast != "public":
            gate_lines.append(f"SIGHTING_BROADCAST: {broadcast.upper()} — avistamentos para coordenador apenas")
        gate_str = '\n'.join(gate_lines) or 'standard (active search permitted)'

        return (
            f"CASE: {self.case['slug']} | {self.case.get('breed', '?')} | "
            f"{self.case.get('primary_color', '?')} | {municipality}\n"
            f"HOURS ELAPSED: {hours:.1f}h\n"
            f"BEHAVIORAL PHASE (WP9): {self._wp9_phase.upper()} | "
            f"legacy={self.phase.value.upper()} — {_PHASE_IMPLICATIONS[self.phase]}\n"
            f"ACTION GATE:\n{gate_str}\n"
            f"ACTION GATE RATIONALE: {ag.get('gate_rationale', 'n/a')}\n"
            f"ACTIONS ALREADY TAKEN: {', '.join(tried)}\n"
            f"LOCAL CANILS IN KB: {canils_str}\n"
            f"LOCAL VETS IN KB: {vets_str}\n"
            f"LOCAL CHANNELS IN KB: {channels_str}\n"
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
