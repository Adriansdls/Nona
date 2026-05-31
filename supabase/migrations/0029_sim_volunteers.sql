-- P-sim-2: geolocated volunteer registry for the "estás a X km" per-person alert.
-- Standalone table (NOT user_profiles, which FKs auth.users and has no coords).
-- Holds both synthetic sim actors (is_simulated=true, negative synthetic telegram_id)
-- and real opt-in volunteers (is_simulated=false, real telegram_id, e.g. the founder).
-- coords use Postgres point as (lng,lat) — same convention as cases.last_seen_coords_approx
-- so the existing _parse_latlng / _haversine_km helpers work unchanged.
-- Purge: DELETE FROM sim_volunteers WHERE source='sim'.

CREATE TABLE IF NOT EXISTS sim_volunteers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id     bigint UNIQUE NOT NULL,
  display_name    text,
  home_coords     point NOT NULL,                       -- (lng,lat)
  municipality    text NOT NULL,
  radius_km       numeric(5,1) NOT NULL DEFAULT 10.0,   -- personal willingness radius
  active          boolean NOT NULL DEFAULT true,
  is_simulated    boolean NOT NULL DEFAULT true,        -- false => real opt-in (gets real DM)
  consent_at      timestamptz,
  -- synthetic-actor behavior params (used by the scale simulator)
  response_rate   numeric(3,2) NOT NULL DEFAULT 0.40,   -- P("estou atento")
  sighting_rate   numeric(3,2) NOT NULL DEFAULT 0.20,   -- P(submit sighting | alerted)
  photo_rate      numeric(3,2) NOT NULL DEFAULT 0.50,   -- P(sighting has photo | sighting)
  response_delay_mean_s int NOT NULL DEFAULT 120,
  persona         jsonb,
  source          text NOT NULL DEFAULT 'sim',
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sim_volunteers_active_idx ON sim_volunteers (active) WHERE active;
CREATE INDEX IF NOT EXISTS sim_volunteers_muni_idx   ON sim_volunteers (municipality);
CREATE INDEX IF NOT EXISTS sim_volunteers_source_idx ON sim_volunteers (source);

COMMENT ON TABLE sim_volunteers IS
  'P-sim: geolocated volunteer registry for distance-filtered ("X km away") alerts. Synthetic actors + real opt-in. Purge by source.';
COMMENT ON COLUMN sim_volunteers.home_coords IS 'Postgres point as (lng,lat) — matches cases.last_seen_coords_approx convention.';
COMMENT ON COLUMN sim_volunteers.is_simulated IS 'true=synthetic (virtual delivery); false=real opt-in (real Telegram DM if allowlisted).';
