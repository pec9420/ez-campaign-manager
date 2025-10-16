-- Create dev user: admin@example.com / Welcome@!
-- This script creates a development user with the growth plan

-- First, we need to sign up through the app or use Supabase dashboard
-- Then run this to upgrade to growth plan:

-- Update user to growth plan (run this after signing up)
-- Replace 'YOUR_USER_ID' with the actual auth user ID after signup

UPDATE public.users
SET
  subscription_tier = 'growth',
  subscription_status = 'active',
  stripe_customer_id = 'dev_customer',
  stripe_subscription_id = 'dev_subscription',
  billing_period_start = CURRENT_DATE,
  billing_period_end = CURRENT_DATE + INTERVAL '30 days'
WHERE email = 'admin@example.com';
