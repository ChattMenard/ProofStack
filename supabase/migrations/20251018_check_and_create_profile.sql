-- Check if your profile exists and what data it has
SELECT 
  id,
  auth_uid,
  email,
  full_name,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- Check auth.users to see your account
SELECT 
  id,
  email,
  raw_user_meta_data,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- If no profile exists, create it manually for your account
-- (Replace with your actual auth user ID if needed)
INSERT INTO profiles (auth_uid, email, full_name, created_at, updated_at)
SELECT
  id::text,
  email,
  COALESCE(
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'name',
    split_part(email, '@', 1)
  ),
  created_at,
  NOW()
FROM auth.users
WHERE email = 'mattchenard2009@gmail.com'
ON CONFLICT (auth_uid) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
  updated_at = NOW();

-- Verify the profile was created
SELECT 
  id,
  auth_uid,
  email,
  full_name,
  created_at
FROM profiles
WHERE email = 'mattchenard2009@gmail.com';
