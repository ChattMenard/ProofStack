# Security Definer Audit & Fix - Complete Report

**Date**: October 30, 2025  
**Status**: ✅ FIXED - Migration Created  
**Migration File**: `supabase/migrations/20251030_fix_security_definer.sql`

---

## Summary

Fixed critical `SECURITY DEFINER` vulnerabilities in API cost tracking functions. The view `api_cost_summary` was already safe (no SECURITY DEFINER), but two functions needed fixes.

---

## What Was Fixed

### 1. `get_user_total_cost(UUID)` Function

**Before** (VULNERABLE):
```sql
CREATE FUNCTION get_user_total_cost(p_user_id UUID) ... 
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Problem**: Runs with elevated privileges, allowing any user to query anyone's costs.

**After** (SECURE):
```sql
CREATE FUNCTION get_user_total_cost(p_user_id UUID) ... 
  -- Enforces: caller must match p_user_id
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
$$ LANGUAGE plpgsql SECURITY INVOKER STABLE;
```

**Changes**:
- ✅ Changed to `SECURITY INVOKER` (uses caller's privileges)
- ✅ Added explicit `auth.uid()` check
- ✅ Raises exception if user tries to query other users' data
- ✅ Marked `STABLE` for query optimization
- ✅ Revoked PUBLIC access, granted to `authenticated` only

---

### 2. `get_cost_by_provider(UUID, INTEGER)` Function

**Before** (VULNERABLE):
```sql
CREATE FUNCTION get_cost_by_provider(p_user_id UUID, p_days INTEGER) ... 
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Problem**: Same - runs with elevated privileges.

**After** (SECURE):
```sql
CREATE FUNCTION get_cost_by_provider(p_user_id UUID, p_days INTEGER) ... 
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
$$ LANGUAGE plpgsql SECURITY INVOKER STABLE;
```

**Changes**: Same security hardening as above.

---

### 3. `api_cost_summary` View

**Status**: ✅ Already safe (no SECURITY DEFINER)

**Enhanced**:
```sql
CREATE VIEW api_cost_summary 
WITH (security_invoker = true) AS ...

REVOKE ALL ON api_cost_summary FROM PUBLIC;
GRANT SELECT ON api_cost_summary TO authenticated;
```

**Changes**:
- ✅ Explicitly set `security_invoker = true` (default, but now explicit)
- ✅ Revoked PUBLIC access
- ✅ Granted SELECT to `authenticated` only
- ✅ Added documentation comment

---

## Other SECURITY DEFINER Functions (REVIEWED - SAFE)

Your codebase has other `SECURITY DEFINER` functions that are **considered safe** because they:
1. Check `auth.uid()` explicitly
2. Are used in triggers where elevated privileges are needed
3. Have specific, limited scope

### Safe Functions:
- **Forum triggers**: `handle_new_thread_func`, `handle_new_reply_func`, `handle_upvote_func`, `update_forum_user_stats_func`
  - Used in `AFTER INSERT` triggers
  - Update reputation stats atomically
  - Check `auth.uid()` to verify caller

- **ProofScore functions**: Used for calculating scores
  - Called by authenticated API routes
  - Check `auth.uid()` ownership

- **Hire attempts**: Track employer hiring limits
  - Validate employer ownership
  - Atomic counter updates

- **Profile triggers**: Auto-create profiles on signup
  - Run on `AFTER INSERT` for new users
  - Limited to single operation

---

## How to Apply This Fix

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to: https://app.supabase.com/project/lytjmxjizalmgbgrgfvc/sql
2. Click "New Query"
3. Copy entire contents of `supabase/migrations/20251030_fix_security_definer.sql`
4. Paste and click "Run"
5. Verify output shows: `Security verification passed: cost functions properly restricted`

### Option 2: Via Supabase CLI

```bash
cd /home/mattson/ProofStack
supabase db push
```

---

## Verification Steps

After applying the migration, verify:

### 1. Check Function Security Type
```sql
SELECT 
  routine_name,
  security_type,
  routine_definition LIKE '%auth.uid()%' as has_auth_check
FROM information_schema.routines 
WHERE routine_name IN ('get_user_total_cost', 'get_cost_by_provider')
AND routine_schema = 'public';
```

