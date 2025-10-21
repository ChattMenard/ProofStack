# ProofStack AI Agent Instructions

## Architecture Overview

ProofStack is a **two-sided marketplace** connecting professionals with employers through verified work samples and AI-powered skill analysis.

### Core Components
- **Frontend**: Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime) with Row-Level Security (RLS)
- **Storage**: Cloudinary for media files, Supabase for structured data
- **AI/ML**: Multi-provider strategy (OpenAI primary, Anthropic/Hugging Face fallback)
- **Payments**: Stripe Embedded Checkout with promotion tiers ($19/$49/$99)
- **Monitoring**: Sentry (errors), PostHog (analytics)
- **Email**: Resend for transactional emails (messages, reviews, expirations)

### Data Flow Architecture
```
Upload → Cloudinary → Supabase (samples) → Background Worker → AI Analysis → ProofScore
                                          ↓
User Profile ← Supabase (profiles + work_samples + analyses) ← Employer Search
```

## Critical Developer Workflows

### Development Setup
```bash
npm install                # Install all dependencies
cp .env.example .env.local # Configure environment variables
npm run dev               # Start dev server on localhost:3000
```

### Testing Strategy
```bash
npm test                  # Run Jest unit tests
npm test -- --coverage    # With coverage report
npm test -- upload.fuzz.test.ts  # Security/fuzz tests only
npx playwright test       # E2E tests (requires browsers)
```

### Building & Deployment
```bash
npm run build            # Production build (checks TypeScript, builds app)
npm run lint             # ESLint check
npm start                # Production server (after build)
```

### Worker Process (Background Analysis)
```bash
npm run worker           # Start background analysis worker
# Worker polls `analyses` table for queued jobs, processes via AI, updates results
```

## Database Architecture

### Key Tables & Relationships
- **profiles**: User accounts (links to Supabase Auth via `auth_uid`)
- **work_samples**: Uploaded work (code/design/writing) with `confidentiality_level`
- **analyses**: AI analysis results linked to work_samples
- **samples** (legacy): Original upload artifacts, being migrated to work_samples
- **promotions**: Paid profile promotion subscriptions
- **messages**: Real-time messaging between professionals and employers
- **reviews**: Employer ratings of professionals (1-5 stars)
- **hire_attempts**: Tracks employer contact attempts (rate limited)

### RLS Patterns
All tables use **Row-Level Security**. Common patterns:
- Users can only read/update their own records: `auth.uid() = auth_uid`
- Public visibility: `visibility = 'public'`
- Admin access: `auth.jwt() ->> 'role' = 'admin'`

### Migration Pattern
Apply migrations in order from `supabase/migrations/`. Critical files:
- `003_github_api_cache.sql`: GitHub data caching
- `004_api_cost_tracking.sql`: AI cost monitoring
- `005_model_ab_testing.sql`: A/B test framework
- `20251019_employer_platform_foundation.sql`: Full marketplace schema

## Project-Specific Conventions

### Authentication Pattern
```typescript
// Server-side (API routes, server components)
import { supabaseServer } from '@/lib/supabaseServer'
const { data: { user } } = await supabaseServer.auth.getUser()

// Client-side (components)
import { supabaseClient } from '@/lib/supabaseClient'
const { data: { user } } = await supabaseClient.auth.getUser()
```

### AI Provider Failover Strategy
Located in `lib/ai/`. Always try providers in order:
1. **Primary**: Ollama (local, free) - check `OLLAMA_URL`
2. **Fallback 1**: Anthropic (Claude) - check `ANTHROPIC_API_KEY`
3. **Fallback 2**: Hugging Face (free tier) - check `HUGGINGFACE_API_KEY`
4. **Fallback 3**: OpenAI (GPT-4) - check `OPENAI_API_KEY`

See `lib/ai/skillExtractor.ts` for implementation. Cost tracking in `lib/costTracking.ts`.

### Rate Limiting Implementation
Two systems in place:
- **In-memory** (`lib/rateLimit.ts`): For development, simple token bucket
- **Redis** (`lib/rateLimitRedis.ts`): For production via Upstash

Usage:
```typescript
import { checkRateLimit } from '@/lib/rateLimit' // or rateLimitRedis
const result = checkRateLimit(`operation:${userId}`)
if (!result.allowed) return NextResponse.json({error: 'Rate limited'}, {status: 429})
```

### Security Patterns
- **Secret Detection**: `lib/security/secretDetection.ts` scans content for API keys, credentials, PII
- **Audit Logging**: All work sample access logged to `security_audit_log` table
- **Content Validation**: Check `confidentiality_level` before displaying work samples
- **SECURITY DEFINER Functions**: Always validate `auth.uid()` in SQL functions to prevent privilege escalation

Example from migration `harden_work_samples_security.sql`:
```sql
CREATE FUNCTION get_work_sample_content(sample_id uuid, viewer_id uuid)
SECURITY DEFINER -- Must validate viewer_id!
AS $$
  -- Validate the viewer is actually the authenticated user
  IF viewer_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized access attempt';
  END IF;
  -- Continue with function...
$$;
```

### Component Patterns
- **Server Components**: Default for pages, fetch data directly
- **Client Components**: Add `'use client'` for interactivity, hooks
- **Reusable Components**: In `components/` (UploadForm, ProofScoreV2, WorkSamplesSection)
- **Feature-specific**: In `components/messages/` etc.

