"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'
import posthog from 'posthog-js'

export default function AuthForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
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
          redirectTo: `${window.location.origin}/dashboard`
        }
      })
      if (error) throw error
    } catch (err: any) {
      posthog.capture('auth_error', { method: 'github', error: err.message })
      setMessage(err.message || 'Error signing in with GitHub')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 max-w-sm">
      <label className="block text-sm">Email</label>
      <input
        required
        type="email"
        className="w-full rounded border px-3 py-2"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded mr-2" type="submit">Send Magic Link</button>
        <button type="button" onClick={handleGitHub} className="bg-gray-800 text-white px-3 py-2 rounded">Sign in with GitHub</button>
      </div>
      {message && <p className="text-sm text-gray-700">{message}</p>}
    </form>
  )
}
