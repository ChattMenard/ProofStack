"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'
import posthog from 'posthog-js'

export default function AuthForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [usePassword, setUsePassword] = useState(false)
  const [message, setMessage] = useState('')

  // Listen for auth state changes and redirect
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (event === 'SIGNED_IN' && session) {
        posthog.capture('auth_success', { method: event })
        // Redirect to dashboard after successful sign in
        router.push('/dashboard')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email,
        password
      })
      if (error) throw error
      posthog.capture('auth_password_success', { email_domain: email.split('@')[1] })
      // Redirect handled by auth state change listener
    } catch (err: any) {
      posthog.capture('auth_error', { method: 'password', error: err.message })
      setMessage(err.message || 'Error signing in with password')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    try {
      const { error } = await supabase.auth.signInWithOtp({ 
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      })
      if (error) throw error
      posthog.capture('auth_magic_link_sent', { email_domain: email.split('@')[1] })
      setMessage('Check your email for the magic link.')
    } catch (err: any) {
      posthog.capture('auth_error', { method: 'magic_link', error: err.message })
      setMessage(err.message || 'Error sending magic link')
    }
  }

  const handleGitHub = async () => {
    setMessage('')
    try {
      posthog.capture('auth_github_started')
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (err: any) {
      posthog.capture('auth_error', { method: 'github', error: err.message })
      setMessage(err.message || 'Error signing in with GitHub')
    }
  }

  const handleGoogle = async () => {
    setMessage('')
    try {
      posthog.capture('auth_google_started')
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
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

  const handleLinkedIn = async () => {
    setMessage('')
    try {
      posthog.capture('auth_linkedin_started')
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (err: any) {
      posthog.capture('auth_error', { method: 'linkedin', error: err.message })
      setMessage(err.message || 'Error signing in with LinkedIn')
    }
  }

  return (
    <div className="space-y-4 max-w-sm bg-forest-900 p-8 rounded-lg border border-forest-800 shadow-xl">
      {/* Toggle between Magic Link and Password */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setUsePassword(false)}
          className={`flex-1 px-4 py-2 rounded transition ${
            !usePassword
              ? 'bg-sage-600 text-white'
              : 'bg-forest-800 text-forest-300 hover:bg-forest-700'
          }`}
        >
          Magic Link
        </button>
        <button
          type="button"
          onClick={() => setUsePassword(true)}
          className={`flex-1 px-4 py-2 rounded transition ${
            usePassword
              ? 'bg-sage-600 text-white'
              : 'bg-forest-800 text-forest-300 hover:bg-forest-700'
          }`}
        >
          Password
        </button>
      </div>

      {/* Password Login Form */}
      {usePassword ? (
        <form onSubmit={handlePasswordSubmit} className="space-y-2">
          <label className="block text-sm text-forest-200">Email</label>
          <input
            required
            type="email"
            className="w-full rounded border border-forest-700 bg-forest-800 text-forest-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sage-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <label className="block text-sm text-forest-200 mt-2">Password</label>
          <input
            required
            type="password"
            className="w-full rounded border border-forest-700 bg-forest-800 text-forest-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sage-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          <button 
            className="w-full bg-sage-600 hover:bg-sage-500 text-forest-50 px-4 py-2 rounded transition mt-2" 
            type="submit"
          >
            Sign In
          </button>
        </form>
      ) : (
        /* Email Magic Link */
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
      )}

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
          className="w-full bg-forest-800 hover:bg-forest-700 text-forest-50 px-4 py-2 rounded border border-forest-700 flex items-center justify-center gap-2 transition"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
          Sign in with Google
        </button>

        <button 
          type="button" 
          onClick={handleLinkedIn}
          className="w-full bg-forest-800 hover:bg-forest-700 text-forest-50 px-4 py-2 rounded border border-forest-700 flex items-center justify-center gap-2 transition"
        >
          <img src="https://www.linkedin.com/favicon.ico" alt="LinkedIn" className="w-4 h-4" />
          Sign in with LinkedIn
        </button>

        <button 
          type="button" 
          onClick={handleGitHub} 
          className="w-full bg-forest-800 hover:bg-forest-700 text-forest-50 px-4 py-2 rounded border border-forest-700 flex items-center justify-center gap-2 transition"
        >
          <img src="https://github.githubassets.com/favicons/favicon.svg" alt="GitHub" className="w-4 h-4 invert" />
          Sign in with GitHub
        </button>
      </div>

      {message && <p className="text-sm text-forest-200">{message}</p>}
    </div>
  )
}
