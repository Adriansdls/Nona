-- WP3: Owner magic link token
ALTER TABLE cases ADD COLUMN IF NOT EXISTS owner_token text UNIQUE;

-- Backfill existing cases (gen_random_uuid gives 122 bits entropy — sufficient for magic link)
UPDATE cases
SET owner_token = replace(gen_random_uuid()::text, '-', '')
WHERE owner_token IS NULL;
