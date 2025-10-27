-- Skill Level System
-- 4-tier developer hierarchy: Junior → Mid → Senior → Lead
-- Skill Level System
-- 4-tier developer hierarchy: Junior → Mid → Senior → Lead

-- Make migration atomic
BEGIN;

-- Create a safer enum type for skill levels if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'skill_level_t') THEN
    CREATE TYPE public.skill_level_t AS ENUM ('junior','mid','senior','lead','unverified');
  END IF;
END$$;

-- Add/ensure `skill_level` column exists and is the enum type (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'skill_level'
  ) THEN
    ALTER TABLE profiles
      ADD COLUMN skill_level public.skill_level_t DEFAULT 'unverified';
  ELSE
    -- If column exists but is not the enum, convert it safely
    IF (SELECT udt_name FROM information_schema.columns WHERE table_name='profiles' AND column_name='skill_level') <> 'skill_level_t' THEN
      -- Drop the CHECK constraint if it exists (from old text column definition)
      ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_skill_level_check;
      
      -- Drop any existing default first (avoids cast errors)
      ALTER TABLE profiles ALTER COLUMN skill_level DROP DEFAULT;

      -- First ensure column is text type (safe no-op if already text)
      ALTER TABLE profiles ALTER COLUMN skill_level TYPE text;

      -- Now convert text to enum with value mapping
      ALTER TABLE profiles
        ALTER COLUMN skill_level TYPE public.skill_level_t
        USING (CASE 
          WHEN skill_level IN ('junior','mid','senior','lead','unverified') 
          THEN skill_level::public.skill_level_t
          ELSE 'unverified'::public.skill_level_t
        END);

      -- Restore sensible default
      ALTER TABLE profiles ALTER COLUMN skill_level SET DEFAULT 'unverified'::public.skill_level_t;
    END IF;
  END IF;
END$$;

-- Additional profile metadata columns (idempotent)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS skill_level_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

-- Skill assessments table
CREATE TABLE IF NOT EXISTS skill_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Assessment type
  assessment_type text NOT NULL, -- 'coding_challenge', 'technical_quiz', 'portfolio_review', 'project_complexity'
  target_level public.skill_level_t NOT NULL,

  -- Results
  score int CHECK (score >= 0 AND score <= 100),
  passed boolean DEFAULT false,

  -- Details
  questions_data jsonb, -- Store questions and answers
  time_taken_seconds int,

  -- Metadata
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),

  -- Only one assessment per type per level
  UNIQUE(profile_id, assessment_type, target_level)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_skill_assessments_profile ON skill_assessments(profile_id);
CREATE INDEX IF NOT EXISTS idx_skill_assessments_level ON skill_assessments(target_level);
-- Partial index to accelerate counts for 'passed' assessments
CREATE INDEX IF NOT EXISTS idx_skill_assessments_passed_level ON skill_assessments(profile_id, target_level) WHERE passed = true;

-- RLS Policies
ALTER TABLE skill_assessments ENABLE ROW LEVEL SECURITY;

-- Users can view their own assessments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policy WHERE polname = 'Users can view own assessments' AND polrelid = 'skill_assessments'::regclass
  ) THEN
    CREATE POLICY "Users can view own assessments"
      ON skill_assessments FOR SELECT
      USING (profile_id IN (SELECT id FROM profiles WHERE auth_uid = auth.uid()::text));
  END IF;
END$$;

-- Users can insert their own assessments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policy WHERE polname = 'Users can insert own assessments' AND polrelid = 'skill_assessments'::regclass
  ) THEN
    CREATE POLICY "Users can insert own assessments"
      ON skill_assessments FOR INSERT
      WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE auth_uid = auth.uid()::text));
  END IF;
END$$;

-- Admins can view all assessments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policy WHERE polname = 'Admins can view all assessments' AND polrelid = 'skill_assessments'::regclass
  ) THEN
    CREATE POLICY "Admins can view all assessments"
      ON skill_assessments FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.auth_uid = auth.uid()::text 
          AND profiles.is_admin = true
        )
      );
  END IF;
END$$;

-- Function to calculate skill level based on assessments
-- Drop existing function if return type is different (text vs enum)
DROP FUNCTION IF EXISTS public.calculate_skill_level(uuid);

CREATE OR REPLACE FUNCTION public.calculate_skill_level(p_profile_id uuid)
RETURNS public.skill_level_t AS $$
DECLARE
  passed_assessments int;
  new_level public.skill_level_t := 'unverified';
BEGIN
  -- Ensure predictable search_path inside SECURITY DEFINER function
  PERFORM set_config('search_path', 'public', true);

  -- Lead: Must pass at least 3 assessments at lead level
  SELECT COUNT(*) INTO passed_assessments
  FROM skill_assessments
  WHERE profile_id = p_profile_id
    AND target_level = 'lead'
    AND passed = true;
  IF passed_assessments >= 3 THEN
    RETURN 'lead';
  END IF;

  -- Senior: Must pass at least 3 assessments at senior level
  SELECT COUNT(*) INTO passed_assessments
  FROM skill_assessments
  WHERE profile_id = p_profile_id
    AND target_level = 'senior'
    AND passed = true;
  IF passed_assessments >= 3 THEN
    RETURN 'senior';
  END IF;

  -- Mid: Must pass at least 2 assessments at mid level
  SELECT COUNT(*) INTO passed_assessments
  FROM skill_assessments
  WHERE profile_id = p_profile_id
    AND target_level = 'mid'
    AND passed = true;
  IF passed_assessments >= 2 THEN
    RETURN 'mid';
  END IF;

  -- Junior: Must pass at least 1 assessment at junior level
  SELECT COUNT(*) INTO passed_assessments
  FROM skill_assessments
  WHERE profile_id = p_profile_id
    AND target_level = 'junior'
    AND passed = true;
  IF passed_assessments >= 1 THEN
    RETURN 'junior';
  END IF;

  RETURN 'unverified';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Lock down function execution privileges (best-effort; tailor as needed)
REVOKE ALL ON FUNCTION public.calculate_skill_level(uuid) FROM public;

-- Function to update skill level after assessment (trigger)
CREATE OR REPLACE FUNCTION public.update_skill_level_after_assessment()
RETURNS TRIGGER AS $$
DECLARE
  computed_level public.skill_level_t;
BEGIN
  PERFORM set_config('search_path', 'public', true);

  -- Only recalculate if assessment was passed
  IF NEW.passed = true THEN
    computed_level := calculate_skill_level(NEW.profile_id);

    -- Only update profile if level actually changes to avoid churn
    UPDATE profiles
    SET
      skill_level = computed_level,
      skill_level_verified_at = now()
    WHERE id = NEW.profile_id
      AND (skill_level IS DISTINCT FROM computed_level);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Lock down trigger function
REVOKE ALL ON FUNCTION public.update_skill_level_after_assessment() FROM public;

-- Trigger to auto-update skill level (idempotent creation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_skill_assessments_update_level'
  ) THEN
    CREATE TRIGGER trg_skill_assessments_update_level
      AFTER INSERT OR UPDATE ON skill_assessments
      FOR EACH ROW
      EXECUTE FUNCTION public.update_skill_level_after_assessment();
  END IF;
END$$;

-- Skill level criteria reference (for display)
COMMENT ON COLUMN profiles.skill_level IS 'Developer skill level: junior (1-2 years), mid (2-5 years), senior (5-10 years), lead (10+ years, leadership)';

COMMIT;
