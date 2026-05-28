-- WP9: Temporal Behavioral Engine v2
-- Extends behavioral_profile JSONB with phase_state, action_gate, belief_distribution.
-- No breaking schema change — pure JSONB extension.
-- New fields added by harness.py compute functions, not by this migration.

-- Generated column for fast phase queries without JSON parsing
ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS behavioral_phase TEXT
  GENERATED ALWAYS AS (
    behavioral_profile->>'phase'
  ) STORED;

-- Index for escalation_sweep to find cases in each phase quickly
CREATE INDEX IF NOT EXISTS idx_cases_behavioral_phase
  ON cases (behavioral_phase)
  WHERE status = 'ativo';

-- Index for action_gate queries (find cases with blocked broadcast)
CREATE INDEX IF NOT EXISTS idx_cases_action_gate_broadcast
  ON cases ((behavioral_profile->'action_gate'->>'broadcast_sighting_location'))
  WHERE status = 'ativo';

-- Comment documenting WP9 behavioral_profile shape
COMMENT ON COLUMN cases.behavioral_profile IS
$$WP9 shape:
{
  "sociability": "shy|neutral|sociable|velcro",
  "off_leash": true,
  "environment": "urban|suburban|rural_road|rural_isolated",
  "stress_level": "normal|stressed|high_stress",
  "breed_category": "galgo|podenco|sighthound_other|toy|herding|guardian|scent_hound|mixed",
  "escape_trigger": "opportunistic|prey_drive|blind_panic|wanderlust",
  "temperament": "gregarious|aloof|xenophobic",
  "phase_state": {
    "current": "phase_1_acute|phase_2_survival|phase_3_entrenched",
    "phase_1_cap_hours": 0,
    "last_calculated_at": "ISO8601",
    "phase_history": [{"phase":"...","entered_at":"...","trigger":"..."}]
  },
  "action_gate": {
    "broadcast_sighting_location": "public|private_coordinator_only|blocked",
    "active_search_permitted": true,
    "crowd_response_blocked": true,
    "name_calling_blocked": true,
    "drone_blocked": true,
    "conditioning_events": [],
    "gate_rationale": "...",
    "last_updated_at": "ISO8601"
  },
  "belief_distribution": {
    "scenarios": [...],
    "sighting_evidence": [{"sighting_id":"...","lambda":0.70,"direction_of_travel":"north","incorporated_at":"ISO8601"}],
    "last_bayesian_update": "ISO8601",
    "posterior_radius_km": 5.2,
    "highest_probability_zone": "..."
  }
}$$;
