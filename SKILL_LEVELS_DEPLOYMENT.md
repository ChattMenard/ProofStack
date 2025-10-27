# Skill Level System - Production Deployment Checklist

## Pre-Deployment Verification ✅

### 1. Database Migrations
- [ ] Run `20251027_skill_levels.sql` in Supabase SQL Editor
- [ ] Run `20251027_skill_levels_grants.sql` in Supabase SQL Editor
- [ ] Verify enum type created: `SELECT typname FROM pg_type WHERE typname = 'skill_level_t';`
- [ ] Verify table exists: `\d skill_assessments`
- [ ] Verify RLS enabled: `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true AND tablename = 'skill_assessments';`

### 2. Test Migrations
- [ ] Run `supabase/tests/skill_levels_test.sql` in SQL Editor
- [ ] Verify calculated_level returns 'senior' for test profile
- [ ] Verify trigger updated profiles.skill_level
- [ ] Check no errors in Supabase logs

### 3. RLS Policy Validation
Test with real auth tokens:

```sql
-- As authenticated user (professional)
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub":"<real-user-uuid>"}';

-- Should see only own assessments
SELECT * FROM skill_assessments;

-- Should be able to insert own assessment
INSERT INTO skill_assessments(profile_id, assessment_type, target_level, passed)
VALUES ((SELECT id FROM profiles WHERE auth_uid = '<your-uuid>'), 'technical_quiz', 'junior', true);
```

- [ ] Professionals can view only their own assessments
- [ ] Professionals can insert their own assessments
- [ ] Admins can view all assessments (test with is_admin=true profile)
- [ ] Anonymous users cannot read/write assessments

### 4. Function Permissions
- [ ] Verify `authenticated` role can execute `calculate_skill_level`:
  ```sql
  SELECT public.calculate_skill_level('<profile-uuid>');
  ```
- [ ] Verify trigger fires on assessment insert (check profiles.skill_level updated)

### 5. API Route Testing
Test all endpoints in production with real auth:

- [ ] `GET /api/assessments/available` - Returns assessment library
- [ ] `POST /api/assessments/submit` - Submits assessment and updates skill_level
- [ ] `GET /api/admin/analytics/skills` - Returns analytics (admin only)

Example test:
```bash
# Get available assessments
curl -H "Authorization: Bearer $TOKEN" https://your-domain.com/api/assessments/available

# Submit an assessment
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"assessmentType":"technical_quiz","targetLevel":"junior","answers":{},"score":75,"timeTakenSeconds":300}' \
  https://your-domain.com/api/assessments/submit
```

### 6. UI Component Testing
- [ ] `/professional/assessments` page loads and shows available assessments
- [ ] Assessment cards show correct locked/unlocked state based on current skill_level
- [ ] `/professional/assessments/[id]` quiz interface works (timer, answers, submission)
- [ ] Skill level badges display correctly on `/portfolios` page
- [ ] Skill level filter works on `/portfolios` (select junior → only juniors shown)
- [ ] `/admin/analytics/skills` page loads for admins (shows distribution, pass rates, velocity)

### 7. End-to-End Flow Validation
Complete a full user journey:

1. [ ] Create new professional account
2. [ ] Verify `skill_level` = 'unverified' in database
3. [ ] Navigate to `/professional/assessments`
4. [ ] Start and complete `junior-quiz-1` with passing score (>70%)
5. [ ] Verify:
   - Assessment record created in `skill_assessments` table
   - `profiles.skill_level` updated to 'junior'
   - `profiles.skill_level_verified_at` set to now()
   - Badge shows 'Junior' on profile
6. [ ] Complete 2 mid-level assessments with passing scores
7. [ ] Verify level promoted to 'mid'
8. [ ] Check `/portfolios` filter shows profile under 'Mid' filter

### 8. Performance & Monitoring
- [ ] Add Sentry monitoring for assessment submission errors
- [ ] Add PostHog events:
  - `assessment_started` (assessmentId, targetLevel)
  - `assessment_completed` (assessmentId, score, passed, levelChanged)
  - `skill_level_promoted` (oldLevel, newLevel)
- [ ] Verify partial index used: `EXPLAIN ANALYZE SELECT * FROM skill_assessments WHERE profile_id = '<uuid>' AND target_level = 'senior' AND passed = true;`
- [ ] Check query performance (should be <50ms for typical queries)

### 9. Rate Limiting Verification
- [ ] Test `/api/assessments/submit` rate limit (5 requests/minute)
- [ ] Verify 429 response after exceeding limit
- [ ] Check Upstash Redis dashboard for rate limit metrics

### 10. Security Audit
- [ ] Review SECURITY DEFINER functions have `search_path` set
- [ ] Verify no public execute permissions on sensitive functions
- [ ] Check RLS policies don't leak data across users
- [ ] Test assessment submission doesn't allow score manipulation (server validates passing score)
- [ ] Verify UNIQUE constraint prevents duplicate assessments for same type/level

