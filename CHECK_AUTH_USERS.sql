-- Run this in Supabase SQL Editor to check your auth status
-- This helps debug login issues

-- 1. Check if you exist in auth.users (authentication table)
SELECT id, email, created_at, email_confirmed_at, last_sign_in_at
FROM auth.users
WHERE email = 'mattchenard2009@gmail.com';

-- 2. Check if your profile exists (application table)
SELECT id, email, full_name, is_founder, user_type, role, created_at
FROM profiles 
WHERE email = 'mattchenard2009@gmail.com';

-- 3. If you exist in auth.users but NOT in profiles, create profile:
-- (This can happen if signup didn't complete properly)
INSERT INTO profiles (id, email, full_name, user_type, is_founder, role)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email),
  'professional',
  true,
  'admin'
FROM auth.users
WHERE email = 'mattchenard2009@gmail.com'
AND id NOT IN (SELECT id FROM profiles);

-- 4. If you DON'T exist in auth.users at all:
-- Go to: https://proofstack-two.vercel.app/signup
-- Sign up with: mattchenard2009@gmail.com
-- Then come back and run MAKE_ME_ADMIN.sql

-- 5. To reset your password (if you forgot it):
-- Go to Supabase Dashboard > Authentication > Users
-- Find your email and click "Send password recovery email"
-- OR use the "Forgot Password" feature on the login page (if implemented)
