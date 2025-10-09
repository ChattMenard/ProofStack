-- ProofStack canonical Supabase schema-- ProofStack canonical schema (single copy)

-- Run in Supabase SQL editor or psql to create base tables for the MVP-- Tables: profiles, samples, analyses, proofs, uploads



-- Enable pgcrypto for gen_random_uuid()-- Notes:

CREATE EXTENSION IF NOT EXISTS pgcrypto;--  - Requires pgcrypto for gen_random_uuid(); Supabase already allows CREATE EXTENSION

--  - Use this in Supabase SQL editor or via psql

-- Profiles: lightweight profile mirror for Supabase Auth users

CREATE TABLE IF NOT EXISTS profiles (CREATE EXTENSION IF NOT EXISTS pgcrypto;

  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  auth_uid text UNIQUE, -- optional Supabase auth user id-- profiles: user metadata mirror (keeps small public profile info)

  full_name text,CREATE TABLE IF NOT EXISTS profiles (

  email text,  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  avatar_url text,  auth_uid text UNIQUE, -- optional Supabase auth user id

  github_username text,  full_name text,

  bio text,  email text,

  metadata jsonb DEFAULT '{}'::jsonb,  avatar_url text,

  created_at timestamptz DEFAULT now(),  github_username text,

  updated_at timestamptz DEFAULT now()  bio text,

);  metadata jsonb DEFAULT '{}'::jsonb,

  created_at timestamptz DEFAULT now(),

-- Samples: uploaded artifacts or external links  updated_at timestamptz DEFAULT now()

CREATE TABLE IF NOT EXISTS samples ();

  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  owner_id uuid REFERENCES profiles(id) ON DELETE SET NULL,-- samples: artifact records (small content or storage_url)

  type text NOT NULL DEFAULT 'unknown', -- code | design | writing | audio | video | repoCREATE TABLE IF NOT EXISTS samples (

  title text,  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  description text,  owner_id uuid REFERENCES profiles(id) ON DELETE SET NULL,

  content text, -- small inlined content for demos; large files use storage_url  type text NOT NULL DEFAULT 'unknown', -- code | writing | design | audio | video | repo

  source_url text, -- external source (github repo, original link)  title text,

  storage_url text, -- Cloudinary / Supabase storage URL  description text,

  filename text,  content text,

  mime text,  source_url text,

  size_bytes bigint DEFAULT 0,  storage_url text,

  hash text,  filename text,

  visibility text DEFAULT 'private', -- public | private  mime text,

  metadata jsonb DEFAULT '{}'::jsonb,  size_bytes bigint DEFAULT 0,

  created_at timestamptz DEFAULT now(),  hash text,

  updated_at timestamptz DEFAULT now()  visibility text DEFAULT 'private',

);  metadata jsonb DEFAULT '{}'::jsonb,

  created_at timestamptz DEFAULT now(),

CREATE INDEX IF NOT EXISTS idx_samples_owner ON samples(owner_id);  updated_at timestamptz DEFAULT now()

);

-- Analyses: queued and processed analysis jobs

CREATE TABLE IF NOT EXISTS analyses (CREATE INDEX IF NOT EXISTS idx_samples_owner ON samples(owner_id);

  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  sample_id uuid REFERENCES samples(id) ON DELETE CASCADE,-- analyses: job records for analysis pipeline

  status text DEFAULT 'queued', -- queued | running | failed | doneCREATE TABLE IF NOT EXISTS analyses (

  summary text,  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  result jsonb DEFAULT '{}'::jsonb, -- canonical analysis output (skills, evidence)  sample_id uuid REFERENCES samples(id) ON DELETE CASCADE,

  skills jsonb DEFAULT '{}'::jsonb,  status text DEFAULT 'queued', -- queued | running | done | failed

  metrics jsonb DEFAULT '{}'::jsonb,  summary text,

  retry_count int DEFAULT 0,  result jsonb DEFAULT '{}'::jsonb,

  last_error text,  skills jsonb DEFAULT '{}'::jsonb,

  created_at timestamptz DEFAULT now(),  metrics jsonb DEFAULT '{}'::jsonb,

  started_at timestamptz,  retry_count int DEFAULT 0,

  completed_at timestamptz  last_error text,

);  created_at timestamptz DEFAULT now(),

  started_at timestamptz,

CREATE INDEX IF NOT EXISTS idx_analyses_sample_id ON analyses(sample_id);  completed_at timestamptz

CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status););



