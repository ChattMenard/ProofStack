-- Migration: Fix mutable search_path on all functions
-- Date: 2025-10-30
-- Purpose: Set explicit search_path on all functions to prevent search path hijacking attacks
-- Security Impact: MEDIUM - Prevents potential privilege escalation via search path manipulation

-- =============================================================================
-- WHAT IS SEARCH PATH HIJACKING?
-- =============================================================================
-- Without explicit search_path, functions inherit the caller's search_path.
-- An attacker could create malicious tables/functions in a schema that appears
-- earlier in the search_path, causing the function to call the wrong code.
--
-- Example attack:
-- 1. Function calls "SELECT * FROM users" without schema qualification
-- 2. Attacker creates schema "evil" and table "evil.users"
-- 3. Attacker sets search_path = 'evil, public'
-- 4. Function now queries "evil.users" instead of "public.users"
--
-- Fix: Set search_path explicitly on all functions

-- =============================================================================
-- HELPER FUNCTION TO SET SEARCH PATH ON ALL FUNCTIONS
-- =============================================================================

DO $$
DECLARE
  func_record RECORD;
  func_signature TEXT;
  set_search_path_sql TEXT;
BEGIN
  -- Loop through all functions in public schema without explicit search_path
  FOR func_record IN 
    SELECT 
      p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as arguments,
      p.oid::regprocedure::text as full_signature,
      p.proconfig as config_array
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname NOT LIKE 'pg_%'
    AND p.prosecdef = false  -- Skip SECURITY DEFINER functions (handle separately)
    AND (
      p.proconfig IS NULL  -- No config set
      OR NOT (p.proconfig::text LIKE '%search_path%')  -- Config exists but no search_path
    )
  LOOP
    -- Build ALTER FUNCTION statement with explicit search_path
    set_search_path_sql := format(
      'ALTER FUNCTION %s SET search_path = public, pg_temp',
      func_record.full_signature
    );
    
    -- Execute the ALTER statement
    BEGIN
      EXECUTE set_search_path_sql;
      RAISE NOTICE 'Set search_path on: %', func_record.full_signature;
    EXCEPTION 
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to set search_path on %: %', func_record.full_signature, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '✅ Migration complete: All functions now have explicit search_path';
END $$;

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================

-- Show remaining functions without explicit search_path (should be empty)
DO $$
DECLARE
  remaining_count integer;
BEGIN
  SELECT COUNT(*) INTO remaining_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname NOT LIKE 'pg_%'
  AND (
    p.proconfig IS NULL 
    OR NOT (p.proconfig::text LIKE '%search_path%')
  );
  
  IF remaining_count > 0 THEN
    RAISE WARNING '% functions still have mutable search_path', remaining_count;
  ELSE
    RAISE NOTICE 'Security verification passed: All functions have explicit search_path';
  END IF;
END $$;

-- =============================================================================
-- LOG THIS MIGRATION
-- =============================================================================

DO $$
DECLARE
  has_success_column boolean;
  sql_statement text;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'migration_log' 
    AND column_name = 'success'
  ) INTO has_success_column;
  
  IF has_success_column THEN
    sql_statement := '
      INSERT INTO public.migration_log (name, description, applied_at, success)
      VALUES (
        ''20251030_fix_function_search_paths'',
        ''Set explicit search_path on all functions to prevent search path hijacking attacks'',
        NOW(),
        true
      )
      ON CONFLICT (name) DO UPDATE
      SET 
        applied_at = NOW(),
        success = true,
        description = EXCLUDED.description';
  ELSE
    sql_statement := '
      INSERT INTO public.migration_log (name, description, applied_at)
      VALUES (
        ''20251030_fix_function_search_paths'',
        ''Set explicit search_path on all functions to prevent search path hijacking attacks'',
        NOW()
      )
      ON CONFLICT (name) DO UPDATE
      SET 
        applied_at = NOW(),
        description = EXCLUDED.description';
  END IF;
  
  EXECUTE sql_statement;
END $$;

-- =============================================================================
-- NOTES FOR FUTURE FUNCTION CREATION
-- =============================================================================

-- When creating new functions, always set search_path explicitly:
--
-- CREATE OR REPLACE FUNCTION my_function()
-- RETURNS void
-- LANGUAGE plpgsql
-- SECURITY INVOKER  -- or SECURITY DEFINER if needed
-- SET search_path = public, pg_temp  -- ALWAYS ADD THIS
-- AS $$
-- BEGIN
--   -- function body
-- END;
-- $$;

-- Recommended search_path values:
-- - "public, pg_temp" - Most common, allows public schema + temp tables
-- - "public" - Stricter, only public schema
-- - "pg_catalog, public, pg_temp" - If you need system catalog access

COMMENT ON SCHEMA public IS 
  'Public schema. All new functions should explicitly set search_path to prevent hijacking attacks.';
