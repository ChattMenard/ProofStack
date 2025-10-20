-- Security Audit Logging System
-- Track all access to sensitive data with "assume breach" mindset
-- Required for compliance (GDPR Article 33, SOC 2, incident response)

-- Audit log table for sensitive data access
CREATE TABLE IF NOT EXISTS security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  user_email text, -- Denormalized for forensics (in case profile deleted)
  ip_address inet,
  user_agent text,
  
  -- What
  action varchar(100) NOT NULL, -- 'work_sample_view', 'work_sample_create', 'profile_view', etc.
  resource_type varchar(50) NOT NULL, -- 'work_sample', 'profile', 'message', etc.
  resource_id uuid,
  
  -- When
  timestamp timestamptz DEFAULT now() NOT NULL,
  
  -- Context
  success boolean DEFAULT true,
  failure_reason text, -- If success = false
  metadata jsonb DEFAULT '{}', -- Additional context (redacted_content_viewed, api_endpoint, etc.)
  
  -- Security flags
  suspicious boolean DEFAULT false, -- Flagged by detection rules
  alert_sent boolean DEFAULT false,
  
  -- Session tracking
  session_id text,
  
  -- Indexes for fast forensic queries
  created_at timestamptz DEFAULT now()
);

-- Indexes for audit log queries
CREATE INDEX idx_audit_user ON security_audit_log(user_id, timestamp DESC);
CREATE INDEX idx_audit_action ON security_audit_log(action, timestamp DESC);
CREATE INDEX idx_audit_resource ON security_audit_log(resource_type, resource_id, timestamp DESC);
CREATE INDEX idx_audit_suspicious ON security_audit_log(suspicious) WHERE suspicious = true;
CREATE INDEX idx_audit_failures ON security_audit_log(success) WHERE success = false;
CREATE INDEX idx_audit_timestamp ON security_audit_log(timestamp DESC);
CREATE INDEX idx_audit_ip ON security_audit_log(ip_address);

-- Partitioning by month for performance (comment in if scaling needed)
-- CREATE TABLE security_audit_log_2024_10 PARTITION OF security_audit_log
--   FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');

-- RLS: Only admins and system can read audit logs
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can see all audit logs (run add_admin_role.sql first!)
CREATE POLICY audit_log_admin_select ON security_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Users can see their own audit logs
CREATE POLICY audit_log_user_select ON security_audit_log
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- No UPDATE or DELETE - audit logs are immutable
CREATE POLICY audit_log_no_update ON security_audit_log
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY audit_log_no_delete ON security_audit_log
  FOR DELETE
  TO authenticated
  USING (false);

