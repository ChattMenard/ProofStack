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
            Limited Offer: First 10 Employers Only
          </span>
        </div>

        {/* Killer Headline */}
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-snug bg-gradient-to-r from-gray-900 via-green-700 to-emerald-600 dark:from-white dark:via-green-100 dark:to-emerald-400 bg-clip-text text-transparent px-4 pb-2">
          Hire Verified Talent, Instantly.
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-8 font-light px-4">
          Find the perfect professional with proven skills on <span className="text-green-600 dark:text-green-400 font-semibold">ProofStack</span>.
        </p>

        {/* The Hook - Contest Rules */}
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-green-500/20 rounded-2xl p-8 mb-10 shadow-2xl">
          <div className="flex items-start gap-4 mb-6">
            <div className="text-4xl">⚡</div>
            <div className="text-left">
              <h3 className="text-xl font-bold text-white mb-3">
                Founding Employer Program
              </h3>
              <p className="text-gray-300 text-base leading-relaxed">
                Be among the <span className="text-amber-400 font-bold">first 10 employers</span> to hire verified talent and get:
              </p>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-left">
              <div className="text-2xl mb-2">💎</div>
              <div className="text-green-400 font-semibold mb-1">1 Month Pro Tier FREE</div>
              <div className="text-gray-400 text-sm">Unlimited searches, priority support, advanced filters</div>
            </div>
            
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-left">
              <div className="text-2xl mb-2">🏅</div>
              <div className="text-amber-400 font-semibold mb-1">Lifetime Founding Badge</div>
              <div className="text-gray-400 text-sm">Exclusive recognition as platform pioneer #1-10</div>
            </div>
          </div>

          {/* The Requirement */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-white font-medium mb-2">
              <span className="text-blue-400">✓</span> How to qualify:
            </p>
            <ol className="text-gray-300 text-sm space-y-2 text-left ml-6 list-decimal">
              <li>Sign up and discover verified professionals</li>
              <li>Hire someone and receive their deliverables</li>
              <li>Post an honest review of the work completed</li>
              <li><span className="text-green-400 font-semibold">Boom! Pro tier unlocked automatically</span></li>
            </ol>
          </div>

          {/* Urgency Indicator */}
          <div className="mt-6 flex items-center justify-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-400">
                <span className="text-white font-bold">
                  {spotsRemaining !== null ? spotsRemaining : '...'} 
                </span> {spotsRemaining === 1 ? 'spot' : 'spots'} remaining
              </span>
            </div>
            <span className="text-gray-600">•</span>
            <span className="text-gray-400">No credit card required</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            href="/employer/signup"
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-lg text-lg shadow-lg shadow-green-500/50 transition-all hover:shadow-xl hover:shadow-green-500/60 hover:-translate-y-0.5"
          >
            Claim Your Founding Spot →
          </Link>
          
          <Link 
            href="/employer/discover"
            className="px-8 py-4 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-slate-600 text-white font-semibold rounded-lg text-lg transition-all"
          >
            Browse Talent First
          </Link>
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
