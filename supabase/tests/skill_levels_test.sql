-- Simple SQL test script for skill level calculation
-- Run this in a staging/dev database to verify function and trigger behavior.
-- Note: run as a privileged user (service role) or ensure your session has rights to insert into profiles and skill_assessments.

BEGIN;

-- Create a deterministic test profile (id chosen for test isolation)
INSERT INTO profiles(id, auth_uid)
VALUES ('00000000-0000-0000-0000-000000000001', 'test-uid-1')
ON CONFLICT (id) DO NOTHING;

-- Clean up any prior assessments for this profile
DELETE FROM skill_assessments WHERE profile_id = '00000000-0000-0000-0000-000000000001';

-- Insert three 'senior' passed assessments -> expect 'senior'
INSERT INTO skill_assessments(profile_id, assessment_type, target_level, passed)
VALUES
('00000000-0000-0000-0000-000000000001','senior-test-1','senior',true),
('00000000-0000-0000-0000-000000000001','senior-test-2','senior',true),
('00000000-0000-0000-0000-000000000001','senior-test-3','senior',true);

-- Check the calculated level
SELECT public.calculate_skill_level('00000000-0000-0000-0000-000000000001') AS calculated_level; -- expect 'senior'

-- Verify trigger updated profiles.skill_level (if triggers are active)
SELECT id, skill_level, skill_level_verified_at FROM profiles WHERE id = '00000000-0000-0000-0000-000000000001';

-- Cleanup inserted test records
DELETE FROM skill_assessments WHERE profile_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM profiles WHERE id = '00000000-0000-0000-0000-000000000001';

COMMIT;

-- Additional manual tests you can run:
-- 1) Insert mixed passed/failed rows and verify the function returns the correct tier.
-- 2) Insert mid-level passed rows (2 passed) and verify 'mid'.
-- 3) Ensure that invalid target_level values are rejected (enum enforces this).
