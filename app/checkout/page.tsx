'use client'

import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const plan = searchParams?.get('plan') || 'pro-monthly'

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
