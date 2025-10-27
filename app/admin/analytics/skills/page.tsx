'use client'

import { useEffect, useState } from 'react'
import SkillLevelBadge from '@/components/SkillLevelBadge'

interface AnalyticsData {
  distribution: Record<string, number>
  passRates: Record<string, { total: number; passed: number }>
  avgPromotionVelocity: Record<string, number>
  recentActivity: {
    totalAssessments: number
    passedAssessments: number
  }
  totalProfessionals: number
  totalAssessments: number
}

export default function SkillAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  async function fetchAnalytics() {
    try {
      const res = await fetch('/api/admin/analytics/skills')
      if (!res.ok) throw new Error('Failed to fetch analytics')
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
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="rounded-lg bg-red-50 p-6 text-center">
          <p className="text-red-800">Error: {error || 'Failed to load analytics'}</p>
        </div>
      </div>
    )
  }

  const totalVerified = Object.entries(data.distribution)
    .filter(([level]) => level !== 'unverified')
    .reduce((sum, [, count]) => sum + count, 0)

  const verificationRate = data.totalProfessionals > 0
    ? Math.round((totalVerified / data.totalProfessionals) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Skill Level Analytics</h1>
          <p className="mt-2 text-gray-600">
            Track assessment performance and skill level progression
          </p>
        </div>

        {/* Overview Stats */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Professionals"
            value={data.totalProfessionals}
            icon="👥"
            color="bg-blue-50 text-blue-600"
          />
          <StatCard
            title="Verified Professionals"
            value={totalVerified}
            subtitle={`${verificationRate}% verified`}
            icon="✅"
            color="bg-green-50 text-green-600"
          />
          <StatCard
            title="Total Assessments"
            value={data.totalAssessments}
            icon="📝"
            color="bg-purple-50 text-purple-600"
          />
          <StatCard
            title="Recent Activity (30d)"
            value={data.recentActivity.totalAssessments}
            subtitle={`${data.recentActivity.passedAssessments} passed`}
            icon="📊"
            color="bg-amber-50 text-amber-600"
          />
        </div>

        {/* Skill Level Distribution */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Skill Level Distribution</h2>
          <div className="space-y-4">
            {Object.entries(data.distribution)
              .sort((a, b) => b[1] - a[1])
              .map(([level, count]) => {
                const percentage = data.totalProfessionals > 0
                  ? Math.round((count / data.totalProfessionals) * 100)
                  : 0

                return (
                  <div key={level} className="flex items-center gap-4">
                    <div className="w-32">
                      <SkillLevelBadge level={level as any} size="sm" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">{count} professionals</span>
                        <span className="text-gray-600">{percentage}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-indigo-600 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Pass Rates */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Assessment Pass Rates</h2>
            <div className="space-y-4">
              {Object.entries(data.passRates).map(([level, stats]) => {
                const passRate = stats.total > 0
                  ? Math.round((stats.passed / stats.total) * 100)
                  : 0

                return (
                  <div key={level} className="border-b border-gray-200 pb-4 last:border-0">
                    <div className="mb-2 flex items-center justify-between">
                      <SkillLevelBadge level={level as any} size="sm" />
                      <span className="text-2xl font-bold text-gray-900">{passRate}%</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {stats.passed} passed / {stats.total} total attempts
                    </p>
                    <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                      <div
                        className={`h-full rounded-full transition-all ${
                          passRate >= 70 ? 'bg-green-500' : passRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${passRate}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Promotion Velocity */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Average Promotion Velocity
            </h2>
            <p className="mb-4 text-sm text-gray-600">
              Average days from account creation to skill level verification
            </p>
            <div className="space-y-4">
              {Object.entries(data.avgPromotionVelocity).map(([level, days]) => (
                <div key={level} className="border-b border-gray-200 pb-4 last:border-0">
                  <div className="mb-2 flex items-center justify-between">
                    <SkillLevelBadge level={level as any} size="sm" />
                    <span className="text-2xl font-bold text-gray-900">
                      {days > 0 ? `${days}d` : 'N/A'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {days > 0
                      ? `Professionals reach ${level} level in ~${days} days`
                      : 'Insufficient data'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color
}: {
  title: string
  value: number
  subtitle?: string
  icon: string
  color: string
}) {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className={`rounded-full p-3 text-3xl ${color}`}>{icon}</div>
      </div>
    </div>
  )
}
