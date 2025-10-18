-- ============================================
-- Add new fields to content_plans table
-- ============================================
ALTER TABLE public.content_plans
ADD COLUMN IF NOT EXISTS context_package JSONB,
ADD COLUMN IF NOT EXISTS num_posts INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS strategy_framework JSONB;

-- Add constraint to num_posts (0-30 range)
ALTER TABLE public.content_plans
ADD CONSTRAINT num_posts_range CHECK (num_posts >= 0 AND num_posts <= 30);

-- ============================================
-- Add new field to brand_hub table
-- ============================================
ALTER TABLE public.brand_hub
ADD COLUMN IF NOT EXISTS other_notes TEXT;

-- ============================================
-- Remove redundant format field from posts
-- ============================================
ALTER TABLE public.posts
DROP COLUMN IF EXISTS format;

-- ============================================
-- Add comment documentation
-- ============================================
COMMENT ON COLUMN content_plans.context_package IS 'System field: Cached context for AI regeneration (never shown to user)';
COMMENT ON COLUMN content_plans.num_posts IS 'User input: Number of posts to generate (0-30)';
COMMENT ON COLUMN content_plans.strategy_framework IS 'AI output: Weekly phases, themes, posting frequency';
COMMENT ON COLUMN brand_hub.other_notes IS 'Optional user notes: Additional instructions (e.g., "never say X")';