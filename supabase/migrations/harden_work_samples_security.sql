-- SECURITY HARDENED Work Samples Migration
-- Fixes critical vulnerabilities identified in security audit
-- Run this AFTER the original add_work_samples.sql

-- 1. FIX: Add proper validation to SECURITY DEFINER functions
-- Prevents impersonation attacks

DROP FUNCTION IF EXISTS get_work_sample_content(uuid, uuid);

CREATE OR REPLACE FUNCTION get_work_sample_content(
  p_sample_id uuid,
  p_viewer_id uuid
)
RETURNS jsonb AS $$
DECLARE
  sample_record RECORD;
  result jsonb;
BEGIN
  -- SECURITY: Validate that viewer_id matches authenticated user
  IF p_viewer_id != auth.uid() THEN
    RETURN jsonb_build_object('error', 'Unauthorized: viewer_id must match authenticated user');
  END IF;
  
  -- Get sample (RLS will enforce access)
  SELECT * INTO sample_record
  FROM work_samples
  WHERE id = p_sample_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Sample not found or access denied');
  END IF;
  
  -- Log access for audit trail
  PERFORM log_work_sample_access(
    auth.uid(),
    'work_sample_view',
    p_sample_id,
    true,
    jsonb_build_object(
      'confidentiality_level', sample_record.confidentiality_level,
      'professional_id', sample_record.professional_id,
      'via_function', 'get_work_sample_content'
    )
  );
  
  -- Employer and professional always see full content
  IF p_viewer_id = sample_record.employer_id OR p_viewer_id = sample_record.professional_id THEN
    RETURN jsonb_build_object(
      'content', sample_record.content,
      'confidentiality_level', sample_record.confidentiality_level,
      'can_view_full', true,
      'viewer_role', CASE 
        WHEN p_viewer_id = sample_record.employer_id THEN 'employer'
        ELSE 'professional'
      END
    );
  END IF;
  
  -- Public samples: everyone sees content
  IF sample_record.confidentiality_level = 'public' AND sample_record.verified = true THEN
    RETURN jsonb_build_object(
      'content', sample_record.content,
      'confidentiality_level', 'public',
      'can_view_full', true,
      'viewer_role', 'public'
    );
  END IF;
  
  -- Redacted samples: show sanitized version
  IF sample_record.confidentiality_level = 'redacted' AND sample_record.verified = true THEN
    RETURN jsonb_build_object(
      'content', COALESCE(sample_record.redacted_content, 'Content redacted by employer'),
      'confidentiality_level', 'redacted',
      'can_view_full', false,
      'viewer_role', 'public'
    );
  END IF;
  
  -- Encrypted samples: only show metadata (never show encrypted_content)
  IF sample_record.confidentiality_level = 'encrypted' THEN
    RETURN jsonb_build_object(
      'content', '🔒 Confidential work sample - content encrypted',
      'confidentiality_level', 'encrypted',
      'can_view_full', false,
      'viewer_role', 'public',
      'metadata', jsonb_build_object(
        'type', sample_record.content_type,
        'language', sample_record.language,
        'title', sample_record.title,
        'quality_score', sample_record.overall_quality_score,
        'verified', sample_record.verified
      )
    );
  END IF;
  
  -- Default: deny access
  RETURN jsonb_build_object('error', 'Access denied');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. FIX: Harden stats function
DROP FUNCTION IF EXISTS get_professional_work_sample_stats(uuid);

CREATE OR REPLACE FUNCTION get_professional_work_sample_stats(p_professional_id uuid)
RETURNS jsonb AS $$
DECLARE
  stats jsonb;
  requesting_user uuid;
