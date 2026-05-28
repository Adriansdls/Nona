-- WP12: Add reliability scoring to sightings
alter table sightings
  add column if not exists reliability_score  integer check (reliability_score between 0 and 15),
  add column if not exists action_recommendation text check (
    action_recommendation in ('move_camera_within_6h', 'log_and_monitor', 'log_only')
  );

comment on column sightings.reliability_score is
  'WP12 5-factor score 0-15: observer_familiarity + description_specificity + behavioral_match + location_plausibility + observation_conditions';
comment on column sightings.action_recommendation is
  'WP12 threshold: >=10 move_camera_within_6h, 7-9 log_and_monitor, <7 log_only';
