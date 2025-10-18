-- Disable Row Level Security on all tables
-- WARNING: This makes all data accessible to any authenticated user

DROP POLICY IF EXISTS users_policy ON users;
DROP POLICY IF EXISTS brand_hub_policy ON brand_hub;
DROP POLICY IF EXISTS content_plans_policy ON content_plans;
DROP POLICY IF EXISTS posts_policy ON posts;
DROP POLICY IF EXISTS feedback_policy ON feedback;

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE brand_hub DISABLE ROW LEVEL SECURITY;
ALTER TABLE content_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;