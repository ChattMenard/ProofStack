# ProofStack AI Coding Instructions

## Project Overview
ProofStack is a two-sided talent marketplace (Next.js 14, TypeScript, Supabase, Stripe) connecting **talent** (job seekers, professionals, freelancers, students) with employers through verified portfolios and AI-powered scoring.

## Architecture Fundamentals

### Tech Stack
- **Frontend**: Next.js 14 App Router, React Server Components, Tailwind CSS
- **Backend**: Supabase PostgreSQL with Row Level Security (RLS)
- **Storage**: Cloudinary (files), Upstash Redis (rate limiting)
- **AI**: OpenAI GPT-4-mini for text analysis, skill extraction
- **Payments**: Stripe Embedded Checkout
- **Monitoring**: Sentry (errors), PostHog (analytics)

### Database Architecture
Three user types: `professional` (internal DB value), `employer`, `organization`. **Note:** Database still uses 'professional' but UI displays 'talent' for inclusivity.

See `DATABASE_SCHEMA_EMPLOYER.md` for full schema (12+ tables).

**Critical tables:**
- `profiles` - User profiles with `user_type` discriminator (DB: 'professional', UI: 'talent')
- `work_samples` - Portfolio items with `is_public` and `code_confidentiality` flags
- `professional_promotions` - Paid advertising (Featured $99, Premium $49, Standard $19/mo)
- `employer_reviews` - Reviews with `ProofScore V2` metrics (30/30/40 weighted)
- `messages`, `conversations`, `conversation_participants` - Real-time messaging system

### Supabase Client Patterns
**ALWAYS use the correct client for the context:**

```typescript
// Client Components (browser) - uses anon key
import { supabase } from '@/lib/supabaseClient'

// API Routes (server) - uses service role key
import { supabaseServer } from '@/lib/supabaseServer'

// Server Components - use createServerClient
import { createServerClient } from '@/lib/supabaseServerClient'
```

**Critical:** `supabaseClient.ts` and `supabaseServer.ts` have fallback stubs for invalid env vars to prevent build failures. Never assume Supabase is configured.

### ProofScore V2 System
**30/30/40 weighted scoring (0-100):**
1. **Communication (30pts)**: Profile quality (10, AI-analyzed), message quality (10, AI-analyzed), response speed (10, tracked)
2. **Historical Performance (30pts)**: Average rating (15), on-time delivery (10), completion rate (5)
3. **Work Quality (40pts)**: Correctness (15), satisfaction (15), revision rate (5), hire-again rate (5)

**Files:** `components/ProofScoreV2.tsx`, `app/api/professional/proof-score-v2/route.ts`  
**Migration:** `supabase/migrations/add_proof_score_v2.sql` (APPLIED)  
**AI APIs:** `/api/professional/analyze-profile`, `/api/professional/analyze-message` (cost: ~$0.001/call)

## Development Workflows

### Running Locally
```powershell
npm install
cp .env.example .env.local
# Configure: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
#            CLOUDINARY_*, GITHUB_CLIENT_*, OPENAI_API_KEY, STRIPE_*, UPSTASH_*
npm run dev        # Port 3000
npm run dev:3001   # Alternate port
```

### Database Migrations
**Order matters!** Apply in sequence via Supabase SQL Editor or CLI:
```powershell
npx supabase link --project-ref YOUR-PROJECT-REF
npx supabase db push
```
**Critical migrations:**
- `20251018_add_rls_policies.sql` - Security foundation
- `20251019_employer_platform_foundation.sql` - Core marketplace tables
- `add_proof_score_v2.sql` - ProofScore V2 schema
- `add_security_audit_logging.sql` - Audit trail (P0 security)
- `harden_work_samples_security.sql` - Fixes SECURITY DEFINER vulnerabilities

See `MIGRATION_GUIDE.md` for detailed steps.

### Testing
```powershell
npm test                    # Unit tests (Jest)
npm test -- --coverage      # Coverage report
npx playwright test         # E2E tests (Chrome/Firefox/WebKit)
npx playwright show-report  # View E2E results
```
**Mock AI clients in tests** using `__tests__/mocks/aiClients.ts` to avoid external API calls.

## Critical Conventions

### Rate Limiting
**ALWAYS apply rate limiting to API routes:**
```typescript
import { withRateLimit } from '@/lib/rateLimitRedis'

async function handler(req: NextRequest) { /* ... */ }

export const POST = withRateLimit(handler, {
  maxRequests: 10,  // Lower for expensive operations
  windowMs: 60000   // 1 minute
})
```
**Backend:** Auto-selects Upstash Redis (production) or in-memory (dev). Enforces 30 req/min default. See `RATE_LIMITING_AND_COSTS.md`.

