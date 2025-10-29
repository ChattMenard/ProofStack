-- Check if Discord is linked to your ProofStack account
-- Run this in Supabase SQL Editor

SELECT 
  p.id,
  p.username,
  p.email,
  p.auth_uid,
  p.user_type,
  p.skill_level,
  au.provider,
  au.provider_id as discord_user_id
FROM profiles p
LEFT JOIN auth.users au ON au.id::text = p.auth_uid
WHERE p.email = 'YOUR_EMAIL_HERE';  -- Replace with your ProofStack email

-- If you see a row with provider='discord' and a discord_user_id, you're linked!
-- If not, you need to sign in with Discord OAuth first
