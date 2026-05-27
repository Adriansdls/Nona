-- WP0: Agent Foundation
-- Case state machine, event log, and agent-writable knowledge base tables.

-- 1. Case state machine
ALTER TABLE cases ADD COLUMN IF NOT EXISTS agent_state text NOT NULL DEFAULT 'new';
-- new       — case created, agent not yet assigned
-- planning  — agent generating day-1 plan
-- active    — agent running cycle (6h or event-triggered)
-- escalated — 48h+ no sightings, wider search activated
-- cold      — 7d+ no sightings, cold-case playbook
-- resolved  — case closed

-- 2. Agent event log
CREATE TABLE IF NOT EXISTS case_agent_events (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id              uuid        NOT NULL REFERENCES cases ON DELETE CASCADE,
  action               text        NOT NULL,
  tool                 text        NOT NULL,
  outcome              text,
  resources_discovered jsonb,
  phase                text,
  agent_state          text,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS case_agent_events_case_id_idx ON case_agent_events(case_id);
CREATE INDEX IF NOT EXISTS case_agent_events_action_idx  ON case_agent_events(action);

-- 3. KB: canils (shelters) — agent-writable, grows over time
CREATE TABLE IF NOT EXISTS kb_canils (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality     text        NOT NULL,
  name             text        NOT NULL,
  phone            text,
  email            text,
  address          text,
  hours            text,
  director_name    text,
  hold_period_days int,
  source           text        NOT NULL DEFAULT 'seed',
  last_verified_at timestamptz,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name, municipality)
);

CREATE INDEX IF NOT EXISTS kb_canils_municipality_idx ON kb_canils(municipality);

-- 4. KB: vets (clinics) — agent-writable
CREATE TABLE IF NOT EXISTS kb_vets (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality     text        NOT NULL,
  name             text        NOT NULL,
  phone            text,
  email            text,
  address          text,
  lat              real,
  lng              real,
  source           text        NOT NULL DEFAULT 'seed',
  last_verified_at timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name, municipality)
);

CREATE INDEX IF NOT EXISTS kb_vets_municipality_idx ON kb_vets(municipality);

-- 5. KB: community channels — agent-writable
CREATE TABLE IF NOT EXISTS kb_channels (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality   text        NOT NULL,
  channel_type   text        NOT NULL,
  name           text        NOT NULL,
  url            text,
  members_approx int,
  breed_focus    text,
  source         text        NOT NULL DEFAULT 'seed',
  last_posted_at timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name, municipality)
);

CREATE INDEX IF NOT EXISTS kb_channels_municipality_idx ON kb_channels(municipality);
