'use client'

import { useEffect, useState, Suspense } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const plan = searchParams?.get('plan') || 'pro-monthly'
  const foundingMember = searchParams?.get('founding') === 'true'

  useEffect(() => {
    let mounted = true

    async function initializeCheckout() {
      try {
        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/login')
          return
        }

        // Get Stripe instance
        const stripe = await stripePromise
        if (!stripe) {
          throw new Error('Stripe failed to load')
        }

        // Fetch client secret from your API
        const fetchClientSecret = async () => {
          const response = await fetch('/api/stripe/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              plan,
              userId: user.id,
              mode: 'embedded',
              usFoundingDiscount: foundingMember,
            }),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to create checkout session')
          }

          const { clientSecret } = await response.json()
          return clientSecret
        }

        // Initialize embedded checkout
        const checkout = await stripe.initEmbeddedCheckout({
          fetchClientSecret,
        })

        if (mounted) {
          // Mount Checkout
          checkout.mount('#checkout')
          setLoading(false)
        }

        // Cleanup function
        return () => {
          mounted = false
          checkout.destroy()
        }
      } catch (err: any) {
        console.error('Checkout initialization error:', err)
        if (mounted) {
          setError(err.message || 'Failed to initialize checkout')
          setLoading(false)
        }
      }
    }

    initializeCheckout()

    return () => {
      mounted = false
    }
  }, [plan, router])

  return (
    <div className="min-h-screen bg-forest-950 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          {foundingMember && (
            <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full text-sm font-semibold text-yellow-200 backdrop-blur-sm">
              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              🎉 Founding Member Discount Applied!
            </div>
          )}
          <h1 className="text-3xl font-bold text-forest-50 mb-2">
            Complete Your Purchase
          </h1>
          <p className="text-forest-300">
            Upgrade to {plan === 'pro-yearly' ? 'Pro Annual' : 'Pro Monthly'}
          </p>
        </div>

        {/* Loading State */}
        {loading && !error && (
          <div className="bg-forest-900 rounded-lg p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sage-500 mb-4"></div>
            <p className="text-forest-300">Loading checkout...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 mb-6">
            <h3 className="text-red-400 font-semibold mb-2">Error</h3>
            <p className="text-forest-300">{error}</p>
            <button
              onClick={() => router.push('/pricing')}
              className="mt-4 px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 transition-colors"
            >
              Back to Pricing
            </button>
          </div>
        )}

        {/* Checkout Container */}
        <div id="checkout" className="bg-forest-900 rounded-lg overflow-hidden">
          {/* Stripe Embedded Checkout will be mounted here */}
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/pricing')}
            className="text-forest-400 hover:text-forest-300 transition-colors text-sm"
          >
            ← Back to Pricing
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-forest-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sage-500 mx-auto mb-4"></div>
          <p className="text-forest-300">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
