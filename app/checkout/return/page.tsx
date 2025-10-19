'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function CheckoutReturnPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  const sessionId = searchParams?.get('session_id')

  useEffect(() => {
    if (!sessionId) {
      setStatus('error')
      setMessage('No session ID found')
      return
    }

    async function checkSessionStatus() {
      try {
        const response = await fetch(`/api/stripe/session-status?session_id=${sessionId}`)
        const data = await response.json()

        if (response.ok) {
          if (data.status === 'complete') {
            setStatus('success')
            setMessage('Payment successful! Your subscription is now active.')
            // Redirect to dashboard after 3 seconds
            setTimeout(() => {
              router.push('/dashboard?upgrade=success')
            }, 3000)
          } else if (data.status === 'open') {
            setStatus('error')
            setMessage('Payment incomplete. Please try again.')
          } else {
            setStatus('error')
            setMessage('Payment failed. Please try again.')
          }
        } else {
          setStatus('error')
          setMessage(data.error || 'Failed to verify payment status')
        }
      } catch (error) {
        console.error('Session status check error:', error)
        setStatus('error')
        setMessage('Failed to verify payment status')
      }
    }

    checkSessionStatus()
  }, [sessionId, router])

  return (
    <div className="min-h-screen bg-forest-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-forest-900 rounded-lg p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sage-500 mb-4"></div>
              <h2 className="text-2xl font-bold text-forest-50 mb-2">
                Processing Payment...
              </h2>
              <p className="text-forest-300">
                Please wait while we verify your payment.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-forest-50 mb-2">
                Payment Successful!
              </h2>
              <p className="text-forest-300 mb-6">{message}</p>
              <p className="text-sm text-forest-400">
                Redirecting to your dashboard...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-4">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-forest-50 mb-2">
                Payment Failed
              </h2>
              <p className="text-forest-300 mb-6">{message}</p>
              <div className="flex flex-col gap-3">
                <Link
                  href="/pricing"
                  className="w-full px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 transition-colors"
                >
                  Try Again
                </Link>
                <Link
                  href="/dashboard"
                  className="w-full px-4 py-2 bg-forest-800 text-forest-300 rounded-lg hover:bg-forest-700 transition-colors"
                >
                  Back to Dashboard
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Session ID for debugging (only in development) */}
        {process.env.NODE_ENV === 'development' && sessionId && (
          <div className="mt-4 p-4 bg-forest-800 rounded text-xs text-forest-400 break-all">
            <strong>Session ID:</strong> {sessionId}
          </div>
        )}
      </div>
    </div>
  )
}
