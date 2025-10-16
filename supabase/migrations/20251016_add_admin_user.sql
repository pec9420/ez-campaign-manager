-- Add Admin User
-- This creates an admin user for testing and administrative purposes

INSERT INTO users (
  id,
  email,
  subscription_tier,
  subscription_status,
  posts_created_this_period,
  ai_regenerations_used_this_period,
  billing_period_start,
  billing_period_end
)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'admin@ez-campaign-manager.com',
  'growth',  -- Give admin the highest tier
  'active',
  0,
  0,
  NOW(),
  NOW() + INTERVAL '30 days'
)
ON CONFLICT (id) DO NOTHING;

-- Add admin brand hub (optional - for testing)
INSERT INTO brand_hub (
  user_id,
  business_name,
  what_you_sell,
  what_makes_unique,
  target_customer,
  brand_vibe_words
)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Admin Test Business',
  'Testing social media content planning tools and features',
  'Full-featured admin account for testing all functionality',
  'Internal team members and QA testers',
  ARRAY['Professional', 'Efficient', 'Reliable']
)
ON CONFLICT (user_id) DO NOTHING;
