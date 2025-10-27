'use client'

import { Suspense, useState } from 'react'
import AuthForm from '../../components/AuthForm'
import { useRouter } from 'next/navigation'

function SignupContent() {
  const [accountType, setAccountType] = useState<'professional' | 'employer' | null>(null)
  const router = useRouter()

  // If account type not selected, show selection screen
  if (!accountType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-forest-950 px-4">
        <div className="max-w-4xl w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-forest-50">
              Join ProofStack
            </h2>
            <p className="mt-2 text-center text-sm text-forest-300">
              Already have an account?{' '}
              <a href="/login" className="text-sage-400 hover:text-sage-300 font-medium">
                Sign in
              </a>
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Professional Account */}
            <button
              onClick={() => setAccountType('professional')}
              className="bg-forest-900 border-2 border-forest-700 hover:border-sage-500 rounded-lg p-8 text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-forest-50 group-hover:text-sage-400">
                  I'm a Professional
                </h3>
                <svg className="w-8 h-8 text-sage-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="text-forest-300 mb-4">
                Create a portfolio to showcase your work samples and get discovered by employers
              </p>
              <ul className="space-y-2 text-sm text-forest-400">
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-sage-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Build your portfolio
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-sage-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Apply to jobs
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-sage-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Get your ProofScore
                </li>
              </ul>
            </button>

            {/* Employer Account */}
            <button
              onClick={() => router.push('/employer/signup')}
              className="bg-forest-900 border-2 border-forest-700 hover:border-sage-500 rounded-lg p-8 text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-forest-50 group-hover:text-sage-400">
                  I'm an Employer
                </h3>
                <svg className="w-8 h-8 text-sage-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="text-forest-300 mb-4">
                Find and hire verified professionals based on their actual work
              </p>
              <ul className="space-y-2 text-sm text-forest-400">
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-sage-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Post job listings
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-sage-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Search verified talent
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-sage-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Review portfolios
                </li>
              </ul>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show signup form for selected account type
  return (
    <div className="min-h-screen flex items-center justify-center bg-forest-950">
      <div className="max-w-md w-full space-y-8">
        <div>
          <button
            onClick={() => setAccountType(null)}
            className="text-sage-400 hover:text-sage-300 text-sm flex items-center mb-4"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to account type
          </button>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-forest-50">
            Create your professional account
          </h2>
          <p className="mt-2 text-center text-sm text-forest-300">
            Already have an account?{' '}
            <a href="/login" className="text-sage-400 hover:text-sage-300 font-medium">
              Sign in
            </a>
          </p>
        </div>
        <AuthForm mode="signup" accountType="professional" />
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-forest-950">
        <div className="text-forest-50">Loading...</div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  )
}
