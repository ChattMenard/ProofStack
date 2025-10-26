-- Add username/handle slug support to profiles
-- Safe to run multiple times: checks for column existence before altering

DO $$
BEGIN
  -- Add column if it does not exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'username'
  ) THEN
    ALTER TABLE profiles ADD COLUMN username TEXT;
  END IF;

  -- Create unique index if it does not exist (NULLs allowed; non-null must be unique)
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'profiles' AND indexname = 'idx_profiles_username_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_profiles_username_unique ON profiles ((lower(username))) WHERE username IS NOT NULL;
  END IF;
END $$;

-- Optional safe backfill: set username to the local-part of email only where unique
-- This avoids conflicts when multiple users share the same local-part across domains
WITH local_parts AS (
  SELECT id, split_part(email, '@', 1) AS uname
  FROM profiles
), unique_locals AS (
  SELECT uname
  FROM local_parts
  GROUP BY uname
  HAVING COUNT(*) = 1
)
UPDATE profiles p
SET username = lp.uname
FROM local_parts lp
JOIN unique_locals ul ON ul.uname = lp.uname
WHERE p.id = lp.id AND p.username IS NULL;

-- RLS policies: allow read access to username like existing profile read policy
-- (Assumes existing "profiles" read policies already allow public read of selected columns.)
-- If you restrict columns, consider adding username to permitted columns.
