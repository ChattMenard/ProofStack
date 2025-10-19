-- ProofStack Employer/Organization Platform Migration
-- This adds the complete foundation for the two-sided marketplace
-- Run this in Supabase SQL Editor: https://lytjmxjizalmgbgrgfvc.supabase.co

-- ============================================================================
-- PART 1: ENUMS & USER TYPE SYSTEM
-- ============================================================================

-- Create user type enum
DO $$ BEGIN
    CREATE TYPE user_type AS ENUM ('professional', 'employer', 'organization');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add user_type column to profiles (if not exists)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS user_type user_type DEFAULT 'professional',
ADD COLUMN IF NOT EXISTS organization_id uuid,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS remote_available boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS availability_status text DEFAULT 'available',
ADD COLUMN IF NOT EXISTS years_experience integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS headline text,
ADD COLUMN IF NOT EXISTS contact_preferences jsonb DEFAULT '{}'::jsonb;

-- ============================================================================
-- PART 2: ORGANIZATIONS
-- ============================================================================

-- Organizations table for employer companies
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  website text,
  industry text,
  company_size text, -- '1-10', '11-50', '51-200', '201-500', '500+'
  logo_url text,
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  subscription_tier text DEFAULT 'free', -- 'free', 'basic', 'pro', 'enterprise'
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text,
  is_verified boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON organizations(created_by);
CREATE INDEX IF NOT EXISTS idx_organizations_tier ON organizations(subscription_tier);

-- Organization members (team management)
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'member', -- 'owner', 'admin', 'recruiter', 'member'
  invited_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  invited_at timestamptz DEFAULT now(),
  joined_at timestamptz,
  is_active boolean DEFAULT true,
  UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(role);

-- Add foreign key for organization_id in profiles
ALTER TABLE profiles
ADD CONSTRAINT fk_profiles_organization 
FOREIGN KEY (organization_id) 
REFERENCES organizations(id) 
ON DELETE SET NULL;

-- ============================================================================
-- PART 3: PROFESSIONAL PROMOTIONS (ADVERTISING)
-- ============================================================================

-- Professional promotion tiers
CREATE TABLE IF NOT EXISTS professional_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  tier text NOT NULL, -- 'featured', 'premium', 'standard'
  starts_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  payment_amount decimal(10,2),
  stripe_payment_intent text,
  stripe_subscription_id text,
  is_active boolean DEFAULT true,
  views_count integer DEFAULT 0,
  saves_count integer DEFAULT 0,
  messages_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_promotions_professional ON professional_promotions(professional_id);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON professional_promotions(is_active, expires_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_promotions_tier ON professional_promotions(tier, is_active);

-- ============================================================================
-- PART 4: REVIEWS & RATINGS
-- ============================================================================

-- Employer reviews (Employer → Professional)
CREATE TABLE IF NOT EXISTS employer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  employer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  would_hire_again boolean,
  work_period_start date,
  work_period_end date,
  position_title text,
  skills_used text[],
  is_verified boolean DEFAULT false,
  is_public boolean DEFAULT true,
  reported boolean DEFAULT false,
  report_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(professional_id, employer_id, work_period_start)
);

