'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function EmployerHero() {
  const [spotsRemaining, setSpotsRemaining] = useState<number | null>(null)

  useEffect(() => {
    // Fetch actual spots remaining from the database
    const fetchSpotsRemaining = async () => {
      try {
        const response = await fetch('/api/founding-employers/spots-remaining')
        const data = await response.json()
        if (data.spots_remaining !== undefined) {
          setSpotsRemaining(data.spots_remaining)
        }
      } catch (error) {
        console.error('Failed to fetch spots remaining:', error)
        setSpotsRemaining(10) // Fallback
      }
    }

    fetchSpotsRemaining()
  }, [])

  return (
    <section className="relative py-20 px-4 overflow-hidden">
      {/* Main Hero Content */}
      <div className="max-w-6xl mx-auto text-center relative z-10">
        {/* Attention-Grabbing Badge */}
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-full mb-8 animate-pulse">
          <span className="text-2xl">🏆</span>
          <span className="text-amber-600 dark:text-amber-400 font-bold text-sm uppercase tracking-wider">
            Limited Offer: {spotsRemaining} Founding Employer Spots Left
          </span>
        </div>

        {/* Killer Headline - Updated to positive messaging */}
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-snug bg-gradient-to-r from-gray-900 via-green-700 to-emerald-600 dark:from-white dark:via-green-100 dark:to-emerald-400 bg-clip-text text-transparent px-4 pb-2">
          Hire Verified Talent, Instantly.
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-8 font-light px-4">
          Find the perfect professional with proven skills on <span className="text-green-600 dark:text-green-400 font-semibold">ProofStack</span>.
        </p>

        {/* Pricing Tiers */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6 mb-10">
          {/* Starter Tier */}
          <div className="bg-gradient-to-br from-green-800/50 to-emerald-900/50 backdrop-blur-sm border-2 border-green-500/40 rounded-2xl p-6 text-left relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
              START HERE
            </div>
            <div className="text-2xl mb-3">⚡</div>
            <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
            <div className="text-3xl font-bold text-white mb-4">$49<span className="text-sm text-gray-400 font-normal">/month</span></div>
            <ul className="space-y-2 text-sm text-gray-300 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span><strong>Unlimited</strong> talent searches</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Advanced filters & AI matching</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>View verified portfolios</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Direct contact with talent</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Email support</span>
              </li>
            </ul>
          </div>

          {/* Enterprise Tier */}
          <div className="bg-gradient-to-br from-amber-800/50 to-orange-900/50 backdrop-blur-sm border border-amber-500/20 rounded-2xl p-6 text-left">
            <div className="text-2xl mb-3">🏢</div>
            <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
            <div className="text-3xl font-bold text-white mb-4">$199<span className="text-sm text-gray-400 font-normal">/month</span></div>
            <ul className="space-y-2 text-sm text-gray-300 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">✓</span>
                <span>Everything in Starter</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">✓</span>
                <span>Team collaboration tools</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">✓</span>
                <span>Analytics dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">✓</span>
                <span>Priority support</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">✓</span>
                <span>Dedicated account manager</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">✓</span>
                <span>Custom integrations</span>
              </li>
            </ul>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            href="/employer/signup"
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-lg text-lg shadow-lg shadow-green-500/50 transition-all hover:shadow-xl hover:shadow-green-500/60 hover:-translate-y-0.5"
          >
            Start 7-Day Free Trial →
          </Link>
          
          <Link 
            href="/employer/discover"
            className="px-8 py-4 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-slate-600 text-white font-semibold rounded-lg text-lg transition-all"
          >
            See Sample Profiles
          </Link>
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 text-center text-sm text-gray-400">
          💳 No credit card required for trial • Cancel anytime
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>AI-Verified Skills</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Blockchain-Backed Proof</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>Real Employer Reviews</span>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-green-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"></div>
    </section>
  )
}
