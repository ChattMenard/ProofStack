-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE proofs ENABLE ROW LEVEL SECURITY;

-- PROFILES: Public read, owner can update
CREATE POLICY "Profiles are publicly readable"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid()::text = auth_uid);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid()::text = auth_uid);

-- SAMPLES: Public can read public samples, owners can do anything with their samples
CREATE POLICY "Public samples are readable by anyone"
  ON samples FOR SELECT
  USING (visibility = 'public');

CREATE POLICY "Users can read own samples"
  ON samples FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = samples.owner_id 
      AND profiles.auth_uid = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert own samples"
  ON samples FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = owner_id 
      AND profiles.auth_uid = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own samples"
  ON samples FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = samples.owner_id 
      AND profiles.auth_uid = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete own samples"
  ON samples FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = samples.owner_id 
      AND profiles.auth_uid = auth.uid()::text
    )
  );

-- ANALYSES: Follow sample visibility
CREATE POLICY "Analyses are readable if sample is readable"
  ON analyses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM samples
      WHERE samples.id = analyses.sample_id
      AND (
        samples.visibility = 'public'
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = samples.owner_id
          AND profiles.auth_uid = auth.uid()::text
        )
      )
    )
  );

CREATE POLICY "Service role can manage analyses"
  ON analyses FOR ALL
  USING (auth.role() = 'service_role');

-- PROOFS: Follow sample visibility
CREATE POLICY "Proofs are readable if sample is readable"
  ON proofs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM analyses
      JOIN samples ON samples.id = analyses.sample_id
      WHERE analyses.id = proofs.analysis_id
      AND (
        samples.visibility = 'public'
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = samples.owner_id
          AND profiles.auth_uid = auth.uid()::text
        )
      )
    )
  );

CREATE POLICY "Service role can manage proofs"
  ON proofs FOR ALL
  USING (auth.role() = 'service_role');

-- Service role bypass (needed for API routes)
CREATE POLICY "Service role full access to profiles"
  ON profiles FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to samples"
  ON samples FOR ALL
  USING (auth.role() = 'service_role');
