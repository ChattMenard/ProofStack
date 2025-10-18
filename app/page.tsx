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
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Turn Your Skills Into
            <span className="text-blue-600 block">Verified Proof</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
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
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Joining...' : 'Join Waitlist'}
              </button>
            </form>
          ) : (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">🎉 You&apos;re on the waitlist!</p>
              <p className="text-green-600 text-sm mt-1">We&apos;ll notify you when ProofStack launches.</p>
            </div>
          )}
          
          <p className="text-sm text-gray-500 mt-3">
            No spam. Unsubscribe anytime. 
            <Link href="/login" className="text-blue-600 hover:underline ml-1">
              Already have access? Sign in
            </Link>
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-8 text-center">
        <div className="space-y-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
            <span className="text-2xl">🔍</span>
          </div>
          <h3 className="text-lg font-semibold">AI-Powered Analysis</h3>
          <p className="text-gray-600">
            Upload code, projects, or media. Our AI extracts your skills and creates detailed evidence.
          </p>
        </div>
        
        <div className="space-y-3">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
            <span className="text-2xl">✅</span>
          </div>
          <h3 className="text-lg font-semibold">Cryptographic Verification</h3>
          <p className="text-gray-600">
            Every skill claim is backed by cryptographic proofs and immutable evidence.
          </p>
        </div>
        
        <div className="space-y-3">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
            <span className="text-2xl">🔗</span>
          </div>
          <h3 className="text-lg font-semibold">GitHub Integration</h3>
          <p className="text-gray-600">
            Verify repository ownership with challenge-response authentication.
          </p>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="bg-gray-50 rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold mb-6">Trusted by Developers</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-2xl font-bold text-blue-600">500+</div>
            <div className="text-sm text-gray-600">Skills Analyzed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">50+</div>
            <div className="text-sm text-gray-600">Verified Repos</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">95%</div>
            <div className="text-sm text-gray-600">Accuracy Rate</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">24h</div>
            <div className="text-sm text-gray-600">Avg. Processing</div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold text-center">How ProofStack Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">1</div>
            <h3 className="text-lg font-semibold">Upload & Connect</h3>
            <p className="text-gray-600">
              Upload your projects, code samples, or connect your GitHub repositories.
            </p>
          </div>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">2</div>
            <h3 className="text-lg font-semibold">AI Analysis</h3>
            <p className="text-gray-600">
              Our AI analyzes your work and extracts specific skills with supporting evidence.
            </p>
          </div>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">3</div>
            <h3 className="text-lg font-semibold">Get Verified</h3>
            <p className="text-gray-600">
              Receive cryptographically signed proofs that employers and recruiters can verify.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to Prove Your Skills?</h2>
        <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
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
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Joining...' : 'Join Waitlist'}
            </button>
          </form>
        )}
      </section>
    </div>
  )
}
