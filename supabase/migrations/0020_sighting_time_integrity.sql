-- WP16 + WP17: Sighting time integrity + owner triage verdict
-- The behavioral engine runs on "hours since seen". A wrong observation time
-- (e.g. a Facebook post showing "2h ago" that was really ~10h old) poisons
-- phase → action_gate → radius → ads. Capture how confident/sourced the time
-- is, derive an uncertainty band, and let the owner confirm/reject candidates.

alter table sightings
  add column if not exists observed_time_confidence text check (
    observed_time_confidence in ('exact', 'approximate', 'unknown')
  ) default 'approximate',
  add column if not exists observed_time_source text check (
    observed_time_source in ('firsthand', 'social_post', 'secondhand')
  ) default 'firsthand',
  add column if not exists time_uncertainty_hours numeric(5,1) default 0,
  add column if not exists owner_verdict text check (
    owner_verdict in ('confirmed', 'rejected', 'unsure')
  );

comment on column sightings.observed_time_confidence is
  'WP16: how precisely the observation time is known — exact|approximate|unknown';
comment on column sightings.observed_time_source is
  'WP16: provenance of the time — firsthand|social_post|secondhand. social_post times are notoriously misleading';
comment on column sightings.time_uncertainty_hours is
  'WP16: ± band in hours applied to seen_at; modulates the sighting lambda weight';
comment on column sightings.owner_verdict is
  'WP17: owner triage of a candidate sighting — confirmed (strong lambda) | rejected (discarded) | unsure (weak lambda)';
