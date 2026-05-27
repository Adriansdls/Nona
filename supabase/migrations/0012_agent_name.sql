-- WP1: Agent identity — one name per case from PT name pool
ALTER TABLE cases ADD COLUMN IF NOT EXISTS agent_name text;
-- null = legacy cases (pre-WP1); assigned at case creation from names.py pool
