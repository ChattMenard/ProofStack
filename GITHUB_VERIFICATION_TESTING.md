## GitHub Verification Testing Guide

### Prerequisites
1. ✅ Migration `20251026_profile_verifications.sql` must be run in Supabase
2. ✅ User must be logged in as a professional
3. ✅ GitHub username should have recent commits (last 6 months)

### Test Steps

#### 1. Run the Migration
```sql
-- In Supabase SQL Editor, run:
-- supabase/migrations/20251026_profile_verifications.sql
```

#### 2. Access Verification Page
- Navigate to: https://proofstack-two.vercel.app/professional/verify
- Or use dropdown menu: 👤 Professional → ✓ Verify Accounts

#### 3. Verify GitHub Account
- Enter GitHub username: `ChattMenard` (or your username)
- Click "Verify GitHub Account"
- Wait for API response

#### 4. Expected Results

**Success Case:**
```
✅ GitHub account verified! Found X commits in the last 6 months.
```
- Verification record created in `profile_verifications` table
- `github_verified` = true
- Badge appears immediately on page

**No Activity Case:**
```
⚠️ GitHub account found but no recent commits. Add some activity to verify.
```
- Account exists but no commits in last 6 months
- `github_verified` = false

**Error Cases:**
```
❌ GitHub user not found
❌ Failed to verify GitHub account
```

#### 5. Verify Badges Display

**Portfolio Page:**
- Navigate to: `/portfolio/mattchenard2009@gmail.com`
- Look for verification badges below name/email
- Should see GitHub icon with checkmark

**Employer Search:**
- Login as employer
- Navigate to: `/employer/discover`
- Search for yourself
- Look for small badges on profile card (no labels, icon-only)

**Verification Page:**
- Return to `/professional/verify`
- "Your Verifications" section should show GitHub badge

### Database Check
```sql
-- Check verification record
SELECT * FROM profile_verifications 
WHERE profile_id = (
  SELECT id FROM profiles 
  WHERE email = 'mattchenard2009@gmail.com'
);
```

### Troubleshooting

**Badge Not Showing:**
- Check browser console for errors
- Verify profile_verifications record exists
- Check github_verified = true
- Refresh page (component loads on mount)

**API Errors:**
- Check GitHub API rate limit (60 requests/hour without token)
- Add GITHUB_TOKEN env var for 5000 requests/hour
- Check network tab for API response

**Database Errors:**
- Verify migration ran successfully
- Check RLS policies are enabled
- Confirm user is authenticated

### Expected Database Schema
```sql
profile_verifications (
  id uuid PRIMARY KEY,
  profile_id uuid REFERENCES profiles(id),
  github_verified boolean,
  github_verified_at timestamp,
  github_username text,
  github_profile_url text,
  github_last_commit_date timestamp,
  github_total_commits integer,
  ...
)
```

### GitHub API Limits
- **Unauthenticated:** 60 requests/hour
- **With token:** 5000 requests/hour

To add token (optional):
```bash
# In .env.local
GITHUB_TOKEN=ghp_your_personal_access_token
```

Generate token at: https://github.com/settings/tokens
- Scopes needed: `public_repo`, `read:user`

### Next Steps After Verification
1. LinkedIn verification (OAuth flow)
2. Portfolio website verification (meta tag)
3. Additional badge types (work samples, identity)
