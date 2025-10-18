# 🚀 Quick Start: Add Google Sign-In (5 Minutes)

## Step 1: Get Google OAuth Credentials

1. Go to https://console.cloud.google.com/
2. Create new project or select existing
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Web application**
6. Add authorized redirect URI:
   ```
   https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback
   ```
7. Copy the **Client ID** and **Client Secret**

## Step 2: Enable in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Google** and toggle it on
4. Paste your **Client ID** and **Client Secret**
5. Click **Save**

## Step 3: Add to AuthForm.tsx

Add this handler function:

```tsx
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
```

Add this button to your form:

```tsx
<button 
  type="button" 
  onClick={handleGoogle}
  className="w-full bg-white hover:bg-gray-50 text-gray-800 px-4 py-2 rounded border border-gray-300 transition flex items-center justify-center gap-2"
>
  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
  Sign in with Google
</button>
```

## Step 4: Test It!

1. Run your dev server: `npm run dev`
2. Go to login page
3. Click "Sign in with Google"
4. Complete OAuth flow
5. Should redirect to `/dashboard`

---

## Quick Copy-Paste: Multiple Providers

### Google + Microsoft + LinkedIn

Replace your `AuthForm.tsx` return statement with:

```tsx
return (
  <div className="space-y-4 max-w-sm">
    {/* Email Magic Link */}
    <form onSubmit={handleSubmit} className="space-y-2">
      <label className="block text-sm text-forest-200">Email</label>
      <input
        required
        type="email"
        className="w-full rounded border border-forest-700 bg-forest-800 text-forest-50 px-3 py-2"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
      />
      <button 
        className="w-full bg-sage-600 hover:bg-sage-500 text-forest-50 px-4 py-2 rounded" 
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
      <button 
        type="button" 
        onClick={handleGoogle}
        className="w-full bg-white hover:bg-gray-50 text-gray-800 px-4 py-2 rounded border flex items-center justify-center gap-2"
      >
        <img src="https://www.google.com/favicon.ico" alt="" className="w-4 h-4" />
        Sign in with Google
      </button>

      <button 
        type="button" 
        onClick={handleGitHub}
        className="w-full bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded flex items-center justify-center gap-2"
      >
        <img src="https://github.githubassets.com/favicons/favicon.svg" alt="" className="w-4 h-4" />
        Sign in with GitHub
      </button>

      <button 
        type="button" 
        onClick={() => handleOAuth('azure')}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center justify-center gap-2"
      >
        <img src="https://www.microsoft.com/favicon.ico" alt="" className="w-4 h-4" />
        Sign in with Microsoft
      </button>
    </div>

    {message && <p className="text-sm text-forest-200">{message}</p>}
  </div>
)
```

---

## Provider-Specific Setup Links

| Provider | OAuth Setup URL | Redirect URI |
|----------|----------------|--------------|
| **Google** | https://console.cloud.google.com/ | `https://YOUR_PROJECT.supabase.co/auth/v1/callback` |
| **GitHub** | https://github.com/settings/developers | `https://YOUR_PROJECT.supabase.co/auth/v1/callback` |
| **Microsoft** | https://portal.azure.com/ | `https://YOUR_PROJECT.supabase.co/auth/v1/callback` |
| **LinkedIn** | https://www.linkedin.com/developers/ | `https://YOUR_PROJECT.supabase.co/auth/v1/callback` |
| **Twitter** | https://developer.twitter.com/en/portal/dashboard | `https://YOUR_PROJECT.supabase.co/auth/v1/callback` |

---

## Supabase Provider Names

```tsx
// Social
'google'
'github'  
'gitlab'
'facebook'
'twitter'
'discord'
'slack'
'spotify'
'linkedin'

// Enterprise
'azure'      // Microsoft
'apple'
'notion'
```

---

## Common Issues

**"Redirect URI mismatch"**
- Make sure redirect URI matches exactly: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
- No trailing slash!

**"Invalid client credentials"**
- Double-check Client ID and Secret in Supabase dashboard
- Make sure you're using production credentials (not dev)

**Session not working**
- Verify `redirectTo` points to your app: `${window.location.origin}/dashboard`
- Check site URL in Supabase settings

---

## Need More Help?

- 📖 Full guide: `AUTH_PROVIDERS_GUIDE.md`
- 📚 Supabase docs: https://supabase.com/docs/guides/auth/social-login
- 💬 Supabase Discord: https://discord.supabase.com
