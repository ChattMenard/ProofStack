-- Check for duplicate profiles for mattchenard2009@gmail.com
-- Run this in Supabase SQL Editor: https://lytjmxjizalmgbgrgfvc.supabase.co

-- ==================================================
-- STEP 1: Find ALL profiles for mattchenard2009@gmail.com
-- ==================================================
SELECT 
  p.id as profile_id,
  p.auth_uid,
  p.email,
  p.full_name,
  p.is_founder,
  p.is_admin,
  p.role,
  p.user_type,
  p.created_at,
  u.id as actual_auth_id,
  u.email as auth_email,
  u.last_sign_in_at
FROM public.profiles p
LEFT JOIN auth.users u ON u.id::text = p.auth_uid
WHERE p.email = 'mattchenard2009@gmail.com'
ORDER BY p.created_at;

-- ==================================================
-- STEP 2: Find the REAL auth user ID
-- ==================================================
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at,
  email_confirmed_at
FROM auth.users
WHERE email = 'mattchenard2009@gmail.com';

-- ==================================================
-- STEP 3: After reviewing above results, DELETE the fake profile
-- Replace 'FAKE_AUTH_UID_HERE' with the wrong auth_uid from STEP 1
-- ==================================================
-- UNCOMMENT AND RUN THIS AFTER IDENTIFYING THE FAKE PROFILE:
/*
DELETE FROM public.profiles 
WHERE auth_uid = 'FAKE_AUTH_UID_HERE'
  AND email = 'mattchenard2009@gmail.com';
*/

-- ==================================================
-- STEP 4: Ensure the REAL profile has correct values
-- Replace 'REAL_AUTH_UID_HERE' with the correct auth_uid from STEP 2
-- ==================================================
-- UNCOMMENT AND RUN THIS AFTER DELETING THE FAKE PROFILE:
/*
UPDATE public.profiles
SET 
  is_admin = true,
  is_founder = true,
  role = 'admin',
  user_type = 'professional'
WHERE auth_uid = 'REAL_AUTH_UID_HERE'
  AND email = 'mattchenard2009@gmail.com';
*/

-- ==================================================
-- STEP 5: Verify only ONE correct profile remains
-- ==================================================
SELECT 
  p.id,
  p.auth_uid,
  p.email,
  p.is_admin,
  p.is_founder,
  p.role,
  p.user_type,
  u.email as auth_email
FROM public.profiles p
LEFT JOIN auth.users u ON u.id::text = p.auth_uid
WHERE p.email = 'mattchenard2009@gmail.com';

-- Expected result: ONE row with:
-- - auth_uid matches the id from auth.users
-- - is_admin: true
-- - is_founder: true
-- - role: admin
-- - auth_email: mattchenard2009@gmail.com (not null)
