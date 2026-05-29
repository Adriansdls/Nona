-- WS-G: community partner panel. intake_slug (0025) is the PUBLIC pinned link an
-- admin drops in their FB group; panel_token is the admin's PRIVATE magic-link to
-- their panel (no account, like owner_token). Also track candidate sightings'
-- partner attribution.
alter table community_partners add column if not exists panel_token text unique;

-- attribute partner-sourced sightings (the matched path, not just auto-created cases)
alter table sightings add column if not exists found_via_partner text;

comment on column community_partners.panel_token is
  'WS-G: secret magic-link token for the partner panel (/parceiro/<token>). No account needed.';
comment on column sightings.found_via_partner is
  'WS-G: partner intake_slug that submitted this sighting (community attribution).';
