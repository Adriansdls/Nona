-- Add metadata to case_notifications for interactive buttons (acknowledgements, triage).
ALTER TABLE case_notifications ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';
COMMENT ON COLUMN case_notifications.metadata IS 'Payload for interactive elements (e.g. inline buttons, callback data).';
