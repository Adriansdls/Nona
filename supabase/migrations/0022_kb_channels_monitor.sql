-- WP20: Facebook-group monitoring registry.
-- Curate which community channels we actively poll for candidate sightings.
-- Incremental curation (mark groups as discovered) + auto-enroll (a group asks
-- to be added). Monitoring a feed surfaces a 65%-match photo → owner triage loop.

alter table kb_channels
  add column if not exists monitor_enabled boolean not null default false,
  add column if not exists last_polled_at  timestamptz,
  add column if not exists external_ref     text;
    -- external_ref: FB group id / handle used by the poller

comment on column kb_channels.monitor_enabled is
  'WP20: poll this channel for candidate sightings (requires authed login profile + ToS acceptance)';
comment on column kb_channels.last_polled_at is
  'WP20: last successful poll timestamp — poller uses this as the since-cursor';
comment on column kb_channels.external_ref is
  'WP20: stable external identifier (FB group id/handle) for the poller';

create index if not exists kb_channels_monitor_idx
  on kb_channels(monitor_enabled) where monitor_enabled = true;
