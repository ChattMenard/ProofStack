# Email Notification System Setup Guide

## Overview
ProofStack now has a complete email notification system using Resend to keep users engaged with timely transactional emails.

## Email Types

### 1. New Message Notifications
**Trigger:** When a user receives a message in a conversation  
**Sent to:** Message recipient (professional or employer)  
**Content:** 
- Sender name and organization
- Message preview (first 100 characters)
- "Reply to Message" CTA button
- Link to the conversation

**Implementation:** `app/api/messages/send/route.ts`

### 2. New Review Notifications
**Trigger:** When an employer leaves a review for a professional  
**Sent to:** Professional who received the review  
**Content:**
- Employer/organization name
- Star rating with emojis
- Review text preview (first 150 characters)
- "View Full Review" CTA button
- Link to portfolio page reviews section

**Implementation:** `app/api/reviews/create/route.ts`

### 3. Promotion Expiring Notifications
**Trigger:** Daily cron job checks for promotions expiring in 7 days  
**Sent to:** Professionals with expiring promotions  
**Content:**
- Current tier name and emoji
- Days remaining until expiry
- Expiration date
- Warning about returning to organic search
- "Renew Promotion" and "View Plans" CTA buttons

**Implementation:** `app/api/cron/check-expiring-promotions/route.ts`

## Setup Instructions

### 1. Install Resend Package
```bash
npm install resend
```
✅ Already installed (11 packages added)

### 2. Configure Environment Variables
Add to `.env.local` and Vercel environment:

```env
# Resend API Key (get from https://resend.com/api-keys)
RESEND_API_KEY=re_xxxxxxxxxxxx

# From email address (must be verified domain in Resend)
RESEND_FROM_EMAIL=ProofStack <notifications@proofstack.com>

# Cron secret for securing cron endpoints
CRON_SECRET=your_random_secret_here_generate_with_openssl
```

### 3. Verify Domain in Resend
1. Go to https://resend.com/domains
2. Add your domain (e.g., proofstack.com)
3. Add the DNS records provided by Resend:
   - SPF record for email authentication
   - DKIM records for signing
   - DMARC record for reporting
4. Wait for verification (usually 5-10 minutes)

### 4. Run Database Migration
Add the `expiry_notified` column to track promotion expiry emails:

```sql
-- Run in Supabase SQL Editor
ALTER TABLE professional_promotions 
ADD COLUMN IF NOT EXISTS expiry_notified BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_professional_promotions_expiring 
ON professional_promotions(expires_at, is_active, expiry_notified) 
WHERE is_active = true;
```

Migration file: `supabase/migrations/add_expiry_notified.sql`

### 5. Configure Vercel Cron Job
The cron job is already configured in `vercel.json`:

```json
"crons": [
  {
    "path": "/api/cron/check-expiring-promotions",
    "schedule": "0 10 * * *"
  }
]
```

This runs daily at 10:00 AM UTC.

**Important:** Set `CRON_SECRET` in Vercel environment variables to secure the endpoint.

### 6. Add Authorization Header to Vercel Cron
Vercel automatically adds the authorization header when calling cron jobs. The endpoint verifies:

```typescript
const authHeader = req.headers.get('authorization');
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

## Email Templates

All email templates are in `lib/email/notifications.ts` with:
- Responsive HTML design
- Gradient headers matching ProofStack branding
- Mobile-friendly layouts
- Clear CTA buttons
- Unsubscribe links (prepared for future preferences)

### Customization
To customize email templates, edit the HTML in `lib/email/notifications.ts`:
- Update colors in gradient backgrounds
- Change button styles
- Modify text and layout
- Add ProofStack logo (if available)

## Testing

### Test Message Notification
1. Sign in as employer
2. Go to /employer/discover
3. Click "Message" on any professional
4. Send a message
5. Check recipient's email inbox

### Test Review Notification
1. Sign in as employer
2. Go to a professional's portfolio
3. Leave a review
4. Check professional's email inbox

### Test Promotion Expiring Notification
Manually trigger the cron job (local or staging):

```bash
curl -X GET http://localhost:3000/api/cron/check-expiring-promotions \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Or create a test promotion expiring in 7 days:

```sql
UPDATE professional_promotions 
SET expires_at = NOW() + INTERVAL '7 days',
    expiry_notified = false
WHERE id = 'test_promotion_id';
```

Then run the cron job.

## Monitoring

### Check Email Delivery
1. Go to Resend dashboard: https://resend.com/emails
2. View sent emails, delivery status, and open rates
3. Check bounce/complaint reports

### View Cron Job Logs
1. Go to Vercel dashboard
2. Select your project
3. Navigate to Logs
4. Filter by "/api/cron/check-expiring-promotions"
5. Check execution times and results

### Error Tracking
All email errors are logged but don't block operations:
- Message sending continues even if email fails
- Review creation succeeds regardless of email status
- Cron job reports failed/successful email counts

## Email Preferences (Future)

Placeholder for future email preference management:

```typescript
// Add to profiles table
email_preferences JSONB DEFAULT '{
  "messages": true,
  "reviews": true, 
  "promotions": true
}'
```

Check preferences before sending:
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('email_preferences')
  .eq('id', userId)
  .single();

if (profile?.email_preferences?.messages !== false) {
  // Send message email
}
```

Add settings page at `/settings/notifications` for users to toggle preferences.

## Resend Pricing

**Free Tier:**
- 3,000 emails/month
- 100 emails/day
- Perfect for MVP and testing

**Pro Tier ($20/month):**
- 50,000 emails/month
- 1,000 emails/day
- Email analytics and tracking

Scale as needed based on user activity.

## Files Modified

### New Files
- `lib/email/notifications.ts` - Email service with 3 template functions
- `app/api/messages/send/route.ts` - Message API with email notification
- `app/api/cron/check-expiring-promotions/route.ts` - Cron job for expiring promotions
- `supabase/migrations/add_expiry_notified.sql` - Database migration

### Modified Files
- `components/messages/MessageThread.tsx` - Uses new message API
- `app/api/reviews/create/route.ts` - Sends review notification emails
- `vercel.json` - Added cron job configuration

## Security Considerations

1. **API Keys:** Never commit `RESEND_API_KEY` to git
2. **Cron Secret:** Use strong random string for `CRON_SECRET`
3. **Rate Limiting:** Resend has built-in rate limiting
4. **Email Validation:** All emails verified before sending
5. **Fire and Forget:** Email failures don't break core functionality

## Troubleshooting

### Emails Not Sending
1. Check `RESEND_API_KEY` is set correctly
2. Verify domain in Resend dashboard
3. Check Resend logs for delivery issues
4. Ensure recipient email exists in profiles table

### Cron Job Not Running
1. Verify cron configuration in `vercel.json`
2. Check `CRON_SECRET` environment variable
3. View Vercel logs for execution errors
4. Test manually with curl command

### Emails Going to Spam
1. Complete domain verification (SPF, DKIM, DMARC)
2. Use verified sender domain
3. Avoid spam trigger words
4. Include unsubscribe link

## Next Steps

1. ✅ Basic email notification system implemented
2. ⏳ Monitor email delivery rates in production
3. ⏳ Add email preferences UI
4. ⏳ Implement email analytics tracking
5. ⏳ Add more notification types (connection requests, profile views)
6. ⏳ Create HTML email templates with ProofStack logo
7. ⏳ A/B test email subject lines and CTAs

## Support

- Resend Documentation: https://resend.com/docs
- Resend Status: https://status.resend.com
- ProofStack Slack: #engineering-notifications
