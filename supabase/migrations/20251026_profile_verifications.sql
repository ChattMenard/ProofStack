-- Profile Verifications - Trust Signals
-- Tracks verified accounts and credentials for professionals
-- Increases trust and credibility on the platform

CREATE TABLE IF NOT EXISTS profile_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Email verification
  email_verified boolean DEFAULT false,
  email_verified_at timestamp with time zone,
  
  -- GitHub verification
  github_verified boolean DEFAULT false,
  github_verified_at timestamp with time zone,
  github_username text,
  github_profile_url text,
  github_last_commit_date timestamp with time zone,
  github_total_commits integer DEFAULT 0,
  
  -- LinkedIn verification
  linkedin_verified boolean DEFAULT false,
  linkedin_verified_at timestamp with time zone,
  linkedin_profile_url text,
  
  -- Portfolio/Website verification
  portfolio_verified boolean DEFAULT false,
  portfolio_verified_at timestamp with time zone,
  portfolio_url text,
  portfolio_verification_code text, -- Code professional adds to their site
  
  -- Work sample verification
  work_samples_verified boolean DEFAULT false,
  work_samples_verified_at timestamp with time zone,
  verified_samples_count integer DEFAULT 0,
  
  -- Identity verification (future: government ID, etc.)
  identity_verified boolean DEFAULT false,
  identity_verified_at timestamp with time zone,
  identity_verification_method text, -- 'manual', 'stripe_identity', etc.
  
  -- Metadata
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_github_url CHECK (github_profile_url IS NULL OR github_profile_url ~* '^https?://'),
  CONSTRAINT valid_linkedin_url CHECK (linkedin_profile_url IS NULL OR linkedin_profile_url ~* '^https?://'),
  CONSTRAINT valid_portfolio_url CHECK (portfolio_url IS NULL OR portfolio_url ~* '^https?://')
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_profile_verifications_profile_id ON profile_verifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_verifications_github_verified ON profile_verifications(github_verified) WHERE github_verified = true;
CREATE INDEX IF NOT EXISTS idx_profile_verifications_linkedin_verified ON profile_verifications(linkedin_verified) WHERE linkedin_verified = true;

-- RLS Policies
ALTER TABLE profile_verifications ENABLE ROW LEVEL SECURITY;

-- Public can read verification status (for trust signals)
CREATE POLICY "Anyone can view verification status"
  ON profile_verifications
  FOR SELECT
  USING (true);

-- Users can only insert/update their own verifications
CREATE POLICY "Users can manage own verifications"
  ON profile_verifications
  FOR ALL
  USING (auth.uid()::text = (SELECT auth_uid FROM profiles WHERE id = profile_id))
  WITH CHECK (auth.uid()::text = (SELECT auth_uid FROM profiles WHERE id = profile_id));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_profile_verifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER profile_verifications_updated_at
  BEFORE UPDATE ON profile_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_verifications_updated_at();

-- Create verification record for existing professionals
INSERT INTO profile_verifications (profile_id, email_verified, email_verified_at)
SELECT 
  id,
  true, -- Assume existing users have verified emails
  created_at
FROM profiles
WHERE user_type = 'professional'
ON CONFLICT (profile_id) DO NOTHING;
