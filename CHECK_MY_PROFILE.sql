-- Check your current profile status
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/lytjmxjizalmgbgrgfvc/editor

-- Check auth.users table
SELECT id, email, created_at, email_confirmed_at
FROM auth.users 
WHERE email = 'mattchenard2009@gmail.com';

-- Check profiles table
SELECT user_id, email, full_name, user_type, role, is_founder, is_admin, created_at
FROM public.profiles 
WHERE email = 'mattchenard2009@gmail.com';

-- If you see your profile above but is_founder is false or null, run this:
/*
UPDATE public.profiles 
SET is_founder = true, 
    is_admin = true,
    role = 'admin'
WHERE email = 'mattchenard2009@gmail.com';
*/

-- Then verify:
/*
SELECT user_id, email, is_founder, is_admin, role
FROM public.profiles 
WHERE email = 'mattchenard2009@gmail.com';
*/
