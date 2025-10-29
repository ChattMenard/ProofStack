-- Cleanup duplicate mattchenard@outlook.com accounts
-- Keep the most recent one, delete the rest

-- Step 1: Identify which one to keep (most recent created_at)
SELECT id, email, created_at, auth_uid, is_admin
FROM profiles
WHERE email = 'mattchenard@outlook.com'
ORDER BY created_at DESC;

-- Step 2: Keep the most recent (2695146a-f517-4f18-88d9-8194a2ff5e6b based on your list)
-- Delete the duplicates
DELETE FROM profiles 
WHERE email = 'mattchenard@outlook.com' 
AND id NOT IN ('2695146a-f517-4f18-88d9-8194a2ff5e6b');

-- Step 3: Verify cleanup
SELECT id, email, created_at, is_admin, role, user_type
FROM profiles
WHERE email IN ('mattchenard@outlook.com', 'mattchenard2009@gmail.com')
ORDER BY email, created_at DESC;

-- Step 4: Add discord_user_id column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS discord_user_id TEXT;

-- Step 5: Link Discord ID to the outlook account (the actual Discord account)
UPDATE profiles 
SET discord_user_id = '1432439681835860003'
WHERE email = 'mattchenard@outlook.com';

-- Step 6: Verify Discord link
SELECT id, email, discord_user_id, is_admin, role
FROM profiles
WHERE email IN ('mattchenard@outlook.com', 'mattchenard2009@gmail.com');
