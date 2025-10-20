# Hire Attempts Migration - Apply in Supabase

## Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your ProofStack project
3. Click "SQL Editor" in the left sidebar

## Step 2: Copy Migration SQL
The migration file is located at:
`supabase/migrations/add_employer_hire_attempts.sql`

## Step 3: Execute in SQL Editor
1. Click "New Query"
2. Paste the entire contents of `add_employer_hire_attempts.sql`
3. Click "Run" (or press Ctrl+Enter)

## Step 4: Verify Migration Success
Run these verification queries:

```sql
-- Check table created
SELECT COUNT(*) FROM hire_attempts;
-- Should return: 0 (empty table, no errors)

-- Check columns added
SELECT hire_attempts_count, hire_attempts_limit, last_hire_attempt_at
FROM employer_organizations
LIMIT 1;
-- Should show the new columns with default values

-- Test functions
SELECT can_employer_hire('00000000-0000-0000-0000-000000000000'::uuid);
-- Should return JSON: {"can_hire": false, "reason": "Organization not found", ...}
```

## Step 5: Verify RLS Policies
```sql
-- Check RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'hire_attempts';
-- Should return: hire_attempts | true

-- List policies
SELECT policyname FROM pg_policies WHERE tablename = 'hire_attempts';
-- Should show 3 policies
```

## Expected Output
✅ Migration completed successfully
✅ Table `hire_attempts` created
✅ Columns added to `employer_organizations`
✅ 3 functions created (can_employer_hire, record_hire_attempt, check_hire_limit_and_record)
✅ RLS policies enabled and active
✅ Permissions granted to authenticated users

## If Errors Occur

### "relation already exists"
The migration is idempotent - it's safe to run again. Existing objects won't be affected.

### "permission denied"
Make sure you're using the Supabase dashboard (has admin privileges) not a client connection.

### "function does not exist" 
Run the entire migration as one transaction - don't run parts separately.

## After Successful Migration

Mark as complete in your project:
- [x] Migration applied
- [ ] Components integrated
- [ ] Dashboard widget added
- [ ] Hire buttons wrapped
- [ ] Testing completed

Next step: Integrate components into employer pages!
