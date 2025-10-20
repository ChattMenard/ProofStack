'use client'

import { useEffect, useState } from 'react'

interface ProofScoreProps {
  professionalId: string
  size?: 'small' | 'medium' | 'large'
  showBreakdown?: boolean
}

interface ScoreData {
  proof_score: number
  breakdown: {
    response_score: number
    response_hours: number
    delivery_score: number
    delivery_rate: number
    communication_score: number
    communication_rating: number
    quality_score: number
    quality_rating: number
    professionalism_score: number
    professionalism_rating: number
    total_projects: number
  }
  percentile?: number
  tier?: string
}

export default function ProofScore({ 
  professionalId, 
  size = 'medium',
  showBreakdown = false 
}: ProofScoreProps) {
  const [scoreData, setScoreData] = useState<ScoreData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchScore = async () => {
      try {
        const response = await fetch(`/api/professional/proof-score?professional_id=${professionalId}`)
        const data = await response.json()
        setScoreData(data)
      } catch (error) {
        console.error('Error fetching ProofScore:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchScore()
  }, [professionalId])

  if (loading) {
    return (
      <div className="animate-pulse bg-slate-800/30 rounded-lg p-4">
        <div className="h-8 bg-slate-700 rounded w-24"></div>
      </div>
    )
  }

  if (!scoreData || scoreData.proof_score === 0) {
    return (
      <div className="bg-slate-800/30 rounded-lg p-4 text-center">
        <div className="text-gray-400 text-sm">No reviews yet</div>
      </div>
    )
  }

  const score = scoreData.proof_score
  const breakdown = scoreData.breakdown

  // Determine color and tier based on score
  let colorClass = 'from-green-500 to-emerald-500'
  let bgColor = 'bg-green-500/10'
  let borderColor = 'border-green-500/30'
  let textColor = 'text-green-400'
  let tier = 'Elite'

  if (score < 90 && score >= 80) {
    colorClass = 'from-blue-500 to-cyan-500'
    bgColor = 'bg-blue-500/10'
    borderColor = 'border-blue-500/30'
    textColor = 'text-blue-400'
    tier = 'Excellent'
  } else if (score < 80 && score >= 70) {
    colorClass = 'from-purple-500 to-pink-500'
    bgColor = 'bg-purple-500/10'
    borderColor = 'border-purple-500/30'
    textColor = 'text-purple-400'
    tier = 'Good'
  } else if (score < 70 && score >= 60) {
    colorClass = 'from-yellow-500 to-orange-500'
    bgColor = 'bg-yellow-500/10'
    borderColor = 'border-yellow-500/30'
    textColor = 'text-yellow-400'
    tier = 'Average'
  } else if (score < 60) {
    colorClass = 'from-red-500 to-pink-500'
    bgColor = 'bg-red-500/10'
    borderColor = 'border-red-500/30'
    textColor = 'text-red-400'
    tier = 'Fair'
  }

  // Size configurations
  const sizeConfig = {
    small: {
      container: 'p-3',
      scoreText: 'text-2xl',
      label: 'text-xs',
      badge: 'text-xs px-2 py-1'
    },
    medium: {
      container: 'p-4',
      scoreText: 'text-4xl',
      label: 'text-sm',
      badge: 'text-sm px-3 py-1'
    },
    large: {
      container: 'p-6',
      scoreText: 'text-6xl',
      label: 'text-base',
      badge: 'text-base px-4 py-2'
    }
  }

  const config = sizeConfig[size]

  return (
    <div>
      {/* Main Score Display */}
      <div className={`bg-gradient-to-br ${bgColor} border ${borderColor} rounded-xl ${config.container}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`font-bold ${textColor} ${config.label}`}>ProofScore™</span>
            <div className={`${bgColor} ${borderColor} border rounded-full ${config.badge} ${textColor} font-semibold`}>
              {tier}
            </div>
          </div>
          {scoreData.percentile !== undefined && (
            <div className="text-gray-400 text-xs">
              Top {(100 - scoreData.percentile).toFixed(0)}%
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <span className={`font-bold ${textColor} ${config.scoreText}`}>
            {score.toFixed(0)}
          </span>
          <span className="text-gray-500 text-lg">/100</span>
        </div>

        {size !== 'small' && (
          <div className="mt-3">
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div 
                className={`bg-gradient-to-r ${colorClass} h-2 rounded-full transition-all duration-500`}
                style={{ width: `${score}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Breakdown */}
      {showBreakdown && breakdown && (
        <div className="mt-4 space-y-3">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Score Breakdown</h4>

          {/* Response Time */}
          <div className="bg-slate-800/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <span className="text-sm text-gray-300">Response Time</span>
              </div>
              <span className="text-green-400 font-semibold">{breakdown.response_score.toFixed(0)}/20</span>
            </div>
            <div className="text-xs text-gray-500">
              Avg: {breakdown.response_hours.toFixed(1)} hours
            </div>
          </div>

          {/* On-Time Delivery */}
          <div className="bg-slate-800/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✅</span>
                <span className="text-sm text-gray-300">On-Time Delivery</span>
              </div>
              <span className="text-green-400 font-semibold">{breakdown.delivery_score.toFixed(0)}/20</span>
            </div>
            <div className="text-xs text-gray-500">
              Rate: {breakdown.delivery_rate.toFixed(0)}%
            </div>
          </div>

          {/* Communication */}
          <div className="bg-slate-800/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💬</span>
                <span className="text-sm text-gray-300">Communication</span>
              </div>
              <span className="text-blue-400 font-semibold">{breakdown.communication_score.toFixed(0)}/20</span>
            </div>
            <div className="text-xs text-gray-500">
              Rating: {breakdown.communication_rating.toFixed(1)}/5.0
            </div>
          </div>

          {/* Quality */}
          <div className="bg-slate-800/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                <span className="text-sm text-gray-300">Quality</span>
              </div>
              <span className="text-purple-400 font-semibold">{breakdown.quality_score.toFixed(0)}/20</span>
            </div>
            <div className="text-xs text-gray-500">
              Rating: {breakdown.quality_rating.toFixed(1)}/5.0
            </div>
          </div>

          {/* Professionalism */}
          <div className="bg-slate-800/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">👔</span>
                <span className="text-sm text-gray-300">Professionalism</span>
              </div>
              <span className="text-amber-400 font-semibold">{breakdown.professionalism_score.toFixed(0)}/20</span>
            </div>
            <div className="text-xs text-gray-500">
              Rating: {breakdown.professionalism_rating.toFixed(1)}/5.0
            </div>
          </div>

          <div className="text-xs text-gray-500 text-center pt-2">
            Based on {breakdown.total_projects} completed project{breakdown.total_projects === 1 ? '' : 's'}
          </div>
        </div>
      )}
    </div>
  )
}
