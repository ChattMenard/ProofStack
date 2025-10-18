-- Add waitlist table for landing page signups
-- Migration: 2025-10-17-add-waitlist-table

CREATE TABLE IF NOT EXISTS waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  source text DEFAULT 'landing_page',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  notified_at timestamptz,
  converted_at timestamptz
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at);
CREATE INDEX IF NOT EXISTS idx_waitlist_source ON waitlist(source);

-- Add RLS policies if needed (optional for waitlist)
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Allow inserts for new signups (no auth required for waitlist)
CREATE POLICY "Anyone can join waitlist" ON waitlist FOR INSERT WITH CHECK (true);

-- Admin access only for reading (could be changed based on needs)
CREATE POLICY "Service role can read waitlist" ON waitlist FOR SELECT USING (auth.role() = 'service_role');