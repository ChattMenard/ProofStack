-- Run this in Supabase SQL Editor to give yourself admin access
-- Replace 'your@email.com' with your actual email address

-- Step 1: Check if your profile exists
SELECT id, email, full_name, is_founder, user_type, role
FROM profiles 
WHERE email = 'mattchenard2009@gmail.com';

-- Step 2: Make yourself a founder/admin (run this if profile exists)
UPDATE profiles 
SET is_founder = true,
    role = 'admin'
WHERE email = 'mattchenard2009@gmail.com';

-- Step 3: Verify it worked
SELECT id, email, full_name, is_founder, user_type, role
FROM profiles 
WHERE email = 'mattchenard2009@gmail.com';

-- If no profile exists, you need to sign up first at:
-- https://proofstack-two.vercel.app/signup
-- OR
-- https://proofstack-two.vercel.app/employer/signup

-- After signing up, run steps 2 and 3 above
