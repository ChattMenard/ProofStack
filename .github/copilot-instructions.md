# ProofStack Copilot Instructions

Brief agent playbook for ProofStack (Next.js 14 + Supabase + AI integrations).

Quick runbook
- Dev: npm install && npm run dev
- Build: npm run build (Vercel buildCommand). Force build by adding [build] or [deploy] to commit message
- Worker: npm run worker (env: WORKER_POLL_MS, WORKER_BATCH, WORKER_MAX_RETRIES)
- Migrations: node scripts/apply-migrations.js [migration.sql]
- Tests: npm test | npx playwright test | npm test -- upload.fuzz.test.ts

Minimum env (required)
- NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- CLOUDINARY_*, OPENAI_API_KEY, GITHUB_CLIENT_ID/SECRET, STRIPE keys, RESEND
Optional: OLLAMA_URL, UPSTASH_REDIS_REST_*

Key files & symbols (open these first)
- lib/rateLimitRedis.ts — withRateLimit(), checkRateLimit(), isRedisEnabled()
- lib/costTracking.ts — selectModelWithFallback(), estimateTokens(), logApiCost()
- lib/githubCache.ts — fetchGitHubWithCache(), getCachedResponse(), setCachedResponse()
- workers/analyzeSample.ts — pollLoop(), processAnalysis() (proof generation)
- lib/ensureProfile.ts — ensureUserProfile()
- scripts/apply-migrations.js — applyMigrations(specificFile)
- scripts/should-build.sh — Vercel build gating
- .github/workflows/ci.yml — CI (Node 18/20, coverage)

Conventions & quick examples
- New API: add app/api/feature/route.ts (server component); use lib/requireAuth.ts
- Rate limit wrapper: export default withRateLimit(handler, { maxRequests: 10, windowMs: 60000 })
- Choose model with cost-aware fallback:
  const { provider, model } = selectModelWithFallback('skillExtraction', estimateTokens(text), 'free')
- GitHub ETag cache usage:
  const { data, fromCache } = await fetchGitHubWithCache(url, token, userId)

Debugging & gotchas
- Check X-RateLimit-* headers and Upstash console for rate-limit failures
- Migration script prints SQL for manual run on failure (Supabase SQL Editor)
- Vercel may skip build for doc-only commits (scripts/should-build.sh)
- Missing OPENAI disables AI features; missing UPSTASH falls back to in-memory rate limiting

Agent & PR workflow
- To run autonomous Copilot coding agent: include a one-line task + acceptance criteria and reference the repository's Copilot agent tag (search the repo for the exact tag to trigger the agent).
- Minimal task format: goal; files to edit; tests to add; acceptance tests (unit test name or E2E path)

Keep changes small and safe: do not hardcode secrets, always add RLS in migrations, preserve audit logging when modifying DB.

If you want, I will: (A) shorten further; (B) create a PR with these edits; (C) add 2–3 concrete code examples or tests. Reply with A/B/C.