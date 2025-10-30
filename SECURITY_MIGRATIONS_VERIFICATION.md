# Security Migrations Verification Guide

## Overview
This guide helps you verify that both security migrations have been successfully applied:
1. `20251030_fix_security_definer.sql` - Fix SECURITY DEFINER vulnerabilities
2. `20251030_enable_rls_migration_log.sql` - Enable RLS on migration_log

## Quick Verification (Run in Supabase SQL Editor)

### Check All Migrations Applied
```sql
SELECT name, description, applied_at, success
FROM public.migration_log
WHERE name LIKE '20251030%'
ORDER BY applied_at DESC;
```

**Expected Result:** Both migrations should appear with `success = true`

---

## Part 1: Verify SECURITY DEFINER Fix

### 1.1 Check Function Security Type
```sql
SELECT 
  routine_name,
  security_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_user_total_cost', 'get_cost_by_provider');
```

**Expected Result:**
- Both functions should show `security_type = 'INVOKER'` (NOT 'DEFINER')

### 1.2 Test Authorization Enforcement
```sql
-- This should work (querying your own costs)
SELECT * FROM get_user_total_cost(auth.uid());

-- This should FAIL with authorization error (querying someone else's costs)
SELECT * FROM get_user_total_cost('00000000-0000-0000-0000-000000000000'::uuid);
```

**Expected Result:**
- First query: Returns your cost data
- Second query: ERROR - "Unauthorized: can only view own cost data"

### 1.3 Verify api_cost_summary View Security
```sql
SELECT 
  schemaname,
  viewname,
  definition
FROM pg_views
WHERE viewname = 'api_cost_summary';
```

**Expected Result:**
- View definition should include `WITH (security_invoker = true)`

---

## Part 2: Verify migration_log RLS

### 2.1 Check RLS Enabled
```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'migration_log'
  AND schemaname = 'public';
```

**Expected Result:** `rls_enabled = true`

### 2.2 Check RLS Policies
```sql
SELECT 
  policyname,
  cmd as command,
  roles,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE tablename = 'migration_log'
  AND schemaname = 'public'
ORDER BY policyname;
```

**Expected Result:** 3 policies:
1. `migration_log_admin_write` - FOR ALL to authenticated
2. `migration_log_read_all` - FOR SELECT to authenticated
3. `migration_log_system_insert` - FOR INSERT to authenticated

### 2.3 Test Read Access (Should Work)
```sql
SELECT name, description, applied_at
FROM public.migration_log
ORDER BY applied_at DESC
LIMIT 5;
```

**Expected Result:** Shows recent migrations

### 2.4 Test Write Access (Should Fail for Non-Admins)
```sql
-- Try to update a migration record (should fail unless you're admin)
UPDATE public.migration_log
SET description = 'test modification'
WHERE name = '20251030_enable_rls_migration_log';
```

**Expected Result:**
- **If you're admin:** Update succeeds
- **If you're not admin:** ERROR - Row-level security violation

---

## Part 3: Overall Security Audit

### 3.1 Check for Tables Without RLS
```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;
```

**Expected Result:**
- Empty result set (all public tables should have RLS enabled)
- OR only internal/system tables that are properly secured by other means

### 3.2 Check for Remaining SECURITY DEFINER Functions
```sql
SELECT 
  routine_schema,
  routine_name,
  security_type,
  routine_type
FROM information_schema.routines
WHERE security_type = 'DEFINER'
  AND routine_schema = 'public'
ORDER BY routine_name;
```

**Expected Result:**
- Forum functions (safe - have auth.uid() checks)
- ProofScore functions (safe - have auth.uid() checks)
- Hire attempts functions (safe - have auth.uid() checks)
- Trigger functions (safe - run in controlled context)
- **NOT** `get_user_total_cost` or `get_cost_by_provider` (should be INVOKER now)

### 3.3 Verify PUBLIC Access Revoked
```sql
SELECT 
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'PUBLIC'
  AND table_schema = 'public'
  AND table_name IN ('api_cost_logs', 'api_cost_summary', 'migration_log')
ORDER BY table_name;
```

**Expected Result:**
- Empty result set (no PUBLIC access to sensitive tables)

---

## Success Checklist

Run through this checklist to confirm all security measures are in place:

- [ ] Both migrations appear in `migration_log` with `success = true`
- [ ] `get_user_total_cost` has `security_type = 'INVOKER'`
- [ ] `get_cost_by_provider` has `security_type = 'INVOKER'`
- [ ] Authorization check prevents querying other users' costs
- [ ] `api_cost_summary` view has `security_invoker = true`
- [ ] `migration_log` table has RLS enabled (`rls_enabled = true`)
- [ ] 3 RLS policies exist on `migration_log` table
- [ ] Can read from `migration_log` as authenticated user
- [ ] Cannot modify `migration_log` as non-admin (if you're not admin)
- [ ] No public tables without RLS (or all exceptions are justified)
- [ ] No PUBLIC access to `api_cost_logs`, `api_cost_summary`, or `migration_log`

---

## Troubleshooting

### Issue: Migration not showing in migration_log
**Solution:** Re-run the migration SQL in Supabase SQL Editor

### Issue: Functions still show DEFINER
**Solution:**
1. Manually drop functions: `DROP FUNCTION get_user_total_cost(UUID);`
2. Re-run `20251030_fix_security_definer.sql`

### Issue: RLS not enabled on migration_log
**Solution:** Run manually:
```sql
ALTER TABLE public.migration_log ENABLE ROW LEVEL SECURITY;
```

### Issue: Can still query other users' costs
**Problem:** Authorization check not working
**Solution:** Check that functions were recreated with auth.uid() checks

### Issue: Cannot read migration_log
**Problem:** RLS too restrictive or policies not created
**Solution:** Verify policies exist with the query in section 2.2

---

## Post-Verification Actions

Once all checks pass:

1. ✅ Mark migrations as deployed in your deployment tracker
2. ✅ Update `CODEBASE_STATUS.md` to note security hardening complete
3. ✅ Monitor Supabase Security Advisor for any new issues
4. ✅ Schedule monthly security audits using queries from section 3

---

## Security Maintenance Schedule

### Weekly
- Check Supabase Security Advisor dashboard
- Review any new tables for RLS status

### Monthly
- Run Part 3 queries to audit overall security
- Check for new SECURITY DEFINER functions
- Verify no PUBLIC access to sensitive tables

### Quarterly
- Full security review of all RLS policies
- Audit function permissions
- Review and update security documentation

---

## Additional Resources

- **SECURITY_DEFINER_FIX.md** - Detailed docs on API cost tracking fix
- **MIGRATION_LOG_RLS_FIX.md** - Detailed docs on migration_log RLS
- **Supabase Security Advisor**: https://app.supabase.com/project/lytjmxjizalmgbgrgfvc/database/security-advisor
- **Supabase RLS Docs**: https://supabase.com/docs/guides/auth/row-level-security

---

## Support

If any verification checks fail or you encounter issues:

1. Review the detailed documentation for the specific migration
2. Check Supabase logs for error messages
3. Verify you're running queries as an authenticated user
4. Contact Matt Chenard (mattchenard2009@gmail.com) for assistance

**Last Updated:** 2025-10-30  
**Status:** Ready for verification
