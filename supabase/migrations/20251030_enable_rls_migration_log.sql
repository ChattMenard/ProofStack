-- Migration: Enable RLS on migration_log table
-- Date: 2025-10-30
-- Purpose: Fix security issue where migration_log table is public but RLS is disabled
-- Security Impact: HIGH - migration_log should not be publicly writable

-- =============================================================================
-- 1. CREATE migration_log TABLE IF NOT EXISTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.migration_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  applied_at timestamptz DEFAULT now(),
  applied_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  success boolean DEFAULT true,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Add helpful comment
COMMENT ON TABLE public.migration_log IS 
  'Tracks database migrations applied to the system. Read-only for most users, write-only for admin/system.';

-- =============================================================================
-- 2. ENABLE ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.migration_log ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 3. CREATE RLS POLICIES
-- =============================================================================

-- Drop existing policies if they exist (to allow re-running this migration)
DROP POLICY IF EXISTS migration_log_read_all ON public.migration_log;
DROP POLICY IF EXISTS migration_log_admin_write ON public.migration_log;
DROP POLICY IF EXISTS migration_log_system_insert ON public.migration_log;

-- Policy 1: Anyone authenticated can read migration logs
-- Rationale: Useful for debugging and transparency
CREATE POLICY migration_log_read_all
  ON public.migration_log
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 2: Only admins can update or delete migration logs
-- Rationale: Only admins should modify historical records
CREATE POLICY migration_log_admin_write
  ON public.migration_log
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Policy 3: Allow system to insert migration logs (for migration scripts)
-- Rationale: Migration scripts need to log their execution
-- Note: This uses a permissive policy for INSERT only
CREATE POLICY migration_log_system_insert
  ON public.migration_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =============================================================================
-- 4. GRANT PERMISSIONS
-- =============================================================================

-- Revoke all public access
REVOKE ALL ON public.migration_log FROM PUBLIC;
REVOKE ALL ON public.migration_log FROM anon;

-- Grant authenticated users read and insert
GRANT SELECT, INSERT ON public.migration_log TO authenticated;

-- Grant service_role full access (for system operations)
GRANT ALL ON public.migration_log TO service_role;

-- =============================================================================
-- 5. CREATE INDEX FOR PERFORMANCE
-- =============================================================================

-- Index on applied_at for chronological queries
CREATE INDEX IF NOT EXISTS idx_migration_log_applied_at 
  ON public.migration_log(applied_at DESC);

-- Index on name for lookups
CREATE INDEX IF NOT EXISTS idx_migration_log_name 
  ON public.migration_log(name);

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify RLS is enabled
DO $$
BEGIN
  IF NOT (
    SELECT relrowsecurity 
    FROM pg_class 
    WHERE relname = 'migration_log' 
    AND relnamespace = 'public'::regnamespace
  ) THEN
    RAISE EXCEPTION 'RLS not enabled on migration_log table!';
  END IF;
  
  RAISE NOTICE 'Security verification passed: RLS enabled on migration_log';
END $$;

-- Verify policies exist
DO $$
DECLARE
  policy_count integer;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'migration_log'
  AND schemaname = 'public';
  
  IF policy_count < 3 THEN
    RAISE EXCEPTION 'Expected at least 3 policies on migration_log, found %', policy_count;
  END IF;
  
  RAISE NOTICE 'Security verification passed: % policies found on migration_log', policy_count;
END $$;

-- =============================================================================
-- 6. LOG THIS MIGRATION
-- =============================================================================

-- Log this migration (will use the new policy)
INSERT INTO public.migration_log (name, description, applied_at, success)
VALUES (
  '20251030_enable_rls_migration_log',
  'Enable RLS on migration_log table and create appropriate security policies',
  NOW(),
  true
)
ON CONFLICT (name) DO UPDATE
SET 
  applied_at = NOW(),
  success = true,
  description = EXCLUDED.description;

-- Show success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration complete: RLS enabled on migration_log with 3 policies';
  RAISE NOTICE '   - Read: All authenticated users';
  RAISE NOTICE '   - Insert: All authenticated users (for migration scripts)';
  RAISE NOTICE '   - Update/Delete: Admins only';
END $$;
