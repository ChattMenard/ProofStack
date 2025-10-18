-- Add "Founder" tier for first 100 users (free forever)
-- Migration: 2025-10-18-add-founder-tier

-- Add plan column to users table (if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='plan') THEN
    ALTER TABLE users ADD COLUMN plan text DEFAULT 'free';
  END IF;
END $$;

-- Add founder_number column to track first 100 users
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='founder_number') THEN
    ALTER TABLE users ADD COLUMN founder_number integer UNIQUE;
  END IF;
END $$;

-- Add is_founder computed helper
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='is_founder') THEN
    ALTER TABLE users ADD COLUMN is_founder boolean DEFAULT false;
  END IF;
END $$;

-- Create index on plan for faster queries
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);
CREATE INDEX IF NOT EXISTS idx_users_founder_number ON users(founder_number) WHERE founder_number IS NOT NULL;

-- Add usage_limits column (JSON for flexible quotas)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='usage_limits') THEN
    ALTER TABLE users ADD COLUMN usage_limits jsonb DEFAULT '{
      "uploads_per_month": 10,
      "analysis_per_month": 20,
      "storage_gb": 1
    }'::jsonb;
  END IF;
END $$;

-- Function to auto-assign founder status to first 100 signups
CREATE OR REPLACE FUNCTION assign_founder_status()
RETURNS TRIGGER AS $$
DECLARE
  current_founder_count integer;
BEGIN
  -- Count existing founders
  SELECT COUNT(*) INTO current_founder_count
  FROM users
  WHERE founder_number IS NOT NULL;
  
  -- If under 100, assign founder status
  IF current_founder_count < 100 THEN
    NEW.founder_number := current_founder_count + 1;
    NEW.is_founder := true;
    NEW.plan := 'founder';
    NEW.usage_limits := '{
      "uploads_per_month": 999999,
      "analysis_per_month": 999999,
      "storage_gb": 999999
    }'::jsonb;
    
    RAISE NOTICE 'Assigned Founder #% status to user %', NEW.founder_number, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-assign on user creation
DROP TRIGGER IF EXISTS trigger_assign_founder_status ON users;
CREATE TRIGGER trigger_assign_founder_status
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION assign_founder_status();

-- Create founder_users view for easy querying
CREATE OR REPLACE VIEW founder_users AS
SELECT 
  id,
  email,
  founder_number,
  created_at,
  plan,
  usage_limits
FROM users
WHERE is_founder = true
ORDER BY founder_number ASC;

-- Add comment explaining the system
COMMENT ON COLUMN users.founder_number IS 'First 100 users get free forever access (Founder tier #1-100)';
COMMENT ON COLUMN users.is_founder IS 'True for first 100 signups - lifetime free access';
COMMENT ON VIEW founder_users IS 'List of all Founder tier users (first 100 signups)';
