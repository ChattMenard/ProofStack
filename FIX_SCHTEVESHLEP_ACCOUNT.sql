-- Fix schteveshlep@protonmail.com account to be an employer
-- Run this in Supabase SQL Editor

-- First, let's check the current state
SELECT 
  id,
  auth_uid,
  email,
  user_type,
  organization_id,
  created_at
FROM profiles
WHERE email = 'schteveshlep@protonmail.com';

-- Update user_type to employer
UPDATE profiles
SET user_type = 'employer'
WHERE email = 'schteveshlep@protonmail.com';

-- Verify the update
SELECT 
  id,
  auth_uid,
  email,
  user_type,
  organization_id,
  created_at
FROM profiles
WHERE email = 'schteveshlep@protonmail.com';

-- Also check if there's an organization
SELECT 
  o.id,
  o.name,
  o.created_at,
  om.user_id,
  om.role
FROM organizations o
LEFT JOIN organization_members om ON o.id = om.organization_id
LEFT JOIN profiles p ON om.user_id = p.id
WHERE p.email = 'schteveshlep@protonmail.com';
