-- Add is_admin field to profiles table
-- Run this once in Supabase SQL Editor

-- Add column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Set your account as admin (replace with your email)
UPDATE profiles 
SET is_admin = true 
WHERE email = 'mattchenard2009@gmail.com';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;

-- Add RLS policy for admin access
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT
  TO authenticated
  USING (
    is_admin = true AND auth.uid() = id
  );

COMMENT ON COLUMN profiles.is_admin IS 'Whether user has admin privileges';
