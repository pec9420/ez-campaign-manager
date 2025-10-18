-- Add strategy_framework JSONB column to content_plans table
-- This stores the output from the Strategy Agent for reuse across the system

ALTER TABLE content_plans
ADD COLUMN strategy_framework JSONB;

COMMENT ON COLUMN content_plans.strategy_framework IS 'Stores strategic planning output from Strategy Agent: weekly phases, posting frequency, content themes, shot requirements';
