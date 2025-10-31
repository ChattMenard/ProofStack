# Navigation Verification Guide

**Purpose**: Manual testing checklist to verify all navigation works correctly  
**Date**: October 30, 2025  
**Status**: Ready for testing

## Quick Verification (5 minutes)

### 1. Header Navigation ✅
```
From any page:
1. Click "🎯 Talent Marketplace" → Should go to /portfolios
2. Click "💼 Job Marketplace" → Should go to /projectlistings
3. Click logo → Should go to / (homepage)
```

### 2. Footer Navigation ✅
```
From homepage, scroll to footer and click:
Product Section:
- Pricing → /pricing ✅
- Talent Pricing → /pricing/talent ✅
- Employer Pricing → /pricing/employer ✅
- Dashboard → /dashboard ✅
- Upload → /upload ✅
- Portfolio → /portfolio ✅

Company Section:
- About → /about ✅
- Contact → /contact ✅
- Sign Up → /signup ✅
- Login → /login ✅
- Terms → /terms ✅
- Privacy → /privacy ✅
- Sitemap → /sitemap ✅

Connect Section:
- Forum → /forum ✅
- New Discussion → /forum/new ✅
```

### 3. User Dropdown (Role-Specific) ✅

#### As Professional User
```
1. Click "My Account" button in header
2. Verify dropdown shows:
   - Dashboard
   - My Portfolio
   - My Reviews
   - My Job Listings
   - Upload Work
   - Skill Assessments
   - Import from GitHub
   - Promote Profile
   - Preferences
   - Account Settings
   - Verify Accounts
3. Click each link → Should navigate correctly
```

#### As Employer User
```
1. Click "My Account" button in header
2. Verify dropdown shows:
   - Dashboard
   - Post a Job
   - Applications
   - Discover Talent
   - Saved Professionals
   - My Reviews
   - Messages
   - Company Profile
   - Settings
3. Click each link → Should navigate correctly
```

### 4. Sitemap Verification ✅
```
1. Go to /sitemap
2. Expand each section (Public, Auth, Professional, Employer, Admin)
3. Click 5-10 random links
4. Verify all links work (blue underlined links should be clickable)
```

## Comprehensive Verification (30 minutes)

### Public Pages (13 pages)
All accessible to logged-out users:

- [ ] `/` - Homepage
  - Verify: Title includes "ProofStack"
  - Verify: Both talent and employer CTAs work
  
- [ ] `/portfolios` - Talent Marketplace
  - Verify: Title is "🎯 Talent Marketplace"
  - Verify: Can browse talent profiles
  
- [ ] `/projectlistings` - Job Marketplace
  - Verify: Title is "💼 Job Marketplace"
  - Verify: Can browse job listings
  
- [ ] `/about` - About page
  - Verify: Content displays correctly
  
- [ ] `/pricing` - Employer pricing
  - Verify: Title is "Pricing - Employer Plans"
  - Verify: Links to /pricing/talent work
  
- [ ] `/pricing/talent` - Talent pricing
  - Verify: Free tier information displays
  
- [ ] `/pricing/employer` - Employer pricing (alternate route)
  - Verify: Pricing plans display
  
- [ ] `/contact` - Contact form
  - Verify: Form displays
  
- [ ] `/forum` - Community forum
  - Verify: Forum threads display
  
- [ ] `/forum/new` - New discussion
  - Verify: Can create new thread
  
- [ ] `/privacy` - Privacy policy
  - Verify: Legal text displays
  
- [ ] `/terms` - Terms of service
  - Verify: Legal text displays
  
- [ ] `/sitemap` - Sitemap
  - Verify: All 53 pages listed

### Authentication Pages (4 pages)

- [ ] `/login` - Sign in
  - Verify: Auth form displays
  - Verify: Can log in
  
- [ ] `/signup` - Sign up
  - Verify: Title is "Sign Up - Join ProofStack"
  - Verify: Can choose talent or employer
  
