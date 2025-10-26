-- Fix employer account for mattchenard@outlook.com
-- Run this in Supabase SQL Editor

-- First, find the auth user ID
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'mattchenard@outlook.com';

-- If the user exists, update their password (you'll need to set a new one)
-- Replace 'new-password-here' with your desired password
-- This sets password without email confirmation
UPDATE auth.users
SET 
  encrypted_password = crypt('YourNewPassword123!', gen_salt('bf')),
  email_confirmed_at = NOW(),
  confirmation_token = NULL,
  recovery_token = NULL
WHERE email = 'mattchenard@outlook.com';

-- Check if profile exists and fix it
SELECT * FROM profiles WHERE email = 'mattchenard@outlook.com';

-- If profile doesn't exist or has wrong user_type, fix it:
-- First get the auth_uid from the user
DO $$
DECLARE
  user_auth_id uuid;
BEGIN
  -- Get the auth user ID
  SELECT id INTO user_auth_id
  FROM auth.users
  WHERE email = 'mattchenard@outlook.com';
  
  -- Update or create profile
  INSERT INTO profiles (auth_uid, email, user_type, role, created_at, updated_at)
  VALUES (
    user_auth_id,
    'mattchenard@outlook.com',
    'employer',
    'employer',
    NOW(),
    NOW()
  )
  ON CONFLICT (auth_uid) 
  DO UPDATE SET
    user_type = 'employer',
    role = 'employer',
    email = 'mattchenard@outlook.com',
    updated_at = NOW();
    
  RAISE NOTICE 'Profile updated for user: %', user_auth_id;
END $$;

-- Verify the fix
SELECT 
  u.id as auth_id,
  u.email,
  u.email_confirmed_at,
  p.id as profile_id,
  p.user_type,
  p.role
FROM auth.users u
LEFT JOIN profiles p ON p.auth_uid = u.id
WHERE u.email = 'mattchenard@outlook.com';
