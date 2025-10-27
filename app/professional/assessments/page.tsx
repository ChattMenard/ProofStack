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
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Please log in to view assessments')
        setLoading(false)
        return
      }

      const res = await fetch('/api/assessments/available', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      if (!res.ok) throw new Error('Failed to fetch assessments')
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      setError(err.message)
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Skill Assessments</h1>
          <p className="mt-2 text-gray-600">
            Complete assessments to verify your skill level and unlock new opportunities
          </p>
        </div>

        {/* Current Level & Progress */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <SkillLevelProgress level={data.currentLevel as any} />
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{data.stats.completed}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-600">{data.stats.available}</p>
              <p className="text-sm text-gray-600">Available</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{data.stats.total}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </div>
        </div>

        {/* Assessments by Level */}
        <div className="space-y-8">
          {(['junior', 'mid', 'senior', 'lead'] as const).map(level => {
            const assessments = data.assessments[level]
            if (assessments.length === 0) return null

            return (
              <div key={level} className="rounded-lg bg-white p-6 shadow">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 capitalize">{level} Level</h2>
                  <SkillLevelBadge level={level} size="sm" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
      className={`rounded-lg border-2 p-4 transition-all ${
        isCompleted
          ? 'border-green-200 bg-green-50'
          : isLocked
          ? 'border-gray-200 bg-gray-50 opacity-60'
          : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
      }`}
    >
      <div className="mb-2 flex items-start justify-between">
        <span className="text-2xl">{typeIcons[assessment.type] || '📋'}</span>
        {isCompleted && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
            ✓ Completed
          </span>
        )}
        {isLocked && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            🔒 Locked
          </span>
        )}
      </div>
      <h3 className="mb-1 font-semibold text-gray-900">{assessment.title}</h3>
      <p className="mb-3 text-sm text-gray-600">{assessment.description}</p>
      <div className="mb-3 flex items-center gap-4 text-xs text-gray-500">
        {assessment.durationMinutes > 0 && (
          <span>⏱️ {assessment.durationMinutes} min</span>
        )}
        <span>🎯 {assessment.passingScore}% to pass</span>
      </div>
      <button
        onClick={onStart}
        disabled={isCompleted || isLocked}
        className={`w-full rounded-md px-4 py-2 text-sm font-medium transition-colors ${
          isCompleted
            ? 'cursor-not-allowed bg-gray-200 text-gray-500'
            : isLocked
            ? 'cursor-not-allowed bg-gray-200 text-gray-400'
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
      >
        {isCompleted ? 'Completed' : isLocked ? 'Locked' : 'Start Assessment'}
      </button>
    </div>
  )
}
