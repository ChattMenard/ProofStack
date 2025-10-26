-- Check the mattchenard@outlook.com account status
SELECT 
  p.id,
  p.auth_uid,
  p.email,
  p.role,
  p.user_type,
  p.is_admin,
  u.email as auth_email,
  u.email_confirmed_at
FROM public.profiles p
LEFT JOIN auth.users u ON u.id::text = p.auth_uid
WHERE p.email = 'mattchenard@outlook.com';

-- If you want this to be an employer account, run:
UPDATE public.profiles
SET 
  role = 'employer',
  user_type = 'employer'
WHERE email = 'mattchenard@outlook.com';

-- Verify the update:
SELECT email, role, user_type FROM public.profiles WHERE email = 'mattchenard@outlook.com';
