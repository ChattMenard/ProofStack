'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

interface UnlockProfileButtonProps {
  professionalId: string
  onUnlock?: () => void
  variant?: 'button' | 'card'
  className?: string
}

export default function UnlockProfileButton({ 
  professionalId, 
  onUnlock,
  variant = 'button',
  className = ''
}: UnlockProfileButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleUnlock = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Please sign in to unlock profiles')
        setLoading(false)
        return
      }

      const response = await fetch('/api/employer/unlock-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ professionalId })
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.insufficientCredits) {
          setError(`Insufficient credits. You need ${data.required} credit(s), but only have ${data.available}.`)
        } else {
          setError(data.error || 'Failed to unlock profile')
        }
        setLoading(false)
        return
      }

      setSuccess(true)
      if (onUnlock) onUnlock()

      // Reload page after short delay to show unlocked profile
      setTimeout(() => {
        window.location.reload()
      }, 1000)

    } catch (err) {
      console.error('Unlock error:', err)
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (variant === 'card') {
    return (
      <div className={`bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 border-2 border-dashed border-purple-300 dark:border-purple-700 ${className}`}>
        <div className="flex items-start gap-4">
          <div className="text-4xl">👻</div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Anonymous Profile
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This professional is in Ghost Mode. Unlock their full profile to see their name, 
              contact information, and portfolio.
            </p>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                {error}
                {error.includes('Insufficient') && (
                  <a href="/employer/dashboard" className="block mt-2 font-semibold hover:underline">
                    Buy more credits →
                  </a>
                )}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400">
                ✅ Profile unlocked! Reloading...
              </div>
            )}

            <button
              onClick={handleUnlock}
              disabled={loading || success}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Unlocking...' : success ? 'Unlocked!' : '🔓 Unlock Profile (1 Credit)'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {error && (
        <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
          {error}
          {error.includes('Insufficient') && (
            <a href="/employer/dashboard" className="block mt-2 font-semibold hover:underline">
              Buy more credits →
            </a>
          )}
        </div>
      )}

      {success && (
        <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400">
          ✅ Profile unlocked!
        </div>
      )}

      <button
        onClick={handleUnlock}
        disabled={loading || success}
        className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Unlocking...' : success ? 'Unlocked!' : '🔓 Unlock Profile (1 Credit)'}
      </button>
    </div>
  )
}
