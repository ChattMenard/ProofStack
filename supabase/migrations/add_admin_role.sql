-- Add admin role support to profiles table
-- Run this BEFORE add_security_audit_logging.sql

-- Add role column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role varchar(20) DEFAULT 'user';

-- Add check constraint for valid roles (skip if exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('user', 'professional', 'employer', 'admin'));
  END IF;
END $$;

-- Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Function to make a user an admin (secure way)
CREATE OR REPLACE FUNCTION make_user_admin(p_user_email text)
RETURNS boolean AS $$
BEGIN
  UPDATE profiles
  SET role = 'admin'
  WHERE email = p_user_email;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make yourself an admin!
-- Replace with your actual email address
SELECT make_user_admin('mattchenard2009@gmail.com');

UPDATE profiles 
SET role = 'admin' 
WHERE email = 'mattchenard2009@gmail.com';

-- Verify
SELECT id, email, role FROM profiles WHERE role = 'admin';

-- Or if you want to do it directly (replace with your user ID):
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';

-- Comments
COMMENT ON COLUMN profiles.role IS 'User role: user, professional, employer, or admin. Admins have full access to security audit logs and admin functions.';
COMMENT ON FUNCTION make_user_admin IS 'Securely promote a user to admin by email address';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION make_user_admin(text) TO authenticated;
