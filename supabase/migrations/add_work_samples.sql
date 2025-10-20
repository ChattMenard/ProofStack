-- Work Samples: Verified deliverables from completed projects
-- Employers submit 500-2000 char samples for AI quality analysis
-- Powers ProofScore V2 "Task Correctness" (20 points) component

-- Work samples table
CREATE TABLE IF NOT EXISTS work_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  professional_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  employer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  review_id uuid REFERENCES employer_reviews(id) ON DELETE SET NULL,
  
  -- Sample content
  content text NOT NULL CHECK (char_length(content) >= 500 AND char_length(content) <= 2000),
  content_type varchar(50) NOT NULL, -- 'code', 'writing', 'design_doc', 'technical_spec'
  language varchar(50), -- 'javascript', 'python', 'markdown', etc.
  
  -- Privacy settings
  confidentiality_level varchar(20) NOT NULL DEFAULT 'public',
  -- 'public': Shows on portfolio
  -- 'encrypted': Hashed, only metadata visible
  -- 'redacted': Sanitized version visible
  
  encrypted_content text, -- For 'encrypted' samples (AES-256)
  redacted_content text, -- For 'redacted' samples (employer-sanitized)
  
  -- AI Analysis Results
  ai_analyzed boolean DEFAULT false,
  ai_analysis_date timestamptz,
  
  -- Quality scores (0-10 scale)
  code_quality_score decimal(4,2), -- For code samples
  technical_depth_score decimal(4,2),
  problem_solving_score decimal(4,2),
  documentation_quality_score decimal(4,2),
  best_practices_score decimal(4,2),
  
  -- Writing scores (for non-code)
  writing_clarity_score decimal(4,2),
  technical_accuracy_score decimal(4,2),
  
  -- Overall assessment
  overall_quality_score decimal(4,2), -- Average of applicable scores
  ai_feedback jsonb DEFAULT '{}', -- Detailed analysis
  
  -- Metadata
  title varchar(200), -- "React Dashboard Component" or "API Documentation"
  description text, -- Employer's description of what was delivered
  project_context text, -- What problem did this solve?
  
  -- Verification
  verified boolean DEFAULT false,
  verified_at timestamptz,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_work_samples_professional ON work_samples(professional_id);
CREATE INDEX idx_work_samples_employer ON work_samples(employer_id);
CREATE INDEX idx_work_samples_review ON work_samples(review_id);
CREATE INDEX idx_work_samples_confidentiality ON work_samples(confidentiality_level);
CREATE INDEX idx_work_samples_type ON work_samples(content_type);
CREATE INDEX idx_work_samples_verified ON work_samples(verified) WHERE verified = true;

-- Row Level Security
ALTER TABLE work_samples ENABLE ROW LEVEL SECURITY;

-- Employers can insert samples for their reviews
CREATE POLICY work_samples_employer_insert ON work_samples
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = employer_id);

-- Employers can update their own samples (before verification)
CREATE POLICY work_samples_employer_update ON work_samples
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = employer_id AND verified = false);

-- Professionals can view their own samples
CREATE POLICY work_samples_professional_select ON work_samples
  FOR SELECT
  TO authenticated
  USING (auth.uid() = professional_id);

-- Employers can view samples they submitted
CREATE POLICY work_samples_employer_select ON work_samples
  FOR SELECT
  TO authenticated
  USING (auth.uid() = employer_id);

-- Public samples are visible to everyone (for portfolios)
CREATE POLICY work_samples_public_select ON work_samples
  FOR SELECT
  TO authenticated
  USING (confidentiality_level = 'public' AND verified = true);

-- Function to get displayable content based on confidentiality
CREATE OR REPLACE FUNCTION get_work_sample_content(
  p_sample_id uuid,
  p_viewer_id uuid
)
RETURNS jsonb AS $$
DECLARE
  sample_record RECORD;
  result jsonb;
BEGIN
  SELECT * INTO sample_record
  FROM work_samples
  WHERE id = p_sample_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Sample not found');
  END IF;
  
  -- Employer and professional always see full content
  IF p_viewer_id = sample_record.employer_id OR p_viewer_id = sample_record.professional_id THEN
    RETURN jsonb_build_object(
      'content', sample_record.content,
      'confidentiality_level', sample_record.confidentiality_level,
      'can_view_full', true
    );
  END IF;
  
  -- Public samples: everyone sees content
  IF sample_record.confidentiality_level = 'public' THEN
    RETURN jsonb_build_object(
      'content', sample_record.content,
      'confidentiality_level', 'public',
      'can_view_full', true
    );
  END IF;
  
  -- Redacted samples: show sanitized version
  IF sample_record.confidentiality_level = 'redacted' THEN
    RETURN jsonb_build_object(
      'content', COALESCE(sample_record.redacted_content, 'Content redacted by employer'),
      'confidentiality_level', 'redacted',
      'can_view_full', false
    );
  END IF;
  
  -- Encrypted samples: only show metadata
  RETURN jsonb_build_object(
    'content', '🔒 Confidential work sample - content encrypted',
    'confidentiality_level', 'encrypted',
    'can_view_full', false,
    'metadata', jsonb_build_object(
      'type', sample_record.content_type,
      'language', sample_record.language,
      'title', sample_record.title,
      'quality_score', sample_record.overall_quality_score
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate work sample statistics for a professional
CREATE OR REPLACE FUNCTION get_professional_work_sample_stats(p_professional_id uuid)
RETURNS jsonb AS $$
DECLARE
  stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_samples', COUNT(*),
    'verified_samples', COUNT(*) FILTER (WHERE verified = true),
    'public_samples', COUNT(*) FILTER (WHERE confidentiality_level = 'public'),
    'encrypted_samples', COUNT(*) FILTER (WHERE confidentiality_level = 'encrypted'),
    'redacted_samples', COUNT(*) FILTER (WHERE confidentiality_level = 'redacted'),
    'average_quality_score', ROUND(AVG(overall_quality_score), 2),
    'by_type', jsonb_object_agg(
      content_type,
      COUNT(*)
    ) FILTER (WHERE content_type IS NOT NULL)
  )
  INTO stats
  FROM work_samples
  WHERE professional_id = p_professional_id
    AND verified = true;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE work_samples IS 'Verified work deliverables submitted by employers for ProofScore V2 task correctness analysis';
COMMENT ON COLUMN work_samples.content IS 'Actual work sample (500-2000 chars) - code, writing, or technical content';
COMMENT ON COLUMN work_samples.confidentiality_level IS 'public: visible to all, encrypted: metadata only, redacted: sanitized version';
COMMENT ON COLUMN work_samples.overall_quality_score IS 'AI-assessed quality score (0-10) used for ProofScore V2 Task Correctness (20 points)';

-- Grant permissions
GRANT SELECT ON work_samples TO authenticated;
GRANT INSERT ON work_samples TO authenticated;
GRANT UPDATE ON work_samples TO authenticated;
GRANT EXECUTE ON FUNCTION get_work_sample_content(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_professional_work_sample_stats(uuid) TO authenticated;
