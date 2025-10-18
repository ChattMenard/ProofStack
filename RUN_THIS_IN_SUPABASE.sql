-- ProofStack Database Setup
-- Copy this ENTIRE file and paste it into Supabase SQL Editor
-- URL: https://lytjmxjizalmgbgrgfvc.supabase.co/project/default/sql
-- Click the green "RUN" button

-- 1. Fix waitlist policies
DROP POLICY IF EXISTS "Anyone can join waitlist" ON waitlist;
DROP POLICY IF EXISTS "Service role can read waitlist" ON waitlist;
CREATE POLICY "Anyone can join waitlist" ON waitlist FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can read waitlist" ON waitlist FOR SELECT USING (auth.role() = 'service_role');

-- 2. Add founder tier columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS founder_number integer;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_founder boolean DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);

-- 3. Create usage tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  month text NOT NULL,
  uploads_count integer DEFAULT 0,
  analysis_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month)
);
CREATE INDEX IF NOT EXISTS idx_usage_user_month ON usage_tracking(user_id, month);

-- Done! You should see "Success. No rows returned"
