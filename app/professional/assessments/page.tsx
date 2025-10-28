'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import SkillLevelBadge, { SkillLevelProgress } from '@/components/SkillLevelBadge'

interface Assessment {
  id: string
  type: string
  targetLevel: string
  title: string
  description: string
  durationMinutes: number
  passingScore: number
  locked: boolean
  completedAt?: string
}

interface AssessmentData {
  currentLevel: string
  assessments: {
    junior: Assessment[]
    mid: Assessment[]
    senior: Assessment[]
    lead: Assessment[]
  }
  stats: {
    total: number
    completed: number
    available: number
  }
}

export default function AssessmentsPage() {
  const router = useRouter()
  const [data, setData] = useState<AssessmentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAssessments()
  }, [])

  async function fetchAssessments() {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        setError('Authentication error. Please try logging in again.')
        setLoading(false)
        return
      }

      if (!session) {
        setError('Please log in to view assessments')
        setLoading(false)
        return
      }

      if (!session.access_token) {
        console.error('No access token in session')
        setError('Invalid session. Please try logging in again.')
        setLoading(false)
        return
      }

      const res = await fetch('/api/assessments/available', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('API error:', errorText)
        throw new Error(`Failed to fetch assessments: ${res.status}`)
      }
      
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      console.error('Fetch error:', err)
      setError(err.message || 'Failed to load assessments')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600 mx-auto" />
          <p className="text-gray-600">Loading assessments...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg bg-red-50 p-6 text-center">
          <p className="text-red-800">Error: {error || 'Failed to load assessments'}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: '#ADADAD' }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 drop-shadow-sm">Skill Assessments</h1>
          <p className="mt-2 text-base text-gray-800">
            Complete assessments to verify your skill level and unlock new opportunities
          </p>
        </div>

        {/* Current Level & Progress */}
        <div className="mb-8 rounded-xl border-2 border-gray-500 p-8 shadow-xl" style={{ backgroundColor: '#DEDEDE' }}>
          <SkillLevelProgress level={data.currentLevel as any} />
          <div className="mt-6 grid grid-cols-3 gap-6 text-center">
            <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}>
              <p className="text-3xl font-bold text-gray-900">{data.stats.completed}</p>
              <p className="text-sm font-medium text-gray-700">Completed</p>
            </div>
            <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>
              <p className="text-3xl font-bold text-indigo-600">{data.stats.available}</p>
              <p className="text-sm font-medium text-gray-700">Available</p>
            </div>
            <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}>
              <p className="text-3xl font-bold text-gray-900">{data.stats.total}</p>
              <p className="text-sm font-medium text-gray-700">Total</p>
            </div>
          </div>
        </div>

        {/* Assessments by Level */}
        <div className="space-y-8">
          {(['junior', 'mid', 'senior', 'lead'] as const).map(level => {
            const assessments = data.assessments[level]
            if (assessments.length === 0) return null

            return (
              <div key={level} className="rounded-xl border-2 border-gray-500 p-8 shadow-xl" style={{ backgroundColor: '#DEDEDE' }}>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 capitalize">{level} Level</h2>
                  <SkillLevelBadge level={level} size="sm" />
                </div>
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {assessments.map(assessment => (
                    <AssessmentCard
                      key={assessment.id}
                      assessment={assessment}
                      onStart={() => router.push(`/professional/assessments/${assessment.id}`)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function AssessmentCard({
  assessment,
  onStart
}: {
  assessment: Assessment
  onStart: () => void
}) {
  const typeIcons: Record<string, string> = {
    coding_challenge: '💻',
    technical_quiz: '📝',
    portfolio_review: '🎨',
    project_complexity: '🏗️'
  }

  const isCompleted = !!assessment.completedAt
  const isLocked = assessment.locked

  return (
    <div
      className={`rounded-xl border-2 p-5 transition-all ${
        isCompleted
          ? 'border-green-400 shadow-lg'
          : isLocked
          ? 'border-gray-500 opacity-70'
          : 'border-gray-500 hover:border-indigo-500 hover:shadow-xl hover:scale-[1.02]'
      }`}
      style={{
        backgroundColor: isCompleted ? '#d4edda' : isLocked ? '#CECECE' : '#DEDEDE'
      }}
    >
      <div className="mb-3 flex items-start justify-between">
        <span className="text-3xl drop-shadow-sm">{typeIcons[assessment.type] || '📋'}</span>
        {isCompleted && (
          <span className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
            ✓ Completed
          </span>
        )}
        {isLocked && (
          <span className="rounded-full bg-gray-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
            🔒 Locked
          </span>
        )}
      </div>
      <h3 className="mb-2 text-lg font-bold text-gray-900">{assessment.title}</h3>
      <p className="mb-4 text-sm leading-relaxed text-gray-700">{assessment.description}</p>
      <div className="mb-4 flex items-center gap-4 text-xs font-medium text-gray-700">
        {assessment.durationMinutes > 0 && (
          <span className="flex items-center gap-1">⏱️ {assessment.durationMinutes} min</span>
        )}
        <span className="flex items-center gap-1">🎯 {assessment.passingScore}% to pass</span>
      </div>
      <button
        onClick={onStart}
        disabled={isCompleted || isLocked}
        className={`w-full rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${
          isCompleted
            ? 'cursor-not-allowed bg-gray-400 text-gray-600 shadow-inner'
            : isLocked
            ? 'cursor-not-allowed bg-gray-500 text-gray-300 shadow-inner'
            : 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:shadow-lg active:scale-95'
        }`}
      >
        {isCompleted ? '✓ Completed' : isLocked ? '🔒 Locked' : 'Start Assessment'}
      </button>
    </div>
  )
}
