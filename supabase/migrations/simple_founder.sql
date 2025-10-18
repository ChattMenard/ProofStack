-- SIMPLE Founder Tier Setup
-- Just adds columns to users table, no complex triggers

-- Add plan column (free, pro, founder)
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free';

-- Add founder_number (1-100 for first users)
ALTER TABLE users ADD COLUMN IF NOT EXISTS founder_number integer;

-- Add is_founder flag
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_founder boolean DEFAULT false;

-- Create index
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);

-- That's it! Now you can manually set founders like:
-- UPDATE users SET plan='founder', is_founder=true, founder_number=1 WHERE email='first@user.com';

SELECT 'Founder columns added!' as status;
