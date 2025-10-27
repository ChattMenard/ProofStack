'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const monthlyPrice = 9.99
  const yearlyPrice = 89.99
  const yearlySavings = Math.round((monthlyPrice * 12) - yearlyPrice)

  const handleGetStarted = async (plan: 'free' | 'pro', useFoundingDiscount = false) => {
    if (plan === 'free') {
      router.push('/signup')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    setLoading(plan)
    const planParam = billingCycle === 'monthly' ? 'pro-monthly' : 'pro-yearly'
    const params = new URLSearchParams({ plan: planParam })
    if (useFoundingDiscount) {
      params.set('founding', 'true')
    }
    router.push(`/checkout?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-forest-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16">
        {/* Background Effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sage-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-earth-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-forest-50 mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-forest-300 max-w-3xl mx-auto mb-8">
            ProofStack is <strong>free for professionals</strong>. Upgrade anytime with profile boosts to stand out.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Plan - Always Free for Professionals */}
          <div className="relative bg-gradient-to-br from-sage-900/40 to-earth-900/40 border-2 border-sage-600 rounded-2xl p-8 hover:shadow-2xl hover:shadow-sage-500/20 transition-all duration-300">
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="px-4 py-1 bg-gradient-to-r from-sage-600 to-sage-500 text-forest-50 text-sm font-bold rounded-full shadow-lg">
                ⭐ FREE FOR PERSONAL USE
              </span>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-forest-50 mb-2">Professional</h2>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sage-400 to-earth-400">$0</span>
                <span className="text-forest-300 text-lg">/forever</span>
              </div>
              <p className="text-forest-300">All features, completely free</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-sage-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-100"><strong className="text-forest-50">Unlimited work samples</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-sage-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-100"><strong className="text-forest-50">AI-powered skill analysis</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-sage-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-100"><strong className="text-forest-50">Public portfolio</strong> with custom URL</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-sage-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-100"><strong className="text-forest-50">GitHub integration</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-sage-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-100"><strong className="text-forest-50">Cryptographic verification</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-sage-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-100"><strong className="text-forest-50">Portfolio analytics</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-sage-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-100">Direct employer contact</span>
              </li>
            </ul>

            <button
              onClick={() => handleGetStarted('free')}
              className="w-full px-6 py-4 bg-gradient-to-r from-sage-600 to-sage-500 hover:from-sage-500 hover:to-sage-400 text-forest-50 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg shadow-sage-500/30"
            >
              Get Started Free →
            </button>
            
            <p className="text-center text-xs text-forest-400 mt-4">
              ✨ Start instantly
            </p>
          </div>

          {/* Profile Boosts */}
          <div className="bg-forest-900/50 border-2 border-forest-800 rounded-2xl p-8 hover:border-forest-700 transition-all duration-300">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-forest-50 mb-2">Profile Boosts</h2>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold text-forest-50">$5</span>
                <span className="text-forest-400 text-lg">/boost</span>
              </div>
              <p className="text-forest-400">Stand out in search results</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-sage-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-200"><strong className="text-forest-50">Featured placement</strong> for 30 days</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-sage-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-200"><strong className="text-forest-50">Priority ranking</strong> in search</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-sage-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-200"><strong className="text-forest-50">Profile badge</strong> "⚡ Featured"</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-sage-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-200">Increased employer visibility</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-sage-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-200">Stackable (buy multiple)</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-sage-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-200">Use when you need it</span>
              </li>
            </ul>

            <button
              onClick={() => router.push('/professional/promote/manage')}
              className="w-full px-6 py-4 bg-forest-800 hover:bg-forest-700 text-forest-50 rounded-xl font-semibold transition-all transform hover:scale-105"
            >
              Buy Profile Boost →
            </button>
            
            <p className="text-center text-xs text-forest-400 mt-4">
              💳 One-time payment • ⚡ Activate instantly
            </p>
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-forest-800">
        <h2 className="text-3xl font-bold text-forest-50 text-center mb-4">
          Feature Comparison
        </h2>
        <p className="text-forest-400 text-center mb-12 max-w-2xl mx-auto">
          See exactly what you get with each plan
        </p>

        <div className="max-w-4xl mx-auto bg-forest-900/50 border border-forest-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-forest-800">
                  <th className="text-left p-6 text-forest-300 font-semibold">Feature</th>
                  <th className="p-6 text-center text-forest-300 font-semibold">Free</th>
                  <th className="p-6 text-center text-sage-400 font-semibold">Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest-800">
                <tr className="hover:bg-forest-800/30 transition-colors">
                  <td className="p-6 text-forest-200">Samples per month</td>
                  <td className="p-6 text-center text-forest-300">5</td>
                  <td className="p-6 text-center text-sage-400 font-semibold">Unlimited</td>
                </tr>
                <tr className="hover:bg-forest-800/30 transition-colors">
                  <td className="p-6 text-forest-200">AI Skill Extraction</td>
                  <td className="p-6 text-center">
                    <svg className="w-5 h-5 text-sage-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </td>
                  <td className="p-6 text-center">
                    <svg className="w-5 h-5 text-sage-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </td>
                </tr>
                <tr className="hover:bg-forest-800/30 transition-colors">
                  <td className="p-6 text-forest-200">Advanced Analysis</td>
                  <td className="p-6 text-center">
                    <svg className="w-5 h-5 text-forest-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </td>
                  <td className="p-6 text-center">
                    <svg className="w-5 h-5 text-sage-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </td>
                </tr>
                <tr className="hover:bg-forest-800/30 transition-colors">
                  <td className="p-6 text-forest-200">Portfolio</td>
                  <td className="p-6 text-center text-forest-400 text-sm">Public</td>
                  <td className="p-6 text-center text-sage-400 font-semibold text-sm">Public + Custom Domain</td>
                </tr>
                <tr className="hover:bg-forest-800/30 transition-colors">
                  <td className="p-6 text-forest-200">GitHub Integration</td>
                  <td className="p-6 text-center">
                    <svg className="w-5 h-5 text-sage-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </td>
                  <td className="p-6 text-center">
                    <svg className="w-5 h-5 text-sage-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </td>
                </tr>
                <tr className="hover:bg-forest-800/30 transition-colors">
                  <td className="p-6 text-forest-200">Cryptographic Verification</td>
                  <td className="p-6 text-center">
                    <svg className="w-5 h-5 text-sage-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </td>
                  <td className="p-6 text-center">
                    <svg className="w-5 h-5 text-sage-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </td>
                </tr>
                <tr className="hover:bg-forest-800/30 transition-colors">
                  <td className="p-6 text-forest-200">Analytics & Insights</td>
                  <td className="p-6 text-center text-forest-400 text-sm">Basic</td>
                  <td className="p-6 text-center text-sage-400 font-semibold text-sm">Detailed</td>
                </tr>
                <tr className="hover:bg-forest-800/30 transition-colors">
                  <td className="p-6 text-forest-200">Portfolio Themes</td>
                  <td className="p-6 text-center">
                    <svg className="w-5 h-5 text-forest-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </td>
                  <td className="p-6 text-center">
                    <svg className="w-5 h-5 text-sage-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </td>
                </tr>
                <tr className="hover:bg-forest-800/30 transition-colors">
                  <td className="p-6 text-forest-200">Support</td>
                  <td className="p-6 text-center text-forest-400 text-sm">Standard</td>
                  <td className="p-6 text-center text-sage-400 font-semibold text-sm">Priority (24h)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-forest-50 text-center mb-12">
          Frequently Asked Questions
        </h2>
        
        <div className="space-y-6">
          <details className="group bg-forest-900/50 border border-forest-800 rounded-xl p-6 hover:border-sage-700 transition-colors">
            <summary className="cursor-pointer list-none flex items-center justify-between font-semibold text-forest-50">
              <span>Can I switch plans anytime?</span>
              <svg className="w-5 h-5 text-forest-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="mt-4 text-forest-300">
              Yes! You can upgrade, downgrade, or cancel your plan at any time. Changes take effect immediately, and you'll be charged or refunded on a prorated basis.
            </p>
          </details>

          <details className="group bg-forest-900/50 border border-forest-800 rounded-xl p-6 hover:border-sage-700 transition-colors">
            <summary className="cursor-pointer list-none flex items-center justify-between font-semibold text-forest-50">
              <span>What payment methods do you accept?</span>
              <svg className="w-5 h-5 text-forest-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="mt-4 text-forest-300">
              We accept all major credit cards (Visa, Mastercard, Amex, Discover) through Stripe. Your payment information is secure and encrypted.
            </p>
          </details>

          <details className="group bg-forest-900/50 border border-forest-800 rounded-xl p-6 hover:border-sage-700 transition-colors">
            <summary className="cursor-pointer list-none flex items-center justify-between font-semibold text-forest-50">
              <span>What happens to my data if I cancel?</span>
              <svg className="w-5 h-5 text-forest-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="mt-4 text-forest-300">
              Your data is yours forever. If you cancel Pro, you'll automatically downgrade to Free tier. Your portfolio and verified skills remain intact, but you'll be limited to the Free plan features.
            </p>
          </details>

          <details className="group bg-forest-900/50 border border-forest-800 rounded-xl p-6 hover:border-sage-700 transition-colors">
            <summary className="cursor-pointer list-none flex items-center justify-between font-semibold text-forest-50">
              <span>Do you offer discounts for students or non-profits?</span>
              <svg className="w-5 h-5 text-forest-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="mt-4 text-forest-300">
              Yes! We offer 50% off for students and educators, and special pricing for non-profits. Contact us at <a href="mailto:hello@proofstack.com" className="text-sage-400 hover:underline">hello@proofstack.com</a> to apply.
            </p>
          </details>

          <details className="group bg-forest-900/50 border border-forest-800 rounded-xl p-6 hover:border-sage-700 transition-colors">
            <summary className="cursor-pointer list-none flex items-center justify-between font-semibold text-forest-50">
              <span>Are there team or enterprise plans?</span>
              <svg className="w-5 h-5 text-forest-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="mt-4 text-forest-300">
              Team and Enterprise plans are coming soon! Want early access or custom pricing? <Link href="/contact" className="text-sage-400 hover:underline">Contact our sales team</Link>.
            </p>
          </details>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sage-900/40 to-earth-900/40 border border-sage-700/50 p-12 text-center backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-sage-500/10 to-earth-500/10 blur-2xl"></div>
          <div className="relative">
            <h2 className="text-3xl font-bold text-forest-50 mb-4">
              Ready to Build Your Verified Portfolio?
            </h2>
            <p className="text-xl text-forest-300 mb-8 max-w-2xl mx-auto">
              Join developers, designers, and creators who trust ProofStack with their professional reputation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="px-8 py-4 bg-gradient-to-r from-sage-600 to-sage-500 hover:from-sage-500 hover:to-sage-400 text-forest-50 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg shadow-sage-500/30"
              >
                Start Free Today
              </Link>
              <Link
                href="/contact"
                className="px-8 py-4 bg-forest-800 hover:bg-forest-700 text-forest-200 rounded-xl font-semibold transition-all"
              >
                Talk to Sales
              </Link>
            </div>
            <p className="text-sm text-forest-400 mt-6">
              Setup in minutes • Cancel anytime
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
