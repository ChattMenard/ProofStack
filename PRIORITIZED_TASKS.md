ProofStack — Prioritized Task Plan (P0–P3)
=========================================

Goal
----
Prioritize the `TASKS.md` items so we know what to do next and can run regular check-ins. This file converts the checklist into clear priorities, a 4‑week sprint plan, and a short daily/weekly cadence.

Priority legend
---------------
- P0 — Critical for a working MVP demo and basic trust (must do now)
- P1 — High impact features that follow P0 (short-term next week)
- P2 — Important improvements and polish (month 1–3)
- P3 — Long-term / nice-to-have / growth

Top-level P0 (Day 0–7) — MVP demo & trust
----------------------------------------
These must land first so we can produce a demo that proves the idea and shows "verifiable evidence".

1. Project scaffold polish
   - Create `supabase/schema.sql` with core tables: `users`, `samples`, `analyses`, `proofs`, `uploads` (add seeds) — Owner: @matt — Est: 0.5d
   - Add minimal `app/` home page and layout that shows "Sign in" and "Demo upload" — @matt — 1d

2. Auth & user model
   - Wire Supabase helper (`lib/supabaseClient.ts`) and basic sign-in (email magic link) — @matt — 0.5d
   - GitHub OAuth skeleton (link account flow; no private repo access required yet) — @matt — 0.5d

3. Upload + storage
   - Cloudinary unsigned/signed upload helper + server API endpoint `/api/upload` that records `samples` and returns `sampleId` — @matt — 1d
   - Client upload page (drag/drop) with max size/type validation — @matt — 1d

4. Queue + worker skeleton
   - Job enqueue on upload and simple worker skeleton `workers/analyzeSample.ts` that can be invoked locally (does not need full queue infra) — @matt — 0.5d

5. Basic analysis pipeline
   - Minimal Ollama wrapper + a small prompt that extracts top 3 skills from text/code and stores an `analyses` record — @matt — 1d
   - Profile page showing sample, analysis summary, and evidence links — @matt — 1d

Success criteria (P0)
- Sign-in -> upload -> queued analysis -> profile shows at least one extracted skill with a link to the original uploaded artifact.

High priority P1 (Week 2) — Verification & reliability
-----------------------------------------------------
1. GitHub integration (read-only proof)
   - Add full GitHub OAuth with optional repo read permission and a repo fetcher that stores sample metadata (no heavy cloning) — @matt — 1.5d ✅ DONE
   - Implement challenge-response: show how to verify the user controls a repo (ephemeral file/commit) — @matt — 1d ✅ DONE

2. Transcription & media handling
   - Add whisper.cpp worker wrapper and pipeline for audio/video -> transcript -> analysis — @matt — 1.5d ✅ DONE

3. Proofs & hashing
   - Artifact hashing + server-signed proof object (store in `proofs`) and display on profile — @matt — 1d

4. Reliability
   - Background retry logic for worker failures and basic logging/metrics — @matt — 0.5d

P1 Success criteria
- GitHub-linked samples show evidence and a challenge can be completed; uploaded media yields transcripts that are analyzed; artifacts show signed proofs.

Medium priority P2 (Month 1–3) — polish, tests, deploy
------------------------------------------------------
- [x] Add unit/integration tests and a Playwright smoke test for the core flow — 3d (Jest setup, skillExtractor tests done, API tests in progress)
- [ ] Deploy to Vercel (envs, secrets) and integrate basic monitoring (Sentry/PostHog) — 1d
- [ ] Add simple signed-commit verification (GPG) detection where possible — 2d
- [ ] Implement basic rate-limiting, caching for GitHub API, and cost fallback for LLMs — 2d

Lower priority P3 (Growth / future)
-----------------------------------
- IPFS anchoring for high-assurance proofs — 2d (optional)
- Premium features (Stripe billing, custom domains) — 1–2w
- Recruiter dashboard / B2B flows — multi-week

4-week sprint plan (concrete)
----------------------------
Week 1 (Days 1–7) — P0 (MVP demo)
- Day 1: Add schema + minimal home page
- Day 2: Wire Supabase client and email sign-in
- Day 3: Upload API + Cloudinary helper
- Day 4: Upload UI + validation
- Day 5: Worker skeleton + enqueue
- Day 6: Ollama wrapper + basic analysis prompt
- Day 7: Profile page + smoke test and polish

Week 2 (Days 8–14) — P1
- GitHub OAuth + repo fetcher
- Challenge-response verification
- Whisper wrapper for audio
- Artifact hashing + proof display

Week 3 (Days 15–21) — P1 → P2
- Retry & reliability improvements
- Unit tests for API + mock Ollama responses
- Deploy to Vercel (staging)

Week 4 (Days 22–28) — P2
- E2E smoke test (Playwright)
- Monitoring + analytics
- Start simple GTM (landing + waitlist)

Daily + weekly cadence
----------------------
- Daily quick-check (5m): failed jobs, 500 errors, blocked tasks
- Weekly review (1h): update `TASKS.md`, close completed tasks, move new items into priority buckets

How I'll use this to act
-----------------------
I'll work in priority order: start with P0 items and only move to P1 after P0 acceptance criteria are met. I'll update `TASKS.md` entries with P0/P1 tags as items complete and run `npm run check-tasks` weekly.

Next immediate action (I will do it unless you tell me otherwise)
-----------------------------------------------------------------
Create `supabase/schema.sql` with the core tables and a small seed so the demo flow can run locally. Reply "go ahead" to let me create that schema file now, or reply with a different next action.