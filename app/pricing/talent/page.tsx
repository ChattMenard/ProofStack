
'use client'
import Link from 'next/link'

export default function TalentBoostsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-6 text-blue-700 dark:text-blue-300">Talent Boosts Are Free!</h1>
      <p className="mb-8 text-lg text-gray-700 dark:text-gray-300 max-w-xl text-center">
        All portfolio boosts and visibility features are now free for talent. You are the core commodity of ProofStack—no payment required to get noticed by employers. Enjoy full access and maximum exposure!
      </p>
      <Link href="/pricing" className="text-blue-600 hover:underline">← Back to Pricing</Link>
    </div>
  )
}
