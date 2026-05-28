-- Behavioral profile + probability scenarios per case
-- Populated by the intake chat after behavioral questions
ALTER TABLE cases ADD COLUMN IF NOT EXISTS behavioral_profile jsonb;
