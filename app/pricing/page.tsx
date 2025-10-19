'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const handleUpgrade = async (plan: string) => {
    setLoading(plan)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          userId: user.id,
        }),
      })

      const { url, error } = await response.json()

      if (error) {
        alert('Error: ' + error)
        return
      }

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      alert('Failed to start upgrade process')
    } finally {
      setLoading(null)
    }
  }

  const monthlyPrice = 9
  const yearlyPrice = 90 // $7.50/month billed yearly
  const yearlySavings = (monthlyPrice * 12) - yearlyPrice

  return (
    <div className="min-h-screen bg-forest-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-forest-50 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-forest-300 max-w-2xl mx-auto">
            Start free, upgrade when you need more
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm ${billingCycle === 'monthly' ? 'text-forest-50 font-semibold' : 'text-forest-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-forest-800 transition-colors focus:outline-none focus:ring-2 focus:ring-sage-500"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-sage-500 transition-transform ${
                  billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm ${billingCycle === 'yearly' ? 'text-forest-50 font-semibold' : 'text-forest-400'}`}>
              Yearly
              <span className="ml-2 px-2 py-0.5 bg-sage-900 text-sage-300 rounded text-xs">
                Save ${yearlySavings}
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="bg-forest-900 border border-forest-800 rounded-xl p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-forest-50 mb-2">Free</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-forest-50">$0</span>
                <span className="text-forest-400">/month</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-sage-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-200">5 samples per month</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-sage-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-200">Basic AI analysis</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-sage-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-200">Public portfolio</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-sage-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-200">Standard support</span>
              </li>
            </ul>

            <Link
              href="/signup"
              className="block w-full text-center px-6 py-3 bg-forest-800 hover:bg-forest-700 text-forest-50 rounded-lg font-medium transition-colors"
            >
              Get Started
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-gradient-to-br from-sage-900 to-forest-900 border-2 border-sage-600 rounded-xl p-8 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="px-4 py-1 bg-sage-600 text-forest-50 text-sm font-semibold rounded-full">
                Most Popular
              </span>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-forest-50 mb-2">Pro</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-forest-50">
                  ${billingCycle === 'monthly' ? monthlyPrice : Math.round(yearlyPrice / 12)}
                </span>
                <span className="text-forest-300">/month</span>
              </div>
              {billingCycle === 'yearly' && (
                <p className="text-sm text-sage-300 mt-1">
                  ${yearlyPrice} billed annually
                </p>
              )}
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-sage-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-100 font-medium">Unlimited samples</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-sage-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-100 font-medium">Advanced AI analysis</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-sage-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-100 font-medium">Custom domain</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-sage-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-100 font-medium">Priority support</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-sage-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-100 font-medium">Detailed analytics</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-sage-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-100 font-medium">Portfolio themes</span>
              </li>
            </ul>

            <button
              onClick={() => handleUpgrade(billingCycle === 'monthly' ? 'pro-monthly' : 'pro-yearly')}
              disabled={loading !== null}
              className="w-full px-6 py-3 bg-sage-600 hover:bg-sage-500 text-forest-50 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Upgrade to Pro'}
            </button>
          </div>
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-forest-400 mb-4">
            Questions? <a href="/contact" className="text-sage-400 hover:text-sage-300 underline">Contact us</a>
          </p>
          <p className="text-sm text-forest-500">
            All plans include a 14-day money-back guarantee. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  )
}
