-- P-sim-1: Sandbox simulation plumbing.
-- Enables a full-pipeline simulation against test data + the founder's private
-- Telegram group, with ZERO real-community contact. Two-layer delivery:
--   * synthetic recipients  -> notifications recorded, NO Telegram API call
--   * real allowlist (founder/private group) -> actual Telegram send
-- 'source' tags every sim row so it can be purged cleanly (DELETE WHERE source='sim').
-- migrations applied via: supabase db push (linked project rirpcbddqbvtjrirrsqi)

-- Tag sim-generated rows for clean, total purge.
ALTER TABLE cases     ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE sightings ADD COLUMN IF NOT EXISTS source text;

-- Per-recipient delivery routing + simulation metrics on the notification queue.
ALTER TABLE case_notifications
  ADD COLUMN IF NOT EXISTS is_simulated    boolean NOT NULL DEFAULT false,  -- true => record only, never call Telegram
  ADD COLUMN IF NOT EXISTS distance_km     numeric(7,2),                    -- haversine case->recipient ("X km away")
  ADD COLUMN IF NOT EXISTS rate_limit_flag boolean;                         -- set when a real send was deferred by the throttle

-- Drain pending notifications fast (sim records bulk-marked sent without API calls).
CREATE INDEX IF NOT EXISTS case_notifications_pending_idx
  ON case_notifications (is_simulated, sent_at) WHERE sent_at IS NULL;

-- Fast purge / sim-only queries.
CREATE INDEX IF NOT EXISTS cases_source_idx     ON cases (source)     WHERE source IS NOT NULL;
CREATE INDEX IF NOT EXISTS sightings_source_idx ON sightings (source) WHERE source IS NOT NULL;

COMMENT ON COLUMN case_notifications.is_simulated IS
  'P-sim: true = synthetic recipient, record sent_at without calling Telegram. false = eligible for real send if recipient is in SIM_REAL_DELIVERY_ALLOWLIST.';
COMMENT ON COLUMN case_notifications.distance_km IS
  'P-sim: great-circle km from case last-seen point to recipient home_coords (the "estás a X km" value).';
COMMENT ON COLUMN cases.source IS
  'P-sim: ''sim'' for simulation-generated cases; NULL for real. Purge: DELETE FROM cases WHERE source=''sim''.';
