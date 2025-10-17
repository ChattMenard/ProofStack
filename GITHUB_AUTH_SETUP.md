# GitHub Authentication Setup Guide

## Current Issue
The GitHub OAuth URL shows `client_id=ChattMenard's Project` instead of a proper OAuth App Client ID.

## Solution: Configure GitHub OAuth in Supabase

### Step 1: Create GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click **"New OAuth App"** (or use existing one)
3. Fill in details:
   ```
   Application name: ProofStack
   Homepage URL: http://localhost:3000
   Authorization callback URL: https://lytjmxjizalmgbgrgfvc.supabase.co/auth/v1/callback
   ```
4. Click **"Register application"**
5. **Copy the Client ID** (starts with `Ov23...`)
6. Click **"Generate a new client secret"**
7. **Copy the Client Secret** (you'll only see this once!)

### Step 2: Configure Supabase

1. Go to your Supabase dashboard:
   https://supabase.com/dashboard/project/lytjmxjizalmgbgrgfvc

2. Navigate to: **Authentication** → **Providers**

3. Find **GitHub** in the list and click to enable/configure

4. Enter your credentials:
   - **Client ID**: `Ov23lilbfg93Fzfea6b8` (or your new one)
   - **Client Secret**: (the secret you just generated)

5. Click **"Save"**

### Step 3: Update .env.local (Optional)

Your `.env.local` already has the GitHub Client ID:
```bash
GITHUB_CLIENT_ID=Ov23lilbfg93Fzfea6b8
GITHUB_CLIENT_SECRET=your-secret-here
```

These are only needed if you're making direct GitHub API calls outside Supabase Auth.

### Step 4: Test Authentication

1. Make sure your dev server is running:
   ```bash
   npm run dev
   ```

2. Visit http://localhost:3000

3. Click **"Sign in with GitHub"**

4. You should see a proper GitHub authorization page (not an error)

5. After authorizing, you'll be redirected back to your app

## For Production Deployment

When deploying to Vercel/production:

1. Create a **second GitHub OAuth App** for production:
   ```
   Application name: ProofStack (Production)
   Homepage URL: https://your-domain.vercel.app
   Authorization callback URL: https://lytjmxjizalmgbgrgfvc.supabase.co/auth/v1/callback
   ```

2. Add production credentials to Vercel Environment Variables:
   ```
   GITHUB_CLIENT_ID=<production-client-id>
   GITHUB_CLIENT_SECRET=<production-secret>
   ```

## Troubleshooting

### Error: "client_id not found"
- Double-check Supabase provider configuration
- Make sure you saved the GitHub provider settings
- Try disabling and re-enabling the GitHub provider

### Error: "redirect_uri_mismatch"
- The callback URL in GitHub OAuth App must match:
  `https://lytjmxjizalmgbgrgfvc.supabase.co/auth/v1/callback`
- Make sure there are no trailing slashes

### Error: "GitHub not connected" when importing repos
- Sign out and sign back in with GitHub
- Check that provider_token is being stored (Supabase should do this automatically)

## Alternative: Device Flow (for CLI tools)

If you want to build a CLI tool later, GitHub Device Flow would be appropriate:
- User runs a command
- App displays a code
- User visits github.com/login/device and enters code
- CLI tool gets access token

For web apps like ProofStack, the OAuth flow you have is the correct approach!