CREATE INDEX IF NOT EXISTS idx_reviews_professional ON employer_reviews(professional_id) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_reviews_employer ON employer_reviews(employer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_organization ON employer_reviews(organization_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON employer_reviews(rating);

-- Professional aggregate ratings (materialized for performance)
CREATE TABLE IF NOT EXISTS professional_ratings (
  professional_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  average_rating decimal(3,2),
  total_reviews integer DEFAULT 0,
  five_star_count integer DEFAULT 0,
  four_star_count integer DEFAULT 0,
  three_star_count integer DEFAULT 0,
  two_star_count integer DEFAULT 0,
  one_star_count integer DEFAULT 0,
  would_hire_again_percentage decimal(5,2),
  last_review_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Function to update professional ratings
CREATE OR REPLACE FUNCTION update_professional_ratings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO professional_ratings (
    professional_id,
    average_rating,
    total_reviews,
    five_star_count,
    four_star_count,
    three_star_count,
    two_star_count,
    one_star_count,
    would_hire_again_percentage,
    last_review_at,
    updated_at
  )
  SELECT
    professional_id,
    AVG(rating)::decimal(3,2),
    COUNT(*)::integer,
    COUNT(*) FILTER (WHERE rating = 5)::integer,
    COUNT(*) FILTER (WHERE rating = 4)::integer,
    COUNT(*) FILTER (WHERE rating = 3)::integer,
    COUNT(*) FILTER (WHERE rating = 2)::integer,
    COUNT(*) FILTER (WHERE rating = 1)::integer,
    (COUNT(*) FILTER (WHERE would_hire_again = true) * 100.0 / COUNT(*))::decimal(5,2),
    MAX(created_at),
    now()
  FROM employer_reviews
  WHERE professional_id = COALESCE(NEW.professional_id, OLD.professional_id)
    AND is_public = true
  GROUP BY professional_id
  ON CONFLICT (professional_id) DO UPDATE SET
    average_rating = EXCLUDED.average_rating,
    total_reviews = EXCLUDED.total_reviews,
    five_star_count = EXCLUDED.five_star_count,
    four_star_count = EXCLUDED.four_star_count,
    three_star_count = EXCLUDED.three_star_count,
    two_star_count = EXCLUDED.two_star_count,
    one_star_count = EXCLUDED.one_star_count,
    would_hire_again_percentage = EXCLUDED.would_hire_again_percentage,
    last_review_at = EXCLUDED.last_review_at,
    updated_at = now();
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update ratings
DROP TRIGGER IF EXISTS trigger_update_professional_ratings ON employer_reviews;
CREATE TRIGGER trigger_update_professional_ratings
  AFTER INSERT OR UPDATE OR DELETE ON employer_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_professional_ratings();

-- ============================================================================
-- PART 5: MESSAGING SYSTEM
-- ============================================================================

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

-- Conversation participants
CREATE TABLE IF NOT EXISTS conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  last_read_at timestamptz,
  is_archived boolean DEFAULT false,
  is_muted boolean DEFAULT false,
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_unread ON conversation_participants(user_id, last_read_at);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  attachment_url text,
  attachment_type text,
  is_read boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(conversation_id, is_read) WHERE is_read = false;

-- Function to update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at,
      updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for conversation timestamps
DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON messages;
CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- ============================================================================
-- PART 6: CONNECTIONS & SAVED CANDIDATES
-- ============================================================================

-- Connection requests (Employer ↔ Professional)
CREATE TABLE IF NOT EXISTS connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'blocked'
  message text,
  conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE(employer_id, professional_id)
);

CREATE INDEX IF NOT EXISTS idx_connections_employer ON connections(employer_id, status);
CREATE INDEX IF NOT EXISTS idx_connections_professional ON connections(professional_id, status);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);

-- Employer saved candidates
CREATE TABLE IF NOT EXISTS saved_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  notes text,
  tags text[],
  folder text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employer_id, professional_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_employer ON saved_candidates(employer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_professional ON saved_candidates(professional_id);
CREATE INDEX IF NOT EXISTS idx_saved_tags ON saved_candidates USING gin(tags);

-- ============================================================================
-- PART 7: SEARCH & DISCOVERY
-- ============================================================================

-- Search history (for analytics)
CREATE TABLE IF NOT EXISTS search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  query text,
  filters jsonb DEFAULT '{}'::jsonb,
  results_count integer,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_employer ON search_history(employer_id, created_at DESC);

-- Profile views tracking
CREATE TABLE IF NOT EXISTS profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  source text, -- 'search', 'saved', 'direct', 'promotion'
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_views_profile ON profile_views(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_views_viewer ON profile_views(viewer_id, created_at DESC);

-- ============================================================================
-- PART 8: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- Organizations: Members can read, owners/admins can update
CREATE POLICY "Members can view their organizations"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Owners can update organizations"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND is_active = true
    )
  );

-- Reviews: Anyone can read public reviews, only review authors can update/delete
CREATE POLICY "Anyone can read public reviews"
  ON employer_reviews FOR SELECT
  USING (is_public = true OR employer_id = auth.uid() OR professional_id = auth.uid());

CREATE POLICY "Employers can create reviews"
  ON employer_reviews FOR INSERT
  WITH CHECK (employer_id = auth.uid());

CREATE POLICY "Review authors can update their reviews"
  ON employer_reviews FOR UPDATE
  USING (employer_id = auth.uid() AND (now() - created_at) < interval '48 hours');

-- Messages: Only conversation participants can read/write
CREATE POLICY "Participants can read messages"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

-- Connections: Both parties can read, employers can create
CREATE POLICY "Parties can view connections"
  ON connections FOR SELECT
  USING (employer_id = auth.uid() OR professional_id = auth.uid());

CREATE POLICY "Employers can create connections"
  ON connections FOR INSERT
  WITH CHECK (employer_id = auth.uid());

-- Saved candidates: Only employer can read/write their saves
CREATE POLICY "Employers can manage saved candidates"
  ON saved_candidates FOR ALL
  USING (employer_id = auth.uid())
  WITH CHECK (employer_id = auth.uid());

-- ============================================================================
-- PART 9: HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user is part of organization
CREATE OR REPLACE FUNCTION is_organization_member(org_id uuid, user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
      AND organization_members.user_id = is_organization_member.user_id
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active promotion for professional
CREATE OR REPLACE FUNCTION get_active_promotion(prof_id uuid)
RETURNS professional_promotions AS $$
  SELECT * FROM professional_promotions
  WHERE professional_id = prof_id
    AND is_active = true
    AND now() BETWEEN starts_at AND expires_at
  ORDER BY 
    CASE tier
      WHEN 'featured' THEN 1
      WHEN 'premium' THEN 2
      WHEN 'standard' THEN 3
    END
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add comment to track migration
COMMENT ON TABLE organizations IS 'Employer/Organization platform - Phase 1 migration';
