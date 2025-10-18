# ProofStack Security & Founder Program Guide

**Last Updated:** October 18, 2025

## 🔐 Security Assessment

### ✅ Current Security Status

**API Keys Protection:**
- ✅ All sensitive keys stored in `.env.local` (gitignored)
- ✅ Server-side only access to OpenAI, Anthropic, Supabase service role keys
- ✅ Client exposes only safe public keys (`NEXT_PUBLIC_*`)
- ✅ Cloudinary uses unsigned uploads with preset restrictions

**Authentication:**
- ✅ All expensive endpoints require `requireAuth()` - bearer token validation
- ✅ Supabase RLS policies enforce row-level security
- ✅ GitHub OAuth with per-user tokens (no shared credentials)

**Rate Limiting:**
- ✅ 30 requests/minute per user/IP via Upstash Redis
- ✅ Fallback to in-memory limiting in development
- ✅ NEW: Waitlist endpoint rate limited (3 signups/hour per IP)

**Cost Controls:**
- ✅ Daily budget limits per tier (Free: $0.50, Pro: $5)
- ✅ Automatic model fallback chains (Claude → GPT → Ollama)
- ✅ Cost tracking database with real-time monitoring

### ⚠️ Pre-Launch Security Checklist

**Before public launch, ensure:**

- [ ] Apply database migrations (waitlist, founder tier, usage tracking)
- [ ] Test rate limiting under load
- [ ] Review Supabase RLS policies
- [ ] Set up monitoring alerts (Sentry for errors, Vercel for uptime)
- [ ] Configure Cloudinary upload presets to restrict file types
- [ ] Enable CAPTCHA for waitlist if spam becomes an issue
- [ ] Review all API endpoints for unprotected routes
- [ ] Test authentication flow end-to-end
- [ ] Backup database before launch
- [ ] Document incident response plan

---

## 🌟 Founder Program: First 100 Users Free Forever

### Overview

The first 100 users who sign up for ProofStack will receive **Founder tier** status with:
- ✅ Free forever access (no subscription required)
- ✅ Unlimited uploads per month
- ✅ Unlimited AI analysis
- ✅ Unlimited storage
- ✅ Special Founder badge on profile
- ✅ Numbered badge (Founder #1, #2, etc.)
- ✅ Early access to new features
- ✅ Direct line to the founder

### Implementation

**Database Schema:**
```sql
-- users table additions
- plan: text (values: 'free', 'pro', 'founder')
- founder_number: integer (1-100, unique)
- is_founder: boolean
- usage_limits: jsonb
```

**Auto-Assignment:**
- Trigger automatically assigns founder status on signup
- First 100 users get founder_number (1-100)
- Sets plan='founder' and unlimited usage_limits
- Subsequent users get default 'free' tier

**Usage Limits by Tier:**

| Tier | Uploads/Month | Analysis/Month | Storage | Cost |
|------|--------------|----------------|---------|------|
| Free | 10 | 20 | 1 GB | $0 |
| Pro | 100 | 200 | 10 GB | $20/mo |
| **Founder** | **Unlimited** | **Unlimited** | **Unlimited** | **$0** |

### Marketing Copy

**Landing Page Badge:**
```
🌟 Join the first 100 users and get lifetime free access!
[X/100 spots remaining]
```

**Email to Founders:**
```
Subject: You're Founder #[NUMBER]! 🎉

Congratulations! You're one of the first 100 people to join ProofStack.

As Founder #[NUMBER], you have:
✅ Free lifetime access (no credit card, ever)
✅ Unlimited uploads & AI analysis
✅ Exclusive Founder badge on your portfolio
✅ Early access to all new features
✅ Direct feedback line to Matt (founder)

Thank you for believing in ProofStack from day one!

Best,
Matt
Founder, ProofStack
```

**Product Hunt Copy:**
```
🎉 Special Launch Offer: The first 100 signups get Founder status with lifetime free access! 
No credit card required, unlimited everything, and a special badge to show you were here from the start.

[X/100 spots remaining - join now!]
```

### How to Check Founder Count

**In Supabase SQL Editor:**
```sql
-- Count current founders
SELECT COUNT(*) as founder_count FROM users WHERE is_founder = true;

-- List all founders
SELECT * FROM founder_users ORDER BY founder_number ASC;

-- Check specific user
SELECT email, plan, founder_number, is_founder, usage_limits 
FROM users WHERE email = 'user@example.com';
```

**In Application:**
```typescript
import { getUserUsage } from '@/lib/usageLimits'

const usage = await getUserUsage(userId)
if (usage?.is_founder) {
  console.log(`User is Founder #${usage.founder_number}`)
}
```

### Displaying Founder Status

**Profile Component:**
```tsx
import FounderBadge from '@/components/FounderBadge'

