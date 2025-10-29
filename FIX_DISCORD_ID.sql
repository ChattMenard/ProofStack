-- Fix Discord user ID assignment
-- It should be on outlook.com (the Discord account), not gmail

-- First, clear the gmail account's discord_user_id
UPDATE profiles 
SET discord_user_id = NULL
WHERE email = 'mattchenard2009@gmail.com';

-- Then, set it correctly on the outlook account
UPDATE profiles 
SET discord_user_id = '1432439681835860003'
WHERE email = 'mattchenard@outlook.com' 
AND id = '2695146a-f517-4f18-88d9-8194a2ff5e6b';

-- Verify the fix
SELECT id, email, discord_user_id, is_admin, role
FROM profiles
WHERE email IN ('mattchenard@outlook.com', 'mattchenard2009@gmail.com')
ORDER BY email;