-- Proofs: signed or cryptographic proofs for an analysis/sampleCREATE INDEX IF NOT EXISTS idx_analyses_sample_id ON analyses(sample_id);

CREATE TABLE IF NOT EXISTS proofs (CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);

  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  analysis_id uuid REFERENCES analyses(id) ON DELETE CASCADE,-- proofs: server-signed or challenge-based verification metadata

  proof_type text, -- server_signed | github_challenge | gpg_commit | ipfs_anchorCREATE TABLE IF NOT EXISTS proofs (

  proof_hash text,  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  signer text,  analysis_id uuid REFERENCES analyses(id) ON DELETE CASCADE,

  signature jsonb,  proof_type text,

  payload jsonb DEFAULT '{}'::jsonb,  proof_hash text,

  metadata jsonb DEFAULT '{}'::jsonb,  signer text,

  created_at timestamptz DEFAULT now()  signature jsonb,

);  payload jsonb DEFAULT '{}'::jsonb,

  metadata jsonb DEFAULT '{}'::jsonb,

CREATE INDEX IF NOT EXISTS idx_proofs_analysis_id ON proofs(analysis_id);  created_at timestamptz DEFAULT now()

);

-- Uploads: raw upload events for audit and retries

CREATE TABLE IF NOT EXISTS uploads (CREATE INDEX IF NOT EXISTS idx_proofs_analysis_id ON proofs(analysis_id);

  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  sample_id uuid REFERENCES samples(id) ON DELETE CASCADE,-- uploads: raw upload audit trail

  uploader_id uuid REFERENCES profiles(id) ON DELETE SET NULL,CREATE TABLE IF NOT EXISTS uploads (

  provider text,  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  provider_payload jsonb,  sample_id uuid REFERENCES samples(id) ON DELETE CASCADE,

  filename text,  uploader_id uuid REFERENCES profiles(id) ON DELETE SET NULL,

  storage_url text,  provider text,

  mime text,  provider_payload jsonb,

  size_bytes bigint DEFAULT 0,  filename text,

  metadata jsonb DEFAULT '{}'::jsonb,  storage_url text,

  created_at timestamptz DEFAULT now()  mime text,

);  size_bytes bigint DEFAULT 0,

  metadata jsonb DEFAULT '{}'::jsonb,

CREATE INDEX IF NOT EXISTS idx_uploads_uploader ON uploads(uploader_id);  created_at timestamptz DEFAULT now()

);

-- Demo seed data (safe to re-run with ON CONFLICT DO NOTHING)

INSERT INTO profiles (id, auth_uid, full_name, email, created_at)CREATE INDEX IF NOT EXISTS idx_uploads_uploader ON uploads(uploader_id);

VALUES (

  '11111111-1111-4111-8111-111111111111',-- Demo seed rows (idempotent)

  'demo-auth-uid',INSERT INTO profiles (id, auth_uid, full_name, email, created_at)

  'Demo User',VALUES ('11111111-1111-4111-8111-111111111111','demo-auth-uid','Demo User','demo@example.com', now())

  'demo@example.com',ON CONFLICT (id) DO NOTHING;

  now()

)INSERT INTO samples (id, owner_id, type, title, description, content, filename, mime, size_bytes, visibility, created_at)

ON CONFLICT (id) DO NOTHING;VALUES ('22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111','writing','Demo project README','Short demo sample used by the ProofStack scaffold.','This is a small example project README. Skills: JavaScript, TypeScript, Next.js.','demo-snippet.txt','text/plain',128,'public', now())

ON CONFLICT (id) DO NOTHING;

INSERT INTO samples (id, owner_id, type, title, description, content, filename, mime, size_bytes, visibility, created_at)

VALUES (INSERT INTO analyses (id, sample_id, status, summary, result, skills, metrics, retry_count, created_at, completed_at)

  '22222222-2222-4222-8222-222222222222',VALUES ('33333333-3333-4333-8333-333333333333','22222222-2222-4222-8222-222222222222','done','Extracted skills from demo snippet','{"skills": [{"name":"JavaScript","confidence":0.95},{"name":"Next.js","confidence":0.9}] }'::jsonb,'{"javascript": {"confidence": 0.95, "evidence": ["demo-snippet.txt"]}}'::jsonb,'{"duration_ms":120, "model":"mock" }'::jsonb,0, now(), now())

  '11111111-1111-4111-8111-111111111111',ON CONFLICT (id) DO NOTHING;

  'writing',

  'Demo project README',INSERT INTO proofs (id, analysis_id, proof_type, proof_hash, signer, payload, signature, created_at)

  'Short demo sample used by the ProofStack scaffold.',VALUES ('44444444-4444-4444-8444-444444444444','33333333-3333-4333-8333-333333333333','server_signed','sha256:abcdef123456','ProofStack Demo Service','{"note":"demo proof"}'::jsonb,'{"sig":"TEST-SIGNATURE"}'::jsonb, now())

  'This is a small example project README. Skills: JavaScript, TypeScript, Next.js.',ON CONFLICT (id) DO NOTHING;

  'demo-snippet.txt',

  'text/plain',-- End of schema

  128,

  'public',-- ProofStack canonical Supabase schema

  now()-- Run in Supabase SQL editor or psql to create base tables for the MVP

)

