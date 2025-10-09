ProofStack — Task List and Roadmap
=================================

Purpose
-------

Single source of truth checklist for the ProofStack MVP and next milestones. Use this file to track work, run weekly check-ins, and manage priorities. Update it as tasks complete.

How to use
---------

- Mark tasks as [ ] -> incomplete, [x] -> done.
- Keep owners and estimates short (e.g., @matt - 2d).
- Move items between sections as priorities change.
- Link to PRs/issues or files when complete.

High-level milestones
---------------------

1. Week0 - MVP scaffold (dev-ready)
2. Week1 - Core features (auth, upload, analysis)
3. Month1 - Verification + proofs
4. Month3 - Growth & GTM
5. Month6 - B2B/enterprise features

Milestone: Week0 — Project scaffold (Done: partial)
--------------------------------------------------

- [x] Create Next.js 14 + Tailwind scaffold (`package.json`, `next.config.js`, `tailwind.config.js`, `postcss.config.js`) — @matt - 0.5d
- [x] Add global styles (`styles/globals.css`) — @matt - 0.25d
- [x] Add README, .env.example, .gitignore — @matt - 0.25d
- [x] Create Python `.venv` & upgrade pip tools (for LLM helpers) — @matt - 0.25d
- [x] Add `supabase/schema.sql` with base tables — @matt - 0.5d
- [x] Create a minimal `app/` home page and layout — @matt - 1d

Milestone: Week1 — Core auth, upload, queue, simple analysis
-----------------------------------------------------------

Auth

- [ ] Wire Supabase client helper (`lib/supabaseClient.ts`) — @matt - 0.5d
- [ ] Implement sign-in: email magic link + GitHub OAuth (basic) — @matt - 1d
- [ ] Protect API routes / session handling — @matt - 0.5d

- [x] Wire Supabase client helper (`lib/supabaseClient.ts`) — @matt - 0.5d
- [x] Implement sign-in: email magic link + GitHub OAuth (basic) — @matt - 1d (demo)
- [x] Protect API routes / session handling — @matt - 0.5d (upload API protected using requireAuth)

Storage & Upload

- [ ] Integrate Cloudinary/Direct unsigned upload flow (`/api/upload`) — @matt - 1d
- [ ] Client-side upload page (drag/drop, sample type) — @matt - 1d
- [ ] Validate file types & max size on client + server — @matt - 0.5d

- [x] Integrate Cloudinary/Direct unsigned upload flow (`/api/upload`) — @matt - 1d (demo server flow implemented)
- [x] Client-side upload page (drag/drop, sample type) — @matt - 1d (UploadForm demo added)
- [ ] Validate file types & max size on client + server — @matt - 0.5d

Queue & Worker

- [ ] Add job queue design (Supabase Realtime, Redis, or webhook queue) — @matt - 0.5d
- [ ] Create worker skeleton (`workers/analyzeSample.ts`) that reads from queue — @matt - 1d

- [x] Add job queue design (Supabase Realtime, Redis, or webhook queue) — @matt - 0.5d (DB-backed queue + worker implemented)
- [x] Create worker skeleton (`workers/analyzeSample.ts`) that reads from queue — @matt - 1d

Basic Analysis

- [ ] Integrate Ollama client call wrapper (local/remote config) — @matt - 1d
- [ ] Write a simple skill extraction prompt + store results in `analyses` table — @matt - 1d
- [ ] Implement profile page to display sample + analysis card — @matt - 1d

Milestone: Week2 — GitHub ingestion, transcription, proofs
---------------------------------------------------------

GitHub Integration

- [ ] Full GitHub OAuth flow with repo read permission option — @matt - 1d
- [ ] Repo fetcher: clone/fetch lightweight zip via GitHub API and extract metadata — @matt - 1d
- [ ] Challenge-response verification flow (create ephemeral file/commit) — @matt - 1d

Transcription & Media

- [ ] Add whisper.cpp pipeline sketch + wrapper script (worker) — @matt - 1d
- [ ] Audio/video -> transcript -> skill extraction pipeline — @matt - 1d

Proofs & Hashing

- [ ] Implement artifact hashing and server-signed JSON proof (`proofs` table) — @matt - 1d
- [ ] Display proof signature on profile and provide download link — @matt - 0.5d
- [ ] (Optional) Add IPFS anchoring script for high-trust proofs — @matt - 2d (later)

Milestone: Month1 — UX polish, tests, deploy
-------------------------------------------

- [ ] Add tests: unit for API routes + integration for upload->analysis flow — @matt - 2d
- [ ] Add E2E smoke test for sign-in, upload, analysis (Playwright) — @matt - 2d
- [ ] Deploy to Vercel + configure env vars & secrets — @matt - 0.5d
- [ ] Add basic monitoring (Sentry) and analytics (Vercel/PostHog/Plausible) — @matt - 0.5d

