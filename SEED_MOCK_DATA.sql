-- ProofStack Mock Data Seed
-- This script creates sample data for testing the portfolio page
-- Run this in Supabase SQL Editor after setting up your profile

DO $$
DECLARE
  v_email text := 'mattchenard2009@gmail.com';
  v_profile_id uuid;
BEGIN
  -- Find or create profile by email
  SELECT id INTO v_profile_id
  FROM profiles
  WHERE email = v_email;

  -- If profile doesn't exist, update the existing one
  IF v_profile_id IS NULL THEN
    -- Try to find by auth_uid from auth.users
    SELECT p.id INTO v_profile_id
    FROM profiles p
    INNER JOIN auth.users u ON u.id::text = p.auth_uid
    WHERE u.email = v_email;
  END IF;

  -- Update profile with founder status and bio
  IF v_profile_id IS NOT NULL THEN
    UPDATE profiles 
    SET 
      full_name = 'Matt Chenard',
      bio = 'Full-stack developer specializing in Next.js, React, and AI integrations. Building ProofStack to help developers prove their authenticity.',
      plan = 'founder',
      is_founder = true,
      founder_number = 1
    WHERE id = v_profile_id;
  ELSE
    RAISE EXCEPTION 'Profile not found for email: %. Please sign in first to create your profile.', v_email;
  END IF;

  -- Delete any existing mock samples first
  DELETE FROM samples WHERE owner_id = v_profile_id;

  -- Insert sample writing work
  INSERT INTO samples (id, owner_id, type, title, description, content, filename, mime, size_bytes, visibility, created_at)
  VALUES
  (
    gen_random_uuid(),
    v_profile_id,
    'writing',
    'Building ProofStack: A Developer''s Journey',
    'Blog post about building a platform to verify authentic human work',
    'Over the past few months, I''ve been working on ProofStack - a platform designed to help developers prove their work is authentically theirs. The idea came from frustration with AI-generated portfolios flooding the job market. This project combines Next.js, Supabase, and Claude AI for content analysis. Key features include skill extraction, AI detection scoring, and cryptographic proof generation.',
    'proofstack-blog-post.md',
    'text/markdown',
    512,
    'public',
    NOW() - INTERVAL '15 days'
  ),
  (
    gen_random_uuid(),
    v_profile_id,
    'writing',
    'Technical Deep Dive: Rate Limiting Strategies',
    'Article exploring different approaches to rate limiting in serverless environments',
    'Rate limiting in serverless applications presents unique challenges. Traditional in-memory solutions don''t work across Lambda instances. In this article, I explore three approaches: Redis (Upstash), DynamoDB, and hybrid solutions. I implemented a dual-mode rate limiter for ProofStack that uses Upstash Redis in production with an in-memory fallback for development.',
    'rate-limiting-article.md',
    'text/markdown',
    768,
    'public',
    NOW() - INTERVAL '20 days'
  );

  -- Insert sample code work
  INSERT INTO samples (id, owner_id, type, title, description, content, filename, mime, size_bytes, visibility, created_at)
  VALUES
  (
    gen_random_uuid(),
    v_profile_id,
    'code',
    'React Hook for Supabase Auth',
    'Custom React hook for managing Supabase authentication state',
    'import { useState, useEffect } from ''react''
import { supabase } from ''../lib/supabaseClient''

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => listener?.subscription.unsubscribe()
  }, [])

  return { user, loading }
}',
    'useAuth.ts',
    'text/typescript',
    456,
    'public',
    NOW() - INTERVAL '10 days'
  ),
  (
    gen_random_uuid(),
    v_profile_id,
    'code',
    'AI Skill Extraction Service',
    'TypeScript module that uses Claude AI to extract skills from code samples',
    'import Anthropic from ''@anthropic-ai/sdk''

export async function extractSkills(code: string): Promise<string[]> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  
  const prompt = `Analyze this code and list the technical skills demonstrated. Return as JSON array.

Code:
${code.slice(0, 2000)}

Output format: ["skill1", "skill2", ...]`

  const message = await anthropic.messages.create({
    model: ''claude-3-5-sonnet-20241022'',
    max_tokens: 500,
    messages: [{ role: ''user'', content: prompt }]
  })

  const text = message.content[0].type === ''text'' ? message.content[0].text : ''[]''
  return JSON.parse(text)
}',
    'skillExtractor.ts',
    'text/typescript',
    612,
    'public',
    NOW() - INTERVAL '5 days'
  );

  -- Now create analyses for these samples with realistic results
  INSERT INTO analyses (id, sample_id, status, summary, result, skills, metrics, created_at, completed_at)
  SELECT
    gen_random_uuid(),
    s.id,
    'done',
    CASE 
      WHEN s.type = 'writing' AND s.title LIKE '%ProofStack%' THEN 'Well-written technical blog post demonstrating clear communication skills and deep understanding of Next.js, Supabase, and AI integration patterns.'
      WHEN s.type = 'writing' AND s.title LIKE '%Rate Limiting%' THEN 'Excellent technical article showing expertise in serverless architecture, Redis, and distributed systems. Clear problem-solving approach.'
      WHEN s.type = 'code' AND s.title LIKE '%React Hook%' THEN 'Clean, well-structured React hook demonstrating solid understanding of React patterns, TypeScript, and Supabase integration.'
      WHEN s.type = 'code' AND s.title LIKE '%Skill Extraction%' THEN 'Professional implementation of AI service integration. Shows expertise in TypeScript, async/await, and Claude AI SDK.'
      ELSE 'Analysis complete'
    END,
    CASE 
      WHEN s.type = 'writing' AND s.title LIKE '%ProofStack%' THEN jsonb_build_object(
        'credentials', jsonb_build_array(
          jsonb_build_object('type', 'experience', 'name', 'Full-Stack Development', 'confidence', 0.95)
        )
      )
      WHEN s.type = 'writing' AND s.title LIKE '%Rate Limiting%' THEN jsonb_build_object(
        'credentials', jsonb_build_array(
          jsonb_build_object('type', 'expertise', 'name', 'Distributed Systems', 'confidence', 0.92)
        )
      )
      ELSE '{}'::jsonb
    END,
    CASE 
      WHEN s.type = 'writing' AND s.title LIKE '%ProofStack%' THEN jsonb_build_object(
        'next.js', jsonb_build_object('confidence', 0.95, 'evidence', jsonb_build_array('mentions Next.js implementation')),
        'supabase', jsonb_build_object('confidence', 0.92, 'evidence', jsonb_build_array('discusses Supabase integration')),
        'ai/ml', jsonb_build_object('confidence', 0.88, 'evidence', jsonb_build_array('Claude AI usage')),
        'technical writing', jsonb_build_object('confidence', 0.90, 'evidence', jsonb_build_array('clear explanations'))
      )
      WHEN s.type = 'writing' AND s.title LIKE '%Rate Limiting%' THEN jsonb_build_object(
        'redis', jsonb_build_object('confidence', 0.93, 'evidence', jsonb_build_array('Redis implementation details')),
        'serverless', jsonb_build_object('confidence', 0.91, 'evidence', jsonb_build_array('Lambda discussion')),
        'dynamodb', jsonb_build_object('confidence', 0.85, 'evidence', jsonb_build_array('DynamoDB comparison')),
        'system design', jsonb_build_object('confidence', 0.92, 'evidence', jsonb_build_array('architectural patterns'))
      )
      WHEN s.type = 'code' AND s.title LIKE '%React Hook%' THEN jsonb_build_object(
        'react', jsonb_build_object('confidence', 0.97, 'evidence', jsonb_build_array('useState', 'useEffect')),
        'typescript', jsonb_build_object('confidence', 0.95, 'evidence', jsonb_build_array('type annotations')),
        'supabase', jsonb_build_object('confidence', 0.93, 'evidence', jsonb_build_array('supabase.auth API'))
      )
      WHEN s.type = 'code' AND s.title LIKE '%Skill Extraction%' THEN jsonb_build_object(
        'typescript', jsonb_build_object('confidence', 0.96, 'evidence', jsonb_build_array('async/await', 'type safety')),
        'anthropic', jsonb_build_object('confidence', 0.94, 'evidence', jsonb_build_array('Claude SDK usage')),
        'ai/ml', jsonb_build_object('confidence', 0.90, 'evidence', jsonb_build_array('prompt engineering')),
        'node.js', jsonb_build_object('confidence', 0.88, 'evidence', jsonb_build_array('import syntax'))
      )
      ELSE '{}'::jsonb
    END,
    jsonb_build_object(
      'duration_ms', (random() * 2000 + 500)::int,
      'model', 'claude-3-sonnet',
      'tokens_used', (random() * 1000 + 200)::int,
      'ai_detection_score', (random() * 15 + 5)::int  -- Low scores (5-20%) indicating human-written
    ),
    s.created_at + INTERVAL '2 minutes',
    s.created_at + INTERVAL '5 minutes'
  FROM samples s
  WHERE s.owner_id = v_profile_id
    AND NOT EXISTS (SELECT 1 FROM analyses a WHERE a.sample_id = s.id);

  -- Create proofs for the analyses
  INSERT INTO proofs (id, analysis_id, proof_type, proof_hash, signer, payload, signature, created_at)
  SELECT
    gen_random_uuid(),
    a.id,
    'server_signed',
    'sha256:' || substr(md5(random()::text), 1, 16),
    'ProofStack AI Service',
    jsonb_build_object(
      'sample_id', a.sample_id,
      'analyzed_at', a.completed_at,
      'model', 'claude-3-sonnet'
    ),
    jsonb_build_object(
      'algorithm', 'RS256',
      'sig', 'DEMO-' || substr(md5(random()::text), 1, 32)
    ),
    a.completed_at
  FROM analyses a
  WHERE a.status = 'done'
    AND NOT EXISTS (SELECT 1 FROM proofs p WHERE p.analysis_id = a.id);

  RAISE NOTICE 'Mock data seeded successfully for profile: %', v_email;
END $$;

-- Query to verify the data
SELECT 
  p.email,
  p.full_name,
  COUNT(DISTINCT s.id) as sample_count,
  COUNT(DISTINCT a.id) as analysis_count,
  COUNT(DISTINCT pr.id) as proof_count
FROM profiles p
LEFT JOIN samples s ON s.owner_id = p.id
LEFT JOIN analyses a ON a.sample_id = s.id
LEFT JOIN proofs pr ON pr.analysis_id = a.id
WHERE p.email = 'mattchenard2009@gmail.com'
GROUP BY p.id, p.email, p.full_name;
