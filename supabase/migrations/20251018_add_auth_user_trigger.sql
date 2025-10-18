-- Create a trigger function to automatically create a users table record
-- when a new user signs up via Supabase Auth

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, subscription_tier, subscription_status)
  VALUES (
    NEW.id,
    NEW.email,
    'starter',
    'active'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill: Create users table records for any existing auth.users
-- that don't have a corresponding users table record
INSERT INTO public.users (id, email, subscription_tier, subscription_status)
SELECT
  au.id,
  au.email,
  'starter' as subscription_tier,
  'active' as subscription_status
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL;
