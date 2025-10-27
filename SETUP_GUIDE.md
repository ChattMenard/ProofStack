# ProofStack Setup Guide

**Welcome!** This guide will help you get ProofStack running locally or deploy it to production.

---

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Node.js 18+ installed
- A Supabase account (free tier works)
- A Cloudinary account (free tier works)

### Step 1: Clone & Install

```powershell
git clone https://github.com/ChattMenard/ProofStack.git
cd ProofStack
npm install
```

### Step 2: Set Up Environment Variables

Copy the example file:
```powershell
cp .env.example .env.local
```

Now you need to fill in the required values. **Don't worry - we'll walk through each one!**

---

## 🔑 Required Configuration

### 1. Supabase (Database & Auth)

**What it does:** Powers your database, authentication, and real-time features.

**How to get it:**
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project"
3. Fill in:
   - Project name: `proofstack-dev`
   - Database password: (generate a strong one)
   - Region: Choose closest to you
4. Wait 2 minutes for project to be created
5. Go to Project Settings → API
6. Copy these values to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important:** The `SERVICE_ROLE_KEY` is sensitive - never commit it to git!

### 2. Cloudinary (File Storage)

**What it does:** Stores and optimizes images/videos for portfolios.

**How to get it:**
1. Go to [cloudinary.com](https://cloudinary.com) and create a free account
2. Go to Dashboard
3. Copy these values to `.env.local`:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=AbCdEfGhIjKlMnOpQrStUvWxYz
```

### 3. GitHub OAuth (Authentication)

**What it does:** Allows users to sign in with GitHub and verify their repos.

**How to get it:**
1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - Application name: `ProofStack Local Dev`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/auth/callback`
4. Click "Register application"
5. Copy Client ID, then click "Generate a new client secret"
6. Copy these to `.env.local`:

```env
GITHUB_CLIENT_ID=Iv1.abc123def456
GITHUB_CLIENT_SECRET=abc123def456789012345678901234567890abcd
```

### 4. OpenAI (AI Features)

**What it does:** Powers skill extraction, profile analysis, and ProofScore V2.

**How to get it:**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create account or sign in
3. Go to API Keys
4. Click "Create new secret key"
5. Copy to `.env.local`:

```env
OPENAI_API_KEY=sk-proj-abc123...
```

**Cost:** Typically $0.001-0.01 per analysis. Budget $5-10/month for light usage.

---

## 🏃 Run the App

Once you've configured the above, run:

```powershell
npm run dev
```

Visit `http://localhost:3000` - you should see:
- ✅ **🎯 The Talent** | **💼 Job Marketplace** in navigation
- ✅ No error messages
- ✅ Sign in/sign up buttons work

---

## 🗄️ Database Setup

After your app is running, you need to create the database tables:

### Apply Migrations

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the sidebar
3. Apply these migrations **in order**:

```sql
-- Copy and run each file from supabase/migrations/ folder:
1. 20251018_add_rls_policies.sql
2. 20251019_employer_platform_foundation.sql
3. add_proof_score_v2.sql
4. add_security_audit_logging.sql
5. harden_work_samples_security.sql
```

**Or use Supabase CLI:**
```powershell
npx supabase link --project-ref your-project-ref
npx supabase db push
```

See `MIGRATION_GUIDE.md` for detailed instructions.

---

## 🔧 Optional Services

These are **optional** - the app works without them, but features are limited:

### Stripe (Payments)
**Enables:** Talent promotion tiers ($19-99/mo)

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Setup: See `STRIPE_SETUP.md`

### Upstash Redis (Rate Limiting)
**Enables:** Production-grade rate limiting across regions

```env
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=AabBccDd...
```

**Without this:** Falls back to in-memory rate limiting (single instance only)

### Sentry (Error Tracking)
**Enables:** Production error monitoring

```env
SENTRY_DSN=https://abc123@o123.ingest.sentry.io/456
NEXT_PUBLIC_SENTRY_DSN=https://abc123@o123.ingest.sentry.io/456
```

### PostHog (Analytics)
**Enables:** User behavior tracking

```env
NEXT_PUBLIC_POSTHOG_KEY=phc_abc123...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### Resend (Email Notifications)
**Enables:** Transactional emails (new messages, reviews)

```env
RESEND_API_KEY=re_abc123...
RESEND_FROM_EMAIL=ProofStack <notifications@yourdomain.com>
```

---

## 🧪 Testing Your Setup

### Check if everything works:

```powershell
# 1. Test build
npm run build

# 2. Test locally
npm run dev

# 3. Visit these pages:
# - http://localhost:3000 (homepage)
# - http://localhost:3000/signup (signup)
# - http://localhost:3000/portfolios (The Talent marketplace)
# - http://localhost:3000/projectlistings (Job marketplace)
```

### Troubleshooting

**Issue:** "Supabase not configured" warning
- **Fix:** Check your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`

**Issue:** "onAuthStateChange is not a function"
- **Fix:** This is already handled! Make sure you have the latest code.

**Issue:** Upload fails
- **Fix:** Check Cloudinary credentials

**Issue:** Can't sign in with GitHub
- **Fix:** Verify GitHub OAuth callback URL matches your local/production URL

---

## 🌐 Production Deployment

### Vercel (Recommended)

1. Push your code to GitHub (without `.env.local`!)
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repo
5. Add all environment variables in Vercel dashboard
6. Deploy!

**Important for production:**
- Use production Supabase project (not dev)
- Use production Stripe keys (not test)
- Set `NEXT_PUBLIC_APP_URL` to your actual domain
- Configure GitHub OAuth callback to production URL

See `DEPLOYMENT_CHECKLIST.md` for full production setup.

---

## 📚 Additional Resources

- `QUICK_REFERENCE.md` - Feature overview
- `TECH_STACK.md` - Service details
- `SECURITY_IMPLEMENTATION.md` - Security checklist
- `PROOFSCORE_V2_GUIDE.md` - Scoring system
- `DATABASE_SCHEMA_EMPLOYER.md` - Database reference

---

## 🆘 Getting Help

**Common Issues:**
1. **"Module not found" errors** → Run `npm install`
2. **Build fails** → Check all required env vars are set
3. **Database errors** → Apply migrations in correct order
4. **Auth not working** → Verify Supabase + OAuth credentials

**Still stuck?**
- Check `CODEBASE_STATUS.md` for known issues
- Review migration logs in Supabase
- Check browser console for error details

---

## ✅ Setup Checklist

- [ ] Node.js 18+ installed
- [ ] Repository cloned
- [ ] `npm install` completed
- [ ] `.env.local` created from `.env.example`
- [ ] Supabase project created & keys copied
- [ ] Cloudinary account created & keys copied
- [ ] GitHub OAuth app created & keys copied
- [ ] OpenAI API key obtained
- [ ] Database migrations applied
- [ ] `npm run dev` starts without errors
- [ ] Can visit http://localhost:3000
- [ ] Can sign up/sign in
- [ ] Can upload work samples

**Once all checked:** You're ready to develop! 🎉

