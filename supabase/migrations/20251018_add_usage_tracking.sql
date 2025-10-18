-- Track monthly usage for rate limiting and billing
-- Migration: 2025-10-18-add-usage-tracking

CREATE TABLE IF NOT EXISTS usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  month text NOT NULL, -- format: YYYY-MM
  uploads_count integer DEFAULT 0,
  analysis_count integer DEFAULT 0,
  storage_bytes bigint DEFAULT 0,
  api_cost_usd numeric(10,4) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_month ON usage_tracking(user_id, month);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_month ON usage_tracking(month);

-- Function to increment usage counters
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id uuid,
  p_upload_count integer DEFAULT 0,
  p_analysis_count integer DEFAULT 0,
  p_storage_bytes bigint DEFAULT 0,
  p_cost_usd numeric DEFAULT 0
)
RETURNS void AS $$
DECLARE
  current_month text;
BEGIN
  current_month := to_char(now(), 'YYYY-MM');
  
  INSERT INTO usage_tracking (user_id, month, uploads_count, analysis_count, storage_bytes, api_cost_usd, updated_at)
  VALUES (p_user_id, current_month, p_upload_count, p_analysis_count, p_storage_bytes, p_cost_usd, now())
  ON CONFLICT (user_id, month) 
  DO UPDATE SET
    uploads_count = usage_tracking.uploads_count + EXCLUDED.uploads_count,
    analysis_count = usage_tracking.analysis_count + EXCLUDED.analysis_count,
    storage_bytes = usage_tracking.storage_bytes + EXCLUDED.storage_bytes,
    api_cost_usd = usage_tracking.api_cost_usd + EXCLUDED.api_cost_usd,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is within usage limits
CREATE OR REPLACE FUNCTION check_usage_limit(
  p_user_id uuid,
  p_type text -- 'upload' or 'analysis'
)
RETURNS boolean AS $$
DECLARE
  user_plan text;
  user_limits jsonb;
  current_usage record;
  current_month text;
  limit_key text;
  current_count integer;
  max_count integer;
BEGIN
  -- Get user plan and limits
  SELECT plan, usage_limits INTO user_plan, user_limits
  FROM users
  WHERE id = p_user_id;
  
  -- Founders have unlimited access
  IF user_plan = 'founder' THEN
    RETURN true;
  END IF;
  
  -- Get current month usage
  current_month := to_char(now(), 'YYYY-MM');
  
  SELECT uploads_count, analysis_count INTO current_usage
  FROM usage_tracking
  WHERE user_id = p_user_id AND month = current_month;
  
  -- Set limits based on type
  IF p_type = 'upload' THEN
    limit_key := 'uploads_per_month';
    current_count := COALESCE(current_usage.uploads_count, 0);
  ELSIF p_type = 'analysis' THEN
    limit_key := 'analysis_per_month';
    current_count := COALESCE(current_usage.analysis_count, 0);
  ELSE
    RETURN false;
  END IF;
  
  -- Get max count from limits
  max_count := (user_limits->limit_key)::integer;
  
  -- Check if within limit
  RETURN current_count < max_count;
END;
$$ LANGUAGE plpgsql;

-- View for easy usage monitoring
CREATE OR REPLACE VIEW user_usage_summary AS
SELECT 
  u.id AS user_id,
  u.email,
  u.plan,
  u.is_founder,
  u.usage_limits,
  ut.month,
  COALESCE(ut.uploads_count, 0) AS uploads_used,
  (u.usage_limits->>'uploads_per_month')::integer AS uploads_limit,
  COALESCE(ut.analysis_count, 0) AS analysis_used,
  (u.usage_limits->>'analysis_per_month')::integer AS analysis_limit,
  COALESCE(ut.api_cost_usd, 0) AS monthly_cost
FROM users u
LEFT JOIN usage_tracking ut ON u.id = ut.user_id 
  AND ut.month = to_char(now(), 'YYYY-MM')
ORDER BY u.created_at DESC;

COMMENT ON TABLE usage_tracking IS 'Monthly usage tracking for rate limiting and billing';
COMMENT ON FUNCTION check_usage_limit IS 'Check if user can perform action based on their plan limits';
