-- Model A/B Testing Schema
-- Enables experimentation with different AI models to optimize quality vs. cost

-- A/B tests configuration
CREATE TABLE IF NOT EXISTS ab_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('skill-extraction', 'code-analysis', 'transcription', 'summarization')),
  variants JSONB NOT NULL, -- { control: 'model-name', treatment: 'model-name' }
  traffic_split INTEGER NOT NULL CHECK (traffic_split >= 0 AND traffic_split <= 100),
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- A/B test variant assignments (which users got which variant)
CREATE TABLE IF NOT EXISTS ab_test_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  variant TEXT NOT NULL CHECK (variant IN ('control', 'treatment')),
  model_variant TEXT NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(test_id, user_id) -- One assignment per user per test
);

-- A/B test results with metrics
CREATE TABLE IF NOT EXISTS ab_test_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  variant TEXT NOT NULL CHECK (variant IN ('control', 'treatment')),
  model_variant TEXT NOT NULL,
  operation TEXT NOT NULL,
  cost_usd DECIMAL(10, 6) NOT NULL,
  latency_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  quality_score DECIMAL(5, 2), -- Optional 0-100 score
  metadata JSONB, -- Additional metrics/context
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ab_tests_operation_active 
  ON ab_tests(operation, is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_ab_test_assignments_test_user 
  ON ab_test_assignments(test_id, user_id);

CREATE INDEX IF NOT EXISTS idx_ab_test_results_test_variant 
  ON ab_test_results(test_id, variant);

CREATE INDEX IF NOT EXISTS idx_ab_test_results_created_at 
  ON ab_test_results(created_at);

-- Function to get A/B test summary statistics
CREATE OR REPLACE FUNCTION get_ab_test_summary(p_test_id UUID)
RETURNS TABLE(
  variant TEXT,
  model_variant TEXT,
  sample_count BIGINT,
  avg_cost_usd DECIMAL(10, 6),
  avg_latency_ms DECIMAL(10, 2),
  avg_quality_score DECIMAL(5, 2),
  error_rate DECIMAL(5, 4),
  total_cost_usd DECIMAL(10, 6)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.variant,
    r.model_variant,
    COUNT(*)::BIGINT as sample_count,
    AVG(r.cost_usd)::DECIMAL(10, 6) as avg_cost_usd,
    AVG(r.latency_ms)::DECIMAL(10, 2) as avg_latency_ms,
    AVG(r.quality_score)::DECIMAL(5, 2) as avg_quality_score,
    (SUM(CASE WHEN r.success = false THEN 1 ELSE 0 END)::DECIMAL / COUNT(*))::DECIMAL(5, 4) as error_rate,
    SUM(r.cost_usd)::DECIMAL(10, 6) as total_cost_usd
  FROM ab_test_results r
  WHERE r.test_id = p_test_id
  GROUP BY r.variant, r.model_variant
  ORDER BY r.variant;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate statistical significance (simplified t-test)
CREATE OR REPLACE FUNCTION calculate_ab_test_significance(
  p_test_id UUID,
  p_metric TEXT -- 'cost', 'latency', or 'quality'
)
RETURNS TABLE(
  control_mean DECIMAL(10, 4),
  treatment_mean DECIMAL(10, 4),
  difference_pct DECIMAL(5, 2),
  sample_size_control BIGINT,
  sample_size_treatment BIGINT,
  is_significant BOOLEAN
) AS $$
DECLARE
  v_control_mean DECIMAL(10, 4);
  v_treatment_mean DECIMAL(10, 4);
  v_control_count BIGINT;
  v_treatment_count BIGINT;
  v_difference_pct DECIMAL(5, 2);
BEGIN
  -- Get control metrics
  SELECT 
    CASE 
      WHEN p_metric = 'cost' THEN AVG(cost_usd)
      WHEN p_metric = 'latency' THEN AVG(latency_ms)
      WHEN p_metric = 'quality' THEN AVG(quality_score)
    END,
    COUNT(*)
  INTO v_control_mean, v_control_count
  FROM ab_test_results
  WHERE test_id = p_test_id AND variant = 'control';

  -- Get treatment metrics
  SELECT 
    CASE 
      WHEN p_metric = 'cost' THEN AVG(cost_usd)
      WHEN p_metric = 'latency' THEN AVG(latency_ms)
      WHEN p_metric = 'quality' THEN AVG(quality_score)
    END,
    COUNT(*)
  INTO v_treatment_mean, v_treatment_count
  FROM ab_test_results
  WHERE test_id = p_test_id AND variant = 'treatment';

  -- Calculate percentage difference
  IF v_control_mean > 0 THEN
    v_difference_pct := ((v_treatment_mean - v_control_mean) / v_control_mean * 100)::DECIMAL(5, 2);
  ELSE
    v_difference_pct := 0;
  END IF;

  -- Simple significance test: require at least 30 samples per variant and >10% difference
  RETURN QUERY SELECT 
    v_control_mean,
    v_treatment_mean,
    v_difference_pct,
    v_control_count,
    v_treatment_count,
    (v_control_count >= 30 AND v_treatment_count >= 30 AND ABS(v_difference_pct) > 10)::BOOLEAN;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ab_tests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ab_tests_updated_at
  BEFORE UPDATE ON ab_tests
  FOR EACH ROW
  EXECUTE FUNCTION update_ab_tests_updated_at();

-- RLS Policies

-- ab_tests: Admin only can manage tests
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY ab_tests_admin_all ON ab_tests
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.tier = 'enterprise' -- Only enterprise users can manage A/B tests
  ));

-- ab_test_assignments: Users can see their own assignments
ALTER TABLE ab_test_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY ab_test_assignments_user_read ON ab_test_assignments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY ab_test_assignments_insert ON ab_test_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ab_test_results: Users can see their own results
ALTER TABLE ab_test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY ab_test_results_user_read ON ab_test_results
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY ab_test_results_insert ON ab_test_results
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Grant permissions
GRANT SELECT, INSERT ON ab_test_assignments TO authenticated;
GRANT SELECT, INSERT ON ab_test_results TO authenticated;
GRANT SELECT ON ab_tests TO authenticated;
GRANT ALL ON ab_tests TO service_role;

-- Insert example A/B tests
INSERT INTO ab_tests (name, operation, variants, traffic_split, is_active)
VALUES 
  ('Skill Extraction: Sonnet vs Haiku', 'skill-extraction', 
   '{"control": "claude-sonnet", "treatment": "claude-haiku"}', 50, false),
  ('Code Analysis: Opus vs GPT-4', 'code-analysis', 
   '{"control": "claude-opus", "treatment": "gpt-4"}', 20, false)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE ab_tests IS 'A/B test configurations for model experimentation';
COMMENT ON TABLE ab_test_assignments IS 'Tracks which users were assigned to which variant';
COMMENT ON TABLE ab_test_results IS 'Stores metrics from each A/B test execution';
COMMENT ON FUNCTION get_ab_test_summary IS 'Returns aggregate metrics for an A/B test';
COMMENT ON FUNCTION calculate_ab_test_significance IS 'Calculates statistical significance between control and treatment';
