'use client'

import { Suspense } from 'react'
import AuthForm from '../../components/AuthForm'

function SignupContent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-forest-950">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-forest-50">
            Create your ProofStack account
          </h2>
          <p className="mt-2 text-center text-sm text-forest-300">
            Already have an account?{' '}
            <a href="/login" className="text-sage-400 hover:text-sage-300 font-medium">
              Sign in
            </a>
          </p>
        </div>
        <AuthForm mode="signup" />
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