-- Function to log access to work samples
CREATE OR REPLACE FUNCTION log_work_sample_access(
  p_user_id uuid,
  p_action varchar(100),
  p_sample_id uuid,
  p_success boolean DEFAULT true,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS void AS $$
DECLARE
  v_user_email text;
BEGIN
  -- Get user email for forensics
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id;
  
  INSERT INTO security_audit_log (
    user_id,
    user_email,
    action,
    resource_type,
    resource_id,
    success,
    metadata
  ) VALUES (
    p_user_id,
    v_user_email,
    p_action,
    'work_sample',
    p_sample_id,
    p_success,
    p_metadata
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect suspicious access patterns
CREATE OR REPLACE FUNCTION detect_suspicious_activity()
RETURNS void AS $$
DECLARE
  v_user RECORD;
BEGIN
  -- Flag users with excessive access (>100 samples in 1 hour = potential scraping)
  FOR v_user IN
    SELECT 
      user_id,
      COUNT(*) as access_count
    FROM security_audit_log
    WHERE action = 'work_sample_view'
      AND timestamp > now() - interval '1 hour'
    GROUP BY user_id
    HAVING COUNT(*) > 100
  LOOP
    -- Flag their recent activity as suspicious
    UPDATE security_audit_log
    SET suspicious = true
    WHERE user_id = v_user.user_id
      AND timestamp > now() - interval '1 hour'
      AND suspicious = false;
      
    -- Could trigger alert here
    -- PERFORM pg_notify('security_alert', json_build_object('user_id', v_user.user_id, 'reason', 'excessive_access')::text);
  END LOOP;
  
  -- Flag access to many different professionals' samples (>20 different professionals in 1 hour)
  FOR v_user IN
    SELECT 
      sal.user_id,
      COUNT(DISTINCT ws.professional_id) as unique_professionals
    FROM security_audit_log sal
    JOIN work_samples ws ON ws.id = sal.resource_id
    WHERE sal.action = 'work_sample_view'
      AND sal.timestamp > now() - interval '1 hour'
    GROUP BY sal.user_id
    HAVING COUNT(DISTINCT ws.professional_id) > 20
  LOOP
    UPDATE security_audit_log
    SET suspicious = true
    WHERE user_id = v_user.user_id
      AND timestamp > now() - interval '1 hour'
      AND suspicious = false;
  END LOOP;
  
  -- Flag failed access attempts (>10 failures in 1 hour = brute force)
  FOR v_user IN
    SELECT 
      user_id,
      COUNT(*) as failure_count
    FROM security_audit_log
    WHERE success = false
      AND timestamp > now() - interval '1 hour'
    GROUP BY user_id
    HAVING COUNT(*) > 10
  LOOP
    UPDATE security_audit_log
    SET suspicious = true
    WHERE user_id = v_user.user_id
      AND timestamp > now() - interval '1 hour'
      AND suspicious = false;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get audit trail for a specific resource
CREATE OR REPLACE FUNCTION get_audit_trail(
  p_resource_type varchar(50),
  p_resource_id uuid,
  p_limit int DEFAULT 100
)
RETURNS TABLE (
  event_timestamp timestamptz,
  user_email text,
  action varchar(100),
  success boolean,
  ip_address inet,
  metadata jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sal.timestamp,
    sal.user_email,
    sal.action,
    sal.success,
    sal.ip_address,
    sal.metadata
  FROM security_audit_log sal
  WHERE sal.resource_type = p_resource_type
    AND sal.resource_id = p_resource_id
  ORDER BY sal.timestamp DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically log work sample views
CREATE OR REPLACE FUNCTION trigger_log_work_sample_view()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log SELECT operations (views)
  IF TG_OP = 'SELECT' THEN
    PERFORM log_work_sample_access(
      auth.uid(),
      'work_sample_view',
      NEW.id,
      true,
      jsonb_build_object(
        'confidentiality_level', NEW.confidentiality_level,
        'professional_id', NEW.professional_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: PostgreSQL doesn't support SELECT triggers
-- Instead, we'll log in the access functions and API endpoints

-- Automatic cleanup: Archive logs older than 2 years (compliance retention)
CREATE OR REPLACE FUNCTION archive_old_audit_logs()
RETURNS void AS $$
BEGIN
  -- Move to archive table (create if needed)
  CREATE TABLE IF NOT EXISTS security_audit_log_archive (LIKE security_audit_log);
  
  INSERT INTO security_audit_log_archive
  SELECT * FROM security_audit_log
  WHERE timestamp < now() - interval '2 years';
  
  DELETE FROM security_audit_log
  WHERE timestamp < now() - interval '2 years';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup (run monthly via cron job or Supabase edge function)
-- SELECT archive_old_audit_logs();

-- Grant permissions
GRANT SELECT ON security_audit_log TO authenticated;
GRANT INSERT ON security_audit_log TO authenticated;
GRANT EXECUTE ON FUNCTION log_work_sample_access(uuid, varchar, uuid, boolean, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION get_audit_trail(varchar, uuid, int) TO authenticated;

-- Comments
COMMENT ON TABLE security_audit_log IS 'Immutable audit log for security forensics and compliance. Tracks all access to sensitive resources.';
COMMENT ON COLUMN security_audit_log.suspicious IS 'Flagged by automated detection rules (excessive access, unusual patterns, etc.)';
COMMENT ON COLUMN security_audit_log.metadata IS 'Additional context: API endpoint, query params, confidentiality level accessed, etc.';
COMMENT ON FUNCTION log_work_sample_access IS 'Log access to work samples for audit trail and breach detection';
COMMENT ON FUNCTION detect_suspicious_activity IS 'Detect and flag suspicious access patterns (scraping, brute force, etc.)';
COMMENT ON FUNCTION get_audit_trail IS 'Get complete audit trail for a specific resource (for investigations)';

-- Example queries for security monitoring:

-- Find all suspicious activity in last 24 hours
-- SELECT * FROM security_audit_log WHERE suspicious = true AND timestamp > now() - interval '24 hours';

-- Find all failed access attempts
-- SELECT user_email, action, failure_reason, COUNT(*) 
-- FROM security_audit_log 
-- WHERE success = false 
-- GROUP BY user_email, action, failure_reason 
-- ORDER BY COUNT(*) DESC;

-- Find users who accessed confidential samples
-- SELECT user_email, COUNT(*) as confidential_views
-- FROM security_audit_log
-- WHERE action = 'work_sample_view'
--   AND metadata->>'confidentiality_level' IN ('encrypted', 'redacted')
-- GROUP BY user_email
-- ORDER BY COUNT(*) DESC;

-- Find access from unusual IPs
-- SELECT DISTINCT ip_address, user_email, COUNT(*)
-- FROM security_audit_log
-- WHERE timestamp > now() - interval '24 hours'
-- GROUP BY ip_address, user_email
-- HAVING COUNT(*) > 50;

-- Copy and paste: supabase/migrations/add_admin_role.sql
-- But FIRST, edit line 32 to use YOUR email address:
SELECT make_user_admin('your-actual-email@example.com');

-- Copy and paste: supabase/migrations/add_security_audit_logging.sql
-- This will now work because the role column exists!

-- Copy and paste: supabase/migrations/harden_work_samples_security.sql

-- Replace with YOUR email
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'mattchenard2009@gmail.com';

-- Verify it worked
SELECT id, email, role FROM profiles WHERE role = 'admin';
