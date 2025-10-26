-- Professional Preferences - "Hard Nos" system
-- Allows professionals to set dealbreakers that employers see upfront

CREATE TABLE IF NOT EXISTS professional_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Work arrangement
  remote_only boolean DEFAULT false,
  no_office_required boolean DEFAULT false,
  hybrid_acceptable boolean DEFAULT true,
  
  -- Compensation
  min_hourly_rate integer, -- USD per hour
  min_annual_salary integer, -- USD per year
  equity_required boolean DEFAULT false,
  equity_preferred boolean DEFAULT false,
  
  -- Work style
  no_agencies boolean DEFAULT false,
  no_contract_to_hire boolean DEFAULT false,
  no_unpaid_trials boolean DEFAULT true,
  async_preferred boolean DEFAULT false,
  max_meetings_per_day integer DEFAULT 4,
  
  -- Schedule
  no_oncall boolean DEFAULT false,
  no_weekends boolean DEFAULT true,
  timezone_requirement text, -- e.g., "Must overlap with EST 9am-2pm"
  
  -- Company preferences
  no_early_stage_startups boolean DEFAULT false,
  no_enterprise boolean DEFAULT false,
  series_a_plus_only boolean DEFAULT false,
  
  -- Tech preferences
  excluded_technologies text[], -- e.g., ["PHP", "Java", "WordPress"]
  required_technologies text[], -- e.g., ["TypeScript", "React", "PostgreSQL"]
  
  -- Availability
  availability_status text DEFAULT 'open', -- 'open', 'passive', 'exceptional_only', 'not_available'
  available_start_date date,
  
  -- Other dealbreakers
  no_travel boolean DEFAULT false,
  max_travel_percent integer DEFAULT 0, -- Percentage of time willing to travel
  visa_sponsorship_required boolean DEFAULT false,
  
  -- Visibility
  show_preferences_to_employers boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for lookups
CREATE INDEX idx_prof_prefs_profile ON professional_preferences(profile_id);
CREATE INDEX idx_prof_prefs_availability ON professional_preferences(availability_status);

-- RLS Policies
ALTER TABLE professional_preferences ENABLE ROW LEVEL SECURITY;

-- Users can read their own preferences
CREATE POLICY "Users can view own preferences"
ON professional_preferences
FOR SELECT
USING (profile_id IN (SELECT id FROM profiles WHERE auth_uid = auth.uid()::text));

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences"
ON professional_preferences
FOR UPDATE
USING (profile_id IN (SELECT id FROM profiles WHERE auth_uid = auth.uid()::text))
WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE auth_uid = auth.uid()::text));

-- Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
ON professional_preferences
FOR INSERT
WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE auth_uid = auth.uid()::text));

-- Employers can view preferences of profiles they can see
CREATE POLICY "Employers can view preferences"
ON professional_preferences
FOR SELECT
TO authenticated
USING (show_preferences_to_employers = true);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_professional_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER professional_preferences_updated_at
BEFORE UPDATE ON professional_preferences
FOR EACH ROW
EXECUTE FUNCTION update_professional_preferences_updated_at();
