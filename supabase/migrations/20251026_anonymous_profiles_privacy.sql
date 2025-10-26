-- Anonymous Profiles (Ghost Mode) - Privacy Feature Only
-- Allows professionals to hide identity at their discretion
-- Employers CANNOT pay to reveal identity - it's purely professional's choice

-- Add anonymous_mode to professional_preferences
ALTER TABLE professional_preferences 
ADD COLUMN IF NOT EXISTS anonymous_mode boolean DEFAULT false;
