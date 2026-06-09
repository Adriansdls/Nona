-- Add recovery_method to case_outcomes for better learning loop.
ALTER TABLE case_outcomes ADD COLUMN IF NOT EXISTS recovery_method text;
COMMENT ON COLUMN case_outcomes.recovery_method IS 'How the dog was recovered (e.g. found by owner, sighting, social media, trap).';
