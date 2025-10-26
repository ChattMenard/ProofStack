-- COMPLETE ADMIN ACCESS TROUBLESHOOTING
-- Run these queries one at a time in Supabase SQL Editor
-- https://supabase.com/dashboard/project/lytjmxjizalmgbgrgfvc/editor

-- ==================================================
-- STEP 1: Find your auth user
-- ==================================================
SELECT 
  id,
  email, 
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users 
WHERE email = 'mattchenard2009@gmail.com';

-- Copy the 'id' from above - you'll need it below


-- ==================================================
-- STEP 2: Check if you have a profile (using auth_uid)
-- ==================================================
SELECT 
  id,
  auth_uid,
  email,
  full_name,
  is_founder,
  is_admin,
  role,
  user_type,
  created_at
FROM public.profiles 
WHERE email = 'mattchenard2009@gmail.com'
   OR auth_uid::text IN (
     SELECT id::text FROM auth.users WHERE email = 'mattchenard2009@gmail.com'
   );


-- ==================================================
-- STEP 3a: If profile EXISTS - Make yourself admin
-- ==================================================
UPDATE public.profiles 
SET 
  is_founder = true,
  is_admin = true,
  role = 'admin',
  updated_at = now()
WHERE auth_uid::text IN (
  SELECT id::text FROM auth.users WHERE email = 'mattchenard2009@gmail.com'
);


-- ==================================================
-- STEP 3b: If NO profile exists - Create one first
-- ==================================================
INSERT INTO public.profiles (
  auth_uid,
  email,
  full_name,
  is_founder,
  is_admin,
  role,
  user_type,
  created_at,
  updated_at
)
SELECT 
  id::text,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email),
  true,
  true,
  'admin',
  'professional',
  now(),
  now()
FROM auth.users 
WHERE email = 'mattchenard2009@gmail.com'
ON CONFLICT (auth_uid) DO UPDATE SET
  is_founder = true,
  is_admin = true,
  role = 'admin',
  updated_at = now();


-- ==================================================
-- STEP 4: Verify it worked
-- ==================================================
SELECT 
  p.id,
  p.auth_uid,
  p.email,
  p.full_name,
  p.is_founder,
  p.is_admin,
  p.role,
  p.user_type,
  u.email as auth_email,
  u.last_sign_in_at
FROM public.profiles p
LEFT JOIN auth.users u ON u.id::text = p.auth_uid
WHERE p.email = 'mattchenard2009@gmail.com'
   OR u.email = 'mattchenard2009@gmail.com';

-- You should see is_founder=true, is_admin=true, role='admin'
-- If yes, refresh your ProofStack page and check the dropdown!
