-- WP2: PI Agent outbox + assessment log

-- Owner message queue — PI agent writes, Telegram bot job flushes
CREATE TABLE IF NOT EXISTS case_notifications (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     uuid        NOT NULL REFERENCES cases ON DELETE CASCADE,
  channel     text        NOT NULL DEFAULT 'telegram', -- 'telegram' | 'email' | 'log'
  telegram_id bigint,                                   -- set if channel='telegram'
  message     text        NOT NULL,
  phase       text,
  sent_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS case_notifications_unsent_idx
  ON case_notifications(created_at) WHERE sent_at IS NULL;

-- PI agent case-file entries — one per run
CREATE TABLE IF NOT EXISTS case_agent_assessments (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id       uuid        NOT NULL REFERENCES cases ON DELETE CASCADE,
  assessment    text        NOT NULL,
  actions_taken jsonb,
  next_planned  jsonb,
  phase         text,
  confidence    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS case_agent_assessments_case_id_idx
  ON case_agent_assessments(case_id);
