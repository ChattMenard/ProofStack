-- FIX: Delete the dummy profile and keep only the real one
-- Run this in Supabase SQL Editor

-- ==================================================
-- STEP 1: Delete the dummy profile (the one with fake auth_uid)
-- ==================================================
DELETE FROM public.profiles 
WHERE auth_uid = 'your-supabase-auth-uid'
  AND email = 'mattchenard2009@gmail.com';


-- ==================================================
-- STEP 2: Verify only ONE profile remains (the real one)
-- ==================================================
SELECT 
  p.id,
  p.auth_uid,
  p.email,
  p.full_name,
  p.is_founder,
  p.is_admin,
  p.role,
  p.user_type,
  u.email as auth_email,
  u.last_sign_in_at
FROM public.profiles p
LEFT JOIN auth.users u ON u.id::text = p.auth_uid
WHERE p.email = 'mattchenard2009@gmail.com';

-- You should see ONLY ONE row now:
-- auth_uid: 89cedd82-5a65-4b61-a3c8-05c707ac440c
-- is_founder: true
-- is_admin: true
-- role: admin


-- ==================================================
-- STEP 3: Refresh your ProofStack page
-- ==================================================
-- After running the above, go back to ProofStack and refresh
-- Check the browser console (F12) for the debug logs
-- The admin dashboard link should now appear in your dropdown!
