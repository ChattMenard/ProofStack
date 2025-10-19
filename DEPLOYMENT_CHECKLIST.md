# ProofStack Deployment Checklist

## ✅ Pre-Deployment (Completed)
- [x] All code committed and pushed to GitHub
- [x] Email notification system implemented
- [x] Professional dashboard complete
- [x] Admin dashboard complete
- [x] Documentation complete
- [x] Environment variable template created
- [x] Database migrations prepared

## 🚀 Vercel Deployment Steps

### 1. Deploy to Vercel
```bash
# Option A: Using Vercel CLI
vercel --prod

# Option B: Using GitHub integration
# 1. Go to https://vercel.com
# 2. Click "Add New Project"
# 3. Import ProofStack repository
# 4. Configure and deploy
```

### 2. Configure Environment Variables in Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

#### Required - Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

#### Required - Stripe
```
STRIPE_SECRET_KEY=sk_live_... (or sk_test_... for testing)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... (or pk_test_...)
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Required - Email System (NEW)
```
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=ProofStack <notifications@proofstack.com>
CRON_SECRET=<generate with: openssl rand -base64 32>
```

#### Required - Site Configuration
```
NEXT_PUBLIC_SITE_URL=https://proofstack.vercel.app (or your domain)
NODE_ENV=production
```

#### Optional - Monitoring
```
SENTRY_DSN=https://...
NEXT_PUBLIC_SENTRY_DSN=https://...
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

#### Optional - Features
```
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
OPENAI_API_KEY=sk-...
```

### 3. Configure Stripe Webhook

After deployment:

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter: `https://your-domain.vercel.app/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy webhook signing secret
6. Add to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`
7. Redeploy if needed

### 4. Set Up Resend Email Service

1. **Create Resend Account**
   - Go to https://resend.com
   - Sign up (free tier: 3,000 emails/month)

2. **Get API Key**
   - Dashboard → API Keys → Create API Key
   - Copy and add to Vercel as `RESEND_API_KEY`

3. **Verify Domain**
   - Dashboard → Domains → Add Domain
   - Add your domain (e.g., proofstack.com)
   - Add DNS records:
     * SPF record: `v=spf1 include:_spf.resend.com ~all`
     * DKIM records (provided by Resend)
     * DMARC record (optional but recommended)
   - Wait 5-10 minutes for verification

4. **Test Email Sending**
   - Use Resend's test mode first
   - Send test emails to yourself
   - Verify deliverability

### 5. Run Database Migrations

Execute in Supabase SQL Editor:

```sql
-- Add expiry notification tracking
ALTER TABLE professional_promotions 
ADD COLUMN IF NOT EXISTS expiry_notified BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_professional_promotions_expiring 
ON professional_promotions(expires_at, is_active, expiry_notified) 
WHERE is_active = true;
```

### 6. Verify Cron Job Setup

1. **Check Vercel Configuration**
   - The `vercel.json` file already includes cron configuration
   - Cron job runs daily at 10:00 AM UTC
   - Path: `/api/cron/check-expiring-promotions`

