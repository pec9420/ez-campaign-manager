-- ============================================
-- Migration: Add missing fields to match schema requirements
-- Date: October 18, 2025
-- ============================================

-- ============================================
-- 1. Add missing fields to content_plans table
-- ============================================

-- Add status field for campaign workflow tracking
ALTER TABLE public.content_plans
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'in_progress', 'completed'));

-- Add other_notes field for user instructions
ALTER TABLE public.content_plans
ADD COLUMN IF NOT EXISTS other_notes TEXT;

-- Add index for filtering by status
CREATE INDEX IF NOT EXISTS idx_content_plans_status ON content_plans(status);

-- Add comments for documentation
COMMENT ON COLUMN content_plans.status IS 'Campaign workflow status: draft (planning), approved (ready to execute), in_progress (actively posting), completed (finished)';
COMMENT ON COLUMN content_plans.other_notes IS 'Optional user notes: Additional campaign instructions (e.g., "include x posts about collaboration with brand for new product launch")';

-- ============================================
-- 2. Add missing field to posts table
-- ============================================

-- Add platform_notes field for platform-specific instructions
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS platform_notes JSONB;

-- Update status constraint to include 'posted' option
ALTER TABLE public.posts
DROP CONSTRAINT IF EXISTS posts_status_check;

ALTER TABLE public.posts
ADD CONSTRAINT posts_status_check CHECK (status IN ('draft', 'approved', 'posted'));

-- Add comment for documentation
COMMENT ON COLUMN posts.platform_notes IS 'Platform-specific instructions (e.g., {"instagram": "Use carousel format", "tiktok": "Keep under 15 seconds"})';

-- ============================================
-- 3. OPTIONAL: Update brand_hub character limits
-- ============================================
-- Uncomment the following if you want to increase character limits
-- from 100 to 500 to match original requirements

-- ALTER TABLE public.brand_hub
-- DROP CONSTRAINT IF EXISTS brand_hub_what_you_sell_check;
--
-- ALTER TABLE public.brand_hub
-- ADD CONSTRAINT brand_hub_what_you_sell_check CHECK (char_length(what_you_sell) BETWEEN 10 AND 500);
--
-- ALTER TABLE public.brand_hub
-- DROP CONSTRAINT IF EXISTS brand_hub_what_makes_unique_check;
--
-- ALTER TABLE public.brand_hub
-- ADD CONSTRAINT brand_hub_what_makes_unique_check CHECK (char_length(what_makes_unique) BETWEEN 10 AND 500);
--
-- ALTER TABLE public.brand_hub
-- DROP CONSTRAINT IF EXISTS brand_hub_target_customer_check;
--
-- ALTER TABLE public.brand_hub
-- ADD CONSTRAINT brand_hub_target_customer_check CHECK (char_length(target_customer) BETWEEN 10 AND 500);

-- ============================================
-- Migration Complete
-- ============================================
