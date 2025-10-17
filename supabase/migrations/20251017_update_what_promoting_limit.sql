-- Update what_promoting character limit from 150 to 500 characters
-- This allows users to provide more detailed descriptions of what they're promoting

ALTER TABLE content_plans
  DROP CONSTRAINT IF EXISTS content_plans_what_promoting_check;

ALTER TABLE content_plans
  ADD CONSTRAINT content_plans_what_promoting_check CHECK (
    char_length(what_promoting) BETWEEN 10 AND 500
  );

COMMENT ON COLUMN content_plans.what_promoting IS 'Description of what is being promoted in this campaign (10-500 chars)';