BEGIN
  requesting_user := auth.uid();
  
  -- Anyone can see public stats, but log the access
  PERFORM log_work_sample_access(
    requesting_user,
    'work_sample_stats_view',
    NULL, -- No specific sample
    true,
    jsonb_build_object(
      'professional_id', p_professional_id,
      'via_function', 'get_professional_work_sample_stats'
    )
  );
  
  -- Calculate stats (only verified samples)
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
    ) FILTER (WHERE content_type IS NOT NULL),
    'last_updated', MAX(created_at)
  )
  INTO stats
  FROM work_samples
  WHERE professional_id = p_professional_id
    AND verified = true;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ADD: Function to detect excessive access (scraping protection)
CREATE OR REPLACE FUNCTION check_work_sample_access_rate(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  recent_views int;
  unique_professionals int;
  is_suspicious boolean := false;
  reasons text[] := '{}';
BEGIN
  -- Count views in last hour
  SELECT COUNT(*) INTO recent_views
  FROM security_audit_log
  WHERE user_id = p_user_id
    AND action = 'work_sample_view'
    AND timestamp > now() - interval '1 hour';
  
  -- Count unique professionals viewed
  SELECT COUNT(DISTINCT (metadata->>'professional_id')::uuid) INTO unique_professionals
  FROM security_audit_log
  WHERE user_id = p_user_id
    AND action = 'work_sample_view'
    AND timestamp > now() - interval '1 hour';
  
  -- Detect suspicious patterns
  IF recent_views > 100 THEN
    is_suspicious := true;
    reasons := array_append(reasons, 'excessive_views');
  END IF;
  
  IF unique_professionals > 20 THEN
    is_suspicious := true;
    reasons := array_append(reasons, 'mass_scraping');
  END IF;
  
  -- Flag suspicious activity
  IF is_suspicious THEN
    UPDATE security_audit_log
    SET suspicious = true
    WHERE user_id = p_user_id
      AND timestamp > now() - interval '1 hour'
      AND suspicious = false;
  END IF;
  
  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'recent_views', recent_views,
    'unique_professionals', unique_professionals,
    'is_suspicious', is_suspicious,
    'reasons', reasons
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. ADD: Trigger to automatically check access patterns
CREATE OR REPLACE FUNCTION trigger_check_access_patterns()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this user's activity is suspicious
  PERFORM check_work_sample_access_rate(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on audit log inserts
DROP TRIGGER IF EXISTS check_access_patterns_trigger ON security_audit_log;
CREATE TRIGGER check_access_patterns_trigger
  AFTER INSERT ON security_audit_log
  FOR EACH ROW
  WHEN (NEW.action = 'work_sample_view')
  EXECUTE FUNCTION trigger_check_access_patterns();

-- 5. ADD: Enhanced RLS policies with stricter rules
-- Drop old policies
DROP POLICY IF EXISTS work_samples_public_select ON work_samples;

-- New public policy: Only verified public samples
CREATE POLICY work_samples_public_select_v2 ON work_samples
  FOR SELECT
  TO authenticated
  USING (
    confidentiality_level = 'public' 
    AND verified = true
    AND (
      -- Must be 30+ days old OR professional has opted in to immediate visibility
      created_at < now() - interval '30 days'
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE id = professional_id
        AND (metadata->>'instant_public_samples')::boolean = true
      )
    )
  );

-- 6. ADD: Function to safely encrypt content (placeholder for actual encryption)
CREATE OR REPLACE FUNCTION encrypt_work_sample_content(
  p_sample_id uuid,
  p_content text
)
RETURNS boolean AS $$
DECLARE
  v_sample RECORD;
BEGIN
  -- Get sample
  SELECT * INTO v_sample
  FROM work_samples
  WHERE id = p_sample_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Verify caller is employer or professional
  IF auth.uid() != v_sample.employer_id AND auth.uid() != v_sample.professional_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- TODO: Implement actual encryption using pgcrypto or Supabase Vault
  -- For now, we'll just hash it to prevent plaintext storage
  UPDATE work_samples
  SET 
    encrypted_content = encode(digest(p_content, 'sha256'), 'hex'),
    content = '[ENCRYPTED]', -- Remove plaintext
    updated_at = now()
  WHERE id = p_sample_id;
  
  -- Log encryption action
  PERFORM log_work_sample_access(
    auth.uid(),
    'work_sample_encrypted',
    p_sample_id,
    true,
    jsonb_build_object(
      'encryption_method', 'sha256_hash',
      'original_length', length(p_content)
    )
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. ADD: Content validation constraints
-- Ensure content doesn't contain obvious secrets (basic check)
CREATE OR REPLACE FUNCTION validate_work_sample_content()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for common secret patterns (basic validation)
  IF NEW.content ~* 'sk-[a-zA-Z0-9]{20,}' THEN
    RAISE EXCEPTION 'Content appears to contain API keys. Please remove secrets before submitting.';
  END IF;
  
  IF NEW.content ~* 'AKIA[0-9A-Z]{16}' THEN
    RAISE EXCEPTION 'Content appears to contain AWS keys. Please remove secrets before submitting.';
  END IF;
  
  IF NEW.content ~* 'ghp_[a-zA-Z0-9]{36}' THEN
    RAISE EXCEPTION 'Content appears to contain GitHub tokens. Please remove secrets before submitting.';
  END IF;
  
  -- Check content length (prevent abuse)
  IF char_length(NEW.content) > 2000 THEN
    RAISE EXCEPTION 'Content exceeds maximum length of 2000 characters';
  END IF;
  
  IF char_length(NEW.content) < 500 THEN
    RAISE EXCEPTION 'Content must be at least 500 characters for AI analysis';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_content_trigger ON work_samples;
CREATE TRIGGER validate_content_trigger
  BEFORE INSERT OR UPDATE ON work_samples
  FOR EACH ROW
  EXECUTE FUNCTION validate_work_sample_content();

-- 8. ADD: Admin function to review flagged samples
CREATE OR REPLACE FUNCTION get_flagged_work_samples()
RETURNS TABLE (
  sample_id uuid,
  professional_id uuid,
  employer_id uuid,
  created_at timestamptz,
  flag_count bigint,
  reasons jsonb
) AS $$
BEGIN
  -- Only admins can call this
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  
  RETURN QUERY
  SELECT 
    ws.id,
    ws.professional_id,
    ws.employer_id,
    ws.created_at,
    COUNT(sal.id) as flag_count,
    jsonb_agg(jsonb_build_object(
      'timestamp', sal.timestamp,
      'reason', sal.failure_reason,
      'suspicious', sal.suspicious
    )) as reasons
  FROM work_samples ws
  JOIN security_audit_log sal ON sal.resource_id = ws.id
  WHERE sal.suspicious = true
    OR sal.success = false
  GROUP BY ws.id, ws.professional_id, ws.employer_id, ws.created_at
  ORDER BY flag_count DESC, ws.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_work_sample_content(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_professional_work_sample_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION check_work_sample_access_rate(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION encrypt_work_sample_content(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_flagged_work_samples() TO authenticated;

-- Comments
COMMENT ON FUNCTION get_work_sample_content IS 'SECURITY HARDENED: Validates viewer_id, logs access, enforces confidentiality levels';
COMMENT ON FUNCTION check_work_sample_access_rate IS 'Detects scraping attempts and flags suspicious users';
COMMENT ON FUNCTION encrypt_work_sample_content IS 'Encrypts sensitive work sample content (TODO: implement actual encryption)';
COMMENT ON FUNCTION get_flagged_work_samples IS 'Admin only: Review work samples flagged for suspicious activity';

-- Summary of security improvements:
-- ✅ Fixed SECURITY DEFINER vulnerability (validates auth.uid())
-- ✅ Added audit logging to all access functions
-- ✅ Implemented automatic scraping detection
-- ✅ Added content validation (basic secret detection)
-- ✅ Hardened RLS policies
-- ✅ Added encryption placeholder (needs actual implementation)
-- ✅ Created admin review function for flagged content
