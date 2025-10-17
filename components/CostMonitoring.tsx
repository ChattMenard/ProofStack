'use client'

import { useEffect, useState } from 'react'

interface CostStats {
  summary: {
    totalCost: string
    totalCostUsd: number
    requestCount: number
    last30DaysCost: string
    last30DaysCostUsd: number
    last7DaysCost: string
    last7DaysCostUsd: number
    todayCost: string
    todayCostUsd: number
  } | null
  breakdown: Array<{
    provider: string
    model: string
    requestCount: number
    totalCost: string
    totalCostUsd: number
    avgCost: string
    avgCostUsd: number
  }>
}

export default function CostMonitoring() {
  const [stats, setStats] = useState<CostStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(30)

  useEffect(() => {
    fetchStats()
  }, [days])

  async function fetchStats() {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/costs/stats?days=${days}`)
      if (!response.ok) {
        throw new Error('Failed to fetch cost statistics')
      }
      
      const data = await response.json()
      setStats(data)
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching cost stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg shadow">
        <h3 className="text-red-800 font-semibold mb-2">Error Loading Cost Data</h3>
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Today</h3>
          <p className="text-3xl font-bold text-gray-900">
            {stats?.summary?.todayCost || '$0.00'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {stats?.summary?.requestCount || 0} total requests
          </p>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Last 7 Days</h3>
          <p className="text-3xl font-bold text-gray-900">
            {stats?.summary?.last7DaysCost || '$0.00'}
          </p>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Last 30 Days</h3>
          <p className="text-3xl font-bold text-gray-900">
            {stats?.summary?.last30DaysCost || '$0.00'}
          </p>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">All Time</h3>
          <p className="text-3xl font-bold text-gray-900">
            {stats?.summary?.totalCost || '$0.00'}
          </p>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-4 py-2 rounded ${
              days === d
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {d} days
          </button>
        ))}
      </div>

      {/* Breakdown by Provider */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Cost Breakdown by Provider</h2>
        
        {stats?.breakdown && stats.breakdown.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requests
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Cost
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Cost
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.breakdown.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {item.provider}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.model}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {item.requestCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      {item.totalCost}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {item.avgCost}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>No API usage data for the selected period</p>
            <p className="text-sm mt-2">Costs will appear here after your first API calls</p>
          </div>
        )}
      </div>

      {/* Cost Alerts */}
      {stats?.summary && stats.summary.todayCostUsd > 0.50 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Cost Alert:</strong> You've used {stats.summary.todayCost} today. 
                {stats.summary.todayCostUsd > 1 && ' Consider using cheaper models for non-critical tasks.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Cost Optimization Tips</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Use GPT-3.5 instead of GPT-4 for simple tasks (10x cheaper)</li>
                <li>Claude Haiku is the most cost-effective for skill extraction</li>
                <li>Self-hosted Ollama models are free but slower</li>
                <li>Whisper transcription costs $0.006/minute</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
