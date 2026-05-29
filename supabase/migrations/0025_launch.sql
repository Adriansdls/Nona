-- Launch-readiness columns.
-- WS-F: link a case to an authenticated user when the owner connects post-acute
--       (Google/FB/magic-link). Magic-link owner_token keeps working regardless.
-- WS-D/WS-G: attribute a community/partner-submitted found dog.

alter table cases
  add column if not exists owner_user_id   uuid references auth.users(id),
  add column if not exists found_via_partner text;

create index if not exists cases_owner_user_idx on cases(owner_user_id) where owner_user_id is not null;

comment on column cases.owner_user_id is
  'WS-F: set when the owner connects an account post-acute; enables "os meus casos" + notifications. Nullable — token magic-link still works.';
comment on column cases.found_via_partner is
  'WS-D/WS-G: partner/community id that submitted this found dog (attribution).';

-- WS-G: community partners (FB group admins etc.) who funnel sightings.
create table if not exists community_partners (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  municipality text,
  contact      text,
  intake_slug  text unique,          -- per-partner pinned intake link token
  created_at   timestamptz not null default now()
);
