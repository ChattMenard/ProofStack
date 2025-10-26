# Username/Handle Slugs for Portfolios

This change introduces optional `username` slugs on profiles, so professionals can use `/portfolio/[handle]` instead of email-based URLs.

## What’s included

- Migration: `supabase/migrations/20251026_add_profile_username.sql`
  - Adds `username` (TEXT, unique case-insensitively when non-null)
  - Safe backfill: populates `username` with the email local-part only when it’s globally unique
- Redirect preference: `app/portfolio/page.tsx` now prefers `profile.username` (when present) over `user.email`

## Rollout steps

1. Apply the migration in your Supabase project:
   - Open SQL Editor → paste contents of the migration file → Run
   - Or run via CLI (optional)
2. Verify a few profiles now have a `username` (those with unique local-parts)
3. Add a simple UI in Dashboard → Profile to set or change `username`
   - Enforce: 3–30 chars, letters, numbers, hyphens/underscores (no spaces)
   - Validate uniqueness on save (case-insensitive)
4. Update the portfolio loader to resolve by `username` OR `email`
   - Once the migration is live, modify the profile fetch to try `username` first (e.g., `.or("username.eq.X,email.eq.X")`), then fallback strategies as needed
5. Add redirects (optional):
   - If a portfolio is accessed via old email URL and the user has a username, redirect to `/portfolio/[username]`

## Notes

- The backfill avoids collisions by only setting `username` when the email local-part is globally unique. Others remain `NULL` and can set a handle manually.
- The unique index is case-insensitive: `Foo` and `foo` collide.
