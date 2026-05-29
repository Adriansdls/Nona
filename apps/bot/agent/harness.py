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
import math
import re
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


def _parse_latlng(p: Any) -> tuple[float, float] | None:
    """Parse a Postgres point '(lng,lat)' → (lat, lng)."""
    if not p or not isinstance(p, str):
        return None
    m = re.match(r"\(([-\d.]+),([-\d.]+)\)", p)
    if not m:
        return None
    try:
        return (float(m.group(2)), float(m.group(1)))
    except ValueError:
        return None


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance in km."""
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2)
    return round(r * 2 * math.asin(math.sqrt(a)), 2)

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


def recompute_posterior_radius(
    belief_distribution: dict[str, Any],
    base_radius_km: float,
    now: datetime | None = None,
) -> float:
    """
    WP17: Posterior search radius from confirmed evidence.
    A strong recent sighting tightens the radius around the highest-probability
    zone; weak or stale evidence keeps it wide because the dog keeps moving.

      no evidence            → base
      weak (λ 0.20–0.70)     → base × 0.7
      strong (λ ≥ 0.70)      → base × 0.4
    Then widened ×1.15 per full 48h since the strongest evidence (dog moves),
    capped at base × 1.5.
    """
    now = now or datetime.now(UTC)
    evidence = belief_distribution.get("sighting_evidence") or []
    if not evidence:
        return round(base_radius_km, 1)

    strongest = max(evidence, key=lambda e: float(e.get("lambda", 0.0)))
    strongest_lambda = float(strongest.get("lambda", 0.0))
    if strongest_lambda >= 0.70:
        factor = 0.4
    elif strongest_lambda >= 0.35:
        factor = 0.7
    else:
        factor = 1.0

    # Staleness widening since the strongest sighting was incorporated.
    try:
        ts = strongest.get("incorporated_at")
        anchored = datetime.fromisoformat(ts) if ts else now
        if anchored.tzinfo is None:
            anchored = anchored.replace(tzinfo=UTC)
        hours_since = max(0.0, (now - anchored).total_seconds() / 3600.0)
        widen = 1.15 ** (hours_since // 48)
    except (ValueError, TypeError):
        widen = 1.0

    posterior = base_radius_km * factor * widen
    posterior = min(posterior, base_radius_km * 1.5)
    return round(max(0.5, posterior), 1)


def update_belief_from_sighting(
    profile: dict[str, Any],
    sighting_id: str,
    location_approx: str,
    direction_of_travel: str | None,
    observer_type: str,
    conditions: str,
    crowd_broadcast: bool = False,
    base_radius_km: float | None = None,
) -> dict[str, Any]:
    """
    Add a sighting to belief_distribution.sighting_evidence with lambda weight.
    Updates highest_probability_zone if λ ≥ 0.70 and recomputes posterior_radius_km.
    """
    lam = score_sighting_lambda(observer_type, conditions, crowd_broadcast)
    if lam < 0.20:
        return profile  # below noise floor, discard

    bd = profile.get("belief_distribution") or {}
    existing = bd.get("sighting_evidence") or []
    # Owner triage is authoritative — never let an agent civilian estimate clobber
    # a verdict the owner already gave for this sighting.
    prior = next((e for e in existing if e.get("sighting_id") == sighting_id), None)
    if prior and prior.get("source") == "owner_triage":
        return profile
    # Dedup by sighting_id: a later entry replaces the earlier one instead of
    # stacking. Without this the agent re-running on every sighting_added
    # double-counts evidence and the posterior radius is computed off inflated data.
    evidence = [e for e in existing if e.get("sighting_id") != sighting_id]
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

    # WP17: recompute the (previously dead) posterior radius. Fall back to a fixed
    # default (NOT the prior posterior) so the radius can recover toward the
    # environmental base instead of ratcheting monotonically down.
    if base_radius_km is None:
        base_radius_km = 5.0
    bd["posterior_radius_km"] = recompute_posterior_radius(bd, float(base_radius_km))

    profile["belief_distribution"] = bd
    return profile

# ---------------------------------------------------------------------------
# WP10: Physical Environment Layer — pure compute function
# ---------------------------------------------------------------------------

_BRACHY_BREEDS = (
    "bulldog", "pug", "boxer", "shih tzu", "french", "boston",
    "cavalier", "pekinese", "pekingese", "shar pei", "chow",
)


def compute_environment_context(case: dict, month: int) -> dict[str, Any]:
    """
    WP10: Compute physical environment context from case row + current month.
    No DB calls — pure function.
    """
    bp = case.get("behavioral_profile") or {}
    breed_category = (bp.get("breed_category") or "").lower()
    escape_trigger = (bp.get("escape_trigger") or "opportunistic").lower()
    temperament = (bp.get("temperament") or "aloof").lower()
    breed = (case.get("breed") or "").lower()
    size = (case.get("size") or "").lower()

    is_nortada_season = month in (5, 6, 7, 8, 9)
    is_summer_heat = month in (6, 7, 8, 9)
    is_peak_summer = month in (7, 8)

    # Search radius — breed/temperament table from Albrecht + dry-season modifier
    if breed_category == "galgo" or (breed_category == "podenco" and escape_trigger == "prey_drive"):
        base_km = 15.0
    elif temperament == "xenophobic" or escape_trigger == "blind_panic":
        base_km = 12.0
    elif temperament == "aloof":
        base_km = 5.0
    else:
        base_km = 2.0

    if is_peak_summer and temperament in ("xenophobic", "aloof"):
        base_km = round(base_km * 1.25, 1)

    # Transport risk — gregarious/opportunistic dogs near roads get picked up
    if temperament == "gregarious" or escape_trigger == "opportunistic":
        transport_risk = "high"
    elif temperament == "xenophobic" or breed_category in ("galgo", "podenco"):
        transport_risk = "very_low"
    elif temperament == "aloof":
        transport_risk = "moderate"
    else:
        transport_risk = "low"

    # Activity windows (crepuscular peaks shift with season/heat)
    if is_peak_summer:
        activity_windows = {"dawn": "05:30-09:00", "dusk": "19:30-21:30", "dead_zone": "11:00-18:00"}
    elif is_summer_heat:
        activity_windows = {"dawn": "06:00-09:30", "dusk": "19:00-21:00", "dead_zone": "12:00-17:00"}
    elif is_nortada_season:
        activity_windows = {"dawn": "06:30-09:30", "dusk": "18:30-20:30", "dead_zone": "12:00-16:00"}
    else:
        activity_windows = {"dawn": "07:00-09:30", "dusk": "17:00-19:00"}

    # Heatstroke risk: brachycephalic or large dog in summer
    is_brachycephalic = any(b in breed for b in _BRACHY_BREEDS)
    is_large = size == "grande"
    heatstroke_risk_flag = is_summer_heat and (is_brachycephalic or is_large)

    # Water urgency: day 2 in summer heat (48h), day 3 otherwise
    water_urgency_day = 2 if is_summer_heat else 3

    nortada_station_hint = (
        "coloque estação a norte/noroeste da zona do cão — Nortada (NNW) leva odor para sul em direcção ao cão"
        if is_nortada_season else None
    )

    return {
        "search_radius_km": base_km,
        "is_nortada_season": is_nortada_season,
        "is_summer_heat": is_summer_heat,
        "transport_risk": transport_risk,
        "activity_windows": activity_windows,
        "heatstroke_risk_flag": heatstroke_risk_flag,
        "water_urgency_day": water_urgency_day,
        "nortada_station_hint": nortada_station_hint,
        "computed_at": datetime.now(UTC).isoformat(),
    }


_WP9_TOOL_PALETTE: dict[str, list[str]] = {
    "phase_1_acute": [
        'notify_canil',
        'notify_vet',
        'post_to_channel',
        'send_owner_brief',
        'request_volunteer_alert',
        'send_field_guide',
        'send_environment_advisory',
        'score_sighting_wp12',
        'update_behavioral_assessment',
        'query_geography',
        'discover_contacts',
        'mark_contact_stale',
    ],
    "phase_2_survival": [
        'notify_canil',
        'notify_vet',
        'post_to_channel',
        'send_owner_brief',
        'request_volunteer_alert',
        'feeding_station_guidance',
        'trap_guidance',
        'schedule_shelter_visit_reminder',
        'send_field_guide',
        'send_environment_advisory',
        'score_sighting_wp12',
        'update_behavioral_assessment',
        'query_geography',
        'discover_contacts',
        'mark_contact_stale',
    ],
    "phase_3_entrenched": [
        'notify_canil',
        'notify_vet',
        'post_to_channel',
        'send_owner_brief',
        'cross_post_regional',
        'expand_shelter_radius',
        'cold_case_assessment',
        'send_field_guide',
        'send_environment_advisory',
        'score_sighting_wp12',
        'update_behavioral_assessment',
        'query_geography',
        'discover_contacts',
        'mark_contact_stale',
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
        # WP10: physical environment context (pure compute, no DB)
        self._env_context = compute_environment_context(self.case, datetime.now(UTC).month)
        # WP13: territorial intelligence from kb_geography (DB lookup, cached)
        self._geo_context = self._load_geo_context()

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    def _load_geo_context(self) -> dict[str, Any]:
        """WP13: Load territorial intelligence from kb_geography for case municipality."""
        municipality = self.case.get("last_seen_municipality", "")
        if not municipality:
            return {}
        res = (
            self._db.table("kb_geography")
            .select("*")
            .eq("municipality", municipality)
            .maybe_single()
            .execute()
        )
        return res.data or {}

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
        """Tool names appropriate for current WP9 behavioral phase."""
        return _WP9_TOOL_PALETTE.get(self._wp9_phase, _WP9_TOOL_PALETTE["phase_1_acute"])

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

        # WP10: environment context block
        ec = self._env_context
        aw = ec.get("activity_windows", {})
        env_lines: list[str] = [
            f"  Activity windows: dawn={aw.get('dawn','?')} | dusk={aw.get('dusk','?')}"
            + (f" | dead_zone={aw['dead_zone']} (NO field ops)" if "dead_zone" in aw else ""),
            f"  Search radius: {ec.get('search_radius_km','?')}km | Transport risk: {ec.get('transport_risk','?').upper()}",
        ]
        if ec.get("nortada_station_hint"):
            env_lines.append(f"  Nortada: {ec['nortada_station_hint']}")
        if ec.get("heatstroke_risk_flag"):
            env_lines.append("  ⚠️ HEATSTROKE RISK: brachycephalic/large dog in summer — buscas apenas amanhecer/crepúsculo")
        env_lines.append(f"  Water urgency: activates at {ec.get('water_urgency_day','?')} days — map water sources, camera at trough")
        env_str = "\n".join(env_lines)

        # WP13: geography context block
        geo_lines: list[str] = []
        if self._geo_context:
            gc = self._geo_context
            geo_lines.append(
                f"  zone={gc['zone_type']}  permeability={gc['terrain_permeability']}"
                f"  radius_modifier={gc['search_radius_modifier']}"
            )
            geo_lines.append(
                f"  A22_side={gc['a22_side']}  water={gc['water_source_type']}"
                f"  food={gc['food_availability']}"
            )
            geo_lines.append(
                f"  human_density={gc['human_density']}  fire_risk={gc['fire_risk_band']}"
            )
            if gc.get("goatherd_zone"):
                geo_lines.append(
                    "  GOATHERD_ZONE: yes — contact local shepherds, natural food attractor"
                )
            peak: list[int] = gc.get("tourist_peak_months") or []
            if datetime.now(UTC).month in peak:
                geo_lines.append(
                    "  TOURIST_PEAK: active — elevated transport risk, multilingual posts warranted"
                )
            # WP19: nearest water points + corridors, ranked by distance from last-seen.
            water_points = gc.get("water_points") or []
            origin = _parse_latlng(self.case.get("last_seen_coords_approx"))
            if water_points and origin:
                olat, olng = origin
                ranked = []
                for wp in water_points:
                    try:
                        d = _haversine_km(olat, olng, float(wp["lat"]), float(wp["lng"]))
                        ranked.append((d, wp))
                    except (KeyError, TypeError, ValueError):
                        continue
                ranked.sort(key=lambda x: x[0])
                for d, wp in ranked[:3]:
                    geo_lines.append(f"  WATER: {wp.get('name','?')} ({wp.get('type','?')}) ~{d}km — anchor point, esp. days 2+")
            elif water_points:
                names = ", ".join(str(wp.get("name", "?")) for wp in water_points[:3])
                geo_lines.append(f"  WATER: {names}")
            corridors = gc.get("terrain_corridors") or []
            for cor in corridors[:2]:
                geo_lines.append(f"  CORRIDOR: {cor.get('name','?')} — {cor.get('description','')}")
        geo_str = "\n".join(geo_lines) if geo_lines else "  not available (municipality not in KB)"

        # WS2: standing investigation plan — so the agent revises it, not re-derives.
        plan = (self.case.get("behavioral_profile") or {}).get("investigation_plan") or {}
        plan_actions = plan.get("actions") or []
        if plan_actions:
            plan_lines = [
                f"  [{a.get('status', 'pending')}] {a.get('action', '?')}"
                + (f" (due: {a['due']})" if a.get("due") else "")
                for a in plan_actions
            ]
            plan_str = "\n".join(plan_lines)
            if plan.get("reassessment_trigger"):
                plan_str += f"\n  reassess when: {plan['reassessment_trigger']}"
        else:
            plan_str = "  none yet — establish the plan this run via update_case_assessment(plan_actions=...)"

        return (
            f"CASE: {self.case['slug']} | {self.case.get('breed', '?')} | "
            f"{self.case.get('primary_color', '?')} | {municipality}\n"
            f"HOURS ELAPSED: {hours:.1f}h\n"
            f"BEHAVIORAL PHASE (WP9): {self._wp9_phase.upper()} | "
            f"legacy={self.phase.value.upper()} — {_PHASE_IMPLICATIONS[self.phase]}\n"
            f"ACTION GATE:\n{gate_str}\n"
            f"ACTION GATE RATIONALE: {ag.get('gate_rationale', 'n/a')}\n"
            f"ENVIRONMENT (WP10):\n{env_str}\n"
            f"GEOGRAPHY (WP13):\n{geo_str}\n"
            f"INVESTIGATION PLAN (standing — revise, don't restart):\n{plan_str}\n"
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