{user.is_founder && (
  <FounderBadge founderNumber={user.founder_number} />
)}
```

**Dashboard:**
```tsx
{user.is_founder && (
  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-lg p-4 mb-4">
    <h3 className="text-lg font-bold text-yellow-900 mb-2">
      🌟 Founder Status
    </h3>
    <p className="text-sm text-yellow-800">
      You're Founder #{user.founder_number} with lifetime free access!
    </p>
  </div>
)}
```

---

## 📋 Pre-Launch Deployment Checklist

### 1. Apply Database Migrations

```bash
# Go to Supabase SQL Editor
# https://lytjmxjizalmgbgrgfvc.supabase.co/project/default/sql

# Run these migrations in order:
1. supabase/migrations/20251017_add_waitlist_table.sql
2. supabase/migrations/20251018_add_founder_tier.sql
3. supabase/migrations/20251018_add_usage_tracking.sql
```

### 2. Environment Variables

**Verify all required env vars are set in Vercel:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://lytjmxjizalmgbgrgfvc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
OPENAI_API_KEY=sk-proj-...
CLOUDINARY_CLOUD_NAME=dh4xjrs3j
CLOUDINARY_API_KEY=517998867229797
CLOUDINARY_API_SECRET=_Y-jMu...
GITHUB_CLIENT_ID=Ov23li...
GITHUB_CLIENT_SECRET=f1c25f...
NEXT_PUBLIC_POSTHOG_KEY=phc_HQ...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### 3. Test Authentication Flow

```bash
# Local testing
1. Start dev server: npm run dev
2. Visit http://localhost:3000
3. Click "Sign Up"
4. Verify email magic link OR GitHub OAuth
5. Upload a sample
6. Check founder status assignment
7. Verify usage limits work
```

### 4. Deploy to Production

```bash
# Push to main branch
git add .
git commit -m "feat: Add founder program and usage limits"
git push origin main

# Vercel auto-deploys from main branch
# Monitor: https://vercel.com/matthew-chenards-projects/proofstack
```

### 5. Post-Deploy Verification

- [ ] Visit production URL
- [ ] Test signup flow
- [ ] Verify founder assignment works
- [ ] Check Sentry for errors
- [ ] Monitor PostHog for analytics
- [ ] Test rate limiting
- [ ] Verify API endpoints require auth

---

## 🚨 Incident Response

**If API keys are exposed:**
1. Immediately rotate keys in provider dashboards
2. Update Vercel environment variables
3. Redeploy application
4. Monitor for unusual usage spikes
5. Review audit logs

**If spam attack occurs:**
1. Check rate limiting logs
2. Add IP-based blocking if needed
3. Enable CAPTCHA on signup
4. Temporarily disable public signup

**If costs spike unexpectedly:**
1. Check `cost_tracking` table for anomalies
2. Review `usage_tracking` for abusive users
3. Temporarily reduce rate limits
4. Switch to cheaper models (Ollama)
5. Disable analysis for free tier if needed

---

## 📊 Monitoring Queries

**Check founder count:**
```sql
SELECT COUNT(*) FROM users WHERE is_founder = true;
```

**Find top users by cost:**
```sql
SELECT u.email, SUM(ct.cost_usd) as total_cost
FROM users u
JOIN cost_tracking ct ON u.id = ct.user_id
WHERE ct.created_at > NOW() - INTERVAL '7 days'
GROUP BY u.email
ORDER BY total_cost DESC
LIMIT 10;
```

**Check usage trends:**
```sql
SELECT month, 
  SUM(uploads_count) as total_uploads,
  SUM(analysis_count) as total_analysis,
  SUM(api_cost_usd) as total_cost
FROM usage_tracking
GROUP BY month
ORDER BY month DESC;
```

**Find users near limits:**
```sql
SELECT * FROM user_usage_summary
WHERE uploads_used >= uploads_limit * 0.8
  OR analysis_used >= analysis_limit * 0.8
ORDER BY uploads_used DESC;
```

---

## 💡 Next Steps

1. **Apply database migrations** (most critical)
2. **Test founder assignment** with test account
3. **Update landing page** with "X/100 spots remaining" counter
4. **Create founder email template**
5. **Set up monitoring dashboard**
6. **Prepare Product Hunt assets**
7. **Draft launch tweets**
8. **Launch! 🚀**

---

## Support

Questions? Email matt@proofstack.com or open an issue in GitHub.
