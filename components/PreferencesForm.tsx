'use client'

import { useState, useEffect } from 'react'
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
  availability_status: 'open' | 'passive' | 'exceptional_only' | 'not_available'
  available_start_date?: string
  no_travel: boolean
  max_travel_percent: number
  visa_sponsorship_required: boolean
  show_preferences_to_employers: boolean
  anonymous_mode: boolean
}

export default function PreferencesForm() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState<Preferences>({
    remote_only: false,
    no_office_required: false,
    hybrid_acceptable: true,
    equity_required: false,
    equity_preferred: false,
    no_agencies: false,
    no_contract_to_hire: false,
    no_unpaid_trials: true,
    async_preferred: false,
    max_meetings_per_day: 4,
    no_oncall: false,
    no_weekends: true,
    no_early_stage_startups: false,
    no_enterprise: false,
    series_a_plus_only: false,
    excluded_technologies: [],
    required_technologies: [],
    availability_status: 'open',
    no_travel: false,
    max_travel_percent: 0,
    visa_sponsorship_required: false,
    show_preferences_to_employers: true,
    anonymous_mode: false,
  })

  const [techInput, setTechInput] = useState({ excluded: '', required: '' })

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_uid', user.id)
        .single()

      if (!profile) return

      const { data: prefs } = await supabase
        .from('professional_preferences')
        .select('*')
        .eq('profile_id', profile.id)
        .single()

      if (prefs) {
        setPreferences(prefs)
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_uid', user.id)
        .single()

      if (!profile) throw new Error('Profile not found')

      const { error } = await supabase
        .from('professional_preferences')
        .upsert({
          profile_id: profile.id,
          ...preferences,
        })

      if (error) throw error

      alert('✅ Preferences saved! Employers will see these when viewing your profile.')
    } catch (error: any) {
      console.error('Error saving preferences:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const addTechnology = (type: 'excluded' | 'required') => {
    const input = techInput[type].trim()
    if (!input) return

    const key = type === 'excluded' ? 'excluded_technologies' : 'required_technologies'
    if (!preferences[key].includes(input)) {
      setPreferences({
        ...preferences,
        [key]: [...preferences[key], input],
      })
    }
    setTechInput({ ...techInput, [type]: '' })
  }

  const removeTechnology = (type: 'excluded' | 'required', tech: string) => {
    const key = type === 'excluded' ? 'excluded_technologies' : 'required_technologies'
    setPreferences({
      ...preferences,
      [key]: preferences[key].filter((t) => t !== tech),
    })
  }

  if (loading) {
    return <div className="p-8 text-center">Loading preferences...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Your Preferences & Dealbreakers</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Set your "hard nos" upfront. Employers see these before contacting you.
        </p>
      </div>

      {/* Availability Status */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">🟢 Availability</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Current Status</label>
            <select
              value={preferences.availability_status}
              onChange={(e) => setPreferences({ ...preferences, availability_status: e.target.value as any })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="open">✅ Actively looking for opportunities</option>
              <option value="passive">👀 Open to offers (passive)</option>
              <option value="exceptional_only">⭐ Only exceptional opportunities</option>
              <option value="not_available">🚫 Not available</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Available Start Date (optional)</label>
            <input
              type="date"
              value={preferences.available_start_date || ''}
              onChange={(e) => setPreferences({ ...preferences, available_start_date: e.target.value })}
              className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        </div>
      </section>

      {/* Work Arrangement */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">🏠 Work Arrangement</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preferences.remote_only}
              onChange={(e) => setPreferences({ ...preferences, remote_only: e.target.checked })}
              className="w-5 h-5"
            />
            <span>Remote only - no office required</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preferences.hybrid_acceptable}
              onChange={(e) => setPreferences({ ...preferences, hybrid_acceptable: e.target.checked })}
              className="w-5 h-5"
            />
            <span>Hybrid acceptable</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preferences.no_travel}
              onChange={(e) => setPreferences({ ...preferences, no_travel: e.target.checked })}
              className="w-5 h-5"
            />
            <span>No travel required</span>
          </label>
        </div>
      </section>

      {/* Compensation */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">💰 Compensation Requirements</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Minimum Hourly Rate (USD)</label>
            <input
              type="number"
              value={preferences.min_hourly_rate || ''}
              onChange={(e) => setPreferences({ ...preferences, min_hourly_rate: parseInt(e.target.value) || undefined })}
              placeholder="e.g., 150"
              className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Minimum Annual Salary (USD)</label>
            <input
              type="number"
              value={preferences.min_annual_salary || ''}
              onChange={(e) => setPreferences({ ...preferences, min_annual_salary: parseInt(e.target.value) || undefined })}
              placeholder="e.g., 150000"
              className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preferences.equity_required}
              onChange={(e) => setPreferences({ ...preferences, equity_required: e.target.checked })}
              className="w-5 h-5"
            />
            <span>Equity required</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preferences.equity_preferred}
              onChange={(e) => setPreferences({ ...preferences, equity_preferred: e.target.checked })}
              className="w-5 h-5"
            />
            <span>Equity preferred</span>
          </label>
        </div>
      </section>

      {/* Dealbreakers */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">🚫 Dealbreakers</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preferences.no_agencies}
              onChange={(e) => setPreferences({ ...preferences, no_agencies: e.target.checked })}
              className="w-5 h-5"
            />
            <span>No agencies or recruiters</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preferences.no_contract_to_hire}
              onChange={(e) => setPreferences({ ...preferences, no_contract_to_hire: e.target.checked })}
              className="w-5 h-5"
            />
            <span>No contract-to-hire</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preferences.no_unpaid_trials}
              onChange={(e) => setPreferences({ ...preferences, no_unpaid_trials: e.target.checked })}
              className="w-5 h-5"
            />
            <span>No unpaid trials or test projects</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preferences.no_oncall}
              onChange={(e) => setPreferences({ ...preferences, no_oncall: e.target.checked })}
              className="w-5 h-5"
            />
            <span>No on-call duties</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preferences.no_weekends}
              onChange={(e) => setPreferences({ ...preferences, no_weekends: e.target.checked })}
              className="w-5 h-5"
            />
            <span>No weekend work</span>
          </label>
        </div>
      </section>

      {/* Technologies */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">🛠️ Technology Preferences</h2>
        
        {/* Excluded Technologies */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">❌ Technologies I won't work with</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={techInput.excluded}
              onChange={(e) => setTechInput({ ...techInput, excluded: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && addTechnology('excluded')}
              placeholder="e.g., PHP, Java, Salesforce"
              className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
            <button
              onClick={() => addTechnology('excluded')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {preferences.excluded_technologies.map((tech) => (
              <span key={tech} className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-sm flex items-center gap-2">
                {tech}
                <button onClick={() => removeTechnology('excluded', tech)} className="text-red-600 hover:text-red-800">×</button>
              </span>
            ))}
          </div>
        </div>

        {/* Required Technologies */}
        <div>
          <label className="block text-sm font-medium mb-2">✅ Technologies I require</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={techInput.required}
              onChange={(e) => setTechInput({ ...techInput, required: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && addTechnology('required')}
              placeholder="e.g., TypeScript, React, PostgreSQL"
              className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
            <button
              onClick={() => addTechnology('required')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {preferences.required_technologies.map((tech) => (
              <span key={tech} className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm flex items-center gap-2">
                {tech}
                <button onClick={() => removeTechnology('required', tech)} className="text-green-600 hover:text-green-800">×</button>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Visibility */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">👁️ Visibility</h2>
        
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={preferences.show_preferences_to_employers}
                onChange={(e) => setPreferences({ ...preferences, show_preferences_to_employers: e.target.checked })}
                className="w-5 h-5"
              />
              <span>Show my preferences to employers (recommended)</span>
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 ml-8">
              When enabled, employers see your dealbreakers before contacting you. This saves everyone time.
            </p>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={preferences.anonymous_mode}
                onChange={(e) => setPreferences({ ...preferences, anonymous_mode: e.target.checked })}
                className="w-5 h-5"
              />
              <span className="font-semibold">👻 Ghost Mode (Hide my identity)</span>
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 ml-8">
              Hide your name, avatar, and contact info until an employer unlocks your profile with credits. 
              Your skills, experience, and preferences remain visible. Great for passive job seekers who want privacy.
            </p>
          </div>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={savePreferences}
          disabled={saving}
          className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}
