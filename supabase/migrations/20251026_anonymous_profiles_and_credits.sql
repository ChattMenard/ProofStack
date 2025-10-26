-- Anonymous Profiles (Ghost Mode) and Credits System
-- Allows professionals to hide identity until employers unlock with credits

-- Add anonymous_mode to professional_preferences
ALTER TABLE professional_preferences 
ADD COLUMN IF NOT EXISTS anonymous_mode boolean DEFAULT false;

-- Create employer_credits table
CREATE TABLE IF NOT EXISTS employer_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  credits integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employer_id)
);

-- Index for credits lookups
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_employer_credits_employer') THEN
    CREATE INDEX idx_employer_credits_employer ON employer_credits(employer_id);
  END IF;
END $$;

-- Create profile_unlocks table (tracks which employers unlocked which professionals)
CREATE TABLE IF NOT EXISTS profile_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  professional_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  credits_spent integer DEFAULT 1 NOT NULL,
  UNIQUE(employer_id, professional_id)
);

-- Indexes for unlock lookups
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profile_unlocks_employer') THEN
    CREATE INDEX idx_profile_unlocks_employer ON profile_unlocks(employer_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profile_unlocks_professional') THEN
    CREATE INDEX idx_profile_unlocks_professional ON profile_unlocks(professional_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profile_unlocks_employer_professional') THEN
    CREATE INDEX idx_profile_unlocks_employer_professional ON profile_unlocks(employer_id, professional_id);
  END IF;
END $$;

-- Create credit_transactions table (audit log for credit purchases and uses)
CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  transaction_type text NOT NULL, -- 'purchase', 'unlock', 'refund', 'admin_adjustment'
  amount integer NOT NULL, -- Positive for additions, negative for deductions
  balance_after integer NOT NULL,
  description text,
  reference_id uuid, -- Links to profile_unlocks.id for unlock transactions
  created_at timestamptz DEFAULT now()
);

-- Index for transaction history
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_credit_transactions_employer') THEN
    CREATE INDEX idx_credit_transactions_employer ON credit_transactions(employer_id, created_at DESC);
  END IF;
END $$;

-- RLS Policies for employer_credits
ALTER TABLE employer_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employers can view own credits" ON employer_credits;
DROP POLICY IF EXISTS "Employers can update own credits" ON employer_credits;
DROP POLICY IF EXISTS "Employers can insert own credits" ON employer_credits;

CREATE POLICY "Employers can view own credits"
ON employer_credits
FOR SELECT
USING (employer_id IN (SELECT id FROM profiles WHERE auth_uid = auth.uid()::text));

CREATE POLICY "Employers can update own credits"
ON employer_credits
FOR UPDATE
USING (employer_id IN (SELECT id FROM profiles WHERE auth_uid = auth.uid()::text))
WITH CHECK (employer_id IN (SELECT id FROM profiles WHERE auth_uid = auth.uid()::text));

CREATE POLICY "Employers can insert own credits"
ON employer_credits
FOR INSERT
WITH CHECK (employer_id IN (SELECT id FROM profiles WHERE auth_uid = auth.uid()::text));

-- RLS Policies for profile_unlocks
ALTER TABLE profile_unlocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employers can view own unlocks" ON profile_unlocks;
DROP POLICY IF EXISTS "Employers can insert own unlocks" ON profile_unlocks;
DROP POLICY IF EXISTS "Professionals can view who unlocked them" ON profile_unlocks;

CREATE POLICY "Employers can view own unlocks"
ON profile_unlocks
FOR SELECT
USING (employer_id IN (SELECT id FROM profiles WHERE auth_uid = auth.uid()::text));

CREATE POLICY "Employers can insert own unlocks"
ON profile_unlocks
FOR INSERT
WITH CHECK (employer_id IN (SELECT id FROM profiles WHERE auth_uid = auth.uid()::text));

CREATE POLICY "Professionals can view who unlocked them"
ON profile_unlocks
FOR SELECT
USING (professional_id IN (SELECT id FROM profiles WHERE auth_uid = auth.uid()::text));

-- RLS Policies for credit_transactions
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employers can view own transactions" ON credit_transactions;

CREATE POLICY "Employers can view own transactions"
ON credit_transactions
FOR SELECT
USING (employer_id IN (SELECT id FROM profiles WHERE auth_uid = auth.uid()::text));

-- Function to auto-update employer_credits updated_at
CREATE OR REPLACE FUNCTION update_employer_credits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS employer_credits_updated_at ON employer_credits;

CREATE TRIGGER employer_credits_updated_at
BEFORE UPDATE ON employer_credits
FOR EACH ROW
EXECUTE FUNCTION update_employer_credits_updated_at();

-- Helper function to check if an employer has unlocked a professional
CREATE OR REPLACE FUNCTION has_unlocked_profile(emp_id uuid, prof_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profile_unlocks 
    WHERE employer_id = emp_id AND professional_id = prof_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
