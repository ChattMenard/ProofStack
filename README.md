# ProofStack Starter

This is a minimal starter scaffold for ProofStack — an MVP for a "Digital Twin Resume" platform built with Next.js 14, Tailwind CSS and Supabase.

What this scaffold includes:
- Next.js 14 app structure (app/)
- Tailwind CSS config and global stylesheet
- Minimal Supabase client helper
- API route placeholders for upload and analysis
- Worker skeleton for background analysis
- Supabase schema SQL to create initial tables
- **Cloudinary Integration**: Automatic image upload, optimization, and display with CldImage component
- **Optimized Image Display**: Portfolio images are automatically formatted, cropped, and quality-optimized

Getting started (PowerShell)

```powershell
# 1) Install dependencies
npm install

# 2) Copy environment variables and configure them
cp .env.example .env.local
# Edit .env.local and fill in ALL required credentials:
# - Supabase URL, anon key, and service role key
# - Cloudinary cloud name, API key, and API secret
# - GitHub OAuth client ID and secret
# - OpenAI API key (for transcription)
# - Optional: Sentry DSN, PostHog key for monitoring/analytics

# 3) Run the dev server
npm run dev
```

## Deployment

ProofStack is configured for deployment on Vercel with monitoring via Sentry and analytics via PostHog.

### Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Sentry Account**: Sign up at [sentry.io](https://sentry.io) for error monitoring
3. **PostHog Account**: Sign up at [posthog.com](https://posthog.com) for analytics
4. **Environment Variables**: Configure all required environment variables (see `.env.example`)

### Deploy to Vercel

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (or use the provided script)
./deploy.sh
```

Or deploy directly:

```bash
vercel --prod
```

### Environment Variables Setup

In your Vercel dashboard, add these environment variables:

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

**Optional (for enhanced features):**
- `OLLAMA_URL`
- `OPENAI_API_KEY`
- `SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_DSN`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`

### Monitoring & Analytics

- **Sentry**: Automatic error tracking and performance monitoring
- **PostHog**: User analytics and event tracking
- Both are configured to initialize automatically when environment variables are set

Next steps:
- Fill in .env variables
- Create a Supabase project and run `supabase/schema.sql`
- Provide Ollama / whisper workers or configure remote LLM

If you want, I can now wire up GitHub OAuth and a sample upload flow in code next. Tell me to proceed with "wire auth" or "add upload UI".
