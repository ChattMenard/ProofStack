# Founding Employers Program

## Overview
The first 5 employers to sign up on ProofStack receive **1 month of Pro tier for FREE** as Founding Employers.

## Benefits

### For Founding Employers:
- 🏆 **Founding Employer Badge** - Special status badge (#1-5)
- 💎 **1 Month Pro Tier FREE** - Full access to all premium features
- ⚡ **Priority Support** - Get help faster
- 📊 **Advanced Analytics** - Track all engagement metrics
- 💬 **Unlimited Messaging** - Connect with unlimited professionals
- 🔍 **Advanced Search Filters** - Find the perfect candidates
- ⭐ **Featured Listings** - Higher visibility

## How It Works

### 1. Automatic Assignment
When an employer signs up:
- A database trigger checks the count of existing founding employers
- If less than 5, automatically assigns founding employer status
- Sets subscription tier to "pro"
- Sets expiration to 1 month from signup date
- Assigns sequential founding number (1-5)

### 2. Signup Flow
```
User signs up → Trigger fires → Check count < 5 → 
Assign founding status → Upgrade to Pro → 
Show celebration message
```

### 3. Celebration Experience
- **Signup Page**: Gold banner promoting limited spots
- **Dashboard**: Massive celebration banner with founding number
- **Badge**: Visible founding employer badge throughout platform

## Technical Implementation

### Database Changes
```sql
-- New columns on organizations table
is_founding_employer: boolean
founding_employer_number: integer (1-5)
pro_expires_at: timestamptz
```

### Trigger Function
Automatically runs on organization INSERT:
- Counts existing founding employers
- If < 5, assigns status and Pro tier
- Sets 1-month expiration

### API Response
Signup endpoint returns founding employer status:
```json
{
  "isFoundingEmployer": true,
  "foundingNumber": 3,
  "subscriptionTier": "pro"
}
```

## Views & Queries

### Check Founding Employer Status
```sql
SELECT * FROM founding_employers_status;
```

Returns:
- Organization details
- Founding number
- Expiration date
- Days remaining
- Status (Active/Expired)

### Check Spots Remaining
```sql
SELECT founding_employer_spots_remaining();
```

Returns number of spots still available (0-5).

## After Expiration

When the 1-month Pro tier expires:
- Organization automatically downgrades to "free" tier
- Founding employer badge remains (lifetime honor)
- Can upgrade to paid Pro tier anytime
- All data and connections preserved

## Migration

Run this migration in Supabase:
```bash
# File: supabase/migrations/add_founding_employers.sql
```

This adds:
- ✅ Required columns to organizations table
- ✅ Trigger for automatic assignment
- ✅ View for status checking
- ✅ Function for spots remaining

## Files Modified

1. **supabase/migrations/add_founding_employers.sql** - Database migration
2. **app/employer/signup/page.tsx** - Gold banner on signup page
3. **app/api/employer/signup/route.ts** - Returns founding status
4. **app/employer/dashboard/page.tsx** - Celebration banner on dashboard

## Testing

### Test Locally
1. Run migration in Supabase
2. Sign up as first employer → Should get Founding Employer #1
3. Sign up as second employer → Should get #2
4. Continue until 5
5. Sixth signup → Should NOT get founding status

### Verify Status
```sql
-- Check current founding employers
SELECT * FROM founding_employers_status;

-- Check how many spots left
SELECT founding_employer_spots_remaining();
```

## Marketing Copy

### Signup Page
"🏆 **Founding Employer Program** - First 5 employers only: Get 1 month of Pro tier FREE! Premium features, priority support, and a founding member badge."

### Dashboard
"🎉 Congratulations! You're one of our first 5 employers. You have 1 month of Pro tier FREE with all premium features!"

## Future Enhancements

Potential additions:
- Email notification when founding employer status is assigned
- Lifetime discount for founding employers (e.g., 20% off Pro tier)
- Special founding employer badge in search results
- Hall of fame page showcasing founding employers
- Anniversary celebrations for founding employers

## Support

If an employer has issues with founding status:
1. Check database: `SELECT * FROM organizations WHERE is_founding_employer = true;`
2. Verify trigger is active: `SELECT * FROM pg_trigger WHERE tgname = 'trigger_assign_founding_employer';`
3. Manually assign if needed (edge case):
   ```sql
   UPDATE organizations 
   SET is_founding_employer = true,
       founding_employer_number = X,
       subscription_tier = 'pro',
       pro_expires_at = now() + interval '1 month'
   WHERE id = 'org-id-here';
   ```
