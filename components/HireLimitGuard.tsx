'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface HireLimitGuardProps {
  employerOrgId: string
  employerUserId: string
  professionalId: string
  attemptType: 'message' | 'contact_request' | 'hire_button'
  children: React.ReactNode
  onLimitReached?: () => void
}

export default function HireLimitGuard({
  employerOrgId,
  employerUserId,
  professionalId,
  attemptType,
  children,
  onLimitReached
}: HireLimitGuardProps) {
  const [isChecking, setIsChecking] = useState(true)
  const [canHire, setCanHire] = useState(false)
  const [limitInfo, setLimitInfo] = useState<{
    allowed: boolean
    reason: string
    attempts_remaining: number
    requires_upgrade: boolean
  } | null>(null)

  const checkLimit = async () => {
    try {
      // First just check status without recording
      const checkResponse = await fetch(
        `/api/employer/check-hire-limit?employer_org_id=${employerOrgId}`
      )
      const checkData = await checkResponse.json()

      setCanHire(checkData.can_hire)
      setIsChecking(false)

      // If they can't hire, show the upgrade prompt immediately
      if (!checkData.can_hire) {
        setLimitInfo({
          allowed: false,
          reason: checkData.reason,
          attempts_remaining: 0,
          requires_upgrade: true
        })
        onLimitReached?.()
      }
    } catch (error) {
      console.error('Error checking hire limit:', error)
      setIsChecking(false)
      setCanHire(false) // Fail closed
    }
  }

  useEffect(() => {
    checkLimit()
  }, [employerOrgId])

  const handleAttempt = async () => {
    try {
      // Record the actual attempt when they click
      const response = await fetch('/api/employer/check-hire-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employer_org_id: employerOrgId,
          employer_user_id: employerUserId,
          professional_id: professionalId,
          attempt_type: attemptType
        })
      })

      const data = await response.json()
      setLimitInfo(data)

      if (!data.allowed) {
        onLimitReached?.()
      }

      return data.allowed
    } catch (error) {
      console.error('Error recording hire attempt:', error)
      return false
    }
  }

  // Show loading state
  if (isChecking) {
    return (
      <div className="inline-flex items-center gap-2 text-gray-400">
        <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
        <span>Checking availability...</span>
      </div>
    )
  }

  // Show upgrade prompt if limit reached
  if (limitInfo && !limitInfo.allowed) {
    return (
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="text-4xl">🔒</div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">
              Free Tier Limit Reached
            </h3>
            <p className="text-gray-300 mb-4">
              You've used all {3} free hire attempts. Upgrade to Pro for unlimited access to professionals.
            </p>
            
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">💎</span>
                <span className="text-green-400 font-semibold">Pro Tier Benefits:</span>
              </div>
              <ul className="text-gray-300 text-sm space-y-1 ml-8 list-disc">
                <li>Unlimited hire attempts and professional contacts</li>
                <li>Advanced search filters and saved searches</li>
                <li>Priority support and featured employer badge</li>
                <li>Early access to top professionals</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/employer/upgrade"
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-lg transition-all text-center"
              >
                Upgrade to Pro →
              </Link>
              <Link
                href="/employer/discover"
                className="px-6 py-3 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-white font-semibold rounded-lg transition-all text-center"
              >
                Back to Search
              </Link>
            </div>

            <p className="text-gray-500 text-xs mt-3">
              💡 Tip: Complete a hire and post a review to become a Founding Employer and get 1 month Pro FREE!
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show children with attempt tracking
  return (
    <div onClick={handleAttempt}>
      {children}
    </div>
  )
}
