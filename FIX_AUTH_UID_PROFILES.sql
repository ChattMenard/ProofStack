-- Fix profiles with missing or incorrect auth_uid
-- Run this in Supabase SQL Editor

-- Step 1: Find duplicate profiles (same email)
SELECT 
  p.email,
  COUNT(*) as profile_count,
  array_agg(p.id) as profile_ids,
  array_agg(p.auth_uid) as auth_uids
FROM profiles p
GROUP BY p.email
HAVING COUNT(*) > 1;

-- Step 2: Check which profiles have auth_uid issues
SELECT 
  p.id,
  p.email,
  p.auth_uid,
  p.user_type,
  p.organization_id,
  a.id::text as actual_auth_id
FROM profiles p
LEFT JOIN auth.users a ON a.email = p.email
WHERE p.auth_uid IS NULL OR p.auth_uid != a.id::text;

-- Step 3: For profiles with NULL auth_uid, update them one at a time
-- This query shows which ones need updating
SELECT 
  p.id,
  p.email,
  p.auth_uid,
  a.id::text as correct_auth_uid
FROM profiles p
JOIN auth.users a ON a.email = p.email
WHERE p.auth_uid IS NULL;

-- Step 4: Manual update (run for each profile that needs fixing)
-- Replace the WHERE clause with the actual profile ID from step 3
-- UPDATE profiles 
-- SET auth_uid = (SELECT id::text FROM auth.users WHERE email = profiles.email)
-- WHERE id = 'PUT_PROFILE_ID_HERE' AND auth_uid IS NULL;

-- Step 3: Verify the fix
SELECT 
  p.id,
  p.email,
  p.auth_uid,
  p.user_type,
  p.organization_id
FROM profiles p
ORDER BY p.created_at DESC
LIMIT 20;
