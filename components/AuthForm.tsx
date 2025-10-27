"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'
import posthog from 'posthog-js'

interface AuthFormProps {
  mode?: 'login' | 'signup'
  accountType?: 'professional' | 'employer'
}

export default function AuthForm({ mode = 'login', accountType = 'professional' }: AuthFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [usePassword, setUsePassword] = useState(mode === 'signup') // Default to password for signup
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [emailSent, setEmailSent] = useState(false) // Track if confirmation email was sent
  const isSignup = mode === 'signup'

  // Listen for auth state changes and redirect
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (event === 'SIGNED_IN' && session) {
        posthog.capture('auth_success', { method: event })
        
        // For signup mode with professionals, redirect to onboarding
        if (isSignup && accountType === 'professional') {
          router.push('/onboarding')
        } else {
          // Otherwise redirect to dashboard
          router.push('/dashboard')
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [router, isSignup, accountType])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    
    if (isSignup) {
      // Sign up flow
      if (password !== confirmPassword) {
        setMessage('Passwords do not match')
        return
      }
      if (password.length < 6) {
        setMessage('Password must be at least 6 characters')
        return
      }
      
      try {
        const { error } = await supabase.auth.signUp({ 
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              user_type: accountType
            }
          }
        })
        if (error) throw error
        posthog.capture('auth_signup_success', { email_domain: email.split('@')[1], account_type: accountType })
        setEmailSent(true)
        setMessage('')
      } catch (err: any) {
        posthog.capture('auth_error', { method: 'signup_password', error: err.message })
        setMessage(err.message || 'Error creating account')
      }
    } else {
      // Sign in flow
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
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    if (!email) {
      setMessage('Please enter your email address')
      return
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`
      })
      if (error) throw error
      posthog.capture('auth_password_reset_sent', { email_domain: email.split('@')[1] })
      setMessage('Password reset link sent! Check your email.')
      setShowForgotPassword(false)
    } catch (err: any) {
      posthog.capture('auth_error', { method: 'password_reset', error: err.message })
      setMessage(err.message || 'Error sending password reset link')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    try {
      const { error } = await supabase.auth.signInWithOtp({ 
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: isSignup ? {
            user_type: accountType
          } : undefined
        }
      })
      if (error) throw error
      posthog.capture('auth_magic_link_sent', { 
        email_domain: email.split('@')[1],
        ...(isSignup && { account_type: accountType })
      })
      if (isSignup) {
        setEmailSent(true)
        setMessage('')
      } else {
        setMessage('Check your email for the magic link.')
      }
    } catch (err: any) {
      posthog.capture('auth_error', { method: 'magic_link', error: err.message })
      setMessage(err.message || 'Error sending magic link')
    }
  }

  const handleGitHub = async () => {
    setMessage('')
    try {
      posthog.capture('auth_github_started', isSignup ? { account_type: accountType } : {})
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          ...(isSignup && {
            data: {
              user_type: accountType
            }
          })
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
      posthog.capture('auth_google_started', isSignup ? { account_type: accountType } : {})
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          ...(isSignup && {
            data: {
              user_type: accountType
            }
          })
        }
      })
      if (error) throw error
    } catch (err: any) {
      posthog.capture('auth_error', { method: 'google', error: err.message })
      setMessage(err.message || 'Error signing in with Google')
    }
  }

  const handleDiscord = async () => {
    setMessage('')
    try {
      posthog.capture('auth_discord_started', isSignup ? { account_type: accountType } : {})
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          ...(isSignup && {
            data: {
              user_type: accountType
            }
          })
        }
      })
      if (error) throw error
    } catch (err: any) {
      posthog.capture('auth_error', { method: 'discord', error: err.message })
      setMessage(err.message || 'Error signing in with Discord')
    }
  }

  return (
    <div className="space-y-4 max-w-sm bg-forest-900 p-8 rounded-lg border border-forest-800 shadow-xl">
      {/* Show email confirmation message if signup successful */}
      {emailSent ? (
        <div className="text-center space-y-4">
          <div className="bg-sage-900/30 border border-sage-700 rounded-lg p-6">
            <svg className="w-16 h-16 text-sage-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="text-xl font-bold text-forest-50 mb-2">
              Check your email
            </h3>
            <p className="text-forest-300 mb-4">
              We've sent a confirmation link to:
            </p>
            <p className="text-sage-400 font-medium mb-4">
              {email}
            </p>
            <p className="text-forest-400 text-sm">
              Click the link in your email to activate your account and complete the signup process.
            </p>
          </div>
          <button
            onClick={() => {
              setEmailSent(false)
              setEmail('')
              setPassword('')
              setConfirmPassword('')
            }}
            className="text-sage-400 hover:text-sage-300 text-sm"
          >
            ← Back to signup
          </button>
        </div>
      ) : (
        <div className="space-y-4">
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
        !isSignup && showForgotPassword ? (
          /* Forgot Password Form */
          <form onSubmit={handleForgotPassword} className="space-y-2">
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
              className="w-full bg-sage-600 hover:bg-sage-500 text-forest-50 px-4 py-2 rounded transition mt-2" 
              type="submit"
            >
              Send Reset Link
            </button>
            <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              className="w-full text-sm text-forest-400 hover:text-forest-200 underline mt-2"
            >
              Back to Sign In
            </button>
          </form>
        ) : (
          /* Password Login/Signup Form */
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
              minLength={6}
            />
            {isSignup && (
              <>
                <label className="block text-sm text-forest-200 mt-2">Confirm Password</label>
                <input
                  required
                  type="password"
                  className="w-full rounded border border-forest-700 bg-forest-800 text-forest-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sage-500"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                />
              </>
            )}
            <button 
              className="w-full bg-sage-600 hover:bg-sage-500 text-forest-50 px-4 py-2 rounded transition mt-2" 
              type="submit"
            >
              {isSignup ? 'Create Account' : 'Sign In'}
            </button>
            {!isSignup && (
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="w-full text-sm text-forest-400 hover:text-forest-200 underline mt-2"
              >
                Forgot Password?
              </button>
            )}
          </form>
        )
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
            {isSignup ? 'Sign Up with Magic Link' : 'Send Magic Link'}
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
          {isSignup ? 'Sign up with Google' : 'Sign in with Google'}
        </button>

        <button 
          type="button" 
          onClick={handleGitHub} 
          className="w-full bg-forest-800 hover:bg-forest-700 text-forest-50 px-4 py-2 rounded border border-forest-700 flex items-center justify-center gap-2 transition"
        >
          <img src="https://github.githubassets.com/favicons/favicon.svg" alt="GitHub" className="w-4 h-4 invert" />
          {isSignup ? 'Sign up with GitHub' : 'Sign in with GitHub'}
        </button>

        <button 
          type="button" 
          onClick={handleDiscord} 
          className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-2 rounded border border-[#4752C4] flex items-center justify-center gap-2 transition"
        >
          <svg className="w-4 h-4" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="currentColor"/>
          </svg>
          {isSignup ? 'Sign up with Discord' : 'Sign in with Discord'}
        </button>
      </div>

      {message && <p className="text-sm text-forest-200">{message}</p>}
        </div>
      )}
    </div>
  )
}
