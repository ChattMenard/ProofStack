'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AuthForm from '../../../components/AuthForm'

function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams?.get('error')

  return (
    <div className="min-h-screen flex items-center justify-center bg-forest-950">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-forest-50">
            Sign in to ProofStack
          </h2>
          <p className="mt-2 text-center text-sm text-forest-300">
            Don't have an account?{' '}
            <a href="/signup" className="text-sage-400 hover:text-sage-300 font-medium">
              Sign up
            </a>
          </p>
          {error && (
            <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-200 text-sm">
              {error}
            </div>
          )}
        </div>
        <AuthForm mode="login" />
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-forest-950">
        <div className="text-forest-50">Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}