ON CONFLICT (id) DO NOTHING;-- Enable pgcrypto for gen_random_uuid()

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO analyses (id, sample_id, status, summary, result, skills, metrics, retry_count, created_at, completed_at)

VALUES (-- Profiles: lightweight profile mirror for Supabase Auth users

  '33333333-3333-4333-8333-333333333333',CREATE TABLE IF NOT EXISTS profiles (

  '22222222-2222-4222-8222-222222222222',  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  'done',  auth_uid text UNIQUE, -- optional Supabase auth user id

  'Extracted skills from demo snippet',  full_name text,

  '{"skills": [{"name":"JavaScript","confidence":0.95},{"name":"Next.js","confidence":0.9}] }'::jsonb,  email text,

  '{"javascript": {"confidence": 0.95, "evidence": ["demo-snippet.txt"]}}'::jsonb,  avatar_url text,

  '{"duration_ms":120, "model":"mock" }'::jsonb,  github_username text,

  0,  bio text,

  now(),  metadata jsonb DEFAULT '{}'::jsonb,

  now()  created_at timestamptz DEFAULT now(),

)  updated_at timestamptz DEFAULT now()

ON CONFLICT (id) DO NOTHING;);



INSERT INTO proofs (id, analysis_id, proof_type, proof_hash, signer, payload, signature, created_at)-- Samples: uploaded artifacts or external links

