# Apply ProofScore Migration - Quick Start

## Step 1: Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your **ProofStack** project
3. Click **SQL Editor** in the left sidebar

## Step 2: Run ProofScore Migration

1. Click **"New Query"** button
2. Open this file in your editor: `supabase/migrations/add_proof_score_rating.sql`
3. Copy the ENTIRE contents (all ~260 lines)
4. Paste into the SQL Editor
5. Click **"Run"** (or press Ctrl+Enter)

## Step 3: Verify Success

Run these verification queries one at a time:

### Check Column Added
```sql
SELECT proof_score, proof_score_breakdown, last_score_calculated_at
FROM professional_ratings
LIMIT 1;
```
**Expected:** Shows new columns (may be NULL if no reviews yet)

### Test Calculate Function
```sql
SELECT calculate_proof_score('00000000-0000-0000-0000-000000000000'::uuid);
```
**Expected:** Returns JSON with `proof_score: 0` and breakdown

### Check View Created
```sql
SELECT * FROM professional_leaderboard LIMIT 5;
```
**Expected:** Returns leaderboard (may be empty if no reviews yet)

### Check Trigger Installed
```sql
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'trigger_auto_update_proof_score';
```
**Expected:** Shows trigger name with `tgenabled = 'O'` (enabled)

## Step 4: Test with Real Data (Optional)

If you have professionals with reviews already:

```sql
-- Pick a professional with reviews
SELECT pr.professional_id, p.username, pr.total_projects_completed
FROM professional_ratings pr
JOIN profiles p ON p.id = pr.professional_id
WHERE pr.total_projects_completed > 0
LIMIT 1;

-- Calculate their score (use the professional_id from above)
SELECT update_professional_proof_score('paste-professional-id-here'::uuid);

-- View their score
SELECT 
  proof_score,
  proof_score_breakdown,
  total_projects_completed
FROM professional_ratings
WHERE professional_id = 'paste-professional-id-here'::uuid;
```

## Expected Output Examples

### Successful Migration
```
Query executed successfully
Time: ~2-5 seconds
Rows returned: 0 (DDL statements don't return rows)
```

### Calculate Score Response
```json
{
  "proof_score": 85.5,
  "breakdown": {
    "response_score": 18,
    "response_hours": 3.2,
    "delivery_score": 18,
    "delivery_rate": 92,
    "communication_score": 17.6,
    "communication_rating": 4.4,
    "quality_score": 16.8,
    "quality_rating": 4.2,
    "professionalism_score": 18.4,
    "professionalism_rating": 4.6,
    "total_projects": 5
  }
}
```

### Leaderboard View
```
professional_id | username | proof_score | rank | tier
------------------------------------------------
uuid-123       | jane_dev | 92.5       | 1    | Elite
uuid-456       | john_pro | 87.3       | 2    | Excellent
uuid-789       | mary_eng | 78.1       | 3    | Good
```

## Troubleshooting

### Error: "relation already exists"
**Solution:** Migration was already applied partially. Safe to ignore or run again (it's idempotent).

### Error: "function does not exist"
**Solution:** Run the entire migration as one block, not line by line.

### Error: "permission denied"
**Solution:** Make sure you're using the Supabase dashboard (has admin privileges).

### No scores showing
**Solution:** ProofScore requires completed projects with reviews. Scores will populate as reviews are submitted.

## What Happens After Migration?

✅ **Auto-calculation:** Scores update automatically when new reviews are posted
✅ **Leaderboard:** `professional_leaderboard` view shows ranked professionals
✅ **API ready:** `/api/professional/proof-score` endpoint works immediately
✅ **Components ready:** `<ProofScore />` component can be added to any page

## Next: Add to UI

After migration succeeds, add ProofScore to your pages:

### Professional Profile
```tsx
import ProofScore from '@/components/ProofScore'

<ProofScore 
  professionalId={professional.id}
  size="large"
  showBreakdown={true}
/>
```

### Search Results
```tsx
<ProofScore 
  professionalId={professional.id}
  size="small"
/>
```

### Dashboard
```tsx
<ProofScore 
  professionalId={currentUser.id}
  size="medium"
/>
```

## Success Criteria

Migration is successful when:
- [x] No errors in SQL Editor
- [x] New columns exist on `professional_ratings`
- [x] Functions return expected JSON
- [x] View shows leaderboard data
- [x] Trigger is active
- [x] API endpoint returns scores

---

**Time to complete:** ~5 minutes
**Risk level:** Low (migration is idempotent and doesn't modify existing data)
**Rollback:** Not needed (only adds columns/functions, doesn't change existing ones)
