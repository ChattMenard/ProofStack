# Applying Database Migrations

## Quick Start

### Option 1: Use the PowerShell Helper Script (Easiest)

```powershell
.\scripts\apply-migrations.ps1
```

This will show you the migration files and help you copy them to Supabase.

### Option 2: Manual Application via Supabase Dashboard

1. **Go to your Supabase SQL Editor:**
   - Open your Supabase project dashboard
   - Navigate to: **SQL Editor** (in the left sidebar)
   - Or go directly to: `https://supabase.com/dashboard/project/[your-project]/sql`

2. **Apply Migration 003 (GitHub API Cache):**
   - Open `supabase/migrations/003_github_api_cache.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click **"RUN"** (or press Ctrl+Enter)
   - Verify: You should see "Success. No rows returned"

3. **Apply Migration 004 (API Cost Tracking):**
   - Open `supabase/migrations/004_api_cost_tracking.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click **"RUN"**
   - Verify: You should see "Success. No rows returned"

### Option 3: Using Node.js Script

```bash
node scripts/apply-migrations.js
```

This will attempt to programmatically apply the migrations.

---

## Migration Files

### 003_github_api_cache.sql
**Purpose:** GitHub API response caching with ETag support

**Creates:**
- `github_api_cache` table
- Indexes for performance
- RLS policies for security
- Cleanup function for expired entries
- Automatic timestamp triggers

**Verify it worked:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'github_api_cache';
```

Should return: `github_api_cache`

### 004_api_cost_tracking.sql
**Purpose:** Track LLM/transcription API costs

**Creates:**
- `api_cost_logs` table
- Indexes for queries
- RLS policies
- Summary view: `api_cost_summary`
- Functions: `get_user_total_cost()`, `get_cost_by_provider()`, `check_daily_budget()`
- Trigger to update analysis costs

**Verify it worked:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'api_cost_logs';
```

Should return: `api_cost_logs`

---

## Verification Queries

After applying both migrations, run these to verify:

### Check Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('github_api_cache', 'api_cost_logs')
ORDER BY table_name;
```

Expected result: Both table names

### Check Functions Exist
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN (
  'cleanup_expired_github_cache',
  'get_user_total_cost',
  'get_cost_by_provider',
  'check_daily_budget'
)
ORDER BY routine_name;
```

Expected result: All 4 function names

### Check RLS is Enabled
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('github_api_cache', 'api_cost_logs');
```

Expected result: Both tables with `rowsecurity = true`

---

## Troubleshooting

### Error: "relation already exists"
This means the migration was already applied. You can safely ignore this or add `IF NOT EXISTS` clauses.

### Error: "permission denied"
Make sure you're using an account with sufficient privileges (project owner or service role).

### Error: "syntax error"
Make sure you copied the entire SQL file including all function definitions. Don't break the SQL in the middle of a function.

### Need to Rollback?

If you need to undo a migration:

**Drop GitHub API Cache:**
```sql
DROP TABLE IF EXISTS github_api_cache CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_github_cache() CASCADE;
DROP FUNCTION IF EXISTS update_github_cache_timestamp() CASCADE;
```

**Drop API Cost Tracking:**
```sql
DROP TABLE IF EXISTS api_cost_logs CASCADE;
DROP VIEW IF EXISTS api_cost_summary CASCADE;
DROP FUNCTION IF EXISTS get_user_total_cost(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_cost_by_provider(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS check_daily_budget(UUID, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS update_analysis_cost() CASCADE;
```

---

## Installing Supabase CLI (Optional)

If you want to use `supabase` commands in the future:

### Windows (PowerShell as Admin)
```powershell
# Install Scoop if you don't have it
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Install Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### macOS/Linux
```bash
brew install supabase/tap/supabase
```

### Using npm (project-local)
```bash
npm install supabase --save-dev
npx supabase --version
```

Then you can run:
```bash
npx supabase db push
npx supabase db pull
npx supabase migration list
```

---

## Migration Status Tracking

Create a simple table to track which migrations have been applied:

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mark migrations as applied
INSERT INTO schema_migrations (version) VALUES 
  ('003_github_api_cache'),
  ('004_api_cost_tracking')
ON CONFLICT (version) DO NOTHING;

-- Check migration status
SELECT * FROM schema_migrations ORDER BY version;
```

---

## Next Steps

After applying migrations:

1. **Test GitHub API caching:**
   - Visit `/api/github/repos` 
   - Check response headers: `X-Cache: MISS` first time, `X-Cache: HIT` second time

2. **Test cost tracking:**
   - Make an API call that uses LLM (analyze a sample)
   - Visit `/api/costs/stats` to see the cost log
   - Check the `api_cost_logs` table in Supabase

3. **Monitor performance:**
   - Use Supabase Dashboard → Database → Performance Insights
   - Check query performance and index usage

---

## Support

If you run into issues:

1. Check the Supabase logs in Dashboard → Logs
2. Verify your database user has correct permissions
3. Ensure you're connected to the correct project
4. Check the SQL syntax in the migration files

For more help:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
