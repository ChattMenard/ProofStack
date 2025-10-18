-- One-click fix: Create profiles for ALL existing auth users
-- This will backfill any users that were created before the trigger was added

INSERT INTO public.profiles (auth_uid, email, full_name, created_at, updated_at)
SELECT
  id::text,
  email,
  COALESCE(
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'name',
    raw_user_meta_data->>'user_name',
    split_part(email, '@', 1)
  ) as full_name,
  created_at,
  NOW()
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE profiles.auth_uid = users.id::text
)
ON CONFLICT (auth_uid) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
  updated_at = NOW();

-- Show what we created
SELECT 
  'Created ' || COUNT(*) || ' profiles' as result
FROM profiles;

-- List all profiles
SELECT 
  email,
  full_name,
  created_at
FROM profiles
ORDER BY created_at DESC;
