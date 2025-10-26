-- DIRECT FIX for mattchenard2009@gmail.com duplicate profiles
-- Run this in Supabase SQL Editor: https://lytjmxjizalmgbgrgfvc.supabase.co

-- ==================================================
-- STEP 1: Check which auth_uid is the REAL one
-- ==================================================
SELECT 
  id as real_auth_uid,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'mattchenard2009@gmail.com';

-- The 'id' returned above is your REAL auth_uid
-- Compare it with: 89cedd82-5a65-4b61-a3c8-05c707ac440c and ef9f931f-e0e6-4ec9-8d42-7cde8e2960d4
-- Whichever one MATCHES is the REAL profile to keep

-- ==================================================
-- STEP 2: Delete the FAKE profile
-- ==================================================
-- If 89cedd82-5a65-4b61-a3c8-05c707ac440c is the REAL one, run this:
DELETE FROM public.profiles 
WHERE auth_uid = 'ef9f931f-e0e6-4ec9-8d42-7cde8e2960d4'
  AND email = 'mattchenard2009@gmail.com';

-- If ef9f931f-e0e6-4ec9-8d42-7cde8e2960d4 is the REAL one, run this instead:
-- DELETE FROM public.profiles 
-- WHERE auth_uid = '89cedd82-5a65-4b61-a3c8-05c707ac440c'
--   AND email = 'mattchenard2009@gmail.com';

-- ==================================================
-- STEP 3: Make sure the REAL profile has admin rights
-- ==================================================
-- Replace with the REAL auth_uid from STEP 1:
UPDATE public.profiles
SET 
  is_admin = true,
  is_founder = true,
  role = 'admin',
  user_type = 'professional'
WHERE email = 'mattchenard2009@gmail.com';

-- ==================================================
-- STEP 4: Verify - should see only ONE row now
-- ==================================================
SELECT 
  p.id,
  p.auth_uid,
  p.email,
  p.is_admin,
  p.is_founder,
  p.role,
  u.email as auth_email
FROM public.profiles p
LEFT JOIN auth.users u ON u.id::text = p.auth_uid
WHERE p.email = 'mattchenard2009@gmail.com';

-- Expected: ONE row with auth_email NOT NULL
