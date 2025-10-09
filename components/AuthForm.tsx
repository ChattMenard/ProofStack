"use client"
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function AuthForm() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    try {
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) throw error
      setMessage('Check your email for the magic link.')
    } catch (err: any) {
      setMessage(err.message || 'Error sending magic link')
    }
  }

  const handleGitHub = async () => {
    setMessage('')
    try {
      // Redirects to GitHub OAuth via Supabase
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'github' })
      if (error) throw error
    } catch (err: any) {
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
