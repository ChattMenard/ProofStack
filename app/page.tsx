"use client"
import { useState } from 'react'
import Link from 'next/link'

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
    <div className="space-y-16 bg-forest-950 min-h-screen">
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-forest-50">
            Turn Your Skills Into
            <span className="text-sage-400 block">Verified Proof</span>
          </h1>
          <p className="text-xl md:text-2xl text-forest-200 max-w-3xl mx-auto">
            Upload your code, projects, or achievements and get AI-powered skill extraction with cryptographic verification. Build a portfolio that employers can trust.
          </p>
        </div>

        {/* Waitlist Form */}
        <div className="max-w-md mx-auto">
          {!isSubmitted ? (
            <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-4 py-3 bg-forest-900 border border-forest-700 text-forest-50 placeholder-forest-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-sage-600 text-forest-50 font-medium rounded-lg hover:bg-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:ring-offset-2 focus:ring-offset-forest-950 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Joining...' : 'Join Waitlist'}
              </button>
            </form>
          ) : (
            <div className="p-4 bg-sage-900/30 border border-sage-700 rounded-lg">
              <p className="text-sage-300 font-medium">🎉 You&apos;re on the waitlist!</p>
              <p className="text-sage-400 text-sm mt-1">We&apos;ll notify you when ProofStack launches.</p>
            </div>
          )}
          
          <p className="text-sm text-forest-400 mt-3">
            No spam. Unsubscribe anytime. 
            <Link href="/login" className="text-sage-400 hover:text-sage-300 hover:underline ml-1">
              Already have access? Sign in
            </Link>
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-8 text-center">
        <div className="space-y-3">
          <div className="w-12 h-12 bg-sage-900/50 rounded-lg flex items-center justify-center mx-auto border border-sage-800">
            <span className="text-2xl">🔍</span>
          </div>
          <h3 className="text-lg font-semibold text-forest-50">AI-Powered Analysis</h3>
          <p className="text-forest-300">
            Upload code, projects, or media. Our AI extracts your skills and creates detailed evidence.
          </p>
        </div>
        
        <div className="space-y-3">
          <div className="w-12 h-12 bg-sage-900/50 rounded-lg flex items-center justify-center mx-auto border border-sage-800">
            <span className="text-2xl">✅</span>
          </div>
          <h3 className="text-lg font-semibold text-forest-50">Cryptographic Verification</h3>
          <p className="text-forest-300">
            Every skill claim is backed by cryptographic proofs and immutable evidence.
          </p>
        </div>
        
        <div className="space-y-3">
          <div className="w-12 h-12 bg-sage-900/50 rounded-lg flex items-center justify-center mx-auto border border-sage-800">
            <span className="text-2xl">🔗</span>
          </div>
          <h3 className="text-lg font-semibold text-forest-50">GitHub Integration</h3>
          <p className="text-forest-300">
            Verify repository ownership with challenge-response authentication.
          </p>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="bg-forest-900 border border-forest-800 rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold mb-6 text-forest-50">Trusted by Developers</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-2xl font-bold text-sage-400">500+</div>
            <div className="text-sm text-forest-300">Skills Analyzed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-sage-400">50+</div>
            <div className="text-sm text-forest-300">Verified Repos</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-sage-400">95%</div>
            <div className="text-sm text-forest-300">Accuracy Rate</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-earth-400">24h</div>
            <div className="text-sm text-forest-300">Avg. Processing</div>
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
