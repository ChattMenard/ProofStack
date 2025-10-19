-- Migration: Fix Founding Employers - Earn Through Work, Not Auto-Assigned
-- Description: First 10 employers who complete work AND leave reviews get founding status

-- Remove the auto-assignment trigger (wrong approach)
DROP TRIGGER IF EXISTS trigger_assign_founding_employer ON organizations;
DROP FUNCTION IF EXISTS assign_founding_employer();

-- Add new function to manually grant founding employer status
-- Called AFTER an employer completes work and leaves a review
CREATE OR REPLACE FUNCTION grant_founding_employer_status(employer_org_id uuid)
RETURNS boolean AS $$
DECLARE
  current_count integer;
  next_number integer;
  already_founding boolean;
  has_reviews boolean;
BEGIN
  -- Check if already a founding employer
  SELECT is_founding_employer INTO already_founding
  FROM organizations
  WHERE id = employer_org_id;
  
  IF already_founding THEN
    RETURN false; -- Already has it
  END IF;
  
  -- Verify they have at least one review (proof of work completion)
  SELECT EXISTS (
    SELECT 1 FROM reviews 
    WHERE employer_id = (SELECT employer_id FROM organizations WHERE id = employer_org_id)
  ) INTO has_reviews;
  
  IF NOT has_reviews THEN
    RETURN false; -- Must have completed work and left review
  END IF;
  
  -- Count existing founding employers
  SELECT COUNT(*) INTO current_count
  FROM organizations
  WHERE is_founding_employer = true;
  
  -- If less than 10 spots taken, grant founding status
  IF current_count < 10 THEN
    next_number := current_count + 1;
    
    UPDATE organizations
    SET 
      is_founding_employer = true,
      founding_employer_number = next_number,
      subscription_tier = 'pro',
      pro_expires_at = now() + interval '1 month'
    WHERE id = employer_org_id;
    
    RETURN true;
  ELSE
    RETURN false; -- All 10 spots taken
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if employer qualifies for founding status
CREATE OR REPLACE FUNCTION check_founding_employer_eligibility(employer_org_id uuid)
RETURNS jsonb AS $$
DECLARE
  current_count integer;
  has_reviews boolean;
  already_founding boolean;
  result jsonb;
BEGIN
  -- Check current founding employer count
  SELECT COUNT(*) INTO current_count
  FROM organizations
  WHERE is_founding_employer = true;
  
  -- Check if already founding employer
  SELECT is_founding_employer INTO already_founding
  FROM organizations
  WHERE id = employer_org_id;
  
  -- Check if they have reviews
  SELECT EXISTS (
    SELECT 1 FROM reviews 
    WHERE employer_id = (SELECT employer_id FROM organizations WHERE id = employer_org_id)
  ) INTO has_reviews;
  
  -- Build result
  result := jsonb_build_object(
    'spots_remaining', GREATEST(0, 10 - current_count),
    'has_reviews', has_reviews,
    'already_founding', already_founding,
    'qualifies', (current_count < 10 AND has_reviews AND NOT already_founding)
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-check and grant founding status AFTER a review is submitted
CREATE OR REPLACE FUNCTION auto_grant_founding_after_review()
RETURNS trigger AS $$
DECLARE
  org_id uuid;
  granted boolean;
BEGIN
  -- Get the employer's organization ID
  SELECT o.id INTO org_id
  FROM organizations o
  WHERE o.employer_id = NEW.employer_id;
  
  -- Try to grant founding employer status
  SELECT grant_founding_employer_status(org_id) INTO granted;
  
  -- No need to do anything with the result, just try it
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on reviews table
DROP TRIGGER IF EXISTS trigger_auto_grant_founding ON reviews;
CREATE TRIGGER trigger_auto_grant_founding
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION auto_grant_founding_after_review();

-- Update comments for clarity
COMMENT ON COLUMN organizations.is_founding_employer IS 'True for first 10 employers who completed work AND left reviews';
COMMENT ON COLUMN organizations.founding_employer_number IS 'Sequential number (1-10) for founding employers based on review order';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION grant_founding_employer_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION check_founding_employer_eligibility(uuid) TO authenticated;

-- Update the view to show review count
CREATE OR REPLACE VIEW founding_employers_status AS
SELECT 
  o.id,
  o.name,
  o.founding_employer_number,
  o.subscription_tier,
  o.pro_expires_at,
  o.created_at,
  p.email as owner_email,
  (SELECT COUNT(*) FROM reviews WHERE employer_id = o.employer_id) as total_reviews,
  CASE 
    WHEN o.pro_expires_at IS NULL THEN 'Lifetime'
    WHEN o.pro_expires_at > now() THEN 'Active'
    ELSE 'Expired'
  END as status,
  CASE 
    WHEN o.pro_expires_at > now() THEN 
      EXTRACT(DAY FROM (o.pro_expires_at - now())) || ' days remaining'
    ELSE 'Expired'
  END as time_remaining
FROM organizations o
LEFT JOIN profiles p ON o.employer_id = p.id
WHERE o.is_founding_employer = true
ORDER BY o.founding_employer_number;
