-- Belt-and-braces: ensure every case gets an owner_token even if an insert path
-- forgets to set one. Migration 0014 added the column + backfilled existing rows
-- but set no DEFAULT, so the bot insert path (api/bot/cases) was producing
-- owner_token=NULL cases — owners of those cases could never reach the OwnerPanel
-- at /caso/[slug]?t=<token>. The app code now sets the token explicitly on all
-- paths; this DEFAULT is the safety net.
ALTER TABLE cases
  ALTER COLUMN owner_token SET DEFAULT replace(gen_random_uuid()::text, '-', '');

-- Backfill any rows that slipped through with a NULL token (e.g. bot-created
-- cases before this fix).
UPDATE cases
SET owner_token = replace(gen_random_uuid()::text, '-', '')
WHERE owner_token IS NULL;
