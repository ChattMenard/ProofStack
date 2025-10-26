-- Job Postings System Migration
-- Run this in Supabase SQL Editor

-- ============================================================================
-- PART 1: CREATE JOB POSTINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Basic Info
  title text NOT NULL,
  description text NOT NULL,
  
  -- Job Details
  job_type text DEFAULT 'full-time', -- 'full-time', 'part-time', 'contract', 'freelance'
  experience_level text DEFAULT 'mid', -- 'entry', 'mid', 'senior', 'lead'
  location text,
  remote_allowed boolean DEFAULT false,
  
  -- Compensation
  salary_min integer,
  salary_max integer,
  salary_currency text DEFAULT 'USD',
  
  -- Requirements
  required_skills text[], -- Array of skill names
  nice_to_have_skills text[],
  
  -- Status
  status text DEFAULT 'draft', -- 'draft', 'published', 'closed', 'filled'
  published_at timestamptz,
  closes_at timestamptz,
  
  -- Metadata
  views_count integer DEFAULT 0,
  applications_count integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_job_type CHECK (job_type IN ('full-time', 'part-time', 'contract', 'freelance')),
  CONSTRAINT valid_experience CHECK (experience_level IN ('entry', 'mid', 'senior', 'lead')),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'published', 'closed', 'filled')),
  CONSTRAINT valid_salary CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_job_postings_employer ON job_postings(employer_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_organization ON job_postings(organization_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_published ON job_postings(published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_job_postings_skills ON job_postings USING gin(required_skills);

-- Comments
COMMENT ON TABLE job_postings IS 'Job listings posted by employers';
COMMENT ON COLUMN job_postings.job_type IS 'Type of employment';
COMMENT ON COLUMN job_postings.experience_level IS 'Required experience level';
COMMENT ON COLUMN job_postings.remote_allowed IS 'Whether remote work is allowed';
COMMENT ON COLUMN job_postings.status IS 'Current status of job posting';

-- ============================================================================
-- PART 2: CREATE JOB APPLICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES job_postings(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Application Content
  cover_letter text,
  portfolio_url text,
  resume_url text,
  
  -- Status
  status text DEFAULT 'submitted', -- 'submitted', 'reviewing', 'shortlisted', 'rejected', 'accepted'
  
  -- Timestamps
  applied_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  responded_at timestamptz,
  
  -- Notes
  employer_notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(job_id, professional_id), -- One application per professional per job
  CONSTRAINT valid_application_status CHECK (status IN ('submitted', 'reviewing', 'shortlisted', 'rejected', 'accepted'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_job_applications_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_professional ON job_applications(professional_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);

-- Comments
COMMENT ON TABLE job_applications IS 'Applications from professionals to job postings';
COMMENT ON COLUMN job_applications.status IS 'Current status of application';

-- ============================================================================
-- PART 3: RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Job Postings Policies

-- Anyone can view published jobs
CREATE POLICY "Anyone can view published jobs"
  ON job_postings FOR SELECT
  USING (status = 'published');

-- Employers can view their own jobs (any status)
CREATE POLICY "Employers can view own jobs"
  ON job_postings FOR SELECT
  USING (employer_id::text = auth.uid()::text);

-- Employers can create jobs
CREATE POLICY "Employers can create jobs"
  ON job_postings FOR INSERT
  WITH CHECK (employer_id::text = auth.uid()::text);

-- Employers can update their own jobs
CREATE POLICY "Employers can update own jobs"
  ON job_postings FOR UPDATE
  USING (employer_id::text = auth.uid()::text);

-- Employers can delete their own jobs
CREATE POLICY "Employers can delete own jobs"
  ON job_postings FOR DELETE
  USING (employer_id::text = auth.uid()::text);

-- Job Applications Policies

-- Professionals can view their own applications
CREATE POLICY "Professionals can view own applications"
  ON job_applications FOR SELECT
  USING (professional_id::text = auth.uid()::text);

-- Employers can view applications to their jobs
CREATE POLICY "Employers can view applications to their jobs"
  ON job_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM job_postings
      WHERE job_postings.id = job_applications.job_id
      AND job_postings.employer_id::text = auth.uid()::text
    )
  );

-- Professionals can create applications
CREATE POLICY "Professionals can create applications"
  ON job_applications FOR INSERT
  WITH CHECK (professional_id::text = auth.uid()::text);

-- Employers can update applications to their jobs
CREATE POLICY "Employers can update applications"
  ON job_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM job_postings
      WHERE job_postings.id = job_applications.job_id
      AND job_postings.employer_id::text = auth.uid()::text
    )
  );

-- ============================================================================
-- PART 4: UPDATE TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_job_postings_updated_at BEFORE UPDATE ON job_postings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON job_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Increment applications count when new application created
CREATE OR REPLACE FUNCTION increment_applications_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE job_postings
  SET applications_count = applications_count + 1
  WHERE id = NEW.job_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER increment_job_applications_count AFTER INSERT ON job_applications
  FOR EACH ROW EXECUTE FUNCTION increment_applications_count();
