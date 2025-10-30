-- Migration: Add RLS policies to tables with RLS enabled but no policies
-- Date: 2025-10-30
-- Purpose: Secure tables that have RLS enabled but no access policies
-- Security Impact: HIGH - Without policies, RLS-enabled tables block ALL access

-- Note: Some tables (analyses, proofs, samples, uploads) already have policies
-- in add_founding_employers.sql. This migration only adds policies for tables
-- that genuinely don't have any.

-- =============================================================================
-- SKIP: ANALYSES TABLE (already has policies)
-- =============================================================================
-- Already defined in add_founding_employers.sql:
-- - Users can view own analyses
-- - Users can insert own analyses
-- - Users can update own analyses
-- - Users can delete own analyses

-- =============================================================================
-- 2. CONVERSATIONS TABLE
-- =============================================================================
-- Chat conversations between users

CREATE POLICY conversations_participant_access
  ON public.conversations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = conversations.id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = conversations.id
      AND user_id = auth.uid()
    )
  );

COMMENT ON POLICY conversations_participant_access ON public.conversations IS
  'Users can only access conversations they are participants in';

-- =============================================================================
-- 3. CONVERSATION_PARTICIPANTS TABLE
-- =============================================================================
-- Junction table for conversation membership

CREATE POLICY conversation_participants_self_read
  ON public.conversation_participants
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY conversation_participants_self_insert
  ON public.conversation_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

COMMENT ON POLICY conversation_participants_self_read ON public.conversation_participants IS
  'Users can see participants in their own conversations';

COMMENT ON POLICY conversation_participants_self_insert ON public.conversation_participants IS
  'Users can add themselves to conversations';

-- =============================================================================
-- 4. ORGANIZATION_MEMBERS TABLE
-- =============================================================================
-- Organization membership tracking

CREATE POLICY organization_members_member_read
  ON public.organization_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY organization_members_admin_write
  ON public.organization_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
    )
  );

COMMENT ON POLICY organization_members_member_read ON public.organization_members IS
  'Members can view their own memberships and their org members';

COMMENT ON POLICY organization_members_admin_write ON public.organization_members IS
  'Only organization admins can manage membership';

-- =============================================================================
-- 5. PROFESSIONAL_PROMOTIONS TABLE
-- =============================================================================
-- Paid advertising for professionals

CREATE POLICY professional_promotions_owner_full_access
  ON public.professional_promotions
  FOR ALL
  TO authenticated
  USING (
    professional_id = auth.uid()
  )
  WITH CHECK (
    professional_id = auth.uid()
  );

CREATE POLICY professional_promotions_public_read_active
  ON public.professional_promotions
  FOR SELECT
  TO authenticated
  USING (
    status = 'active'
    AND end_date > NOW()
  );

COMMENT ON POLICY professional_promotions_owner_full_access ON public.professional_promotions IS
  'Professionals manage their own promotions';

COMMENT ON POLICY professional_promotions_public_read_active ON public.professional_promotions IS
  'Everyone can see active promotions (for marketplace display)';

-- =============================================================================
-- 6. PROFESSIONAL_RATINGS TABLE
-- =============================================================================
-- ProofScore V2 ratings storage

CREATE POLICY professional_ratings_owner_read
  ON public.professional_ratings
  FOR SELECT
  TO authenticated
  USING (
    professional_id = auth.uid()
  );

CREATE POLICY professional_ratings_public_read
  ON public.professional_ratings
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY professional_ratings_owner_read ON public.professional_ratings IS
  'Professionals can view their own ratings';

COMMENT ON POLICY professional_ratings_public_read ON public.professional_ratings IS
  'Public ratings are visible to all authenticated users';

-- =============================================================================
-- 7. PROFILE_VIEWS TABLE
-- =============================================================================
-- Track who viewed whose profile

CREATE POLICY profile_views_owner_read
  ON public.profile_views
  FOR SELECT
  TO authenticated
  USING (
    profile_id = auth.uid()
  );

CREATE POLICY profile_views_viewer_insert
  ON public.profile_views
  FOR INSERT
  TO authenticated
  WITH CHECK (
    viewer_id = auth.uid()
  );

COMMENT ON POLICY profile_views_owner_read ON public.profile_views IS
  'Users can see who viewed their profile';

COMMENT ON POLICY profile_views_viewer_insert ON public.profile_views IS
  'Users can record their own profile views';

-- =============================================================================
-- SKIP: PROOFS TABLE (already has policies)
-- =============================================================================
-- Already defined in add_founding_employers.sql:
-- - Users can view own proofs
-- - Users can insert own proofs  
-- - Users can update own proofs

-- =============================================================================
-- SKIP: SAMPLES TABLE (already has policies)
-- =============================================================================
-- Already defined in add_founding_employers.sql:
-- - Users can view own samples
-- - Users can insert own samples
-- - Users can update own samples
-- - Users can delete own samples

-- =============================================================================
-- 10. SEARCH_HISTORY TABLE
-- =============================================================================
-- User search history tracking

CREATE POLICY search_history_owner_full_access
  ON public.search_history
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

COMMENT ON POLICY search_history_owner_full_access ON public.search_history IS
  'Users manage their own search history';

-- =============================================================================
-- SKIP: UPLOADS TABLE (already has policies)
-- =============================================================================
-- Already defined in add_founding_employers.sql:
-- - Users can view own uploads
-- - Users can insert own uploads
-- - Users can update own uploads  
-- - Users can delete own uploads

-- =============================================================================
-- 12. USAGE_TRACKING TABLE
-- =============================================================================
-- System usage analytics

CREATE POLICY usage_tracking_owner_read
  ON public.usage_tracking
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

CREATE POLICY usage_tracking_self_insert
  ON public.usage_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

COMMENT ON POLICY usage_tracking_owner_read ON public.usage_tracking IS
  'Users can view their own usage data';

COMMENT ON POLICY usage_tracking_self_insert ON public.usage_tracking IS
  'System can record usage for authenticated users';

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================

DO $$
DECLARE
  tables_without_policies integer;
BEGIN
  SELECT COUNT(*) INTO tables_without_policies
  FROM pg_tables t
  WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'conversation_participants', 'conversations',
    'organization_members', 'professional_promotions', 'professional_ratings',
    'profile_views', 'search_history', 'usage_tracking'
  )
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public'
    AND p.tablename = t.tablename
  );
  
  IF tables_without_policies > 0 THEN
    RAISE WARNING '% tables still have no RLS policies', tables_without_policies;
  ELSE
    RAISE NOTICE '✅ Security verification passed: All 8 tables now have RLS policies';
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
        ''20251030_add_missing_rls_policies'',
        ''Add RLS policies to 8 tables that had RLS enabled but no policies'',
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
        ''20251030_add_missing_rls_policies'',
        ''Add RLS policies to 8 tables that had RLS enabled but no policies'',
        NOW()
      )
      ON CONFLICT (name) DO UPDATE
      SET 
        applied_at = NOW(),
        description = EXCLUDED.description';
  END IF;
  
  EXECUTE sql_statement;
END $$;
