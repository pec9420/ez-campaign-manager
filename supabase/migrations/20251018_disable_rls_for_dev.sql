-- Disable RLS for development
-- This migration removes authentication requirements to allow direct user selection

-- Drop existing RLS policies
DROP POLICY IF EXISTS users_policy ON users;
DROP POLICY IF EXISTS brand_hub_policy ON brand_hub;
DROP POLICY IF EXISTS content_plans_policy ON content_plans;
DROP POLICY IF EXISTS posts_policy ON posts;
DROP POLICY IF EXISTS feedback_policy ON feedback;

-- Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE brand_hub DISABLE ROW LEVEL SECURITY;
ALTER TABLE content_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;

-- Note: This is for development only. In production, you would want RLS enabled
-- with proper policies to ensure data security.
