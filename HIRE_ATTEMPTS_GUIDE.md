# Employer Hire Attempts System

## Overview
Employers can **browse professional profiles for free** but are limited to **3 failed hire attempts** before requiring upgrade to Pro tier.

## Business Logic

### Free Tier Rules
- ✅ **Unlimited browsing** of professional profiles
- ✅ **3 free hire attempts** (message/contact requests)
- ❌ **Failed attempts count** toward the limit
- ✅ **Successful hires don't count** toward the limit
- 💎 **Pro tier = unlimited** hiring

### What Counts as an Attempt?
1. **Message Button** - Sending first message to professional
2. **Contact Request** - Requesting professional's contact info
3. **Hire Button** - Clicking "Hire This Professional"

### What Counts as "Failed"?
- Professional doesn't respond within 7 days
- Professional declines the opportunity
- Conversation ends without hire
- **Successful hire = doesn't count toward limit**

### Upgrade Paths
1. **Pay for Pro** - $49/month for unlimited hiring
2. **Become Founding Employer** - Complete hire + review = 1 month Pro FREE
3. **Enterprise** - Custom plans for teams

## Database Schema

### Tables Created

#### `hire_attempts` Table
Tracks every hire attempt with full audit trail:
```sql
- id (uuid)
- employer_org_id (uuid) - Which organization
- employer_user_id (uuid) - Which user clicked
- professional_id (uuid) - Who they tried to hire
- attempted_at (timestamptz) - When
- attempt_type (text) - 'message' | 'contact_request' | 'hire_button'
- was_successful (boolean) - Did it go through?
- blocked_reason (text) - Why blocked if unsuccessful
- upgraded_after (boolean) - Did they upgrade after?
```

#### Columns Added to `employer_organizations`
```sql
- hire_attempts_count (integer) - Total failed attempts
- hire_attempts_limit (integer) - Max free attempts (default 3)
- last_hire_attempt_at (timestamptz) - Most recent attempt
```

## Database Functions

