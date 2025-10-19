"use client"
import { useState } from 'react'
import Link from 'next/link'
import EmployerHero from '@/components/EmployerHero'

export default function Home() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      
      if (response.ok) {
        setIsSubmitted(true)
        setEmail('')
      } else {
        // Handle API errors gracefully - could show user feedback in future
        console.warn('Failed to join waitlist:', response.status)
      }
    } catch (error) {
      // Handle network errors gracefully - could show user feedback in future
      console.warn('Error joining waitlist:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-20 min-h-screen">
      {/* Employer Hero - Stop Hiring Disappointments */}
      <EmployerHero />

      {/* Professional Hero Section */}
      <section className="text-center space-y-8 pt-12 pb-8 relative">
        {/* Animated Background Glow */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sage-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-earth-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-sage-900/30 border border-sage-700/50 rounded-full text-sm text-sage-300 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sage-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sage-500"></span>
            </span>
            For Professionals - Build Your Verified Portfolio
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-forest-50 leading-tight">
            Turn Your Skills Into
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sage-400 to-earth-400 block mt-2 animate-gradient">
              Verified Proof
            </span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-forest-200 max-w-3xl mx-auto leading-relaxed">
            Upload your code, projects, or achievements and get <span className="text-sage-400 font-semibold">AI-powered skill extraction</span> with cryptographic verification. Build a portfolio that employers can <span className="text-sage-400 font-semibold">trust</span>.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <span className="px-4 py-2 bg-forest-900/50 border border-forest-700 rounded-full text-sm text-forest-300 backdrop-blur-sm">
              🤖 AI-Powered
            </span>
            <span className="px-4 py-2 bg-forest-900/50 border border-forest-700 rounded-full text-sm text-forest-300 backdrop-blur-sm">
              🔐 Cryptographically Verified
            </span>
            <span className="px-4 py-2 bg-forest-900/50 border border-forest-700 rounded-full text-sm text-forest-300 backdrop-blur-sm">
              ⚡ Instant Analysis
            </span>
          </div>
        </div>

        {/* Waitlist Form - Enhanced */}
        <div className="max-w-xl mx-auto pt-4">{!isSubmitted ? (
            <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-3 shadow-2xl">
              <input
                type="email"
                placeholder="Enter your email for early access"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-6 py-4 bg-forest-900/80 border-2 border-forest-700 text-forest-50 placeholder-forest-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition-all backdrop-blur-sm"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-4 bg-gradient-to-r from-sage-600 to-sage-500 text-forest-50 font-semibold rounded-xl hover:from-sage-500 hover:to-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:ring-offset-2 focus:ring-offset-forest-950 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-sage-500/20"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Joining...
                  </span>
                ) : (
                  'Join Waitlist →'
                )}
              </button>
            </form>
          ) : (
            <div className="p-6 bg-gradient-to-r from-sage-900/40 to-earth-900/40 border-2 border-sage-600/50 rounded-xl backdrop-blur-sm shadow-lg">
              <div className="flex items-center justify-center gap-3 mb-2">
                <svg className="w-6 h-6 text-sage-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sage-300 font-semibold text-lg">You&apos;re on the waitlist!</p>
              </div>
              <p className="text-sage-400 text-sm">We&apos;ll notify you when ProofStack launches. Check your email for confirmation.</p>
            </div>
          )}
          
          <p className="text-sm text-forest-400 mt-4">
            No spam. Unsubscribe anytime. 
            <Link href="/login" className="text-sage-400 hover:text-sage-300 hover:underline ml-1 font-medium">
              Already have access? Sign in →
            </Link>
          </p>
        </div>
      </section>

      {/* Two-Sided Platform Section - NEW */}
      <section className="py-16 bg-gradient-to-br from-forest-900/30 to-sage-900/20 border border-forest-800/50 rounded-3xl backdrop-blur-sm">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-forest-50 mb-4">
            Built For <span className="text-sage-400">Everyone</span>
          </h2>
          <p className="text-xl text-forest-300 max-w-2xl mx-auto">
            Whether you're showcasing skills or finding talent, ProofStack connects the right people
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* For Professionals */}
          <div className="group p-8 bg-forest-900/50 border-2 border-sage-700/30 rounded-2xl hover:border-sage-500 transition-all duration-300 hover:shadow-xl hover:shadow-sage-500/20 hover:-translate-y-2">
            <div className="text-center mb-6">
              <div className="inline-block p-4 bg-gradient-to-br from-sage-600 to-sage-700 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-5xl">👤</span>
              </div>
              <h3 className="text-2xl font-bold text-forest-50 mb-2">For Professionals</h3>
              <p className="text-sage-400 font-medium">Showcase Your Skills</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-sage-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <div className="font-semibold text-forest-50">Build Your Portfolio</div>
                  <div className="text-sm text-forest-300">AI-powered skill extraction from your work</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-sage-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <div className="font-semibold text-forest-50">Get Discovered</div>
                  <div className="text-sm text-forest-300">Employers find you based on verified skills</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-sage-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <div className="font-semibold text-forest-50">Boost Your Profile</div>
                  <div className="text-sm text-forest-300">Promote your portfolio to stand out</div>
                </div>
              </li>
            </ul>

            <Link 
              href="/login" 
              className="block w-full text-center px-6 py-3 bg-gradient-to-r from-sage-600 to-sage-500 text-white font-semibold rounded-xl hover:from-sage-500 hover:to-sage-400 transition-all transform hover:scale-105 shadow-lg"
            >
              Create Your Portfolio →
            </Link>
          </div>

          {/* For Employers */}
          <div className="group p-8 bg-forest-900/50 border-2 border-earth-700/30 rounded-2xl hover:border-earth-500 transition-all duration-300 hover:shadow-xl hover:shadow-earth-500/20 hover:-translate-y-2">
            <div className="text-center mb-6">
              <div className="inline-block p-4 bg-gradient-to-br from-earth-600 to-earth-700 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-5xl">🏢</span>
              </div>
              <h3 className="text-2xl font-bold text-forest-50 mb-2">For Employers</h3>
              <p className="text-earth-400 font-medium">Find Verified Talent</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-earth-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <div className="font-semibold text-forest-50">Discover Professionals</div>
                  <div className="text-sm text-forest-300">Advanced filters by skills, location, experience</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-earth-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <div className="font-semibold text-forest-50">Message Directly</div>
                  <div className="text-sm text-forest-300">Real-time messaging with candidates</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-earth-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <div className="font-semibold text-forest-50">Verify Skills</div>
                  <div className="text-sm text-forest-300">See cryptographically verified portfolios</div>
                </div>
              </li>
            </ul>

            <Link 
              href="/employer/signup" 
              className="block w-full text-center px-6 py-3 bg-gradient-to-r from-earth-600 to-earth-500 text-white font-semibold rounded-xl hover:from-earth-500 hover:to-earth-400 transition-all transform hover:scale-105 shadow-lg"
            >
              Start Hiring →
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced */}
      <section className="grid md:grid-cols-3 gap-8">
        <div className="group p-8 bg-forest-900/50 border border-forest-800 rounded-2xl hover:border-sage-700 transition-all duration-300 hover:shadow-lg hover:shadow-sage-500/10 hover:-translate-y-1">
          <div className="w-16 h-16 bg-gradient-to-br from-sage-600 to-sage-700 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-sage-500/20">
            <span className="text-3xl">🔍</span>
          </div>
          <h3 className="text-xl font-bold text-forest-50 mb-3 text-center">AI-Powered Analysis</h3>
          <p className="text-forest-300 text-center leading-relaxed">
            Upload code, projects, or media. Our advanced AI extracts your skills and creates detailed, verifiable evidence.
          </p>
          <div className="mt-4 pt-4 border-t border-forest-800">
            <ul className="space-y-2 text-sm text-forest-400">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-sage-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Multi-language support
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-sage-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Context-aware extraction
              </li>
            </ul>
          </div>
        </div>
        
        <div className="group p-8 bg-forest-900/50 border border-forest-800 rounded-2xl hover:border-sage-700 transition-all duration-300 hover:shadow-lg hover:shadow-sage-500/10 hover:-translate-y-1">
          <div className="w-16 h-16 bg-gradient-to-br from-earth-600 to-earth-700 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-earth-500/20">
            <span className="text-3xl">✅</span>
          </div>
          <h3 className="text-xl font-bold text-forest-50 mb-3 text-center">Cryptographic Verification</h3>
          <p className="text-forest-300 text-center leading-relaxed">
            Every skill claim is backed by cryptographic proofs and immutable evidence chains.
          </p>
          <div className="mt-4 pt-4 border-t border-forest-800">
            <ul className="space-y-2 text-sm text-forest-400">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-sage-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Tamper-proof records
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-sage-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Timestamp verification
              </li>
            </ul>
          </div>
        </div>
        
        <div className="group p-8 bg-forest-900/50 border border-forest-800 rounded-2xl hover:border-sage-700 transition-all duration-300 hover:shadow-lg hover:shadow-sage-500/10 hover:-translate-y-1">
          <div className="w-16 h-16 bg-gradient-to-br from-sage-500 to-earth-600 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-sage-500/20">
            <span className="text-3xl">🔗</span>
          </div>
          <h3 className="text-xl font-bold text-forest-50 mb-3 text-center">GitHub Integration</h3>
          <p className="text-forest-300 text-center leading-relaxed">
            Verify repository ownership with challenge-response authentication and automatic updates.
          </p>
          <div className="mt-4 pt-4 border-t border-forest-800">
            <ul className="space-y-2 text-sm text-forest-400">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-sage-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                One-click sync
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-sage-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Automatic updates
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Social Proof / Stats - Enhanced */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-sage-900/20 to-earth-900/20 rounded-2xl blur-2xl"></div>
        <div className="relative bg-forest-900/80 border border-forest-700 rounded-2xl p-12 backdrop-blur-sm">
          <h2 className="text-3xl font-bold mb-8 text-forest-50 text-center">Trusted by Developers Worldwide</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sage-400 to-sage-500 mb-2 group-hover:scale-110 transition-transform">
                500+
              </div>
              <div className="text-sm text-forest-300 font-medium">Skills Analyzed</div>
              <div className="text-xs text-forest-500 mt-1">and counting</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-earth-400 to-earth-500 mb-2 group-hover:scale-110 transition-transform">
                50+
              </div>
              <div className="text-sm text-forest-300 font-medium">Verified Repos</div>
              <div className="text-xs text-forest-500 mt-1">GitHub integrated</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sage-400 to-earth-400 mb-2 group-hover:scale-110 transition-transform">
                95%
              </div>
              <div className="text-sm text-forest-300 font-medium">Accuracy Rate</div>
              <div className="text-xs text-forest-500 mt-1">AI precision</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-earth-400 to-sage-400 mb-2 group-hover:scale-110 transition-transform">
                &lt;24h
              </div>
              <div className="text-sm text-forest-300 font-medium">Avg. Processing</div>
              <div className="text-xs text-forest-500 mt-1">lightning fast</div>
            </div>
          </div>
          
          {/* CTA Buttons */}
          <div className="mt-8 text-center space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/pricing" 
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-sage-600 to-sage-500 text-forest-50 font-bold rounded-xl hover:from-sage-500 hover:to-sage-400 transition-all transform hover:scale-105 shadow-lg shadow-sage-500/20"
              >
                View Pricing
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link 
                href="/login" 
                className="inline-flex items-center gap-2 px-8 py-4 bg-forest-800 hover:bg-forest-700 text-forest-200 font-semibold rounded-xl border border-forest-700 transition-all transform hover:scale-105"
              >
                Sign In
              </Link>
            </div>
            <p className="text-sm text-forest-400">
              Start free • No credit card required • Upgrade anytime
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold text-center text-forest-50">How ProofStack Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-sage-700 text-forest-50 rounded-full flex items-center justify-center mx-auto text-xl font-bold border-2 border-sage-600">1</div>
            <h3 className="text-lg font-semibold text-forest-50">Upload & Connect</h3>
            <p className="text-forest-300">
              Upload your projects, code samples, or connect your GitHub repositories.
            </p>
          </div>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-sage-700 text-forest-50 rounded-full flex items-center justify-center mx-auto text-xl font-bold border-2 border-sage-600">2</div>
            <h3 className="text-lg font-semibold text-forest-50">AI Analysis</h3>
            <p className="text-forest-300">
              Our AI analyzes your work and extracts specific skills with supporting evidence.
            </p>
          </div>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-sage-700 text-forest-50 rounded-full flex items-center justify-center mx-auto text-xl font-bold border-2 border-sage-600">3</div>
            <h3 className="text-lg font-semibold text-forest-50">Get Verified</h3>
            <p className="text-forest-300">
              Receive cryptographically signed proofs that employers and recruiters can verify.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-sage-600 to-earth-600 rounded-xl p-8 text-center border border-sage-500 shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-white">Ready to Prove Your Skills?</h2>
        <p className="text-sage-50 mb-6 max-w-2xl mx-auto">
          Join thousands of developers who are already building verified skill portfolios with ProofStack.
        </p>
        {!isSubmitted && (
          <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 px-4 py-3 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-white text-sage-700 font-semibold rounded-lg hover:bg-sage-50 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              {isLoading ? 'Joining...' : 'Join Waitlist'}
            </button>
          </form>
        )}
      </section>
    </div>
  )
}
