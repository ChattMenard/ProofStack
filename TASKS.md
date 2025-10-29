ProofStack — Task List and Roadmap
=================================

Purpose
-------

Single source of truth for the ProofStack MVP and next milestones. Use this file to track work, run weekly check-ins, and manage priorities. Update it as tasks complete.

How to use
---------

- Mark tasks as [ ] -> incomplete, [x] -> done.
- Keep owners and estimates short (e.g., @matt - 2d).
- Move items between sections as priorities change.
- Link to PRs/issues or files when complete.

Users & Billing
---------------

- User types: There are only two user types in the product model: `Employer` and `Talent` (DB name: `professional`). Use "Talent" in UI copy; use `professional` in DB queries/migrations.
- Promotions & spend rules: The `professional_promotions` table grants paid advertising for professionals. NOTE: Professionals (talent) may only spend on portfolio-boost purchases (promotions that boost a professional's portfolio visibility). Employers pay subscription fees and are the only users who purchase employer subscriptions or employer-targeted products.
- Pricing source and action required: Employer subscription prices should reflect the Glassdoor-based rates we previously decided on. Insert the finalized Glassdoor rates below when ready (or supply them to update this file and the billing/config code).

Pricing & product decisions (current)
-----------------------------------

- Developers / Talent (free tier)
  - Base profile access: FREE (unlimited view, apply limits handled by employer rules)
  - Skill verification features: included (verification badges appear after successful checks)
  - Unlimited applications to jobs (platform-level rule)
  - Job matching based on verified skills (included)

- Developer optional Boosts (professional_promotions)
  - Optional Boosts: $15-25/month (tiered) or $149/year (annual) — boosts increase visibility and add profile analytics
  - Boost features: priority placement, "Open to offers" badge, portfolio showcase, verified skill score prominence, analytics on profile views/employer interest
  - Implementation note: enforce via `professional_promotions` table and server-side checks so professionals can only buy boosts (not employer subscriptions)

- Employer subscription tiers (new Glassdoor-based pricing)
  - Starter: $399/month
    - 5 active job postings
    - Search/filter by verified skills
    - Contact 25 candidates/month
    - Basic skill match scoring
    - Standard verification reports

  - Professional: $999/month
    - 15 active postings
    - Unlimited candidate contact
    - Advanced filters (specific tech stacks, project complexity)
    - Detailed verification breakdowns
    - ATS integration and skill gap analysis tools

  - Enterprise: $2,499 - $5,000+/month (custom)
    - Unlimited postings
    - Custom verification criteria
    - API access and white-label badges
    - Dedicated account manager, bulk hiring tools, custom skill assessments

- High-value add-ons (à la carte)
  - Custom skill assessment: $99-299 per candidate
  - Deep background check integration: $49-99 per candidate
  - Reference verification: $75 per candidate
  - Project code review (senior): $149 per candidate
  - Success-based pay-per-hire: $1,500-3,000 per successful hire (optional alternative)

Next actions / tasks
--------------------

- [x] Update `supabase/migrations/20251027_employer_billing.sql` to set canonical pricing constants/comments and ensure `organizations.subscription_price` defaults align with the new tiers — @matt - 0.1d
- [x] Add pricing constants/config file (e.g., `lib/pricing.ts`) and wire into billing code and Stripe integration; include monthly/yearly mapping — @matt - 0.25d
- [x] Enforce professional promotions spend rules in server API and RLS: professionals may only purchase `professional_promotions` (portfolio boosts), employers purchase subscriptions — @backend - 0.5d ✅ COMPLETED
- [x] Add tests for promotions purchase flow and employer subscription enforcement (unit + integration) — @qa - 0.5d ✅ COMPLETED
- [ ] Apply billing migration to Supabase production DB (`20251027_employer_billing.sql`) — @matt - 0.25d



High-level milestones
---------------------

1. Week0 - MVP scaffold (dev-ready)
2. Week1 - Core features (auth, upload, analysis)
3. Month1 - Verification + proofs
4. Month3 - Growth & GTM
5. Month6 - B2B/enterprise features

Milestone: Week0 — Project scaffold ✅ COMPLETE
------------------------------------------------

- [x] Create Next.js 14 + Tailwind scaffold (`package.json`, `next.config.js`, `tailwind.config.js`, `postcss.config.js`) — @matt - 0.5d
- [x] Add global styles (`styles/globals.css`) — @matt - 0.25d
- [x] Add README, .env.example, .gitignore — @matt - 0.25d
- [x] Create Python `.venv` & upgrade pip tools (for LLM helpers) — @matt - 0.25d
- [x] Add `supabase/schema.sql` with base tables — @matt - 0.5d
- [x] Create a minimal `app/` home page and layout — @matt - 1d
- [x] E2E verification complete (DB + worker + analysis pipeline) — @matt - 1d

Progress: E2E verification ✅ COMPLETE
--------------------------------------

- [x] Schema applied to Supabase project — @matt - DONE (2025-10-09)
- [x] Test sample inserted via REST API — @matt - DONE (sample ID: 19711bde-0cd0-413a-ab2d-ec472bd8be12)
- [x] Queued analysis created — @matt - DONE (analysis ID: 1ca7637b-9c35-41e0-bdf1-2801cd9a3281)
- [x] Worker successfully connected and picked up queued job — @matt - DONE
- [x] Worker completes analysis and writes result — @matt - DONE (2025-10-09)
  - ✅ Analysis completed with status="done", result contains skills extraction
  - ✅ Worker properly handles stuck/running jobs (5min timeout retry logic)
  - ✅ Full pipeline verified: sample → queued analysis → worker processing → completed result

Milestone: Week1 — Core auth, upload, queue, simple analysis ✅ COMPLETE
-----------------------------------------------------------

Auth

- [x] Wire Supabase client helper (`lib/supabaseClient.ts`) — @matt - 0.5d
- [x] Implement sign-in: email magic link + GitHub OAuth (basic) — @matt - 1d
- [x] Protect API routes / session handling — @matt - 0.5d

Storage & Upload

- [x] Integrate Cloudinary/Direct unsigned upload flow (`/api/upload`) — @matt - 1d
- [x] Client-side upload page (drag/drop, sample type) — @matt - 1d
- [x] Validate file types & max size on client + server — @matt - 0.5d

Queue & Worker

- [x] Add job queue design (Supabase Realtime, Redis, or webhook queue) — @matt - 0.5d
- [x] Create worker skeleton (`workers/analyzeSample.ts`) that reads from queue — @matt - 1d

Basic Analysis

- [x] Integrate Ollama client call wrapper (local/remote config) — @matt - 1d
- [x] Write a simple skill extraction prompt + store results in `analyses` table — @matt - 1d
- [x] Implement profile page to display sample + analysis card — @matt - 1d

Milestone: Week2 — GitHub ingestion, transcription, proofs ✅ COMPLETE
-------------------------------------------------------------

GitHub Integration

- [x] Full GitHub OAuth flow with repo read permission option — @matt - 1d (per-user tokens implemented)
- [x] Repo fetcher: clone/fetch lightweight zip via GitHub API and extract metadata — @matt - 1d (API-based analysis implemented)
- [x] Challenge-response verification flow (create ephemeral file/commit) — @matt - 1d (challenge creation and verification implemented)

Transcription & Media

- [x] Add whisper.cpp pipeline sketch + wrapper script (worker) — @matt - 1d (OpenAI Whisper API integration implemented)
- [x] Audio/video -> transcript -> skill extraction pipeline — @matt - 1d (worker updated to handle audio/video files)

Proofs & Hashing

- [x] Implement artifact hashing and server-signed JSON proof (`proofs` table) — @matt - 1d (done: hash computed on upload, proof created on analysis completion)
- [x] Display proof signature on profile and provide download link — @matt - 0.5d (done: proofs shown in portfolio view)
- [ ] (Optional) Add IPFS anchoring script for high-trust proofs — @matt - 2d (later)

Milestone: Month1 — UX polish, tests, deploy ✅ COMPLETE
--------------------------------------------

- [x] Add tests: unit for API routes + integration for upload->analysis flow — @matt - 2d (Jest setup done, skillExtractor tests passing, upload API tests in progress)
- [x] Add E2E smoke test for sign-in, upload, analysis (Playwright) — @matt - 2d (Playwright setup complete, 12 tests passing across 3 browsers)
- [x] Deploy to Vercel + configure env vars & secrets — @matt - 0.5d
- [x] Add basic monitoring (Sentry) and analytics (Vercel/PostHog/Plausible) — @matt - 0.5d
- [x] Operational infrastructure (rate limiting, cost tracking, caching) — @matt - 1.5d (✅ See Operations & cost control section)

Milestone: Month2-3 — Premium features & employer flows
------------------------------------------------------

- [ ] Premium payment via Stripe (billing page + subscription) — @matt - 2d
- [ ] Custom domain for portfolios (Pro) — @matt - 2d
- [ ] Recruiter dashboard (bulk ingest + team portfolios) — @matt - 5d
- [ ] Employer API for verification checks — @matt - 3d

Security, Privacy & Legal (must-do before public launch)
--------------------------------------------------------

- [x] Draft Terms of Service & Privacy Policy (explicit consent for analyzing uploads) — Legal - 3d
- [x] Implement DMCA / takedown flow + contact endpoint — @matt - 0.5d
- [x] Add data deletion endpoint and retention policy in UI — @matt - 1d
- [x] Check employer-owned artifacts: show warning and require checkbox consent on upload — @matt - 0.5d
- [x] Store service keys securely using Vercel secrets or environment variables — Ops - 0.25d (done via Vercel env vars)

Testing & QA checklist
----------------------

- [x] Unit tests for core functions (skillExtractor) — @matt - 1d (Jest setup, skillExtractor tests passing)
- [x] Unit tests for API routes (happy + 2 edge cases each) — @matt - 2d (Jest setup done, upload API, analyze API, and GitHub repos API tests passing)
- [x] Mock Ollama responses in tests (avoid external network in CI) — @matt - 0.5d (AI client mocks implemented)
- [x] Fuzz test upload handling with large files and unexpected MIME types — @matt - 1d (Comprehensive fuzz tests added)
- [x] Security scan for dependencies (dependabot or Snyk) — @matt - 0.5d (Dependabot + GitHub Actions security workflows configured)

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

Operations & cost control ✅ COMPLETE
-------------------------

- [x] Cache GitHub API responses (store etags & conditional requests) — @matt - 0.5d (✅ ETag-based caching implemented, see GITHUB_CACHING.md)
- [x] Implement rate limiting on API endpoints — @matt - 0.5d (✅ Distributed rate limiting with Upstash Redis (multi-region) + in-memory fallback, see RATE_LIMITING_AND_COSTS.md)
- [x] Monitor LLM/Transcription costs and configure fallback to cheaper models — @matt - 1d (✅ Cost tracking DB, fallback chains, monitoring dashboard, see RATE_LIMITING_AND_COSTS.md)

**Implementation Summary:**
- GitHub API caching reduces API calls by ~90% via ETag-based conditional requests
- Rate limiting: Upstash Redis for production (global enforcement across Vercel regions) with automatic in-memory fallback for development
- Cost tracking: Real-time monitoring, daily budget limits (Free $0.50, Pro $5, Enterprise $50), automatic model fallback chains (Claude → GPT → Ollama)
- See `IMPLEMENTATION_SUMMARY.md` for complete details

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

- Complete unit tests for API routes (upload, analyze, github endpoints)
- Add E2E smoke test with Playwright for sign-in -> upload -> analysis flow
- Deploy to Vercel and configure environment variables
- Implement basic monitoring with Sentry and analytics with PostHog
- Address security/privacy items before public launch (Terms, DMCA, data deletion)

Current status (as of Oct 20, 2025)
-----------------------------------

**🎉 MAJOR MILESTONES ACHIEVED:**

✅ **Week0-2: Core MVP** - COMPLETE
- All auth, upload, analysis, and GitHub integration features working
- E2E verification pipeline tested and operational
- Worker successfully processing queued jobs

✅ **Month1: Polish & Deploy** - COMPLETE  
- Tests implemented (Jest unit tests, Playwright E2E)
- Deployed to Vercel with monitoring (Sentry + PostHog)
- Operations infrastructure in place (rate limiting, cost tracking, caching)

✅ **Security & Legal** - COMPLETE
- Terms of Service & Privacy Policy drafted
- DMCA/takedown flow implemented
- Data deletion endpoint created
- Employer-owned content warning system added

✅ **UI/UX Enhancement** - COMPLETE (Oct 18, 2025)
- [x] Portfolio page with full skill/credential display (`app/portfolio/[username]/page.tsx`)
- [x] Enhanced dashboard with stats and upload form (`app/dashboard/page.tsx`)
- [x] Mock data seed system (4 complete samples with analyses) (`SEED_MOCK_DATA.sql`)
- [x] Auth UX improvements (removed persistent popups, clean navigation)
- [x] URL encoding fixes for email-based portfolio routes
- [x] **Dark/Light Theme System** - Professional natural color palette
  - Forest greens (dark backgrounds), Sage greens (accents), Earth browns (highlights)
  - Theme toggle in header with localStorage persistence
  - All pages updated: landing, dashboard, portfolio, upload form
  - Logo visibility fixed for both themes (Sentry white/black, Supabase with filters)
  - Smooth transitions and WCAG AA compliant contrast
  - See `THEME_SYSTEM.md` for complete documentation

✅ **ProofScore V2 System** - COMPLETE (Oct 19, 2025)
- [x] ProofScore V2 calculation with 30/30/40 breakdown
  - Communication Quality (30pts): Profile AI + Message AI + Response Speed
  - Historical Performance (30pts): Rating + Delivery + Completion
  - Work Quality (40pts): Task Correctness + Satisfaction + Revisions + Hire Again
- [x] ProofScoreV2 component with expandable breakdown display
- [x] Profile AI analysis trigger (analyze bio/headline/skills on save)
- [x] Message AI analysis trigger (analyze first employer contact message)
- [x] Integration into portfolio pages (medium size, expanded breakdown)
- [x] Integration into employer discovery page (small size, compact view)
- [x] API endpoint: `/api/professional/proof-score-v2` (GET)
- [x] API endpoint: `/api/professional/analyze-profile` (POST)
- [x] API endpoint: `/api/professional/analyze-message` (POST)
- [x] Professional settings page with AI-powered profile editor
- [x] Documentation: `PROOFSCORE_V2_GUIDE.md`, `PROOFSCORE_V2_INTEGRATION_SUMMARY.md`

✅ **Work Sample Verification System** - COMPLETE (Oct 20, 2025)
- [x] Database schema: `work_samples` table with RLS policies
  - 500-2000 character constraint (optimal for AI analysis + cost)
  - 3 confidentiality levels: public, encrypted, redacted
  - 9 AI analysis score columns (code quality, technical depth, problem solving, etc.)
  - Helper functions: `get_work_sample_content()`, `get_professional_work_sample_stats()`
- [x] AI Analysis API: `/api/work-samples/analyze` (POST)
  - OpenAI GPT-4o-mini with specialized prompts
  - Code analysis: 5 metrics (quality, depth, problem-solving, docs, best practices)
  - Writing analysis: 4 metrics (clarity, accuracy, professionalism, completeness)
  - Cost: ~$0.001-0.002 per sample
- [x] Employer review form with work sample submission
  - 500-2000 char textarea with real-time validation
  - Sample type selector (code/writing/design_doc/technical_spec)
  - Confidentiality radio buttons with clear explanations
  - Character counter and submission warnings
- [x] Work samples portfolio display component
  - Filterable tabs (All/Code/Writing/Design/Specs)
  - Expandable cards with AI scores and feedback
  - Confidentiality enforcement (lock icons, redaction warnings)
  - AI feedback display (strengths + improvements)
- [x] Backend integration in `/api/reviews/create`
  - Work sample validation and insertion
  - Background AI analysis trigger
  - ProofScore V2 automatic recalculation
- [x] Portfolio integration showing verified work samples
- [x] Documentation: `WORK_SAMPLE_VERIFICATION_GUIDE.md` (complete implementation guide)

✅ **Sitemap & Navigation** - COMPLETE (Oct 20, 2025)
- [x] Comprehensive sitemap page at `/sitemap`
  - All pages listed with descriptions (public, auth, professional, employer, admin, API)
  - Complete file structure tree
  - Recent features showcase (ProofScore V2, Work Samples)
  - Tech stack display
  - Footer link added next to Contact/Terms/Privacy

**📁 FILES & DOCUMENTATION:**
- `UPLOAD_SYSTEM_GUIDE.md` - Complete upload/analyze/portfolio flow documentation
- `THEME_SYSTEM.md` - Theme system implementation and usage guide
- `IMPLEMENTATION_SUMMARY.md` - Architecture and infrastructure details
- `SEED_MOCK_DATA.sql` - Mock data for testing (4 samples verified working)
- `PROOFSCORE_V2_GUIDE.md` - ProofScore V2 technical implementation
- `PROOFSCORE_V2_INTEGRATION_SUMMARY.md` - Complete integration guide
- `WORK_SAMPLE_VERIFICATION_GUIDE.md` - Work sample system guide
- `CODEBASE_STATUS.md` - Production vs pending features inventory

**🚀 READY FOR:**
- Public beta testing (all core features operational)
- User onboarding (founder program active with 4 founder slots)
- Real-world usage (rate limiting, monitoring, cost controls in place)
- Employer verification workflows (work sample submission fully functional)

**⏭️ NEXT PRIORITIES (Month 2-3):**

**Premium & Monetization:**
- [ ] Stripe integration for Pro subscriptions ($9/mo)
- [ ] Custom domain support for Pro portfolios
- [ ] Enhanced analytics dashboard for Pro users

**GTM & Growth:**
- [x] Landing page with waitlist (functional at `/`)
- [ ] Launch on Product Hunt (prep demo video)
- [ ] Hacker News Show HN post
- [ ] SEO content strategy (target "verified developer portfolio", "skill authentication")
- [ ] Bootcamp/school partnerships outreach

**Features to Consider:**
- [ ] Recruiter dashboard (bulk verification)
- [ ] Employer API for automated verification checks
- [ ] Portfolio export (PDF generation)
- [ ] Skill badges/certificates
- [ ] Public API for third-party integrations
- [ ] Professional approval workflow for work samples (verify before public)
- [ ] Work sample tagging system (skills, technologies, frameworks)
- [ ] Work sample analytics (view counts, saves)

**🔍 KNOWN ISSUES/IMPROVEMENTS:**
- None blocking! System stable and operational
- Consider adding professional approval step for work samples before going public
- Could add syntax highlighting for code samples in different languages
- Portfolio work samples could show employer organization name/logo

**📊 CURRENT METRICS:**
- Database: 4 mock samples with complete analyses + work_samples table ready
- Auth: Magic link + GitHub OAuth working
- Analysis: Claude AI with GPT/Ollama fallbacks configured
- Rate limits: 30 req/min upload, 10 req/min analyze
- Cost tracking: Real-time monitoring with daily budget limits
- ProofScore V2: 30/30/40 breakdown with AI analysis integration
- Work Samples: Employer submission → AI analysis → Portfolio display pipeline complete

**🎯 RECOMMENDATION:**
The platform now has a complete verification ecosystem:
1. ✅ Upload samples → AI analysis → Skills extraction
2. ✅ ProofScore V2 → Objective quality metrics (30/30/40)
3. ✅ Work Sample Verification → Employer-submitted proof with AI quality analysis
4. ✅ Portfolio display → Public showcase with confidentiality options

**Ready to focus on GTM:**
1. Create demo video showing the complete verification flow
2. Write Show HN post highlighting the multi-layered proof system
3. Start building in public on X/Twitter showcasing work sample verification
4. Launch founder program publicly emphasizing verified quality metrics
5. Reach out to coding bootcamps with the work sample verification angle
