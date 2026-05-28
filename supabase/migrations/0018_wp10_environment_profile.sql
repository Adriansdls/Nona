-- WP10: Physical Environment Layer
-- Adds environment_profile JSONB column to store computed environment context per case.
-- Fields: search_radius_km, is_nortada_season, is_summer_heat, transport_risk,
--         activity_windows, heatstroke_risk_flag, water_urgency_day, nortada_station_hint.

ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS environment_profile JSONB;

COMMENT ON COLUMN cases.environment_profile IS
  'WP10: Physical environment context computed at case_created. '
  'Includes activity windows, search radius, transport risk, Nortada orientation, water urgency.';
