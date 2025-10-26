-- Hide Identifying Information - Anti-Discrimination Feature
-- Allows professionals to hide discriminatory data (name, location, photo, social profiles)
-- while keeping work samples, skills, and experience fully visible
-- Prevents bias based on gender, ethnicity, age, location, etc.

-- Add anonymous_mode to professional_preferences
ALTER TABLE professional_preferences 
ADD COLUMN IF NOT EXISTS anonymous_mode boolean DEFAULT false;