**Expected**: `security_type = 'INVOKER'` and `has_auth_check = true`

### 2. Check PUBLIC Access
```sql
SELECT routine_name, grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_name IN ('get_user_total_cost', 'get_cost_by_provider')
AND routine_schema = 'public';
```

**Expected**: No `PUBLIC` grants, only `authenticated`

### 3. Test Authorization
```sql
-- As authenticated user
SELECT * FROM get_user_total_cost(auth.uid()); -- ✅ Should work

-- Try to query another user
SELECT * FROM get_user_total_cost('some-other-uuid'); -- ❌ Should error
```

**Expected**: Error message `Unauthorized: can only view own cost data`

---

## Impact Assessment

### ✅ What Works After Fix
- Users can still query their own cost data via functions
- RLS policies on `api_cost_logs` table still enforced
- Admin dashboard (using service_role) still works
- View `api_cost_summary` respects caller's RLS policies

### ⚠️ Breaking Changes
**None!** The authorization checks ensure only the owner can query their data, which is the intended behavior.

### 🔒 Security Improvements
1. **No privilege escalation**: Functions run with caller's permissions
2. **Explicit authorization**: Hard-coded `auth.uid()` checks
3. **Least privilege**: Only `authenticated` role can execute
4. **Defense in depth**: Both function checks AND RLS policies

---

## Monitoring & Maintenance

### Regular Security Audits

Run this query monthly to check for new SECURITY DEFINER functions:

```sql
SELECT 
  routine_schema,
  routine_name,
  routine_type,
  security_type,
  routine_definition LIKE '%auth.uid()%' as has_auth_check
FROM information_schema.routines 
WHERE security_type = 'DEFINER'
AND routine_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY routine_schema, routine_name;
```

**Action**: Any new `DEFINER` functions should be reviewed and either:
1. Converted to `INVOKER` with explicit auth checks
2. Documented with justification for why DEFINER is needed

### Audit Logging

Consider enabling PostgreSQL audit logging for privileged operations:

```sql
-- Enable audit extension (if available)
CREATE EXTENSION IF NOT EXISTS pgaudit;

-- Configure audit settings
ALTER SYSTEM SET pgaudit.log = 'all';
ALTER SYSTEM SET pgaudit.log_level = 'notice';
```

---

## Best Practices Going Forward

### When to Use SECURITY DEFINER (Rarely!)
✅ **Acceptable**:
- Database triggers that need to update system tables
- Tightly scoped functions with explicit authorization checks
- Service-layer operations called via service_role key

❌ **Avoid**:
- Any function callable directly by clients
- Views (use RLS on underlying tables instead)
- Functions without explicit `auth.uid()` validation

### Pattern: Safe SECURITY DEFINER Function
```sql
CREATE FUNCTION safe_privileged_operation(param UUID)
RETURNS ... AS $$
BEGIN
  -- 1. Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- 2. Check authorization
  IF NOT EXISTS (
    SELECT 1 FROM owned_resources 
    WHERE id = param AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- 3. Perform privileged operation
  ...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Restrict access
REVOKE EXECUTE ON FUNCTION safe_privileged_operation(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION safe_privileged_operation(UUID) TO authenticated;
```

---

## Related Documentation

- `SECURITY_IMPLEMENTATION.md` - P0 security hardening checklist
- `DATABASE_SCHEMA_EMPLOYER.md` - RLS policies documentation
- `RATE_LIMITING_AND_COSTS.md` - API cost tracking overview

---

## Quick Checklist

- [x] Created migration file `20251030_fix_security_definer.sql`
- [ ] Applied migration to production Supabase
- [ ] Verified functions are SECURITY INVOKER
- [ ] Verified PUBLIC access revoked
- [ ] Tested authorization checks work
- [ ] Documented in `SECURITY_IMPLEMENTATION.md`
- [ ] Scheduled monthly SECURITY DEFINER audit

---

**Once you apply this migration, your API cost tracking will be secure! 🔒**

Run the migration via Supabase SQL Editor and you're done.
