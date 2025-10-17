-- Cost tracking for LLM and transcription API usage
-- Stores every API call with cost, duration, and metadata

CREATE TABLE IF NOT EXISTS public.api_cost_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sample_id UUID REFERENCES public.samples(id) ON DELETE SET NULL,
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE SET NULL,
  
  -- API details
  provider TEXT NOT NULL, -- 'openai', 'anthropic', 'huggingface', 'ollama'
  model_name TEXT NOT NULL, -- e.g., 'gpt-4', 'whisper-1', 'claude-3-sonnet'
  operation TEXT NOT NULL, -- 'transcription', 'skill_extraction', 'analysis', 'embedding'
  
  -- Cost tracking
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,
  cost_usd DECIMAL(10, 6) NOT NULL, -- Cost in USD (6 decimal places for fractional cents)
  
  -- Performance
  duration_ms INTEGER, -- API call duration in milliseconds
  
  -- Request/response metadata
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,
  status TEXT NOT NULL DEFAULT 'success', -- 'success', 'error', 'timeout', 'rate_limited'
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_cost_logs_user ON public.api_cost_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_cost_logs_created ON public.api_cost_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_cost_logs_provider ON public.api_cost_logs(provider);
CREATE INDEX IF NOT EXISTS idx_api_cost_logs_model ON public.api_cost_logs(model_name);
CREATE INDEX IF NOT EXISTS idx_api_cost_logs_status ON public.api_cost_logs(status);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_api_cost_logs_user_created ON public.api_cost_logs(user_id, created_at DESC);

-- Row Level Security
ALTER TABLE public.api_cost_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own logs
CREATE POLICY "Users can view their own API cost logs"
  ON public.api_cost_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert logs
CREATE POLICY "Service role can insert API cost logs"
  ON public.api_cost_logs
  FOR INSERT
  WITH CHECK (true);

-- Service role can view all logs (for admin dashboard)
CREATE POLICY "Service role can view all API cost logs"
  ON public.api_cost_logs
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Cost summary view for easy querying
CREATE OR REPLACE VIEW public.api_cost_summary AS
SELECT
  user_id,
  provider,
  model_name,
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as request_count,
  SUM(cost_usd) as total_cost_usd,
  SUM(total_tokens) as total_tokens,
  AVG(duration_ms) as avg_duration_ms,
  SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_count
FROM public.api_cost_logs
GROUP BY user_id, provider, model_name, DATE_TRUNC('day', created_at);

-- Function to get user's total spending
CREATE OR REPLACE FUNCTION get_user_total_cost(p_user_id UUID)
RETURNS TABLE (
  total_cost_usd DECIMAL(10, 6),
  request_count BIGINT,
  last_30_days_cost DECIMAL(10, 6),
  last_7_days_cost DECIMAL(10, 6),
  today_cost DECIMAL(10, 6)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(cost_usd), 0) as total_cost_usd,
    COUNT(*) as request_count,
    COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN cost_usd ELSE 0 END), 0) as last_30_days_cost,
    COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN cost_usd ELSE 0 END), 0) as last_7_days_cost,
    COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('day', NOW()) THEN cost_usd ELSE 0 END), 0) as today_cost
  FROM public.api_cost_logs
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get spending by provider
CREATE OR REPLACE FUNCTION get_cost_by_provider(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  provider TEXT,
  model_name TEXT,
  request_count BIGINT,
  total_cost_usd DECIMAL(10, 6),
  avg_cost_usd DECIMAL(10, 6)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    acl.provider,
    acl.model_name,
    COUNT(*) as request_count,
    SUM(acl.cost_usd) as total_cost_usd,
    AVG(acl.cost_usd) as avg_cost_usd
  FROM public.api_cost_logs acl
  WHERE acl.user_id = p_user_id
    AND acl.created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY acl.provider, acl.model_name
  ORDER BY total_cost_usd DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has exceeded daily budget
CREATE OR REPLACE FUNCTION check_daily_budget(p_user_id UUID, p_daily_limit_usd DECIMAL DEFAULT 5.00)
RETURNS BOOLEAN AS $$
DECLARE
  v_today_cost DECIMAL(10, 6);
BEGIN
  SELECT COALESCE(SUM(cost_usd), 0)
  INTO v_today_cost
  FROM public.api_cost_logs
  WHERE user_id = p_user_id
    AND created_at >= DATE_TRUNC('day', NOW());
  
  RETURN v_today_cost >= p_daily_limit_usd;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update analyses table with cost data
CREATE OR REPLACE FUNCTION update_analysis_cost()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the analysis with the cost if analysis_id is provided
  IF NEW.analysis_id IS NOT NULL THEN
    UPDATE public.analyses
    SET metadata = COALESCE(metadata, '{}'::jsonb) || 
      jsonb_build_object(
        'api_cost_usd', COALESCE((metadata->>'api_cost_usd')::decimal, 0) + NEW.cost_usd,
        'last_cost_update', NOW()
      )
    WHERE id = NEW.analysis_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER api_cost_update_analysis
  AFTER INSERT ON public.api_cost_logs
  FOR EACH ROW
  WHEN (NEW.analysis_id IS NOT NULL)
  EXECUTE FUNCTION update_analysis_cost();

-- Comments for documentation
COMMENT ON TABLE public.api_cost_logs IS 'Logs every API call to LLM and transcription services with cost tracking';
COMMENT ON COLUMN public.api_cost_logs.cost_usd IS 'Cost in USD with 6 decimal precision (e.g., 0.000123 = $0.000123)';
COMMENT ON FUNCTION get_user_total_cost IS 'Returns comprehensive cost statistics for a user';
COMMENT ON FUNCTION get_cost_by_provider IS 'Returns spending breakdown by provider and model for a user';
COMMENT ON FUNCTION check_daily_budget IS 'Checks if user has exceeded their daily spending limit';
