-- Remove Founder Program Database Cleanup
-- Removes all founder-related columns, tables, and functions

BEGIN;

-- Drop founder-related columns from profiles table
ALTER TABLE profiles 
  DROP COLUMN IF EXISTS is_founder CASCADE,
  DROP COLUMN IF EXISTS founder_number CASCADE;

-- Drop founder-related columns from organizations table
ALTER TABLE organizations
  DROP COLUMN IF EXISTS is_founding_employer CASCADE,
  DROP COLUMN IF EXISTS founding_employer_number CASCADE;

-- Drop employer_hire_attempts table (part of founder program)
DROP TABLE IF EXISTS employer_hire_attempts CASCADE;

-- Drop related functions
DROP FUNCTION IF EXISTS assign_founding_employer() CASCADE;
DROP FUNCTION IF EXISTS grant_founding_employer_status() CASCADE;
DROP FUNCTION IF EXISTS check_hire_attempts(uuid) CASCADE;

-- Drop any triggers related to founding employers
DROP TRIGGER IF EXISTS trg_assign_founding_employer ON organizations;
DROP TRIGGER IF EXISTS trg_track_hire_attempts ON conversations;

COMMIT;
