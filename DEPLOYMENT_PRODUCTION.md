# ProofStack Production Deployment Checklist

## Overview
This guide walks through deploying ProofStack to Vercel + Supabase production.
Estimated time: 20-30 minutes (depending on how quickly you gather credentials).

## Prerequisites
- Vercel account (free tier works): https://vercel.com
- Supabase account (free tier works): https://supabase.com
- GitHub account (OAuth app configured): https://github.com/settings/developers
- Stripe account (for payments): https://stripe.com
- Cloudinary account (for file storage): https://cloudinary.com
- Optional: Sentry, PostHog, Upstash for monitoring/analytics

---

## Step 1: Gather Production Credentials (5-10 min)

### Supabase
1. Go to https://supabase.com/dashboard
2. Create a new **production** project (or use existing)
3. Wait for project to be created (~2 min)
4. Go to **Settings > API**
5. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Public Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service Role Secret** (keep secret!) → `SUPABASE_SERVICE_ROLE_KEY`

### Stripe
1. Go to https://dashboard.stripe.com
2. Ensure you're in **production mode** (toggle in top-left)
3. Go to **Developers > API Keys**
4. Copy:
   - **Publishable key** (starts with `pk_live_`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** (starts with `sk_live_`) → `STRIPE_SECRET_KEY`
5. Go to **Developers > Webhooks**
6. Create new endpoint:
   - URL: `https://your-production-domain.com/api/stripe/webhook`
   - Events: Select `payment_intent.succeeded`, `payment_intent.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`
7. Copy webhook secret → `STRIPE_WEBHOOK_SECRET`

### Cloudinary
1. Go to https://cloudinary.com/console/settings/api
2. Copy:
   - **Cloud name** → `CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** (keep secret!) → `CLOUDINARY_API_SECRET`

### GitHub OAuth
1. Go to https://github.com/settings/developers
2. Go to **OAuth Apps > New OAuth App**
3. Fill in:
   - **Application name**: `ProofStack Production`
   - **Homepage URL**: `https://your-production-domain.com`
   - **Authorization callback URL**: `https://your-production-domain.com/auth/callback`
4. Click **Register application**
5. Copy:
   - **Client ID** → `GITHUB_CLIENT_ID`
   - **Client Secret** (click to generate, keep secret!) → `GITHUB_CLIENT_SECRET`

### OpenAI
1. Go to https://platform.openai.com/api/keys
2. Click **Create new secret key**
3. Copy → `OPENAI_API_KEY`

### Optional: Resend (Email)
1. Go to https://resend.com/api-keys
2. Copy API key → `RESEND_API_KEY`
3. Your email domain → `RESEND_FROM_EMAIL` (format: "ProofStack <notifications@your-domain.com>")

### Security: Generate CRON_SECRET
```powershell
# Generate a random secret for cron endpoints
$bytes = [byte[]]::new(32)
[Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
$secret = [Convert]::ToBase64String($bytes)
Write-Host $secret
```

---

## Step 2: Create Vercel Project (2-3 min)

1. Go to https://vercel.com/new
2. Import your GitHub repository (ProofStack)
3. Click **Import**
4. In the configuration screen:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `.` (default)
   - **Build Command**: `npm run build` (pre-filled)
   - **Output Directory**: `.next` (pre-filled)
   - **Install Command**: `npm install` (pre-filled)
5. Click **Deploy** (this will fail with missing env vars - that's expected)

---

## Step 3: Add Environment Variables to Vercel (3-5 min)

### Option A: Vercel Dashboard (Recommended for first-time)
1. Go to your Vercel project dashboard
2. Go to **Settings > Environment Variables**
3. For each variable in the list below, click **Add New** and fill in:
   - **Name**: (from the list below)
   - **Value**: (your credential from Step 1)
   - **Environment**: Production
   - **Encrypt** (toggle): ON (for secrets)
4. Click **Add**

**Required variables to add:**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY (secret)
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY (secret)
STRIPE_WEBHOOK_SECRET (secret)
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET (secret)
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET (secret)
OPENAI_API_KEY (secret)
CRON_SECRET (secret)
RESEND_API_KEY (secret, optional)
RESEND_FROM_EMAIL (optional)
```

### Option B: PowerShell Script (Faster if you have many vars)
1. Copy `.env.production.example` to `.env.production`:
```powershell
Copy-Item .env.production.example .env.production
```

2. Edit `.env.production` and fill in all your credentials (from Step 1)

3. Run the setup script:
```powershell
# First time: link project
vercel login
vercel link

# Then bulk-add vars
# (Note: The PowerShell script can be run locally; it will prompt Vercel CLI)
# For now, manually add via Vercel dashboard UI (Option A) is more reliable
```

---

## Step 4: Apply Supabase Migrations (3-5 min)

Migrations create database tables and Row Level Security policies.

### Option A: Supabase SQL Editor (Easiest)
1. Go to your Supabase project dashboard
2. Go to **SQL Editor** (left sidebar)
3. Copy and run each migration file **in order** from `supabase/migrations/`:
   - `20251018_add_rls_policies.sql`
   - `20251019_employer_platform_foundation.sql`
   - `add_proof_score_v2.sql`
   - `add_security_audit_logging.sql`
   - `harden_work_samples_security.sql`
   - (continue with remaining .sql files in numerical/alphabetical order)
4. Paste each file content, click **Run**, wait for success ✓

### Option B: Supabase CLI
```powershell
# Link CLI to your project
npx supabase login
npx supabase link --project-ref YOUR-PROJECT-REF

# Apply all migrations
npx supabase db push

# Verify
npx supabase db list
```

---

## Step 5: Trigger Vercel Deployment (2-3 min)

1. Go to your Vercel project dashboard
2. Go to **Deployments**
3. Click on the failed deployment (from Step 2)
4. Click **Redeploy** (or manually trigger via Git push)
5. Wait for deployment to complete (~3-5 min)
6. Once successful, you'll see a URL like `https://your-app.vercel.app`

Alternatively, deploy locally:
```powershell
vercel --prod
```

---

## Step 6: Verify Deployment (2-3 min)

### Smoke Tests
1. Visit your app URL (from Step 5)
2. Homepage should load without errors ✓
3. Sign-up page accessible ✓
4. Try signing up with GitHub (optional, requires OAuth callback to work)

### Check Logs
1. Vercel dashboard > **Deployments** > Click your deployment
2. View **Logs** tab for any build/runtime errors
3. Look for Sentry/PostHog initialization messages (optional features)

### Database Check
1. Supabase dashboard > **Tables**
2. Verify tables exist: `profiles`, `work_samples`, `analyses`, `messages`, etc.
3. Click **profiles** table > **Edit Data** to confirm RLS policies are working

---

## Step 7: Configure Stripe Webhook (if using payments)

1. You created the webhook in Step 1 (Stripe section)
2. Verify webhook in Stripe Dashboard:
   - Go to **Developers > Webhooks**
   - Click your endpoint (from Step 1)
   - Confirm **Status**: Active (green)
3. Test webhook (optional):
   - Click **Send test event** > Select `payment_intent.succeeded` > **Send event**
   - Check Vercel logs for successful webhook receipt

---

## Step 8: Post-Deployment Checklist

- [ ] App loads without console errors
- [ ] Sign-in redirects to GitHub (if configured)
- [ ] Supabase tables visible in dashboard
- [ ] No Sentry/error-tracking alerts
- [ ] Stripe webhook shows as "Active"
- [ ] Environment variables set in Vercel (no missing key warnings in logs)
- [ ] Database backups enabled in Supabase (Settings > Backups)

---

## Troubleshooting

### "Missing environment variable" error
- Check Vercel dashboard > Settings > Environment Variables
- Verify variable name matches exactly (case-sensitive)
- Redeploy after adding new variables

### "Database connection failed"
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set and correct (not anon key)
- Check Supabase project is in production mode
- Migrations may not have been applied; re-run them

### "Stripe webhook not received"
- Verify `STRIPE_WEBHOOK_SECRET` is set in Vercel env
- Check Stripe webhook endpoint URL matches your Vercel domain
- Webhook status should show "Active" in Stripe dashboard

### "Can't sign in with GitHub"
- Verify `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set
- Check OAuth app callback URL in GitHub matches your Vercel domain: `https://your-domain/auth/callback`

### Database migration error
- Ensure migrations are applied **in order** (numerical order matters)
- Check Supabase logs (Logs tab in dashboard) for error details
- If a migration fails, you may need to skip it or manually fix the DB state

---

## Security Notes

- **Never commit `.env.production`** with real secrets to git
- **Rotate Stripe keys** if you suspect compromise
- **Enable Supabase backups** (free tier gets 24-hour backups)
- **Monitor Sentry errors** if configured
- **Review RLS policies** periodically to ensure data is private

---

## Next Steps After Deployment

1. **Monitor logs** in Vercel and Sentry (if configured)
2. **Test features** thoroughly (upload, messaging, payment flows)
3. **Set up monitoring alerts** (optional)
4. **Enable CI/CD** (GitHub Actions, if desired)
5. **Plan for scaling** (rate limits, CDN, database optimization)

---

## Timeline Summary
- Step 1 (Credentials): 5-10 min
- Step 2 (Vercel project): 2-3 min
- Step 3 (Env vars): 3-5 min
- Step 4 (Migrations): 3-5 min
- Step 5 (Deploy): 2-3 min
- Step 6 (Verify): 2-3 min
- **Total: ~20-35 minutes**

---

## Support

If stuck:
1. Check `CODEBASE_STATUS.md` and `SECURITY_IMPLEMENTATION.md` for architecture details
2. Review logs in Vercel and Supabase dashboards
3. Check GitHub Issues or Discussions (if available)
4. Verify all migration files have been applied in order