### Security Best Practices
1. **Secret Detection**: All uploads run through `lib/security.ts` secret scanners (OpenAI keys, GitHub tokens, AWS keys, etc.)
2. **Audit Logging**: Use `lib/security/auditLog.ts` for sensitive actions (login, profile edits, reviews)
3. **RLS Policies**: All tables have Row Level Security - never disable RLS in production
4. **Authentication**: Use `lib/requireAuth.ts` wrapper for protected API routes:
   ```typescript
   import { requireAuth } from '@/lib/requireAuth'
   export const POST = requireAuth(async (req, user) => { /* user is authenticated */ })
   ```

### AI Integration Patterns
**Model Selection with A/B Testing:**
```typescript
import { selectModelVariant, trackABResult } from '@/lib/modelABTesting'

const { model, testId } = await selectModelVariant('skill-extraction', user.id)
// Use 'model' (claude-sonnet, claude-haiku, gpt-4, etc.)
// Track result:
await trackABResult(testId, user.id, 'treatment', { cost, latency, quality })
```
See `AB_TESTING_GUIDE.md` for creating/managing tests.

**Cost Tracking:** All AI calls should log to `api_cost_logs` table via `lib/costTracking.ts`.

### File Upload Flow
1. Client uploads to `/api/upload` (rate limited to 10/min)
2. Cloudinary stores file, returns URL
3. Record created in `work_samples` table
4. Background worker (`workers/analyzeSample.ts`) extracts skills via AI
5. Security scan runs on all content (`lib/security.ts`)

**Code confidentiality:** Respect `work_samples.code_confidentiality` flag - hide implementation details if true.

### Messaging System
Real-time via Supabase Realtime subscriptions:
```typescript
// Subscribe to new messages
supabase
  .channel('messages')
  .on('postgres_changes', { 
    event: 'INSERT', 
    schema: 'public', 
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`
  }, handleNewMessage)
  .subscribe()
```
**Email notifications:** Resend API sends transactional emails (new message, new review, promotion expiring). See `EMAIL_NOTIFICATIONS_GUIDE.md`.

## Project-Specific Gotchas

1. **PowerShell Environment**: Default shell is `pwsh.exe`. Use PowerShell syntax for scripts (`.ps1` files).

2. **Terminology**: UI displays "Talent" but database uses "professional" for `user_type`. Always use "talent" in user-facing strings, keep "professional" in queries.

3. **Navigation Structure**: Both marketplaces (Talent Marketplace `/portfolios`, Job Marketplace `/projectlistings`) are visible to all users. See `NAVIGATION_IMPLEMENTATION_PHASE1.md`.

4. **ProofScore V1 Deprecated**: `components/ProofScore.tsx` is old 5-component system. Always use `ProofScoreV2.tsx` for new features.

5. **LinkedIn OAuth Placeholder**: `.env.local` has placeholder credentials. Disable LinkedIn button or create real app (see `LINKEDIN_AUTH_SETUP.md`).

6. **Task Marketplace Removed**: `app/professional/tasks/` and `app/employer/tasks/` deleted (no `employer_tasks` table). Don't reference task features until rebuilt.

7. **Sentry Instrumentation**: `instrumentation.ts` and `instrumentation-client.ts` auto-initialize Sentry when `SENTRY_DSN` is set. Don't manually initialize.

8. **Stripe Webhook Path**: Webhook endpoint is `/api/stripe/webhook` - must be configured in Stripe dashboard with signing secret.

9. **Founding Employer Program**: Special tier with `is_founding_employer` flag - unlimited hire attempts, special badge. Check `FOUNDING_EMPLOYERS_GUIDE.md`.

10. **GitHub Verification**: Uses cached API responses (`lib/githubCache.ts`) with ETag support to avoid rate limits. Verifies commit activity in last 6 months.

## Key Documentation Files
- `QUICK_REFERENCE.md` - Core features and routes
- `TECH_STACK.md` - Full service inventory and data flows
- `CODEBASE_STATUS.md` - Production status, known issues, deprecated features
- `SECURITY_IMPLEMENTATION.md` - P0 security hardening checklist
- `PROOFSCORE_V2_GUIDE.md` - Scoring algorithm details
- `DATABASE_SCHEMA_EMPLOYER.md` - Complete schema with RLS policies

## Common Commands
```powershell
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # ESLint
npm test                 # Run tests
npx playwright test      # E2E tests
npx supabase db push     # Apply migrations
vercel --prod            # Deploy to production
```

## When Adding New Features
1. Check `CODEBASE_STATUS.md` for current system state
2. Apply rate limiting to new API routes
3. Add RLS policies for new tables
4. Log AI costs if using LLMs
5. Add audit logging for sensitive operations
6. Update relevant `.md` documentation files
7. Run `npm test` and `npx playwright test` before committing
