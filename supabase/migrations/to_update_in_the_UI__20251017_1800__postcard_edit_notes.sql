-- ============================================================================
-- UI WORKING NOTES ONLY – DO NOT APPLY
-- ============================================================================
-- Potential DB changes queued from PostCard editing UI refactor
-- Created: 2025-10-17
-- Context: PostDetailModal → PostCard refactor for in-place editing
-- ============================================================================

-- 1) Add Reel-specific columns to posts table
-- These fields allow users to specify reel metadata before content generation
-- Currently handled in UI but not persisted to database

ALTER TABLE posts
  ADD COLUMN reel_duration_seconds INT CHECK (reel_duration_seconds >= 1),
  ADD COLUMN reel_script TEXT CHECK (
    reel_script IS NULL OR char_length(reel_script) <= 2500
  );

COMMENT ON COLUMN posts.reel_duration_seconds IS 'Total reel length in whole seconds (only for post_type = ''reel''). User-specified before content generation.';
COMMENT ON COLUMN posts.reel_script IS 'Script or talking points for the reel (≤2500 chars). User-specified before content generation.';

-- Add index for reel posts with duration
CREATE INDEX idx_posts_reel_duration ON posts(reel_duration_seconds)
  WHERE post_type = 'reel' AND NOT deleted;

-- ============================================================================

-- 2) Behavioral Trigger Enum - ALREADY EXISTS ✓
-- Confirmed in migration: 20251017030524_31b0cbd5-e50b-4aef-8552-a2aa157b1b1a.sql
-- Current constraint: CHECK (behavioral_trigger IN ('reciprocity', 'FOMO', 'scarcity', 'trust', 'nostalgia', 'belonging', 'curiosity', 'urgency'))
-- No changes needed

-- ============================================================================

-- 3) Tracking Focus Enum - ALREADY EXISTS ✓
-- Confirmed in migration: 20251017030524_31b0cbd5-e50b-4aef-8552-a2aa157b1b1a.sql
-- Current constraint: CHECK (tracking_focus IN ('views', 'saves', 'shares', 'comments', 'clicks', 'DMs', 'redemptions', 'attendance'))
-- No changes needed

-- ============================================================================

-- 4) Strategy Type Enum - ALREADY EXISTS ✓
-- Confirmed in migration: 20251017030524_31b0cbd5-e50b-4aef-8552-a2aa157b1b1a.sql
-- Current constraint: CHECK (strategy_type IN ('educational', 'promotional', 'engagement', 'testimonial', 'behind-the-scenes'))
-- No changes needed

-- ============================================================================

-- 5) Post Status Type - Consider Converting to Enum (FUTURE)
-- Currently: TEXT column with CHECK constraint
-- Current constraint: CHECK (status IN ('draft', 'approved'))
--
-- Future enhancement: Convert to enum for type safety and support multi-stage workflow
-- Proposed stages: draft → planning → approved (or draft → approved → published)

-- Option A: Create enum and migrate (breaking change)
-- CREATE TYPE post_status_enum AS ENUM ('draft', 'planning', 'approved', 'published');
-- ALTER TABLE posts
--   ALTER COLUMN status TYPE post_status_enum USING status::post_status_enum;

-- Option B: Add new stages to existing CHECK constraint (non-breaking)
-- ALTER TABLE posts
--   DROP CONSTRAINT IF EXISTS posts_status_check,
--   ADD CONSTRAINT posts_status_check CHECK (
--     status IN ('draft', 'planning', 'approved', 'published')
--   );

-- Decision: Deferred until multi-stage workflow requirements are finalized

-- ============================================================================

-- 6) Post Type Enum - Consider Converting to Enum (FUTURE)
-- Currently: TEXT column with CHECK constraint
-- Current constraint: CHECK (post_type IN ('image', 'carousel', 'reel', 'story'))
--
-- Benefits of enum: Type safety, autocomplete in database tools
-- Drawbacks: Harder to add new types (requires enum migration)

-- CREATE TYPE post_type_enum AS ENUM ('image', 'carousel', 'reel', 'story');
-- ALTER TABLE posts
--   ALTER COLUMN post_type TYPE post_type_enum USING post_type::post_type_enum;

-- Decision: Keep as TEXT for flexibility (easy to add new types)

-- ============================================================================

-- 7) Platform Validation - Consider Enum (FUTURE)
-- Currently: TEXT[] array with no constraint
-- Used values: 'instagram', 'tiktok', 'facebook', 'google_business'
--
-- Option: Add CHECK constraint for valid platforms

-- CREATE TYPE platform_enum AS ENUM ('instagram', 'tiktok', 'facebook', 'google_business');
-- ALTER TABLE posts
--   DROP COLUMN platforms,
--   ADD COLUMN platforms platform_enum[] CHECK (
--     array_length(platforms, 1) BETWEEN 1 AND 3
--   );

-- Decision: Keep as TEXT[] for flexibility

-- ============================================================================

-- 8) Content Lock Status Tracking (OPTIONAL ENHANCEMENT)
-- Currently: Content lock logic is derived from post.status in UI
-- Alternative: Add explicit boolean flag for clarity

-- ALTER TABLE posts
--   ADD COLUMN content_locked BOOLEAN DEFAULT TRUE;

-- Trigger to auto-update based on status:
-- CREATE OR REPLACE FUNCTION update_content_locked_trigger()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.content_locked := (NEW.status = 'draft');
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER posts_content_locked_trigger
--   BEFORE INSERT OR UPDATE ON posts
--   FOR EACH ROW
--   EXECUTE FUNCTION update_content_locked_trigger();

-- Decision: Not needed - deriving from status in UI is simpler

-- ============================================================================

-- 9) Audit Columns - Consider Adding (FUTURE)
-- Track who last edited the post and when

-- ALTER TABLE posts
--   ADD COLUMN last_edited_by UUID REFERENCES auth.users(id),
--   ADD COLUMN last_edited_at TIMESTAMP WITH TIME ZONE;

-- Trigger to auto-update:
-- CREATE OR REPLACE FUNCTION update_last_edited_trigger()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.last_edited_at := NOW();
--   NEW.last_edited_by := auth.uid();
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER posts_last_edited_trigger
--   BEFORE UPDATE ON posts
--   FOR EACH ROW
--   EXECUTE FUNCTION update_last_edited_trigger();

-- Decision: Deferred until team collaboration features are needed

-- ============================================================================

-- SUMMARY OF REQUIRED CHANGES FOR POSTCARD UI:
--
-- 1. Add reel_duration_seconds column (INT, CHECK >= 1)
-- 2. Add reel_script column (TEXT, CHECK <= 2500 chars)
-- 3. Add index on reel_duration_seconds for reel posts
--
-- All other validation (enums, constraints) already exists in schema.
--
-- ============================================================================