- [ ] `/employer/signup` - Employer registration
  - Verify: Title is "Employer Sign Up - Hire Top Talent"
  - Verify: Employer form displays

### Professional Pages (13 pages)
Requires professional account:

- [ ] `/professional/dashboard`
  - Verify: Dashboard displays stats
  - Verify: Quick links work
  
- [ ] `/professional/settings`
  - Verify: Settings form displays
  
- [ ] `/professional/preferences`
  - Verify: Preferences form displays
  
- [ ] `/professional/messages`
  - Verify: Message list displays
  
- [ ] `/professional/reviews`
  - Verify: Reviews display
  
- [ ] `/professional/my-jobs`
  - Verify: Job listings display
  
- [ ] `/upload`
  - Verify: Upload form displays
  
- [ ] `/professional/assessments`
  - Verify: Assessment list displays
  
- [ ] `/professional/import-git`
  - Verify: GitHub import UI displays
  
- [ ] `/professional/promote`
  - Verify: Promotion options display
  
- [ ] `/professional/promote/manage`
  - Verify: Promotion analytics display
  - Note: Accessible from professional dashboard
  
- [ ] `/professional/verify`
  - Verify: Verification UI displays
  
- [ ] `/portfolio/[username]`
  - Verify: Public portfolio displays

### Employer Pages (12 pages)
Requires employer account:

- [ ] `/employer/dashboard`
  - Verify: Dashboard displays
  
- [ ] `/employer/discover`
  - Verify: Search interface displays
  - Verify: Can browse talent
  
- [ ] `/employer/saved`
  - Verify: Saved professionals list
  
- [ ] `/employer/applications`
  - Verify: Applications list displays
  
- [ ] `/employer/post-job`
  - Verify: Job posting form displays
  
- [ ] `/employer/messages`
  - Verify: Message list displays
  
- [ ] `/employer/reviews` ⭐ NEW
  - Verify: Reviews list displays
  - Verify: Links to portfolios work
  - Verify: Empty state shows if no reviews
  
- [ ] `/employer/profile`
  - Verify: Company profile displays
  
- [ ] `/employer/settings`
  - Verify: Settings form displays

### Admin Pages (3 pages)
Requires admin privileges:

- [ ] `/admin/dashboard`
  - Verify: Admin stats display
  
- [ ] `/admin/analytics/skills`
  - Verify: Skills analytics display
  
- [ ] `/admin/security`
  - Verify: Security dashboard displays

### Workflow Pages (Intentionally Not in Nav)

These pages are accessed through specific workflows:

- [ ] `/checkout`
  - Access: Click any pricing plan
  - Verify: Stripe checkout displays
  
- [ ] `/checkout/return`
  - Access: Complete Stripe checkout (redirects here)
  - Verify: Success message displays
  
- [ ] `/onboarding`
  - Access: Created automatically for new users
  - Verify: Onboarding flow displays
  
- [ ] `/settings`
  - Access: Professional dropdown → "Account Settings"
  - Verify: Redirects to /professional/settings

## Automated Testing

### Run Navigation Audit
```bash
cd /home/runner/work/ProofStack/ProofStack
node /tmp/navigation-audit.js
```

**Expected Results**:
```
✅ Total pages: 53
✅ Navigation links: 26
✅ Footer links: 15
✅ Orphaned pages: 7 (all intentional)
✅ Broken links: 0
✅ Title mismatches: 9 (all acceptable)
```

### Build Verification
```bash
npm run build
```

**Expected**: Build completes successfully with no errors

### Lint Check
```bash
npm run lint
```

**Expected**: Only pre-existing warnings (no new issues)

## Navigation Flows to Test

### Flow 1: Guest → Sign Up → Dashboard
```
1. Start at homepage (/)
2. Click "Sign Up" in footer
3. Choose "I'm Talent"
4. Complete signup
5. Should redirect to /professional/dashboard
```

