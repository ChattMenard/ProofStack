-- Migration: Fix SECURITY DEFINER vulnerabilities
-- Date: 2025-10-30
-- Purpose: Remove or properly secure SECURITY DEFINER functions to prevent privilege escalation

-- =============================================================================
-- 1. FIX API COST TRACKING FUNCTIONS
-- =============================================================================

-- Drop existing SECURITY DEFINER versions
DROP FUNCTION IF EXISTS public.get_user_total_cost(UUID);
DROP FUNCTION IF EXISTS public.get_cost_by_provider(UUID, INTEGER);

-- Recreate WITHOUT SECURITY DEFINER (uses caller's privileges + RLS)
CREATE OR REPLACE FUNCTION public.get_user_total_cost(p_user_id UUID)
RETURNS TABLE (
  total_cost_usd DECIMAL(10, 6),
  request_count BIGINT,
  last_30_days_cost DECIMAL(10, 6),
  last_7_days_cost DECIMAL(10, 6),
  today_cost DECIMAL(10, 6)
) AS $$
BEGIN
  -- Enforce: caller can only query their own costs
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: can only view own cost data';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(SUM(cost_usd), 0)::DECIMAL(10, 6) as total_cost_usd,
    COUNT(*)::BIGINT as request_count,
    COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN cost_usd ELSE 0 END), 0)::DECIMAL(10, 6) as last_30_days_cost,
    COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN cost_usd ELSE 0 END), 0)::DECIMAL(10, 6) as last_7_days_cost,
    COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('day', NOW()) THEN cost_usd ELSE 0 END), 0)::DECIMAL(10, 6) as today_cost
  FROM public.api_cost_logs
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER STABLE;

-- Recreate get_cost_by_provider WITHOUT SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_cost_by_provider(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  provider TEXT,
  model_name TEXT,
  request_count BIGINT,
  total_cost_usd DECIMAL(10, 6),
  avg_cost_usd DECIMAL(10, 6)
) AS $$
BEGIN
  -- Enforce: caller can only query their own costs
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: can only view own cost data';
  END IF;

  RETURN QUERY
  SELECT
    acl.provider,
    acl.model_name,
    COUNT(*)::BIGINT as request_count,
    SUM(acl.cost_usd)::DECIMAL(10, 6) as total_cost_usd,
    AVG(acl.cost_usd)::DECIMAL(10, 6) as avg_cost_usd
  FROM public.api_cost_logs acl
  WHERE acl.user_id = p_user_id
    AND acl.created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY acl.provider, acl.model_name
  ORDER BY total_cost_usd DESC;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER STABLE;

-- Grant execute to authenticated users only
REVOKE EXECUTE ON FUNCTION public.get_user_total_cost(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_total_cost(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_cost_by_provider(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_cost_by_provider(UUID, INTEGER) TO authenticated;

-- =============================================================================
-- 2. ADD SECURITY TO api_cost_summary VIEW
-- =============================================================================

-- Drop and recreate with proper security comment
DROP VIEW IF EXISTS public.api_cost_summary;

CREATE VIEW public.api_cost_summary 
WITH (security_invoker = true) AS
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

COMMENT ON VIEW public.api_cost_summary IS 
'Summary view of API costs. Respects RLS policies on api_cost_logs table.';

-- Revoke public access, grant to authenticated only
REVOKE ALL ON public.api_cost_summary FROM PUBLIC;
GRANT SELECT ON public.api_cost_summary TO authenticated;

-- =============================================================================
-- 3. AUDIT REMAINING SECURITY DEFINER FUNCTIONS
-- =============================================================================

-- Note: The following functions use SECURITY DEFINER but have authorization checks:
-- - Forum functions (handle_new_thread_func, etc.) - check auth.uid()
-- - ProofScore functions - check auth.uid()
-- - Hire attempts functions - check auth.uid()
-- - Profile triggers - run on INSERT/UPDATE by authenticated users

-- These are considered safe because:
-- 1. They check auth.uid() explicitly
-- 2. They're used in triggers where elevated privileges are needed
-- 3. They have specific, limited scope

-- If you want to audit them, run:
-- SELECT routine_name, routine_schema 
-- FROM information_schema.routines 
-- WHERE security_type = 'DEFINER' 
-- AND routine_schema = 'public';

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify no PUBLIC access to cost functions
DO $$
BEGIN
  -- Check that PUBLIC cannot execute cost functions
  IF EXISTS (
    SELECT 1 FROM information_schema.routine_privileges
    WHERE routine_name IN ('get_user_total_cost', 'get_cost_by_provider')
    AND grantee = 'PUBLIC'
  ) THEN
    RAISE EXCEPTION 'PUBLIC still has access to cost functions!';
  END IF;
  
  RAISE NOTICE 'Security verification passed: cost functions properly restricted';
END $$;
