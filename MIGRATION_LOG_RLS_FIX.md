# Migration Log RLS Security Fix

## Issue Summary
**Severity:** HIGH  
**Entity:** `public.migration_log`  
**Problem:** Table is publicly accessible but Row Level Security (RLS) is not enabled

## Description
The `migration_log` table tracks all database migrations applied to ProofStack. Without RLS enabled, this table could potentially be modified by any authenticated user, creating security risks:

1. **Data Integrity Risk:** Users could falsely mark migrations as applied/failed
2. **Audit Trail Tampering:** Historical migration records could be modified
3. **Information Disclosure:** Migration details could reveal system architecture

## Security Impact

### Before Fix
- ❌ RLS disabled on `migration_log` table
- ❌ No access controls on migration records
- ❌ Any authenticated user could potentially INSERT/UPDATE/DELETE migration logs
- ❌ No audit trail protection

### After Fix
- ✅ RLS enabled with three policies
- ✅ **Read Policy:** All authenticated users can view migration logs (transparency)
- ✅ **Insert Policy:** Authenticated users can insert (for migration scripts)
- ✅ **Admin Policy:** Only admins can UPDATE/DELETE (data integrity)
- ✅ Service role has full access (system operations)

## Migration File
**Location:** `supabase/migrations/20251030_enable_rls_migration_log.sql`

### What It Does
1. Creates `migration_log` table if not exists (safe to re-run)
2. Enables Row Level Security on the table
3. Creates three RLS policies:
   - `migration_log_read_all`: SELECT for authenticated users
   - `migration_log_admin_write`: UPDATE/DELETE for admins only
   - `migration_log_system_insert`: INSERT for authenticated users
4. Revokes PUBLIC/anon access
5. Grants appropriate permissions to authenticated and service_role
6. Creates performance indexes on `applied_at` and `name`
7. Includes verification queries to confirm RLS is properly enabled

## How to Apply

### Step 1: Open Supabase SQL Editor
```
https://app.supabase.com/project/lytjmxjizalmgbgrgfvc/sql
```

### Step 2: Run the Migration
1. Copy contents of `supabase/migrations/20251030_enable_rls_migration_log.sql`
2. Paste into SQL Editor
3. Click "Run"

### Step 3: Verify Success
You should see output like:
```
NOTICE:  Security verification passed: RLS enabled on migration_log
NOTICE:  Security verification passed: 3 policies found on migration_log
NOTICE:  ✅ Migration complete: RLS enabled on migration_log with 3 policies
NOTICE:     - Read: All authenticated users
NOTICE:     - Insert: All authenticated users (for migration scripts)
NOTICE:     - Update/Delete: Admins only
```

### Step 4: Confirm in Supabase Dashboard
1. Go to Database → Tables → `migration_log`
2. Under "RLS Policies" tab, verify 3 policies exist:
   - `migration_log_read_all`
   - `migration_log_admin_write`
   - `migration_log_system_insert`
3. Under "Settings" tab, verify "Enable RLS" toggle is ON

## Verification Queries

### Check RLS Status
```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'migration_log'
AND schemaname = 'public';
```

Expected result: `rls_enabled = true`

### Check Policies
```sql
SELECT 
  policyname,
  cmd as command,
  qual as using_expression,
  with_check as check_expression
FROM pg_policies
WHERE tablename = 'migration_log'
AND schemaname = 'public';
```

Expected result: 3 policies listed

### Test Read Access (as authenticated user)
```sql
SELECT name, description, applied_at, success
FROM public.migration_log
ORDER BY applied_at DESC
LIMIT 5;
```

This should work for any authenticated user.

### Test Write Access (as non-admin)
```sql
-- This should FAIL for non-admin users
UPDATE public.migration_log
SET description = 'test'
WHERE id = (SELECT id FROM migration_log LIMIT 1);
```

Expected result: Row-level security violation

## RLS Policy Details

### Policy 1: Read All (SELECT)
```sql
CREATE POLICY migration_log_read_all
  ON public.migration_log
  FOR SELECT
  TO authenticated
  USING (true);
```
**Purpose:** Allow all authenticated users to view migration history  
**Rationale:** Transparency for debugging and system understanding  
**Risk:** Low - migration logs don't contain sensitive data

### Policy 2: Admin Write (UPDATE/DELETE)
```sql
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
  );
```
**Purpose:** Only admins can modify or delete migration records  
**Rationale:** Protect audit trail integrity  
**Risk:** Low - requires admin privileges

### Policy 3: System Insert (INSERT)
```sql
CREATE POLICY migration_log_system_insert
  ON public.migration_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
```
**Purpose:** Allow migration scripts to log their execution  
**Rationale:** Migration scripts run as authenticated users and need to record completion  
**Risk:** Medium - any authenticated user can insert, but admins control DELETE to remove spam

## Why This Design?

### Why Allow INSERT for All Authenticated Users?
Migration scripts run as authenticated users (not always service_role), so they need INSERT permission to log their execution. The alternative would be:
1. Force all migrations through service_role (complex, breaks existing patterns)
2. Check if user is admin before INSERT (breaks migration script workflow)

The current design allows migration scripts to self-log while preventing tampering via the admin-only UPDATE/DELETE policies.

### Why Allow READ for All Authenticated Users?
Transparency improves:
- **Developer Experience:** Devs can debug which migrations are applied
- **Support Quality:** Support can verify migration state without admin access
- **System Visibility:** Users can understand system evolution

Migration logs don't contain secrets, so public read within the authenticated user pool is acceptable.

## Impact Assessment

### Breaking Changes
**None.** This migration is additive-only:
- Creates table if missing
- Enables security that wasn't present
- Grants permissions explicitly

### Performance Impact
**Minimal.** RLS adds microseconds to queries. Indexes on `applied_at` and `name` ensure fast lookups.

### Existing Data
**Preserved.** Migration uses `IF NOT EXISTS` and `ON CONFLICT` to avoid data loss.

## Related Security Fixes
This fix is part of a broader security hardening effort:
- `20251030_fix_security_definer.sql` - Remove SECURITY DEFINER vulnerabilities
- `20251030_enable_rls_migration_log.sql` - Enable RLS on migration_log (this file)

See `SECURITY_DEFINER_FIX.md` for the companion security fix.

## Best Practices for Future Tables

### Always Enable RLS on Public Tables
```sql
CREATE TABLE public.my_table (
  -- columns
);

ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;
```

### Check RLS Status Before Deployment
Run this query monthly:
```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false;
```

Any table in the `public` schema without RLS is a potential security risk.

### Use Supabase Security Advisor
Supabase dashboard has a "Security Advisor" that detects missing RLS. Check it regularly:
```
https://app.supabase.com/project/lytjmxjizalmgbgrgfvc/database/security-advisor
```

## Deployment Checklist
- [x] Create migration file
- [x] Add verification queries
- [x] Document security impact
- [ ] Apply migration via Supabase SQL Editor
- [ ] Verify RLS enabled in dashboard
- [ ] Test read access as non-admin user
- [ ] Test write access as non-admin (should fail)
- [ ] Commit migration to Git
- [ ] Update security documentation

## Timeline
- **Identified:** 2025-10-30 (via Supabase Security Advisor)
- **Migration Created:** 2025-10-30
- **Status:** Ready to deploy
- **Deployed:** Pending (user must apply via SQL Editor)

## Support
If you encounter issues applying this migration:
1. Check Supabase logs for error messages
2. Verify you have admin access to run SQL
3. Ensure no other migrations are running concurrently
4. Contact Matt Chenard (mattchenard2009@gmail.com) if issues persist
