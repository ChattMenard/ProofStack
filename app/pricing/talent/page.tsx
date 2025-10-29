'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

interface BoostTier {
  id: string
  name: string
  price: number
  duration: string
  features: string[]
  stripePriceId: string
  billingCycle: string
}

export default function TalentBoostsPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
  }

  const boostTiers: BoostTier[] = [
    {
      id: 'standard',
      name: 'Standard Boost',
      price: 19,
      duration: 'per month',
      billingCycle: 'monthly',
      stripePriceId: 'price_1_standard_monthly', // Replace with actual Stripe price ID
      features: [
        'Portfolio listed in marketplace',
        'Basic profile highlight',
        'Standard search ranking',
        'Monthly featured slot (limited)',
      ]
    },
    {
      id: 'premium',
      name: 'Premium Boost',
      price: 49,
      duration: 'per month',
      billingCycle: 'monthly',
      stripePriceId: 'price_1_premium_monthly', // Replace with actual Stripe price ID
      features: [
        'Everything in Standard +',
        'Priority profile highlight',
        'Enhanced search ranking',
        'Weekly featured slots',
        'Profile badge (Premium)',
        'Email feature notifications',
      ]
    },
    {
      id: 'featured',
      name: 'Featured Boost',
      price: 99,
      duration: 'per month',
      billingCycle: 'monthly',
      stripePriceId: 'price_1_featured_monthly', // Replace with actual Stripe price ID
      features: [
        'Everything in Premium +',
        'Top marketplace placement',
        'Guaranteed featured position',
        'Daily featured slots',
        'Profile badge (Featured - Gold)',
        'Priority support',
        'Advanced analytics dashboard',
        'Social media promotion',
      ]
    }
  ]

  const handleSelectBoost = async (tier: BoostTier) => {
    if (!currentUser) {
      router.push('/login')
      return
    }

    setLoading(true)
    try {
      // Redirect to checkout with boost tier
      const params = new URLSearchParams({
        boost: tier.id,
        price: tier.stripePriceId
      })
      router.push(`/checkout?${params.toString()}`)
    } catch (error) {
      console.error('Error selecting boost:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-forest-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sage-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-earth-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-forest-50 mb-6">
            Boost Your Portfolio
          </h1>
          <p className="text-xl text-forest-300 max-w-3xl mx-auto mb-8">
            Stand out in the marketplace. Choose a boost tier to increase visibility and get noticed by employers.
          </p>
          <Link
            href="/pricing"
            className="text-sage-400 hover:text-sage-300 underline"
          >
            ← Back to Pricing
          </Link>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid md:grid-cols-3 gap-8">
          {boostTiers.map((tier, idx) => (
            <div
              key={tier.id}
              className={`relative rounded-2xl p-8 transition-all duration-300 ${
                idx === 2
                  ? 'bg-gradient-to-br from-amber-900/40 to-orange-900/40 border-2 border-amber-600 lg:scale-105 shadow-2xl shadow-amber-500/20'
                  : 'bg-gradient-to-br from-sage-900/40 to-earth-900/40 border-2 border-forest-700 hover:border-sage-600'
              }`}
            >
              {idx === 2 && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 bg-gradient-to-r from-amber-600 to-orange-500 text-forest-50 text-sm font-bold rounded-full shadow-lg">
                    ⭐ MOST POPULAR
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-forest-50 mb-2">
                  {tier.name}
                </h2>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sage-400 to-earth-400">
                    ${tier.price}
                  </span>
                  <span className="text-forest-300">/{tier.duration}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-sage-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-forest-200">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectBoost(tier)}
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                  idx === 2
                    ? 'bg-gradient-to-r from-amber-600 to-orange-500 text-forest-50 hover:shadow-lg hover:shadow-amber-500/50 disabled:opacity-50'
                    : 'bg-sage-600 text-forest-50 hover:bg-sage-700 disabled:opacity-50'
                }`}
              >
                {loading ? 'Processing...' : idx === 2 ? 'Get Featured' : 'Select Boost'}
              </button>

              <p className="text-xs text-forest-400 text-center mt-4">
                Cancel anytime. Renews automatically.
              </p>
            </div>
          ))}
        </div>

        {/* Features Comparison Table */}
        <div className="mt-20 bg-forest-900/50 rounded-2xl p-8 border border-forest-800">
          <h3 className="text-2xl font-bold text-forest-50 mb-8">What's Included</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-forest-700">
                  <th className="text-left py-3 px-4 text-forest-300 font-semibold">Feature</th>
                  <th className="text-center py-3 px-4 text-forest-300 font-semibold">Standard</th>
                  <th className="text-center py-3 px-4 text-forest-300 font-semibold">Premium</th>
                  <th className="text-center py-3 px-4 text-forest-300 font-semibold">Featured</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-forest-800">
                  <td className="py-3 px-4 text-forest-200">Marketplace Listing</td>
                  <td className="text-center py-3 px-4">✓</td>
                  <td className="text-center py-3 px-4">✓</td>
                  <td className="text-center py-3 px-4">✓</td>
                </tr>
                <tr className="border-b border-forest-800">
                  <td className="py-3 px-4 text-forest-200">Featured Slots/Month</td>
                  <td className="text-center py-3 px-4 text-amber-400">1</td>
                  <td className="text-center py-3 px-4 text-amber-400">4</td>
                  <td className="text-center py-3 px-4 text-amber-400">30</td>
                </tr>
                <tr className="border-b border-forest-800">
                  <td className="py-3 px-4 text-forest-200">Search Ranking</td>
                  <td className="text-center py-3 px-4">Standard</td>
                  <td className="text-center py-3 px-4 text-sage-400">Enhanced</td>
                  <td className="text-center py-3 px-4 text-sage-400">Top Priority</td>
                </tr>
                <tr className="border-b border-forest-800">
                  <td className="py-3 px-4 text-forest-200">Profile Badge</td>
                  <td className="text-center py-3 px-4">—</td>
                  <td className="text-center py-3 px-4">Premium</td>
                  <td className="text-center py-3 px-4 text-amber-400">Featured (Gold)</td>
                </tr>
                <tr className="border-b border-forest-800">
                  <td className="py-3 px-4 text-forest-200">Analytics Dashboard</td>
                  <td className="text-center py-3 px-4">—</td>
                  <td className="text-center py-3 px-4">—</td>
                  <td className="text-center py-3 px-4">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
