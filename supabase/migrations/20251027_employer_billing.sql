-- Employer Billing & Subscription System
-- Adds billing fields to organizations table for Glassdoor-style pricing

-- Add billing columns to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'professional', 'enterprise'));
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_price numeric(10,2) DEFAULT 0.00;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly', 'one-time'));
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS job_post_limit int DEFAULT 0; -- 0 = free tier, -1 = unlimited
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS job_posts_used int DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS next_renewal_date timestamptz;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'incomplete', 'trialing'));
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

-- Create index for Stripe lookups
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer ON organizations(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_subscription ON organizations(stripe_subscription_id);

-- Professional Promotions (Portfolio Boost) - Add Stripe payment tracking
ALTER TABLE professional_promotions ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;
ALTER TABLE professional_promotions ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE professional_promotions ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly', 'one-time'));

CREATE INDEX IF NOT EXISTS idx_promotions_stripe_payment ON professional_promotions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_promotions_stripe_subscription ON professional_promotions(stripe_subscription_id);

-- Function to check if employer can post job
CREATE OR REPLACE FUNCTION can_post_job(org_id uuid)
RETURNS boolean AS $$
DECLARE
  org_record organizations%ROWTYPE;
BEGIN
  SELECT * INTO org_record FROM organizations WHERE id = org_id;
  
  -- Unlimited plan
  IF org_record.job_post_limit = -1 THEN
    RETURN true;
  END IF;
  
  -- Check if under limit
  IF org_record.job_posts_used < org_record.job_post_limit THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to increment job post usage
CREATE OR REPLACE FUNCTION increment_job_posts_used(org_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE organizations 
  SET job_posts_used = job_posts_used + 1
  WHERE id = org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset job post usage (for monthly plans)
CREATE OR REPLACE FUNCTION reset_job_posts_usage(org_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE organizations 
  SET job_posts_used = 0
  WHERE id = org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to track job post creation
CREATE OR REPLACE FUNCTION trg_track_job_post_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment usage counter for the employer's organization
  IF NEW.employer_id IS NOT NULL THEN
    PERFORM increment_job_posts_used(
      (SELECT organization_id FROM profiles WHERE id = NEW.employer_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_increment_job_posts ON job_postings;

-- Create trigger on job_postings table
CREATE TRIGGER trg_increment_job_posts
  AFTER INSERT ON job_postings
  FOR EACH ROW
  EXECUTE FUNCTION trg_track_job_post_creation();

-- Subscription pricing reference (for documentation)
COMMENT ON COLUMN organizations.subscription_tier IS 'Pricing: free (0 posts), basic ($249/1 post/mo), professional ($949/10 posts/mo), enterprise ($2499/unlimited/yr)';
COMMENT ON COLUMN organizations.job_post_limit IS '0 = free tier, positive number = limit, -1 = unlimited';

-- Portfolio boost pricing reference
COMMENT ON TABLE professional_promotions IS 'Portfolio Boost Pricing: standard ($19/mo), premium ($49/mo), featured ($99/mo)';