## Deployment Steps 🚀

### Option A: Supabase Dashboard (Recommended for first time)
1. Log into Supabase Dashboard → Your Project → SQL Editor
2. Create new query, paste contents of `supabase/migrations/20251027_skill_levels.sql`
3. Click **Run** (watch for errors in output)
4. Create another query, paste `20251027_skill_levels_grants.sql`
5. Click **Run**
6. Verify no errors in Database → Logs

### Option B: Supabase CLI
```bash
# Link to production project
npx supabase link --project-ref YOUR-PROD-PROJECT-REF

# Push migrations
npx supabase db push

# Verify
npx supabase db diff --linked
```

### Option C: PowerShell Script (with backup)
```powershell
# Set production connection
$env:PGHOST='db.xxxxx.supabase.co'
$env:PGPORT='5432'
$env:PGUSER='postgres'
$env:PGPASSWORD='your-prod-password'
$env:PGDATABASE='postgres'

# Run migration script (creates backup first)
.\scripts\run_skill_level_migration.ps1
```

## Post-Deployment Validation ✅

### Immediate Checks (within 1 hour)
- [ ] Run test SQL script in production
- [ ] Check Supabase logs for errors
- [ ] Submit test assessment via UI (use test account)
- [ ] Verify skill level updated in database
- [ ] Check Sentry for new errors
- [ ] Verify no performance degradation (check API response times)

### 24-Hour Monitoring
- [ ] Review PostHog events for assessment activity
- [ ] Check error rates in Sentry
- [ ] Monitor Supabase dashboard for database performance
- [ ] Review user feedback (check support channels for issues)

### 7-Day Review
- [ ] Analyze assessment pass rates by level
- [ ] Review promotion velocity metrics
- [ ] Check for any stuck/orphaned assessments
- [ ] Validate RLS policies working correctly (no unauthorized access)
- [ ] Review API rate limit logs (any abuse patterns?)

## Rollback Plan 🔄

If issues detected, rollback steps:

1. **Immediate**: Disable assessment routes in `next.config.js` or via feature flag
2. **Database rollback** (if needed):
   ```sql
   BEGIN;
   
   -- Drop trigger
   DROP TRIGGER IF EXISTS trg_skill_assessments_update_level ON skill_assessments;
   
   -- Drop functions
   DROP FUNCTION IF EXISTS public.update_skill_level_after_assessment();
   DROP FUNCTION IF EXISTS public.calculate_skill_level(uuid);
   
   -- Drop policies (optional, or leave if not causing issues)
   DROP POLICY IF EXISTS "Users can view own assessments" ON skill_assessments;
   DROP POLICY IF EXISTS "Users can insert own assessments" ON skill_assessments;
   DROP POLICY IF EXISTS "Admins can view all assessments" ON skill_assessments;
   
   -- Drop table (WARNING: deletes all assessment data)
   DROP TABLE IF EXISTS skill_assessments;
   
   -- Revert profiles columns (optional)
   ALTER TABLE profiles DROP COLUMN IF EXISTS skill_level;
   ALTER TABLE profiles DROP COLUMN IF EXISTS skill_level_verified_at;
   
   -- Drop enum type
   DROP TYPE IF EXISTS public.skill_level_t;
   
   COMMIT;
   ```

3. **Restore from backup** (if available):
   ```bash
   pg_restore -d $DATABASE_URL backup_file.sql
   ```

## Support Resources 📚

- **Migration files**: `supabase/migrations/20251027_skill_levels*.sql`
- **Test script**: `supabase/tests/skill_levels_test.sql`
- **Component docs**: See `components/SkillLevelBadge.tsx` for UI usage
- **API docs**: See `app/api/assessments/*/route.ts` for endpoint details
- **Analytics**: Admin dashboard at `/admin/analytics/skills`

## Success Metrics 📊

Track these KPIs after launch:

- **Adoption Rate**: % of professionals completing at least 1 assessment
- **Verification Rate**: % of professionals advancing from 'unverified' to verified levels
- **Pass Rates**: % of assessments passed per level (target: 60-70%)
- **Promotion Velocity**: Average days to reach each level
- **User Engagement**: Daily/weekly active assessments completed
- **Employer Usage**: % of employers filtering by skill level in search

Target goals (30 days post-launch):
- [ ] 30% of professionals complete at least 1 assessment
- [ ] 15% of professionals reach 'junior' or higher
- [ ] Overall pass rate between 60-70%
- [ ] Average time to 'junior': 7-14 days
- [ ] Zero RLS policy violations
- [ ] <1% error rate on assessment submissions

---

**Last Updated**: October 27, 2025  
**Version**: 1.0  
**Owner**: Engineering Team
