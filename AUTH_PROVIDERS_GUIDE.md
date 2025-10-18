# 🔐 Authentication Providers Guide

## Overview

ProofStack currently supports:
- ✅ Email Magic Link (passwordless)
- ✅ GitHub OAuth

This guide shows you how to add more OAuth providers (Google, Microsoft, LinkedIn, etc.)

---

## Current Setup

**File**: `components/AuthForm.tsx`

**Providers**:
1. **Magic Link** - Uses Supabase `signInWithOtp()`
2. **GitHub OAuth** - Uses Supabase `signInWithOAuth()`

---

## Adding a New OAuth Provider

### Step 1: Enable Provider in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Find your desired provider (e.g., Google, Microsoft, LinkedIn)
4. Enable the provider
5. Fill in the required credentials:
   - **Client ID** / **App ID**
   - **Client Secret** / **App Secret**
   - **Redirect URL** (provided by Supabase)

### Step 2: Get OAuth Credentials

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Web application**
6. Add authorized redirect URI: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
7. Copy **Client ID** and **Client Secret**

#### Microsoft OAuth
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Add redirect URI: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
5. Go to **Certificates & secrets** → Create new client secret
6. Copy **Application (client) ID** and **Client Secret**

#### LinkedIn OAuth
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. In **Auth** tab, add redirect URL: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
4. Copy **Client ID** and **Client Secret**

#### Twitter/X OAuth
1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app
3. Enable **OAuth 2.0**
4. Add callback URL: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
5. Copy **Client ID** and **Client Secret**

### Step 3: Update AuthForm Component

Add the new provider button and handler to `components/AuthForm.tsx`:

```tsx
// Add handler for new provider (e.g., Google)
const handleGoogle = async () => {
  setMessage('')
  try {
    posthog.capture('auth_google_started')
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })
    if (error) throw error
  } catch (err: any) {
    posthog.capture('auth_error', { method: 'google', error: err.message })
    setMessage(err.message || 'Error signing in with Google')
  }
}

// Add button in the return JSX
<button 
  type="button" 
  onClick={handleGoogle} 
  className="bg-white text-gray-800 px-3 py-2 rounded border border-gray-300 hover:bg-gray-50"
>
  <span className="flex items-center gap-2">
    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
    Sign in with Google
  </span>
</button>
```

---

## Complete Example: Adding Multiple Providers

Here's an updated `AuthForm.tsx` with Google, Microsoft, and LinkedIn:

