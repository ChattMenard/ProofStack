# Fix Supabase OAuth Redirects - Quick Guide

**Issue**: OAuth redirects to `localhost:3000` instead of `www.proofstacked.com`

**Solution**: Update Supabase redirect URLs (takes 2 minutes)

---

## Step 1: Go to Supabase Auth Settings

Click this link (opens in your browser):
```
https://app.supabase.com/project/lytjmxjizalmgbgrgfvc/auth/url-configuration
```

Or navigate manually:
1. Go to https://app.supabase.com
2. Click on your project: `lytjmxjizalmgbgrgfvc`
3. Click **Authentication** in sidebar
4. Click **URL Configuration** tab

---

## Step 2: Update Site URL

**Find the field**: "Site URL"

**Change FROM**:
```
http://localhost:3000
```

**Change TO**:
```
https://www.proofstacked.com
```

Click **Save**

---

## Step 3: Update Redirect URLs

**Find the field**: "Redirect URLs"

**Add these URLs** (one per line):
```
https://www.proofstacked.com
https://www.proofstacked.com/**
http://localhost:3000
http://localhost:3000/**
```

**Why include localhost?** So you can still test locally while developing.

**Important**: The `/**` wildcard allows all routes under your domain.

Click **Save**

---

## Step 4: Verify Google OAuth Settings

**Go to Google Cloud Console**:
```
https://console.cloud.google.com/apis/credentials
```

**Find your OAuth 2.0 Client ID** (the one you're using for Supabase)

**Check "Authorized redirect URIs"** - should include:
```
https://lytjmxjizalmgbgrgfvc.supabase.co/auth/v1/callback
```

**NOT** your app domain - Supabase handles the callback.

---

## Step 5: Test It

1. Clear your browser cookies for `www.proofstacked.com`
2. Go to: `https://www.proofstacked.com/login`
3. Click "Continue with Google"
4. After Google login, check the URL

**Expected URL after login**:
```
https://www.proofstacked.com/#access_token=eyJ...
```

**NOT**:
```
http://localhost:3000/#access_token=eyJ...
```

---

## Troubleshooting

### Still redirects to localhost
- Double-check Site URL is `https://www.proofstacked.com` (no trailing slash)
- Clear browser cache and cookies
- Wait 1-2 minutes for Supabase settings to propagate

### "Invalid redirect URL" error
- Make sure you clicked **Save** after adding redirect URLs
- Verify `https://www.proofstacked.com/**` is in the list (with wildcard)

### Works on production but breaks local dev
- Keep `http://localhost:3000/**` in the redirect URLs list
- Both production and local should work simultaneously

---

## What This Fixes

- ✅ Google OAuth redirects to production
- ✅ GitHub OAuth redirects to production
- ✅ LinkedIn OAuth redirects to production
- ✅ Magic link emails point to production
- ✅ Local development still works (localhost in list)

---

## Quick Checklist

- [ ] Updated Site URL to `https://www.proofstacked.com`
- [ ] Added production URLs to Redirect URLs
- [ ] Kept localhost URLs for local dev
- [ ] Clicked Save
- [ ] Tested login on production
- [ ] Verified URL shows `www.proofstacked.com` after login

---

**Time to complete**: ~2 minutes

**Once done**: OAuth will redirect to production correctly! 🎉
