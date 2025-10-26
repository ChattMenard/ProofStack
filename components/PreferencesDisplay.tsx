'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

interface Preferences {
  remote_only: boolean
  no_office_required: boolean
  hybrid_acceptable: boolean
  min_hourly_rate?: number
  min_annual_salary?: number
  equity_required: boolean
  equity_preferred: boolean
  no_agencies: boolean
  no_contract_to_hire: boolean
  no_unpaid_trials: boolean
  async_preferred: boolean
  max_meetings_per_day: number
  no_oncall: boolean
  no_weekends: boolean
  timezone_requirement?: string
  no_early_stage_startups: boolean
  no_enterprise: boolean
  series_a_plus_only: boolean
  excluded_technologies: string[]
  required_technologies: string[]
  availability_status: string
  available_start_date?: string
  no_travel: boolean
  max_travel_percent: number
  visa_sponsorship_required: boolean
  show_preferences_to_employers: boolean
}

interface Props {
  profileId: string
  compact?: boolean // For search results badges
}

export default function PreferencesDisplay({ profileId, compact = false }: Props) {
  const [preferences, setPreferences] = useState<Preferences | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPreferences()
  }, [profileId])

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('professional_preferences')
        .select('*')
        .eq('profile_id', profileId)
        .eq('show_preferences_to_employers', true)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error loading preferences:', error)
      }
      
      setPreferences(data)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !preferences) return null

  // Compact mode for search results - just show key badges
  if (compact) {
    const badges = []
    
    if (preferences.availability_status === 'open') badges.push({ icon: '🟢', text: 'Actively looking' })
    else if (preferences.availability_status === 'passive') badges.push({ icon: '👀', text: 'Open to offers' })
    else if (preferences.availability_status === 'exceptional_only') badges.push({ icon: '⭐', text: 'Exceptional only' })
    
    if (preferences.remote_only) badges.push({ icon: '🏠', text: 'Remote only' })
    if (preferences.min_annual_salary) badges.push({ icon: '💰', text: `$${(preferences.min_annual_salary / 1000).toFixed(0)}k+` })
    if (preferences.no_agencies) badges.push({ icon: '🚫', text: 'No agencies' })
    
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {badges.map((badge, i) => (
          <span key={i} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
            {badge.icon} {badge.text}
          </span>
        ))}
      </div>
    )
  }

  // Full display for portfolio page
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
        Work Preferences & Requirements
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        These are non-negotiable requirements set by the professional.
      </p>

      <div className="space-y-6">
        {/* Availability */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Availability</h3>
          <div className="flex items-center gap-2">
            {preferences.availability_status === 'open' && <span className="text-2xl">🟢</span>}
            {preferences.availability_status === 'passive' && <span className="text-2xl">👀</span>}
            {preferences.availability_status === 'exceptional_only' && <span className="text-2xl">⭐</span>}
            {preferences.availability_status === 'not_available' && <span className="text-2xl">🚫</span>}
            <span className="text-gray-700 dark:text-gray-300">
              {preferences.availability_status === 'open' && 'Actively looking for opportunities'}
              {preferences.availability_status === 'passive' && 'Open to offers (passive)'}
              {preferences.availability_status === 'exceptional_only' && 'Only exceptional opportunities'}
              {preferences.availability_status === 'not_available' && 'Not currently available'}
            </span>
          </div>
          {preferences.available_start_date && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 ml-8">
              Available from: {new Date(preferences.available_start_date).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Work Arrangement */}
        {(preferences.remote_only || preferences.no_travel) && (
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Work Arrangement</h3>
            <div className="space-y-1">
              {preferences.remote_only && (
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <span>🏠</span>
                  <span>Remote only - no office required</span>
                </div>
              )}
              {preferences.no_travel && (
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <span>✈️</span>
                  <span>No travel required</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Compensation */}
        {(preferences.min_hourly_rate || preferences.min_annual_salary || preferences.equity_required) && (
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Compensation Requirements</h3>
            <div className="space-y-1">
              {preferences.min_hourly_rate && (
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <span>💵</span>
                  <span>Minimum ${preferences.min_hourly_rate}/hour</span>
                </div>
              )}
              {preferences.min_annual_salary && (
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <span>💰</span>
                  <span>Minimum ${preferences.min_annual_salary.toLocaleString()}/year</span>
                </div>
              )}
              {preferences.equity_required && (
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <span>📈</span>
                  <span>Equity required</span>
                </div>
              )}
              {preferences.equity_preferred && (
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <span>📊</span>
                  <span>Equity preferred</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dealbreakers */}
        {(preferences.no_agencies || preferences.no_contract_to_hire || preferences.no_unpaid_trials || 
          preferences.no_oncall || preferences.no_weekends) && (
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Dealbreakers</h3>
            <div className="space-y-1">
              {preferences.no_agencies && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <span>🚫</span>
                  <span>No agencies or third-party recruiters</span>
                </div>
              )}
              {preferences.no_contract_to_hire && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <span>🚫</span>
                  <span>No contract-to-hire arrangements</span>
                </div>
              )}
              {preferences.no_unpaid_trials && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <span>🚫</span>
                  <span>No unpaid trials or test projects</span>
                </div>
              )}
              {preferences.no_oncall && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <span>🚫</span>
                  <span>No on-call duties</span>
                </div>
              )}
              {preferences.no_weekends && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <span>🚫</span>
                  <span>No weekend work</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Technologies */}
        {(preferences.excluded_technologies?.length > 0 || preferences.required_technologies?.length > 0) && (
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Technology Preferences</h3>
            {preferences.excluded_technologies?.length > 0 && (
              <div className="mb-3">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Won't work with:</p>
                <div className="flex flex-wrap gap-2">
                  {preferences.excluded_technologies.map((tech) => (
                    <span key={tech} className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-sm">
                      ❌ {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {preferences.required_technologies?.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Requires:</p>
                <div className="flex flex-wrap gap-2">
                  {preferences.required_technologies.map((tech) => (
                    <span key={tech} className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm">
                      ✅ {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Company Preferences */}
        {(preferences.no_early_stage_startups || preferences.no_enterprise || preferences.series_a_plus_only) && (
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Company Preferences</h3>
            <div className="space-y-1">
              {preferences.no_early_stage_startups && (
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <span>🚫</span>
                  <span>No early-stage startups</span>
                </div>
              )}
              {preferences.no_enterprise && (
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <span>🚫</span>
                  <span>No enterprise companies</span>
                </div>
              )}
              {preferences.series_a_plus_only && (
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <span>📈</span>
                  <span>Series A+ companies only</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
