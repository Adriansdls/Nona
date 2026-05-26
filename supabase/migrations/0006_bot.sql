-- Telegram user identity on profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS telegram_id bigint UNIQUE;

-- Bot conversation state (persists across Telegram messages)
CREATE TABLE IF NOT EXISTS bot_conversations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id bigint UNIQUE NOT NULL,
  state       jsonb NOT NULL DEFAULT '{}',
  locale      text NOT NULL DEFAULT 'pt',
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Rate limiting: max cases per telegram user per day
CREATE TABLE IF NOT EXISTS bot_rate_limits (
  telegram_id bigint NOT NULL,
  date        date NOT NULL DEFAULT CURRENT_DATE,
  case_count  int NOT NULL DEFAULT 0,
  PRIMARY KEY (telegram_id, date)
);

-- Index for fast conversation lookups
CREATE INDEX IF NOT EXISTS bot_conversations_telegram_id_idx
  ON bot_conversations (telegram_id);

-- RLS: bot_conversations are internal-only (service role only)
ALTER TABLE bot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_rate_limits ENABLE ROW LEVEL SECURITY;

-- No public access to bot tables
CREATE POLICY "bot_conversations_deny_public" ON bot_conversations
  FOR ALL TO anon, authenticated USING (false);
CREATE POLICY "bot_rate_limits_deny_public" ON bot_rate_limits
  FOR ALL TO anon, authenticated USING (false);
