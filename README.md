# ProofStack Starter

This is a minimal starter scaffold for ProofStack — an MVP for a "Digital Twin Resume" platform built with Next.js 14, Tailwind CSS and Supabase.

What this scaffold includes:
- Next.js 14 app structure (app/)
- Tailwind CSS config and global stylesheet
- Minimal Supabase client helper
- API route placeholders for upload and analysis
- Worker skeleton for background analysis
- Supabase schema SQL to create initial tables

Getting started (PowerShell)

```powershell
# 1) Install dependencies
npm install

# 2) Copy environment variables
cp .env.example .env.local
# edit .env.local and fill in Supabase + Cloudinary + GitHub credentials

# 3) Run the dev server
npm run dev
```

Next steps:
- Fill in .env variables
- Create a Supabase project and run `supabase/schema.sql`
- Provide Ollama / whisper workers or configure remote LLM

If you want, I can now wire up GitHub OAuth and a sample upload flow in code next. Tell me to proceed with "wire auth" or "add upload UI".
