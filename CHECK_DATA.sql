-- Quick check to see if samples exist for your profile
-- Run this in Supabase SQL Editor

SELECT 
  p.email,
  p.full_name,
  p.is_founder,
  p.founder_number,
  COUNT(s.id) as total_samples,
  COUNT(a.id) as total_analyses
FROM profiles p
LEFT JOIN samples s ON s.owner_id = p.id
LEFT JOIN analyses a ON a.sample_id = s.id
WHERE p.email = 'mattchenard2009@gmail.com'
GROUP BY p.id, p.email, p.full_name, p.is_founder, p.founder_number;

-- If this shows 0 samples, run this to find your profile ID:
SELECT id, email, auth_uid, is_founder 
FROM profiles 
WHERE email = 'mattchenard2009@gmail.com';

-- Then check if any samples exist at all:
SELECT 
  s.id,
  s.type,
  s.title,
  s.owner_id,
  s.visibility,
  p.email as owner_email
FROM samples s
LEFT JOIN profiles p ON p.id = s.owner_id
ORDER BY s.created_at DESC
LIMIT 10;