Milestone: Month2-3 — Premium features & employer flows
------------------------------------------------------

- [ ] Premium payment via Stripe (billing page + subscription) — @matt - 2d
- [ ] Custom domain for portfolios (Pro) — @matt - 2d
- [ ] Recruiter dashboard (bulk ingest + team portfolios) — @matt - 5d
- [ ] Employer API for verification checks — @matt - 3d

Security, Privacy & Legal (must-do before public launch)
--------------------------------------------------------

- [ ] Draft Terms of Service & Privacy Policy (explicit consent for analyzing uploads) — Legal - 3d
- [ ] Implement DMCA / takedown flow + contact endpoint — @matt - 0.5d
- [ ] Add data deletion endpoint and retention policy in UI — @matt - 1d
- [ ] Check employer-owned artifacts: show warning and require checkbox consent on upload — @matt - 0.5d
- [ ] Store service keys securely using Vercel secrets or environment variables — Ops - 0.25d

Testing & QA checklist
----------------------

- [ ] Unit tests for API endpoints (happy + 2 edge cases each)
- [ ] Mock Ollama responses in tests (avoid external network in CI)
- [ ] Fuzz test upload handling with large files and unexpected MIME types
- [ ] Security scan for dependencies (dependabot or Snyk)

Data model & schema tasks
-------------------------

Create `supabase/schema.sql` with these tables and indices:

- users
- samples
- analyses
- proofs
- uploads

(Include sample `INSERT` for a demo user and sample analysis.)

GTM / Marketing checklist
-------------------------

Pre-launch

- [ ] Launch landing & waitlist (Typeform or simple form) — @matt - 1d
- [ ] Start building in public on X/Twitter — @matt - ongoing
- [ ] Prepare Product Hunt assets and demo video — @matt - 2d

Launch

- [ ] Post on Product Hunt (best day Tue-Thu) — Marketing - 1d
- [ ] Hacker News Show HN post — Marketing - 1d

Post-launch

- [ ] SEO content plan (target keywords + 3 pillar posts) — Content - ongoing
- [ ] Reach out to bootcamps & coding schools for partnerships — Growth - ongoing

Operations & cost control
-------------------------

- [ ] Cache GitHub API responses (store etags & conditional requests) — @matt - 0.5d
- [ ] Implement rate limiting on API endpoints — @matt - 0.5d
- [ ] Monitor LLM/Transcription costs and configure fallback to cheaper models — @matt - 1d

Recurring tasks & cadence
-------------------------

- Weekly: Sprint review + update `TASKS.md` (1h) — Owner: @matt
- Weekly: Check queue/backlog failures and retry (30m)
- Bi-weekly: Security dependency check (30m)
- Monthly: Cost review & infra scaling plan (1h)

Daily quick-check (5 minutes)
-----------------------------

- Are there failed analysis jobs? (Check worker logs)
- Any 500 errors in API or failing deploys? (Sentry/monitor)
- New auth signups or GitHub link failures?

Release checklist (for public deploy)
------------------------------------

- [ ] All critical security/privacy items done
- [ ] Tests passing (unit + smoke)
- [ ] Monitor & rollback plan documented
- [ ] Update `README.md` with public demo link

Acceptance criteria examples
---------------------------

Sign-in & auth

- Users can sign up with email and/or GitHub
- Session persists across pages

Upload & analysis

- Users can upload a file and receive a queued job
- Analysis returns a JSON `skills` object with at least one skill and an evidence link

Proofs

- Each public sample shows a hash + server-signed proof metadata

Metrics to track (KPIs)
-----------------------

- Time-to-first-proof (ms)
- % profiles with at least one verified skill
- Average analysis processing time
- MRR and conversion rate (once premium exists)

Project management suggestions
-----------------------------

- Track issues in GitHub Issues + a Project board (Kanban)
- Use small PR size, require at least one reviewer
- Create milestone tags (week0, week1, month1)
- Use `TASKS.md` for the canonical checklist and link tasks to issues/PRs

Weekly review template (use this during 1h weekly sync)
-------------------------------------------------------

1. What did we finish since last check? (link PRs)
2. What's blocked? (list blockers & owners)
3. What will we do next week? (top 3 priorities)
4. Any infra/scale/PR concerns?
5. Quick KPI snapshot (errors, jobs failing, signups)

Next actions I can take now
--------------------------

- Create `supabase/schema.sql` and example seeds for early demo.
- Wire a minimal Supabase auth helper and sign-in page.
- Implement the upload API + Cloudinary signed upload helper.

If you want me to start implementing any of the next actions, tell me which one (e.g., "add schema" or "wire auth") and I'll begin and report progress after each milestone.
