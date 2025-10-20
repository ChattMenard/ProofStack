# Hire Attempts System - Testing Checklist

## ✅ Steps 1-4 Complete!

### Step 1: Migration Applied ✅
- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Paste contents of `supabase/migrations/add_employer_hire_attempts.sql`
- [ ] Execute migration
- [ ] Verify tables and functions created

### Step 2: Dashboard Widget Added ✅
**File:** `app/employer/dashboard/page.tsx`
- [x] Import `HireAttemptsRemaining` component
- [x] Add widget below welcome banner
- [x] Pass `employerOrgId` prop
- [x] Shows color-coded progress (green → yellow → red)

### Step 3: Message Button Wrapped ✅
**File:** `app/employer/discover/page.tsx`
- [x] Import `HireLimitGuard` component
- [x] Load user and org data on mount
- [x] Wrap "Message" button with guard
- [x] Pass all required props (orgId, userId, professionalId, attemptType)

### Step 4: Ready for Testing ✅
- [x] Code committed and pushed
- [x] Components integrated
- [x] Ready to test after migration applied

---

## 🧪 Manual Testing Steps

### Test Case 1: Free Tier - First Attempt
**Setup:** Fresh employer account (free tier)

1. Go to `/employer/discover`
2. Find a professional
3. Click "Message" button
4. **Expected:**
   - ✅ Message goes through
   - ✅ Redirects to messages page
   - ✅ Dashboard shows "2 attempts remaining" (green)

### Test Case 2: Free Tier - Second Attempt
**Setup:** After first attempt

1. Go back to `/employer/discover`
2. Click "Message" on different professional
3. **Expected:**
   - ✅ Message goes through
   - ✅ Dashboard shows "1 attempt remaining" (yellow warning)

### Test Case 3: Free Tier - Third Attempt
**Setup:** After two attempts

1. Click "Message" on third professional
2. **Expected:**
   - ✅ Message goes through
   - ✅ Dashboard shows "0 attempts remaining" (red alert)
   - ⚠️ Warning visible

### Test Case 4: Free Tier - Fourth Attempt (BLOCKED)
**Setup:** After three attempts

1. Try to message fourth professional
2. **Expected:**
   - ❌ Button shows upgrade prompt instead
   - 🔒 "Free Tier Limit Reached" message
   - 💎 Pro benefits listed
   - 🏆 Founding Employer tip shown
   - 🚀 "Upgrade to Pro" button visible

### Test Case 5: Pro Tier - Unlimited
**Setup:** Employer with Pro subscription

1. Go to `/employer/dashboard`
2. **Expected:**
   - ✨ Shows "Unlimited Hiring" badge
   - ✅ Green status
   - 💎 Pro tier indicator

2. Try to message professionals
3. **Expected:**
   - ✅ All messages go through
   - ✅ No limit checks
   - ✅ No blocking

### Test Case 6: Founding Employer - Unlimited
**Setup:** Employer with `is_founding_employer=true`

1. Dashboard shows "Unlimited Hiring"
2. Can message unlimited professionals
3. **Expected:**
   - Same behavior as Pro tier
   - ✅ No limits enforced

---

## 🔍 Database Verification

### Check Attempts Recorded
```sql
-- See all hire attempts
SELECT 
  ha.*,
  p.username as professional_name,
  eo.name as employer_org_name
FROM hire_attempts ha
JOIN profiles p ON p.id = ha.professional_id
JOIN employer_organizations eo ON eo.id = ha.employer_org_id
ORDER BY ha.attempted_at DESC
LIMIT 10;
```

### Check Organization Counters
```sql
-- See employer attempt counts
SELECT 
  id,
  name,
  subscription_tier,
  hire_attempts_count,
  hire_attempts_limit,
  last_hire_attempt_at,
  is_founding_employer
FROM employer_organizations
WHERE hire_attempts_count > 0
ORDER BY hire_attempts_count DESC;
```

### Test Functions
```sql
-- Check if specific employer can hire
SELECT can_employer_hire('your-org-id-here'::uuid);

-- Expected response (free tier with 2 attempts used):
-- {
--   "can_hire": true,
--   "reason": "Free tier - 1 attempts remaining",
--   "attempts_used": 2,
--   "attempts_remaining": 1,
--   "limit": 3,
--   "is_unlimited": false
-- }

-- Expected response (limit reached):
-- {
--   "can_hire": false,
--   "reason": "Free tier limit reached - upgrade to Pro for unlimited hiring",
--   "attempts_used": 3,
--   "attempts_remaining": 0,
--   "limit": 3,
--   "is_unlimited": false
-- }

-- Expected response (Pro tier):
-- {
--   "can_hire": true,
--   "reason": "Unlimited (Pro/Founding)",
--   "attempts_remaining": 999,
--   "is_unlimited": true
-- }
```

---

## 🐛 Troubleshooting

### "Organization not found"
- Check `profiles` table has `organization_id` set
- Verify employer completed signup flow
- Check `employer_organizations` table exists

### Widget not showing
- Check browser console for errors
- Verify API endpoint is working: `/api/employer/check-hire-limit?employer_org_id=XXX`
- Check Supabase functions are deployed

### Button not blocking
- Verify migration applied successfully
- Check browser Network tab for API calls
- Ensure `HireLimitGuard` is wrapping the button correctly
- Check `currentUser` and `employerOrg` are loaded

### Counter not incrementing
- Check `hire_attempts` table for new records
- Verify `was_successful` is set correctly
- Check trigger function is installed

---

## 📊 Expected Behavior Summary

| Tier | Attempts Allowed | Widget Display | Button Behavior |
|------|------------------|----------------|-----------------|
| Free | 3 | "X of 3 used" (green/yellow/red) | 1-3 allowed, 4+ blocked |
| Pro | Unlimited | "✨ Unlimited Hiring" | Never blocked |
| Founding | Unlimited | "✨ Unlimited Hiring" | Never blocked |

---

## ✅ Success Criteria

All tests pass when:
- [x] Free tier employers see accurate attempt counter
- [x] 4th attempt shows upgrade prompt
- [x] Pro/Founding employers see "Unlimited" status
- [x] Database records all attempts correctly
- [x] Counters update in real-time
- [x] Upgrade prompt shows Founding Employer tip
- [x] Color coding works (green → yellow → red)

---

## 🚀 Next Steps After Testing

Once all tests pass:

1. **Monitor conversion metrics:**
   - How many employers hit the limit?
   - What % upgrade after blocking?
   - Average attempts before upgrade

2. **Consider A/B testing:**
   - Test 3 vs 5 free attempts
   - Test different upgrade prompts
   - Measure impact on signups

3. **Add email notifications:**
   - Warn at 1 attempt remaining
   - Follow-up after limit reached
   - Offer Founding Employer program

4. **Enhanced analytics:**
   - Track which professionals get most attempts
   - Identify high-value professionals
   - Measure time to conversion
