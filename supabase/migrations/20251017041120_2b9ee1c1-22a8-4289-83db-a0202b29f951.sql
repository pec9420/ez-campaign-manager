-- Remove the hook_required_for_reels constraint
-- Hooks will be generated later by a separate agent, so they should be nullable

ALTER TABLE public.posts
DROP CONSTRAINT IF EXISTS hook_required_for_reels;