### `can_employer_hire(employer_org_id)`
**Check if employer can hire (doesn't record attempt)**

Returns:
```json
{
  "can_hire": true,
  "reason": "Free tier - 2 attempts remaining",
  "attempts_used": 1,
  "attempts_remaining": 2,
  "limit": 3,
  "is_unlimited": false
}
```

Pro/Founding employers get:
```json
{
  "can_hire": true,
  "reason": "Unlimited (Pro/Founding)",
  "attempts_remaining": 999,
  "is_unlimited": true
}
```

### `record_hire_attempt(org_id, user_id, professional_id, type, successful, reason)`
**Record an attempt in audit trail**

Parameters:
- `employer_org_id` - Organization UUID
- `employer_user_id` - User UUID who clicked
- `professional_id` - Professional UUID
- `attempt_type` - 'message', 'contact_request', or 'hire_button'
- `was_successful` - true/false
- `blocked_reason` - NULL if successful, reason if blocked

Returns:
```json
{
  "attempt_id": "uuid",
  "recorded": true,
  "total_failed_attempts": 2
}
```

### `check_hire_limit_and_record(org_id, user_id, professional_id, type)`
**Check eligibility AND record the attempt (all-in-one)**

This is the main function to call when employer clicks hire/message/contact.

Returns:
```json
{
  "allowed": true,
  "reason": "Free tier - 2 attempts remaining",
  "attempts_remaining": 2,
  "requires_upgrade": false,
  "attempt_recorded": true
}
```

Or if blocked:
```json
{
  "allowed": false,
  "reason": "Free tier limit reached - upgrade to Pro",
  "attempts_remaining": 0,
  "requires_upgrade": true,
  "attempt_recorded": true
}
```

## API Endpoints

### `GET /api/employer/check-hire-limit?employer_org_id=xxx`
**Check status without recording attempt**

Use this for:
- Showing remaining attempts in UI
- Pre-flight check before showing hire buttons
- Dashboard widgets

### `POST /api/employer/check-hire-limit`
**Check AND record attempt**

Body:
```json
{
  "employer_org_id": "uuid",
  "employer_user_id": "uuid",
  "professional_id": "uuid",
  "attempt_type": "message"
}
```

Use this when:
- User clicks "Message Professional"
- User clicks "Request Contact"
- User clicks "Hire This Professional"

## React Components

### `<HireLimitGuard>`
**Wrap hire buttons to enforce limits**

```tsx
import HireLimitGuard from '@/components/HireLimitGuard'

<HireLimitGuard
  employerOrgId={orgId}
  employerUserId={userId}
  professionalId={professionalId}
  attemptType="message"
  onLimitReached={() => {
    // Show upgrade modal or redirect
  }}
>
  <button>Message Professional</button>
</HireLimitGuard>
```

**Features:**
- Shows loading spinner while checking
- Automatically hides children if limit reached
- Shows upgrade prompt when blocked
- Records attempt on click
- Suggests Founding Employer program

### `<HireAttemptsRemaining>`
**Dashboard widget showing remaining attempts**

```tsx
import HireAttemptsRemaining from '@/components/HireAttemptsRemaining'

<HireAttemptsRemaining employerOrgId={orgId} />
```

**Features:**
- Color-coded progress bar (green → yellow → red)
- Shows X of 3 attempts used
- "Unlimited" badge for Pro/Founding
- Upgrade button when limit reached
- Helpful tips for free tier users

## Implementation Guide

### Step 1: Wrap Hire Buttons
Wrap any button that initiates contact with professionals:

```tsx
// Before
<button onClick={() => sendMessage()}>
  Message Professional
</button>

// After
<HireLimitGuard
  employerOrgId={employerOrg.id}
  employerUserId={currentUser.id}
  professionalId={professional.id}
  attemptType="message"
>
  <button onClick={() => sendMessage()}>
    Message Professional
  </button>
</HireLimitGuard>
```

### Step 2: Add Dashboard Widget
Show remaining attempts on employer dashboard:

```tsx
import HireAttemptsRemaining from '@/components/HireAttemptsRemaining'

export default function EmployerDashboard({ orgId }) {
  return (
    <div>
      <h1>Dashboard</h1>
      <HireAttemptsRemaining employerOrgId={orgId} />
      {/* ...rest of dashboard */}
    </div>
  )
}
```

### Step 3: Update Message/Contact APIs
Before sending messages or contact requests, check the limit:

```typescript
// In your message send API
const response = await fetch('/api/employer/check-hire-limit', {
  method: 'POST',
  body: JSON.stringify({
    employer_org_id: orgId,
    employer_user_id: userId,
    professional_id: recipientId,
    attempt_type: 'message'
  })
})

const { allowed } = await response.json()

if (!allowed) {
  return NextResponse.json(
    { error: 'Hire limit reached - upgrade to Pro' },
    { status: 403 }
  )
}

// Proceed with sending message...
```

### Step 4: Apply Migration
Run the migration in Supabase SQL Editor:

```bash
# Copy contents of supabase/migrations/add_employer_hire_attempts.sql
# Paste into Supabase Dashboard → SQL Editor
# Execute
```

Verify:
```sql
-- Check table created
SELECT * FROM hire_attempts LIMIT 1;

-- Check columns added
\d employer_organizations;

-- Test function
SELECT can_employer_hire('your-org-id-here');
```

## User Experience Flow

### Free Tier Employer Journey

1. **Browse Freely** ✅
   - View all professional profiles
   - Read reviews and skills
   - See portfolios and samples
   - No restrictions

2. **First Hire Attempt** (1/3 used)
   - Clicks "Message Professional"
   - `HireLimitGuard` checks limit
   - Allowed! Message sent
   - Dashboard shows "2 attempts remaining"

3. **Second Attempt** (2/3 used)
   - Different professional
   - Clicks "Request Contact"
   - Allowed! Contact request sent
   - Dashboard shows "1 attempt remaining" (yellow warning)

4. **Third Attempt** (3/3 used)
   - Another professional
   - Clicks "Hire This Professional"
   - Allowed! Hire request sent
   - Dashboard shows "0 attempts remaining" (red alert)

5. **Fourth Attempt** ❌ **BLOCKED**
   - Clicks any hire button
   - `HireLimitGuard` blocks and shows upgrade prompt:
     - "Free Tier Limit Reached"
     - Pro benefits list
     - "Upgrade to Pro" button
     - "Back to Search" button
     - Founding Employer tip

### Pro/Founding Employer Journey

1. **Unlimited Access** ✨
   - Dashboard shows "Unlimited Hiring"
   - No restrictions on any actions
   - All hire buttons work without checks
   - Badge showing Pro/Founding status

## Analytics & Insights

### Track Conversion Metrics

```sql
-- How many employers hit the limit?
SELECT COUNT(DISTINCT employer_org_id)
FROM employer_organizations
WHERE hire_attempts_count >= hire_attempts_limit
  AND subscription_tier = 'free';

-- How many upgraded after hitting limit?
SELECT COUNT(DISTINCT employer_org_id)
FROM hire_attempts
WHERE upgraded_after = true;

-- What attempt type converts best?
SELECT 
  attempt_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE was_successful = true) as successful,
  ROUND(COUNT(*) FILTER (WHERE was_successful = true)::numeric / COUNT(*) * 100, 2) as success_rate
FROM hire_attempts
GROUP BY attempt_type;

-- Average attempts before upgrade
SELECT 
  AVG(hire_attempts_count) as avg_attempts_before_upgrade
FROM employer_organizations
WHERE subscription_tier = 'pro'
  AND hire_attempts_count > 0;
```

## Testing Checklist

- [ ] Free tier employer sees attempts remaining widget
- [ ] First 3 attempts go through successfully
- [ ] 4th attempt shows upgrade prompt
- [ ] Pro tier employer sees "Unlimited" status
- [ ] Founding employer sees "Unlimited" status
- [ ] Attempts are recorded in hire_attempts table
- [ ] Failed attempts increment counter
- [ ] Successful hires don't increment counter
- [ ] Upgrade button links to /employer/upgrade
- [ ] Founding Employer tip links to program info
- [ ] Color coding works (green → yellow → red)
- [ ] Progress bar updates correctly

## Future Enhancements

- [ ] **Smart Reset** - Reset counter when they upgrade
- [ ] **Attempt Expiry** - Failed attempts expire after 30 days
- [ ] **Partial Refund** - Give back attempts if professional declines quickly
- [ ] **A/B Testing** - Test different limits (3 vs 5 vs unlimited)
- [ ] **Email Notifications** - Warn at 1 attempt remaining
- [ ] **Analytics Dashboard** - Show conversion funnel
