# LinkedIn OAuth Setup Guide

## ✅ Status: LinkedIn credentials added to .env.local (already in .gitignore)

## What's Already Done:
1. ✅ LinkedIn OAuth button added to AuthForm.tsx
2. ✅ Handler function `handleLinkedIn()` implemented using `linkedin_oidc` provider
3. ✅ PostHog tracking added for LinkedIn auth events
4. ✅ .env.local already protected in .gitignore

## What You Need to Do Next:

### Step 1: Configure LinkedIn in Supabase Dashboard

1. **Go to your Supabase Dashboard:**
   - Navigate to: https://supabase.com/dashboard/project/lytjmxjizalmgbgrgfvc
   - Go to Authentication → Providers

2. **Enable LinkedIn (OIDC):**
   - Find "LinkedIn (OIDC)" in the provider list
   - Toggle it ON
   - Enter your credentials:
     - **Client ID:** `proofstack`
     - **Client Secret:** `yf77!K7ez-iU-Yz`
   - **Callback URL** (should be auto-filled): 
     ```
     https://lytjmxjizalmgbgrgfvc.supabase.co/auth/v1/callback
     ```
   - Click **Save**

### Step 2: Configure LinkedIn App Settings

1. **Go to LinkedIn Developers:**
   - Visit: https://www.linkedin.com/developers/apps
   - Find your "proofstack" app

2. **Verify OAuth Settings:**
   - Go to the **Auth** tab
   - Make sure these redirect URLs are added:
     ```
     https://lytjmxjizalmgbgrgfvc.supabase.co/auth/v1/callback
     https://proofstack-n4fmmhj5v-matthew-chenards-projects.vercel.app/auth/callback
     ```
   - Add your production domain when you have it:
     ```
     https://yourdomain.com/auth/callback
     ```

3. **Required Scopes:**
   Make sure these scopes are selected:
   - `openid`
   - `profile`
   - `email`

### Step 3: Add LinkedIn Credentials to Vercel (Production)

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/matthew-chenards-projects/proofstack/settings/environment-variables

2. **Add these variables** (just for documentation - Supabase handles the actual OAuth):
   ```
   LINKEDIN_CLIENT_ID=proofstack
   LINKEDIN_CLIENT_SECRET=yf77!K7ez-iU-Yz
   ```
   - Select: Production, Preview, Development
   - Click **Save**

   **Note:** These aren't technically needed in your Next.js app since Supabase handles the OAuth flow, but it's good to document them in Vercel for reference.

### Step 4: Test Locally

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Go to login page:**
   ```
   http://localhost:3000/login
   ```

3. **Click "Sign in with LinkedIn"**
   - Should redirect to LinkedIn
   - After authorizing, redirects back to your app
   - Should land on `/dashboard`

### Step 5: Deploy to Production

Once local testing works:

```bash
git add .
git commit -m "feat: Add LinkedIn OAuth authentication"
git push
npx vercel --prod
```

## 🔧 Technical Details

### Provider Name
Supabase uses `linkedin_oidc` (OpenID Connect version) rather than the legacy `linkedin` provider.

### Auth Flow
1. User clicks "Sign in with LinkedIn"
2. Redirects to LinkedIn authorization page
3. User grants permissions
4. LinkedIn redirects to: `https://lytjmxjizalmgbgrgfvc.supabase.co/auth/v1/callback`
5. Supabase processes the callback and creates/updates user
6. Supabase redirects to: `${window.location.origin}/auth/callback`
7. Your callback handler redirects to `/dashboard`

### Data Retrieved from LinkedIn
- Email address
- Full name
- Profile picture URL
- LinkedIn profile URL

## 🎯 Files Modified
- ✅ `components/AuthForm.tsx` - Added LinkedIn button and handler
- ✅ `.env.local` - Cleaned up and documented LinkedIn credentials

## 📝 Common Issues

### "Invalid client_id"
- Make sure Client ID in Supabase exactly matches your LinkedIn app
- Check for extra spaces or typos

### "Redirect URI mismatch"
- Ensure the Supabase callback URL is added to LinkedIn app's allowed redirect URLs
- URL must match exactly (including https://)

### "Email not provided"
- LinkedIn requires "email" scope
- Check that your LinkedIn app has email scope enabled
- Some LinkedIn accounts may not have verified emails

## 🎨 Button Styling
The LinkedIn button matches your existing auth buttons:
- Forest theme colors
- LinkedIn favicon icon
- Hover effects
- Same size/spacing as Google/GitHub buttons

## 🚀 Next Steps After Setup
1. Test all three OAuth providers (Google, LinkedIn, GitHub)
2. Verify user profiles are created correctly
3. Check PostHog for auth event tracking
4. Update any documentation with LinkedIn login option
