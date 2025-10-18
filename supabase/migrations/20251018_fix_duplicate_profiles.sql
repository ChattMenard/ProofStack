-- Find and remove duplicate profiles
-- Keeps the most recent profile for each email

-- First, let's see the duplicates
SELECT email, COUNT(*) as count
FROM profiles
GROUP BY email
HAVING COUNT(*) > 1;

-- Show all details of duplicates
SELECT id, auth_uid, email, full_name, created_at
FROM profiles
WHERE email IN (
  SELECT email
  FROM profiles
  GROUP BY email
  HAVING COUNT(*) > 1
)
ORDER BY email, created_at DESC;

-- Delete older duplicates (keeping the most recent one for each email)
WITH ranked_profiles AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
  FROM profiles
  WHERE email IS NOT NULL
)
DELETE FROM profiles
WHERE id IN (
  SELECT id FROM ranked_profiles WHERE rn > 1
);

-- Verify no more duplicates
SELECT email, COUNT(*) as count
FROM profiles
GROUP BY email
HAVING COUNT(*) > 1;

-- Show all remaining profiles
SELECT email, full_name, created_at
FROM profiles
ORDER BY created_at DESC;
