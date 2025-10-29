-- Add is_admin column to profiles table for secure admin checks
-- Fixes Google Play security requirement: no hardcoded emails in client code

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Set admin flag for authorized user (replace with actual email)
UPDATE profiles SET is_admin = true WHERE email = 'mattchenard2009@gmail.com';

-- Add comment for documentation
COMMENT ON COLUMN profiles.is_admin IS 'Admin access flag - checked server-side only, never exposed to client';