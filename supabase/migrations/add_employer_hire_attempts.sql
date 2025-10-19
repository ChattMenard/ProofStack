-- Track employer hire attempts to enforce free tier limits
-- Employers can browse freely but only attempt to hire 3 professionals before upgrading

-- Add columns to track hire attempts
ALTER TABLE employer_organizations 
ADD COLUMN IF NOT EXISTS hire_attempts_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS hire_attempts_limit integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS last_hire_attempt_at timestamptz;

COMMENT ON COLUMN employer_organizations.hire_attempts_count IS 'Number of times employer has attempted to hire (failed attempts)';
COMMENT ON COLUMN employer_organizations.hire_attempts_limit IS 'Maximum free hire attempts allowed (default 3)';
COMMENT ON COLUMN employer_organizations.last_hire_attempt_at IS 'Timestamp of most recent hire attempt';

-- Create hire_attempts tracking table for detailed history
CREATE TABLE IF NOT EXISTS hire_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_org_id uuid NOT NULL REFERENCES employer_organizations(id) ON DELETE CASCADE,
  employer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  attempt_type text NOT NULL CHECK (attempt_type IN ('message', 'contact_request', 'hire_button')),
  was_successful boolean DEFAULT false,
  blocked_reason text, -- 'free_limit_reached', 'requires_upgrade', etc.
  upgraded_after boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_hire_attempts_employer ON hire_attempts(employer_org_id, attempted_at DESC);
CREATE INDEX idx_hire_attempts_professional ON hire_attempts(professional_id, attempted_at DESC);
CREATE INDEX idx_hire_attempts_successful ON hire_attempts(was_successful, attempted_at DESC);

COMMENT ON TABLE hire_attempts IS 'Tracks every time an employer attempts to hire/contact a professional';
COMMENT ON COLUMN hire_attempts.attempt_type IS 'How they tried to contact: message, contact_request, hire_button';
COMMENT ON COLUMN hire_attempts.was_successful IS 'Whether the attempt went through (true) or was blocked (false)';
COMMENT ON COLUMN hire_attempts.blocked_reason IS 'Why attempt was blocked if unsuccessful';
COMMENT ON COLUMN hire_attempts.upgraded_after IS 'Whether employer upgraded their plan after this attempt';

-- Function to check if employer can attempt to hire
CREATE OR REPLACE FUNCTION can_employer_hire(p_employer_org_id uuid)
RETURNS jsonb AS $$
DECLARE
  org_record RECORD;
  failed_attempts integer;
  can_hire boolean;
  reason text;
