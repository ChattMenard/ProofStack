-- Run this in Supabase SQL Editor to give yourself admin access
-- Replace 'your@email.com' with your actual email address

UPDATE profiles 
SET is_founder = true
WHERE email = 'mattchenard2009@gmail.com';

-- Verify it worked
SELECT id, email, full_name, is_founder, user_type 
FROM profiles 
WHERE email = 'mattchenard2009@gmail.com';
