-- Add admin privileges to mattchenard@outlook.com
-- Run this in Supabase SQL Editor

UPDATE profiles 
SET 
  is_admin = true,
  role = 'admin'
WHERE email = 'mattchenard@outlook.com';

-- Verify the change
SELECT id, email, is_admin, role, user_type
FROM profiles
WHERE email IN ('mattchenard@outlook.com', 'mattchenard2009@gmail.com');
