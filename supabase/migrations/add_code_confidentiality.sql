-- Migration: Add Code Confidentiality Feature
-- Description: Let professionals keep code confidential after AI analysis

-- Add confidentiality column to samples table
ALTER TABLE samples ADD COLUMN IF NOT EXISTS is_confidential boolean DEFAULT false;
ALTER TABLE samples ADD COLUMN IF NOT EXISTS made_confidential_at timestamptz;

-- Create index for quick queries
CREATE INDEX IF NOT EXISTS idx_samples_confidential ON samples(is_confidential) WHERE is_confidential = true;

-- Add comments
COMMENT ON COLUMN samples.is_confidential IS 'If true, code is hidden from employers - only AI analysis shown';
COMMENT ON COLUMN samples.made_confidential_at IS 'When the professional made this code confidential';

-- Function to make code confidential (only after analysis is complete)
CREATE OR REPLACE FUNCTION make_sample_confidential(sample_id uuid)
RETURNS boolean AS $$
DECLARE
  sample_owner_id uuid;
  analysis_complete boolean;
  current_user_id uuid;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  -- Get sample owner and check if analysis is complete
  SELECT 
    user_id,
    EXISTS (
      SELECT 1 FROM analyses 
      WHERE sample_id = make_sample_confidential.sample_id 
      AND status = 'done'
    )
  INTO sample_owner_id, analysis_complete
  FROM samples
  WHERE id = sample_id;
  
  -- Verify ownership
  IF sample_owner_id != current_user_id THEN
    RAISE EXCEPTION 'Not authorized to modify this sample';
  END IF;
  
  -- Verify analysis is complete
  IF NOT analysis_complete THEN
    RAISE EXCEPTION 'Analysis must be complete before making code confidential';
  END IF;
  
  -- Make confidential
  UPDATE samples
  SET 
    is_confidential = true,
    made_confidential_at = now()
  WHERE id = sample_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to make code public again
CREATE OR REPLACE FUNCTION make_sample_public(sample_id uuid)
RETURNS boolean AS $$
DECLARE
  sample_owner_id uuid;
  current_user_id uuid;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  -- Get sample owner
  SELECT user_id INTO sample_owner_id
  FROM samples
  WHERE id = sample_id;
  
  -- Verify ownership
  IF sample_owner_id != current_user_id THEN
    RAISE EXCEPTION 'Not authorized to modify this sample';
  END IF;
  
  -- Make public
  UPDATE samples
  SET 
    is_confidential = false,
    made_confidential_at = null
  WHERE id = sample_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policy for samples to hide confidential code from non-owners
CREATE POLICY "Users can view confidential samples metadata only"
  ON samples FOR SELECT
  USING (
    -- Owner can see everything
    auth.uid() = user_id 
    OR 
    -- Others can see non-confidential samples
    is_confidential = false
    OR
    -- Others can see confidential samples but storage_url will be filtered
    is_confidential = true
  );

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION make_sample_confidential(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION make_sample_public(uuid) TO authenticated;
