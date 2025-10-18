-- Fix waitlist table (already exists, just ensure it's correct)
-- Run this if you got the "policy already exists" error

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can join waitlist" ON waitlist;
DROP POLICY IF EXISTS "Service role can read waitlist" ON waitlist;

-- Recreate them cleanly
CREATE POLICY "Anyone can join waitlist" ON waitlist FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can read waitlist" ON waitlist FOR SELECT USING (auth.role() = 'service_role');

-- Verify table exists
SELECT 'Waitlist table is ready!' as status;