VALUES (CREATE TABLE IF NOT EXISTS samples (

  '44444444-4444-4444-8444-444444444444',  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  '33333333-3333-4333-8333-333333333333',  owner_id uuid REFERENCES profiles(id) ON DELETE SET NULL,

  'server_signed',  type text NOT NULL DEFAULT 'unknown', -- code | design | writing | audio | video | repo

  'sha256:abcdef123456',  title text,

  'ProofStack Demo Service',  description text,

  '{"note":"demo proof"}'::jsonb,  content text, -- small inlined content for demos; large files use storage_url

  '{"sig":"TEST-SIGNATURE"}'::jsonb,  source_url text, -- external source (github repo, original link)

  now()  storage_url text, -- Cloudinary / Supabase storage URL

)  filename text,

ON CONFLICT (id) DO NOTHING;  mime text,

  size_bytes bigint DEFAULT 0,

-- End of schema  hash text,

  visibility text DEFAULT 'private', -- public | private
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_samples_owner ON samples(owner_id);

-- Analyses: queued and processed analysis jobs
CREATE TABLE IF NOT EXISTS analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id uuid REFERENCES samples(id) ON DELETE CASCADE,
  status text DEFAULT 'queued', -- queued | running | failed | done
  summary text,
  result jsonb DEFAULT '{}'::jsonb, -- canonical analysis output (skills, evidence)
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

-- Proofs: signed or cryptographic proofs for an analysis/sample
CREATE TABLE IF NOT EXISTS proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid REFERENCES analyses(id) ON DELETE CASCADE,
  proof_type text, -- server_signed | github_challenge | gpg_commit | ipfs_anchor
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

-- End of schema
-- ProofStack Supabase schema
-- Run on Postgres (Supabase) to create base tables for MVP

-- Enable pgcrypto for gen_random_uuid() on Supabase/Postgres
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Profiles table (mirror of Supabase auth users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID NULL, -- optional link to Supabase auth's user id
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  bio TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Samples: uploaded artifacts or text/code samples
CREATE TABLE IF NOT EXISTS samples (
-- Consolidated ProofStack Supabase schema
-- Run on Postgres (Supabase) to create base tables for MVP

-- Enable pgcrypto for gen_random_uuid() on Supabase/Postgres
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Profiles table (mirror of Supabase auth users)
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
  type text NOT NULL DEFAULT 'unknown', -- code | design | writing | audio | video | repo
  title text,
  description text,
  content text, -- small inlined content for demos; large files use storage_url
  source_url text, -- original source (github repo, external link)
  storage_url text, -- Cloudinary / Supabase storage url
  filename text,
  mime text,
  size_bytes bigint DEFAULT 0,
  hash text,
  visibility text DEFAULT 'private', -- public | private
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_samples_owner ON samples(owner_id);

-- Analyses: queued/processed jobs that analyze a sample
CREATE TABLE IF NOT EXISTS analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id uuid REFERENCES samples(id) ON DELETE CASCADE,
  status text DEFAULT 'queued', -- queued | running | failed | done
  summary text,
  result jsonb DEFAULT '{}'::jsonb, -- canonical result (skills, evidence, etc.)
  skills jsonb DEFAULT '{}'::jsonb,
  metrics jsonb DEFAULT '{}'::jsonb, -- timing, model, tokens, retry_count
  retry_count int DEFAULT 0,
  last_error text,
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_analyses_sample_id ON analyses(sample_id);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);

-- Proofs table: cryptographic or signed metadata for verification
CREATE TABLE IF NOT EXISTS proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid REFERENCES analyses(id) ON DELETE CASCADE,
  proof_type text, -- server_signed | github_challenge | gpg_commit | ipfs_anchor
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
  provider text, -- cloudinary | github | direct
  provider_payload jsonb,
  filename text,
  storage_url text,
  mime text,
  size_bytes bigint DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_uploads_uploader ON uploads(uploader_id);

-- Demo seeds: a profile, a sample, an analysis, and a proof
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

-- End of consolidated schema

  source_url text, -- original URL (github repo link, provided url)
  storage_url text, -- Cloudinary / object storage URL
  filename text,
  size_bytes bigint,
  hash text,
  visibility text DEFAULT 'private', -- public | private
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_samples_user_id ON samples(user_id);

-- analyses: results of running the analysis worker on a sample
CREATE TABLE IF NOT EXISTS analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id uuid REFERENCES samples(id) ON DELETE CASCADE,
  status text DEFAULT 'queued', -- queued | running | failed | done
  summary text,
  skills jsonb DEFAULT '{}'::jsonb,
  metrics jsonb DEFAULT '{}'::jsonb,
  started_at timestamptz,
  finished_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_analyses_sample_id ON analyses(sample_id);

-- proofs: cryptographic or signed proof artifacts for a sample/analysis
CREATE TABLE IF NOT EXISTS proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid REFERENCES analyses(id) ON DELETE CASCADE,
  proof_type text, -- server_signed | github_challenge | gpg_commit | ipfs_anchor
  payload jsonb,
  signature text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proofs_analysis_id ON proofs(analysis_id);

-- uploads: raw upload events (useful for audit & retries)
CREATE TABLE IF NOT EXISTS uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id uuid REFERENCES samples(id) ON DELETE CASCADE,
  provider text, -- cloudinary, github, direct
  provider_payload jsonb,
  created_at timestamptz DEFAULT now()
);

-- Example seed data for a demo user and sample
-- Adjust the UUIDs or use gen_random_uuid() when inserting via the app
-- Insert a demo profile
INSERT INTO profiles (id, auth_uid, email, full_name, avatar_url)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'demo-auth-uid', 'demo@example.com', 'Demo User', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert a demo sample (text file / snippet)
INSERT INTO samples (id, user_id, type, source_url, storage_url, filename, size_bytes, hash, visibility)
VALUES
  ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'writing', NULL, NULL, 'demo-snippet.txt', 1234, 'sha256:abcdef123456', 'public')
ON CONFLICT (id) DO NOTHING;

-- Insert a demo analysis for the sample
INSERT INTO analyses (id, sample_id, status, summary, skills, metrics, started_at, finished_at)
VALUES
  ('33333333-3333-4333-8333-333333333333', '22222222-2222-4222-8222-222222222222', 'done', 'Extracted skills from demo snippet', '{"javascript": {"confidence": 0.86, "evidence": [{"type":"sample","id":"22222222-2222-4222-8222-222222222222","path":"demo-snippet.txt"}]}}', '{}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Insert a demo proof
INSERT INTO proofs (id, analysis_id, proof_type, payload, signature)
VALUES
  ('44444444-4444-4444-8444-444444444444', '33333333-3333-4333-8333-333333333333', 'server_signed', '{"hash":"sha256:abcdef123456"}', 'TEST-SIGNATURE')
ON CONFLICT (id) DO NOTHING;

-- End of schema