### API Route Structure
```
app/api/
  ├── upload/route.ts           # File uploads to Cloudinary
  ├── analyze/route.ts          # Trigger AI analysis
  ├── professional/             # Professional-specific endpoints
  │   ├── proof-score/route.ts
  │   └── analyze-profile/route.ts
  ├── employer/                 # Employer-specific endpoints
  │   ├── search/route.ts
  │   └── check-hire-limit/route.ts
  ├── stripe/                   # Payment integration
  │   ├── webhook/route.ts
  │   └── create-checkout-session/route.ts
  └── cron/                     # Vercel cron jobs
      └── check-expiring-promotions/route.ts
```

## Integration Points

### GitHub OAuth + Repository Analysis
- OAuth configured in Supabase Auth settings
- Access token stored in `user_metadata.provider_token`
- Cache GitHub API responses in `github_api_cache` table (24hr TTL)
- Analyze repos in `workers/analyzeSample.ts` using `lib/analyzers/githubAnalyzer.ts`

### Stripe Integration
- Embedded Checkout flow (not deprecated Elements)
- Webhook endpoint: `/api/stripe/webhook`
- Subscription tiers in `promotions` table linked to Stripe subscription IDs
- Test with: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### Cloudinary Media Pipeline
```typescript
// Upload
import { v2 as cloudinary } from 'cloudinary'
const result = await cloudinary.uploader.upload(file)

// Display (with optimization)
import { CldImage } from 'next-cloudinary'
<CldImage src={publicId} width={800} height={600} crop="fill" />
```

### Email Notifications (Resend)
Three notification types:
1. **New Message**: `lib/email/templates/newMessage.ts`
2. **New Review**: `lib/email/templates/newReview.ts`
3. **Promotion Expiring**: Sent by `/api/cron/check-expiring-promotions`

Cron job secured with `CRON_SECRET` header check.

### Real-time Messaging
Uses Supabase Realtime subscriptions:
```typescript
const channel = supabaseClient
  .channel('messages')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'messages' },
    handleNewMessage
  )
  .subscribe()
```

## Testing Conventions

### Unit Tests (`__tests__/`)
- Mock AI clients: `__tests__/mocks/aiClients.ts`
- API mocking: Use `node-mocks-http` for request/response
- Supabase mocking: Mock `supabaseClient` and `supabaseServer` imports
- Run before commits to catch regressions

### Fuzz/Security Tests
File: `__tests__/api/upload.fuzz.test.ts`
- Tests edge cases: 0-byte files, XSS attempts, SQL injection, SSRF
- Tests auth bypass: Expired tokens, malformed JWTs
- Critical for API security

### E2E Tests (Playwright)
File: `e2e/` directory
- Full user flows: auth, upload, search, messaging
- Multi-browser: Chrome, Firefox, WebKit
- Screenshot on failure for debugging

## Common Pitfalls & Solutions

### Issue: Build fails with "Cannot find module '@/lib/...'"
**Solution**: Check `tsconfig.json` paths. `@/` maps to project root.

### Issue: Supabase RLS blocks legitimate requests
**Solution**: Check if user is authenticated (`auth.uid()` returns value). Verify RLS policy allows the operation. Use `USING` for reads, `WITH CHECK` for writes.

### Issue: AI analysis stuck in "queued" status
**Solution**: Worker not running. Start with `npm run worker`. Check logs for errors. Verify `OPENAI_API_KEY` or `OLLAMA_URL` is set.

### Issue: Rate limiting too aggressive
**Solution**: Adjust limits in `lib/rateLimit.ts` or `lib/rateLimitRedis.ts`. Current limits:
- Upload: 10/hour per user
- Search: 100/minute per IP
- AI Analysis: 20/hour per user

### Issue: Stripe webhook not working locally
**Solution**: Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`. Update webhook endpoint in Stripe Dashboard for production.

### Issue: GitHub private repos not accessible
**Solution**: Check GitHub OAuth scopes include `repo`. Token stored in `user_metadata.provider_token`. Refresh token if expired.

## Key Files Reference

- **Authentication**: `lib/supabaseServer.ts`, `lib/requireAuth.ts`, `lib/ensureProfile.ts`
- **AI Logic**: `lib/ai/skillExtractor.ts`, `workers/analyzeSample.ts`
- **Security**: `lib/security/` directory (all files critical)
- **Database Schema**: `supabase/schema.sql`, `supabase/migrations/`
- **Cost Tracking**: `lib/costTracking.ts`, `lib/modelABTesting.ts`
- **Email Templates**: `lib/email/` directory
- **GitHub Integration**: `lib/githubCache.ts`, `lib/analyzers/githubAnalyzer.ts`

## Monitoring & Debugging

- **Error Tracking**: Sentry configured in `instrumentation.ts`, auto-captures exceptions
- **Analytics**: PostHog events tracked via `components/PostHogProvider.tsx`
- **Logs**: Check Vercel dashboard or local console
- **Database Logs**: Supabase dashboard → Logs → SQL logs for RLS denials
- **Cost Monitoring**: `/admin/dashboard` shows AI API usage and costs

## Documentation Quick Links

- Full platform overview: `PLATFORM_COMPLETION_SUMMARY.md`
- Security audit: `SECURITY_AUDIT.md`, `SECURITY_IMPLEMENTATION.md`
- Testing guide: `TESTING.md`
- Email setup: `EMAIL_NOTIFICATIONS_GUIDE.md`
- Quick reference: `QUICK_REFERENCE.md`
- Tech stack: `TECH_STACK.md`
