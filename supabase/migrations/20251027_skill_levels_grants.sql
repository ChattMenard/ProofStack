-- Grant EXECUTE on skill level functions to common roles (idempotent)
-- This migration attempts to grant execute only when roles and functions exist.

BEGIN;

DO $$
BEGIN
  -- Only proceed if the functions exist
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_skill_level') THEN

    -- Grant to the 'authenticated' role if it exists (typical Supabase role)
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      EXECUTE 'GRANT EXECUTE ON FUNCTION public.calculate_skill_level(uuid) TO authenticated';
      EXECUTE 'GRANT EXECUTE ON FUNCTION public.update_skill_level_after_assessment() TO authenticated';
    END IF;

    -- Grant to a 'service_role' role if present (some setups create a service role)
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
      EXECUTE 'GRANT EXECUTE ON FUNCTION public.calculate_skill_level(uuid) TO service_role';
      EXECUTE 'GRANT EXECUTE ON FUNCTION public.update_skill_level_after_assessment() TO service_role';
    END IF;

  END IF;
END$$;

COMMIT;
