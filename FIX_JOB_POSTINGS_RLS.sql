-- Fix RLS policies for job_postings to use auth_uid from profiles
-- Run this in Supabase SQL Editor (select all and run)

BEGIN;

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can view published jobs" ON job_postings;
DROP POLICY IF EXISTS "Employers can view own jobs" ON job_postings;
DROP POLICY IF EXISTS "Employers can create jobs" ON job_postings;
DROP POLICY IF EXISTS "Employers can update own jobs" ON job_postings;
DROP POLICY IF EXISTS "Employers can delete own jobs" ON job_postings;

-- Recreate policies with correct auth check

-- Anyone can view published jobs
CREATE POLICY "Anyone can view published jobs"
  ON job_postings FOR SELECT
  USING (status = 'published');

-- Employers can view their own jobs (any status)
CREATE POLICY "Employers can view own jobs"
  ON job_postings FOR SELECT
  USING (
    employer_id IN (
      SELECT id FROM profiles WHERE auth_uid = auth.uid()::text
    )
  );

-- Employers can create jobs (check via profiles.auth_uid)
CREATE POLICY "Employers can create jobs"
  ON job_postings FOR INSERT
  WITH CHECK (
    employer_id IN (
      SELECT id FROM profiles WHERE auth_uid = auth.uid()::text
    )
  );

-- Employers can update their own jobs
CREATE POLICY "Employers can update own jobs"
  ON job_postings FOR UPDATE
  USING (
    employer_id IN (
      SELECT id FROM profiles WHERE auth_uid = auth.uid()::text
    )
  );

-- Employers can delete their own jobs
CREATE POLICY "Employers can delete own jobs"
  ON job_postings FOR DELETE
  USING (
    employer_id IN (
      SELECT id FROM profiles WHERE auth_uid = auth.uid()::text
    )
  );

COMMIT;