BEGIN
  -- Get organization details
  SELECT 
    subscription_tier,
    hire_attempts_count,
    hire_attempts_limit,
    is_founding_employer
  INTO org_record
  FROM employer_organizations
  WHERE id = p_employer_org_id;

  -- If not found
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'can_hire', false,
      'reason', 'Organization not found',
      'attempts_remaining', 0
    );
  END IF;

  -- Pro tier or founding employers have unlimited attempts
  IF org_record.subscription_tier = 'pro' OR org_record.is_founding_employer = true THEN
    RETURN jsonb_build_object(
      'can_hire', true,
      'reason', 'Unlimited (Pro/Founding)',
      'attempts_remaining', 999,
      'is_unlimited', true
    );
  END IF;

  -- Count failed attempts (unsuccessful attempts)
  SELECT COUNT(*) INTO failed_attempts
  FROM hire_attempts
  WHERE employer_org_id = p_employer_org_id
    AND was_successful = false;

  -- Check if under limit
  can_hire := failed_attempts < org_record.hire_attempts_limit;

  IF can_hire THEN
    reason := format('Free tier - %s attempts remaining', 
                     org_record.hire_attempts_limit - failed_attempts);
  ELSE
    reason := 'Free tier limit reached - upgrade to Pro for unlimited hiring';
  END IF;

  RETURN jsonb_build_object(
    'can_hire', can_hire,
    'reason', reason,
    'attempts_used', failed_attempts,
    'attempts_remaining', GREATEST(0, org_record.hire_attempts_limit - failed_attempts),
    'limit', org_record.hire_attempts_limit,
    'is_unlimited', false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record a hire attempt
CREATE OR REPLACE FUNCTION record_hire_attempt(
  p_employer_org_id uuid,
  p_employer_user_id uuid,
  p_professional_id uuid,
  p_attempt_type text,
  p_was_successful boolean DEFAULT false,
  p_blocked_reason text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  attempt_id uuid;
  new_count integer;
BEGIN
  -- Insert the attempt record
  INSERT INTO hire_attempts (
    employer_org_id,
    employer_user_id,
    professional_id,
    attempt_type,
    was_successful,
    blocked_reason
  ) VALUES (
    p_employer_org_id,
    p_employer_user_id,
    p_professional_id,
    p_attempt_type,
    p_was_successful,
    p_blocked_reason
  )
  RETURNING id INTO attempt_id;

  -- Update organization's attempt count (only count failed attempts)
  IF p_was_successful = false THEN
    UPDATE employer_organizations
    SET 
      hire_attempts_count = hire_attempts_count + 1,
      last_hire_attempt_at = now()
    WHERE id = p_employer_org_id
    RETURNING hire_attempts_count INTO new_count;
  END IF;

  RETURN jsonb_build_object(
    'attempt_id', attempt_id,
    'recorded', true,
    'total_failed_attempts', new_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and enforce hire limits (call this before allowing contact)
CREATE OR REPLACE FUNCTION check_hire_limit_and_record(
  p_employer_org_id uuid,
  p_employer_user_id uuid,
  p_professional_id uuid,
  p_attempt_type text
)
RETURNS jsonb AS $$
DECLARE
  eligibility jsonb;
  can_proceed boolean;
  attempt_result jsonb;
BEGIN
  -- Check if they can hire
  eligibility := can_employer_hire(p_employer_org_id);
  can_proceed := (eligibility->>'can_hire')::boolean;

  -- If they can't hire, record the failed attempt
  IF NOT can_proceed THEN
    attempt_result := record_hire_attempt(
      p_employer_org_id,
      p_employer_user_id,
      p_professional_id,
      p_attempt_type,
      false, -- was_successful = false
      eligibility->>'reason' -- blocked_reason
    );

    RETURN jsonb_build_object(
      'allowed', false,
      'reason', eligibility->>'reason',
      'attempts_remaining', (eligibility->>'attempts_remaining')::integer,
      'requires_upgrade', true,
      'attempt_recorded', true
    );
  END IF;

  -- They can proceed - record successful attempt
  attempt_result := record_hire_attempt(
    p_employer_org_id,
    p_employer_user_id,
    p_professional_id,
    p_attempt_type,
    true, -- was_successful = true
    NULL
  );

  RETURN jsonb_build_object(
    'allowed', true,
    'reason', eligibility->>'reason',
    'attempts_remaining', (eligibility->>'attempts_remaining')::integer,
    'requires_upgrade', false,
    'attempt_recorded', true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies for hire_attempts table
ALTER TABLE hire_attempts ENABLE ROW LEVEL SECURITY;

-- Employers can view their own attempts
CREATE POLICY "Employers can view their hire attempts"
  ON hire_attempts
  FOR SELECT
  USING (
    employer_user_id = auth.uid()
    OR 
    employer_org_id IN (
      SELECT id FROM employer_organizations WHERE owner_id = auth.uid()
    )
  );

-- Professionals can see attempts to hire them
CREATE POLICY "Professionals can see hire attempts on them"
  ON hire_attempts
  FOR SELECT
  USING (professional_id = auth.uid());

-- Only system can insert (via functions)
CREATE POLICY "System can insert hire attempts"
  ON hire_attempts
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION can_employer_hire(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION record_hire_attempt(uuid, uuid, uuid, text, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION check_hire_limit_and_record(uuid, uuid, uuid, text) TO authenticated;