### Flow 2: Guest → Browse Talent → View Profile
```
1. Start at homepage (/)
2. Click "🎯 Talent Marketplace" in header
3. Click on any talent profile
4. Should see portfolio at /portfolio/[username]
```

### Flow 3: Employer → Discover → Save → Review
```
1. Login as employer
2. Click "Discover Talent" in dropdown
3. Browse and save a professional
4. Go to "My Reviews" from dropdown
5. Should see empty state with link to discover
```

### Flow 4: Professional → Promote → Manage
```
1. Login as professional
2. Go to dashboard
3. Click "Promote Profile" card
4. Choose a promotion tier
5. After purchase, click "Manage Promotion"
6. Should see analytics at /professional/promote/manage
```

### Flow 5: Navigation Consistency
```
Test from 5 different pages:
1. Homepage → Click header links
2. Dashboard → Click header links
3. Settings → Click header links
4. Pricing → Click header links
5. Forum → Click header links

All header links should work from every page
```

## Common Issues to Check

### ❌ What to Look For

- [ ] **404 Errors**: Any link goes to 404 page
- [ ] **Broken Images**: Any images fail to load
- [ ] **Wrong Redirects**: Links go to unexpected pages
- [ ] **Auth Errors**: Can't access pages you should have access to
- [ ] **Missing Content**: Pages load but show no content
- [ ] **Console Errors**: Browser console shows errors

### ✅ What Should Work

- [ ] **Logo Click**: Always returns to homepage
- [ ] **Back Button**: Browser back works correctly
- [ ] **Refresh**: Page refresh doesn't break navigation
- [ ] **Mobile**: Navigation works on mobile screens
- [ ] **Dark Mode**: Navigation visible in both themes
- [ ] **Fast Navigation**: No unnecessary loading states

## Testing Checklist Summary

Minimum tests for verification:

- [ ] 1. All header links work (3 links)
- [ ] 2. All footer links work (15 links)
- [ ] 3. User dropdown shows correct links per role
- [ ] 4. Sitemap lists all 53 pages
- [ ] 5. New employer reviews page works
- [ ] 6. Workflow pages accessible through proper flows
- [ ] 7. Build completes successfully
- [ ] 8. Navigation audit shows 0 broken links
- [ ] 9. No console errors during navigation
- [ ] 10. Navigation works in both light/dark modes

## Success Criteria

**✅ All tests pass if**:
- No 404 errors on any navigation link
- All 53 pages accessible within 2-3 clicks
- User dropdown shows role-appropriate links
- Workflow pages accessible through proper flows
- Build completes without errors
- Navigation audit shows 0 broken links

**❌ Tests fail if**:
- Any navigation link goes to 404
- Any page completely unreachable
- User dropdown shows wrong links for role
- Build fails with errors
- Navigation audit shows broken links

## Reporting Issues

If you find any navigation issues:

1. **Document the issue**:
   - Current URL
   - Link clicked
   - Expected behavior
   - Actual behavior
   - Browser/device

2. **Check if it's known**:
   - Review NAVIGATION_AUDIT_RESULTS.md
   - Check if page is intentionally orphaned

3. **Report**:
   - Create GitHub issue with "Navigation" label
   - Include steps to reproduce
   - Include screenshot if applicable

## Additional Resources

- **Audit Results**: See `NAVIGATION_AUDIT_RESULTS.md`
- **Implementation**: See `NAVIGATION_FIX_SUMMARY.md`
- **Navigation Config**: See `lib/navigationConfig.ts`
- **Sitemap**: Visit `/sitemap` for complete directory

---

**Testing Complete?** Mark this section when all tests pass:

- [ ] Quick Verification (5 min) - All tests passed
- [ ] Comprehensive Verification (30 min) - All tests passed
- [ ] Automated Testing - All tests passed
- [ ] Navigation Flows - All flows work
- [ ] Common Issues - No issues found

**Date Tested**: __________  
**Tested By**: __________  
**Result**: ☐ Pass ☐ Fail  
**Notes**: _________________________________
