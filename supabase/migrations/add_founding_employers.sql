-- Migration: Add Founding Employers Program
-- Description: First 5 employers get 1 month free Pro tier + founding badge

-- Add founding employer columns to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS is_founding_employer boolean DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS founding_employer_number integer;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS pro_expires_at timestamptz;

-- Create index for quick founding employer queries
CREATE INDEX IF NOT EXISTS idx_organizations_founding ON organizations(is_founding_employer) WHERE is_founding_employer = true;

-- Add comments
COMMENT ON COLUMN organizations.is_founding_employer IS 'True for first 5 employers - gets 1 month free Pro';
COMMENT ON COLUMN organizations.founding_employer_number IS 'Sequential number (1-5) for founding employers';
COMMENT ON COLUMN organizations.pro_expires_at IS 'When Pro tier expires (null = lifetime for some promotions)';

-- Function to assign founding employer status
CREATE OR REPLACE FUNCTION assign_founding_employer()
RETURNS trigger AS $$
DECLARE
  current_count integer;
BEGIN
  -- Only run on INSERT
  IF TG_OP = 'INSERT' THEN
    -- Count existing founding employers
    SELECT COUNT(*) INTO current_count
    FROM organizations
    WHERE is_founding_employer = true;
    
    -- If less than 5, make this a founding employer
    IF current_count < 5 THEN
      NEW.is_founding_employer := true;
      NEW.founding_employer_number := current_count + 1;
      NEW.subscription_tier := 'pro';
      -- Set expiration to 1 month from now
      NEW.pro_expires_at := now() + interval '1 month';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-assigning founding employer status
DROP TRIGGER IF EXISTS trigger_assign_founding_employer ON organizations;
CREATE TRIGGER trigger_assign_founding_employer
  BEFORE INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION assign_founding_employer();

-- View to check founding employer status
CREATE OR REPLACE VIEW founding_employers_status AS
SELECT 
  o.id,
  o.name,
  o.founding_employer_number,
  o.subscription_tier,
  o.pro_expires_at,
  o.created_at,
  p.email as owner_email,
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
LEFT JOIN profiles p ON o.created_by = p.id
WHERE o.is_founding_employer = true
ORDER BY o.founding_employer_number;

-- Grant access
GRANT SELECT ON founding_employers_status TO authenticated;

-- Query to check how many spots are left
CREATE OR REPLACE FUNCTION founding_employer_spots_remaining()
RETURNS integer AS $$
DECLARE
  taken integer;
BEGIN
  SELECT COUNT(*) INTO taken
  FROM organizations
  WHERE is_founding_employer = true;
  
  RETURN GREATEST(0, 5 - taken);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