```tsx
"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'
import posthog from 'posthog-js'

export default function AuthForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (event === 'SIGNED_IN' && session) {
        posthog.capture('auth_success', { method: event })
        router.push('/dashboard')
      }
    })
    return () => subscription.unsubscribe()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    try {
      const { error } = await supabase.auth.signInWithOtp({ 
        email,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` }
      })
      if (error) throw error
      posthog.capture('auth_magic_link_sent', { email_domain: email.split('@')[1] })
      setMessage('Check your email for the magic link.')
    } catch (err: any) {
      posthog.capture('auth_error', { method: 'magic_link', error: err.message })
      setMessage(err.message || 'Error sending magic link')
    }
  }

  const handleOAuth = async (provider: string) => {
    setMessage('')
    try {
      posthog.capture(`auth_${provider}_started`)
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: provider as any,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          ...(provider === 'google' && {
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            }
          })
        }
      })
      if (error) throw error
    } catch (err: any) {
      posthog.capture('auth_error', { method: provider, error: err.message })
      setMessage(err.message || `Error signing in with ${provider}`)
    }
  }

  return (
    <div className="space-y-4 max-w-sm">
      {/* Email Magic Link */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <label className="block text-sm text-forest-200">Email</label>
        <input
          required
          type="email"
          className="w-full rounded border border-forest-700 bg-forest-800 text-forest-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sage-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <button 
          className="w-full bg-sage-600 hover:bg-sage-500 text-forest-50 px-4 py-2 rounded transition" 
          type="submit"
        >
          Send Magic Link
        </button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-forest-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-forest-900 text-forest-400">Or continue with</span>
        </div>
      </div>

      {/* OAuth Providers */}
      <div className="space-y-2">
        {/* Google */}
        <button 
          type="button" 
          onClick={() => handleOAuth('google')}
          className="w-full bg-white hover:bg-gray-50 text-gray-800 px-4 py-2 rounded border border-gray-300 transition flex items-center justify-center gap-2"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
          Sign in with Google
        </button>

        {/* GitHub */}
        <button 
          type="button" 
          onClick={() => handleOAuth('github')}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded transition flex items-center justify-center gap-2"
        >
          <img src="https://github.githubassets.com/favicons/favicon.svg" alt="GitHub" className="w-4 h-4" />
          Sign in with GitHub
        </button>

        {/* Microsoft */}
        <button 
          type="button" 
          onClick={() => handleOAuth('azure')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition flex items-center justify-center gap-2"
        >
          <img src="https://www.microsoft.com/favicon.ico" alt="Microsoft" className="w-4 h-4" />
          Sign in with Microsoft
        </button>

        {/* LinkedIn */}
        <button 
          type="button" 
          onClick={() => handleOAuth('linkedin')}
          className="w-full bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded transition flex items-center justify-center gap-2"
        >
          <img src="https://www.linkedin.com/favicon.ico" alt="LinkedIn" className="w-4 h-4" />
          Sign in with LinkedIn
        </button>
      </div>

      {message && <p className="text-sm text-forest-200">{message}</p>}
    </div>
  )
}
```

---

## Supported Providers in Supabase

Supabase supports these OAuth providers out of the box:

### Social Providers
- ✅ **Google** - `provider: 'google'`
- ✅ **GitHub** - `provider: 'github'`
- ✅ **GitLab** - `provider: 'gitlab'`
- ✅ **Bitbucket** - `provider: 'bitbucket'`
- ✅ **Facebook** - `provider: 'facebook'`
- ✅ **Twitter** - `provider: 'twitter'`
- ✅ **LinkedIn** - `provider: 'linkedin'`
- ✅ **Discord** - `provider: 'discord'`
- ✅ **Slack** - `provider: 'slack'`
- ✅ **Spotify** - `provider: 'spotify'`
- ✅ **Twitch** - `provider: 'twitch'`

### Enterprise Providers
- ✅ **Microsoft/Azure** - `provider: 'azure'`
- ✅ **Apple** - `provider: 'apple'`
- ✅ **Notion** - `provider: 'notion'`
- ✅ **Workos** - `provider: 'workos'`

---

## Best Practices

### 1. **Scope Management**
Request only the scopes you need:

```tsx
const { error } = await supabase.auth.signInWithOAuth({ 
  provider: 'google',
  options: {
    scopes: 'email profile', // Minimal scopes
    redirectTo: `${window.location.origin}/dashboard`
  }
})
```

### 2. **Error Handling**
Always handle OAuth errors gracefully:

```tsx
try {
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
  if (error) {
    // Handle specific errors
    if (error.message.includes('popup')) {
      setMessage('Please allow popups for this site')
    } else {
      setMessage(error.message)
    }
  }
} catch (err) {
  setMessage('Unexpected error occurred')
}
```

### 3. **Analytics Tracking**
Track auth events for each provider:

```tsx
posthog.capture('auth_attempt', { provider: 'google' })
posthog.capture('auth_success', { provider: 'google' })
posthog.capture('auth_failure', { provider: 'google', error: error.message })
```

### 4. **User Experience**
- Show loading state during OAuth redirect
- Clear error messages
- Branded buttons with provider logos
- Mobile-responsive layout

---

## Testing OAuth Providers

### Local Development
1. Add `http://localhost:3000/dashboard` to authorized redirect URIs in provider settings
2. Test sign-in flow
3. Verify session persistence
4. Test sign-out

### Production
1. Use production domain in redirect URIs
2. Test from multiple devices/browsers
3. Verify email addresses are captured correctly
4. Test account linking (same email, different providers)

---

## Troubleshooting

### "Redirect URI mismatch"
- Ensure redirect URI in provider settings matches: `https://<project>.supabase.co/auth/v1/callback`
- Check for trailing slashes

### "Invalid client credentials"
- Verify Client ID and Secret are correct
- Check credentials haven't expired
- Ensure correct environment (dev vs prod)

### "Access denied" / "Consent required"
- User declined permissions
- Check required scopes in provider dashboard
- Some providers require app verification

### Session not persisting
- Check cookie settings in browser
- Verify `emailRedirectTo` is correct
- Check Supabase auth settings for site URL

---

## Security Considerations

1. **HTTPS Required** - OAuth providers require HTTPS in production
2. **State Parameter** - Supabase handles CSRF protection automatically
3. **Token Storage** - Supabase stores tokens securely in localStorage
4. **Scope Minimization** - Only request necessary permissions
5. **Provider Verification** - Some providers require app review before public use

---

## Quick Reference

### Add a Provider in 3 Steps:

1. **Enable in Supabase Dashboard** (Auth → Providers)
2. **Get OAuth credentials** from provider's developer portal
3. **Add button handler** to `AuthForm.tsx`:
   ```tsx
   const handleNewProvider = async () => {
     await supabase.auth.signInWithOAuth({ 
       provider: 'provider-name',
       options: { redirectTo: `${window.location.origin}/dashboard` }
     })
   }
   ```

---

## Next Steps

- [ ] Choose which providers to add based on your target audience
- [ ] Set up OAuth apps in provider dashboards
- [ ] Enable providers in Supabase
- [ ] Update AuthForm.tsx with new buttons
- [ ] Test sign-in flow
- [ ] Update analytics tracking
- [ ] Add provider icons to buttons

Need help with a specific provider? Check the [Supabase Auth Docs](https://supabase.com/docs/guides/auth/social-login) for detailed setup guides!