2. **Test Cron Endpoint** (after deployment)
   ```bash
   curl -X GET https://your-domain.vercel.app/api/cron/check-expiring-promotions \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

3. **Monitor in Vercel**
   - Dashboard → Your Project → Logs
   - Filter by `/api/cron/check-expiring-promotions`
   - Check execution times and results

### 7. Post-Deployment Testing

#### Test Employer Flow
- [ ] Sign up as employer at `/auth/signup-employer`
- [ ] Complete organization profile
- [ ] Search for professionals at `/employer/discover`
- [ ] Save a candidate
- [ ] Send a message
- [ ] Verify email notification received

#### Test Professional Flow
- [ ] Sign up as professional
- [ ] Create portfolio at `/upload`
- [ ] View dashboard at `/professional/dashboard`
- [ ] Purchase promotion at `/professional/promote`
- [ ] Complete Stripe checkout
- [ ] Verify promotion active in `/professional/promote/manage`
- [ ] Check metrics tracking (views, saves, messages)

#### Test Messaging
- [ ] Send message from employer
- [ ] Verify real-time delivery
- [ ] Check email notification sent
- [ ] Reply from professional

#### Test Reviews
- [ ] Leave review as employer
- [ ] Verify rating calculated
- [ ] Check email notification sent to professional
- [ ] Verify review appears on portfolio

#### Test Admin Dashboard
- [ ] Access `/admin/dashboard` as founder
- [ ] Verify user counts
- [ ] Check revenue calculation (MRR)
- [ ] View top professionals
- [ ] Monitor recent activity

#### Test Cron Job
- [ ] Wait for scheduled execution (10:00 AM UTC)
- [ ] Or manually trigger with curl
- [ ] Check Vercel logs for execution
- [ ] Verify emails sent for expiring promotions

### 8. Monitor Key Metrics

#### Vercel Dashboard
- Deployment status
- Function execution times
- Error rates
- Bandwidth usage

#### Sentry (if configured)
- Error tracking
- Performance monitoring
- User feedback

#### PostHog (if configured)
- User analytics
- Event tracking
- Funnel analysis

#### Resend Dashboard
- Email delivery rates
- Bounce rates
- Open rates (if tracking enabled)

#### Stripe Dashboard
- Subscription counts
- MRR tracking
- Failed payments
- Churn rate

## 🐛 Troubleshooting

### Emails Not Sending
1. Check `RESEND_API_KEY` is set correctly in Vercel
2. Verify domain in Resend dashboard
3. Check DNS records are propagated
4. Review Resend logs for delivery issues
5. Check recipient email exists in profiles table

### Cron Job Not Running
1. Verify `vercel.json` cron configuration
2. Check `CRON_SECRET` environment variable
3. View Vercel logs for execution errors
4. Test manually with curl command
5. Ensure deployment is on Pro plan (crons require Pro)

### Stripe Webhook Failing
1. Verify webhook URL is correct
2. Check `STRIPE_WEBHOOK_SECRET` matches
3. Review Stripe webhook logs
4. Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### Database Connection Issues
1. Verify Supabase credentials
2. Check RLS policies are correct
3. Ensure service role key has proper permissions
4. Review Supabase logs

### Real-Time Messaging Not Working
1. Check Supabase Realtime is enabled
2. Verify WebSocket connections
3. Check browser console for errors
4. Test with different browsers

## 🔒 Security Checklist

- [ ] All API keys stored as environment variables
- [ ] No secrets committed to Git
- [ ] Stripe webhook signature verification enabled
- [ ] Cron endpoints secured with CRON_SECRET
- [ ] RLS policies tested and working
- [ ] CORS configured correctly
- [ ] Rate limiting considered for API routes
- [ ] SQL injection prevention (parameterized queries)

## 📊 Success Metrics to Track

### Week 1
- Total signups (professionals + employers)
- Promotion purchases
- Messages sent
- Reviews submitted
- Email delivery rate

### Month 1
- Monthly Recurring Revenue (MRR)
- User retention rate
- Message response rate
- Review completion rate
- Promotion renewal rate

## 🎉 Launch Checklist

- [ ] All tests passing
- [ ] Documentation complete
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Email domain verified
- [ ] Stripe webhooks configured
- [ ] Cron jobs running
- [ ] Monitoring tools active
- [ ] Error tracking enabled
- [ ] Analytics tracking enabled

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Stripe Docs**: https://stripe.com/docs
- **Resend Docs**: https://resend.com/docs
- **Next.js Docs**: https://nextjs.org/docs

## 🚀 Ready to Deploy!

Once all environment variables are configured and you've completed the checklist:

```bash
# Deploy to production
vercel --prod

# Or let GitHub integration auto-deploy
git push origin main
```

Monitor the deployment in Vercel dashboard and test all features thoroughly!

---

**Need Help?** Check the documentation files:
- [EMAIL_NOTIFICATIONS_GUIDE.md](EMAIL_NOTIFICATIONS_GUIDE.md)
- [PLATFORM_COMPLETION_SUMMARY.md](PLATFORM_COMPLETION_SUMMARY.md)
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
