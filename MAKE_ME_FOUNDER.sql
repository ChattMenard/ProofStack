-- Make yourself Founder #1!
-- Find your profile by email and set founder status

UPDATE profiles 
SET 
  plan = 'founder',
  is_founder = true,
  founder_number = 1
WHERE email = 'YOUR_EMAIL_HERE';  -- Replace with your actual email

-- Verify it worked
SELECT email, plan, is_founder, founder_number FROM profiles WHERE is_founder = true;
