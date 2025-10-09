-- ProofStack canonical Supabase schema (cleaned)
-- Run this file in the Supabase SQL editor or with psql to create the MVP tables

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Profiles: lightweight profile mirror for Supabase Auth users
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_uid text UNIQUE,
  full_name text,
  email text,
  avatar_url text,
  github_username text,
  bio text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Samples: uploaded artifacts or links (code, writing, media, repo)
CREATE TABLE IF NOT EXISTS samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'unknown',
  title text,
  description text,
  content text,
  source_url text,
  storage_url text,
  filename text,
  mime text,
  size_bytes bigint DEFAULT 0,
  hash text,
  visibility text DEFAULT 'private',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_samples_owner ON samples(owner_id);

-- Analyses: queued/processed jobs that analyze a sample
CREATE TABLE IF NOT EXISTS analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id uuid REFERENCES samples(id) ON DELETE CASCADE,
  status text DEFAULT 'queued',
  summary text,
  result jsonb DEFAULT '{}'::jsonb,
  skills jsonb DEFAULT '{}'::jsonb,
  metrics jsonb DEFAULT '{}'::jsonb,
  retry_count int DEFAULT 0,
  last_error text,
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_analyses_sample_id ON analyses(sample_id);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);

-- Proofs: cryptographic or signed metadata for verification
CREATE TABLE IF NOT EXISTS proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid REFERENCES analyses(id) ON DELETE CASCADE,
  proof_type text,
  proof_hash text,
  signer text,
  signature jsonb,
  payload jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proofs_analysis_id ON proofs(analysis_id);

-- Uploads: raw upload events for audit and retries
CREATE TABLE IF NOT EXISTS uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id uuid REFERENCES samples(id) ON DELETE CASCADE,
  uploader_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  provider text,
  provider_payload jsonb,
  filename text,
  storage_url text,
  mime text,
  size_bytes bigint DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_uploads_uploader ON uploads(uploader_id);

-- Demo seed data (safe to re-run with ON CONFLICT DO NOTHING)
INSERT INTO profiles (id, auth_uid, full_name, email, created_at)
VALUES (
  '11111111-1111-4111-8111-111111111111',
  'demo-auth-uid',
  'Demo User',
  'demo@example.com',
  now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO samples (id, owner_id, type, title, description, content, filename, mime, size_bytes, visibility, created_at)
VALUES (
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111',
  'writing',
  'Demo project README',
  'Short demo sample used by the ProofStack scaffold.',
  'This is a small example project README. Skills: JavaScript, TypeScript, Next.js.',
  'demo-snippet.txt',
  'text/plain',
  128,
  'public',
  now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO analyses (id, sample_id, status, summary, result, skills, metrics, retry_count, created_at, completed_at)
VALUES (
  '33333333-3333-4333-8333-333333333333',
  '22222222-2222-4222-8222-222222222222',
  'done',
  'Extracted skills from demo snippet',
  '{"skills": [{"name":"JavaScript","confidence":0.95},{"name":"Next.js","confidence":0.9}] }'::jsonb,
  '{"javascript": {"confidence": 0.95, "evidence": ["demo-snippet.txt"]}}'::jsonb,
  '{"duration_ms":120, "model":"mock" }'::jsonb,
  0,
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO proofs (id, analysis_id, proof_type, proof_hash, signer, payload, signature, created_at)
VALUES (
  '44444444-4444-4444-8444-444444444444',
  '33333333-3333-4333-8333-333333333333',
  'server_signed',
  'sha256:abcdef123456',
  'ProofStack Demo Service',
  '{"note":"demo proof"}'::jsonb,
  '{"sig":"TEST-SIGNATURE"}'::jsonb,
  now()
)
ON CONFLICT (id) DO NOTHING;