'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface HireAttemptsRemainingProps {
  employerOrgId: string
}

export default function HireAttemptsRemaining({ employerOrgId }: HireAttemptsRemainingProps) {
  const [status, setStatus] = useState<{
    can_hire: boolean
    reason: string
    attempts_remaining?: number
    attempts_used?: number
    limit?: number
    is_unlimited?: boolean
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(
          `/api/employer/check-hire-limit?employer_org_id=${employerOrgId}`
        )
        const data = await response.json()
        setStatus(data)
      } catch (error) {
        console.error('Error fetching hire attempts status:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStatus()
  }, [employerOrgId])

  if (isLoading) {
    return (
      <div className="animate-pulse bg-slate-800/30 rounded-lg p-4">
        <div className="h-4 bg-slate-700 rounded w-3/4"></div>
      </div>
    )
  }

  if (!status) return null

  // Pro/Unlimited users
  if (status.is_unlimited) {
    return (
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">✨</div>
          <div>
            <div className="text-green-400 font-semibold">Unlimited Hiring</div>
            <div className="text-gray-400 text-sm">{status.reason}</div>
          </div>
        </div>
      </div>
    )
  }

  // Free tier users
  const attemptsRemaining = status.attempts_remaining || 0
  const attemptsUsed = status.attempts_used || 0
  const limit = status.limit || 3
  const percentage = (attemptsUsed / limit) * 100

  // Determine color based on remaining attempts
  let colorClass = 'from-green-500/10 to-emerald-500/10 border-green-500/30 text-green-400'
  let progressColor = 'bg-green-500'
  
  if (attemptsRemaining === 1) {
    colorClass = 'from-yellow-500/10 to-orange-500/10 border-yellow-500/30 text-yellow-400'
    progressColor = 'bg-yellow-500'
  } else if (attemptsRemaining === 0) {
    colorClass = 'from-red-500/10 to-pink-500/10 border-red-500/30 text-red-400'
    progressColor = 'bg-red-500'
  }

  return (
    <div className={`bg-gradient-to-r ${colorClass} border rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="text-2xl">
            {attemptsRemaining > 1 ? '🎯' : attemptsRemaining === 1 ? '⚠️' : '🔒'}
          </div>
          <div>
            <div className="font-semibold">
              {attemptsRemaining > 0 
                ? `${attemptsRemaining} Free Hire${attemptsRemaining === 1 ? '' : 's'} Remaining`
                : 'Free Tier Limit Reached'
              }
            </div>
            <div className="text-gray-400 text-sm">
              {attemptsUsed} of {limit} attempts used
            </div>
          </div>
        </div>

        {attemptsRemaining === 0 && (
          <Link
            href="/employer/upgrade"
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-lg text-sm transition-all"
          >
            Upgrade Now
          </Link>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
        <div 
          className={`${progressColor} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      {/* Helpful message */}
      {attemptsRemaining > 0 && attemptsRemaining <= 2 && (
        <p className="text-gray-400 text-xs mt-2">
          💡 Tip: Upgrade to Pro for unlimited hiring or become a Founding Employer to get 1 month Pro FREE
        </p>
      )}
    </div>
  )
}
