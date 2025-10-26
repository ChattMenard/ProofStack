"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '../../../lib/supabaseClient'
import ProofScoreV2 from '../../../components/ProofScoreV2'
import WorkSamplesSection from '../../../components/WorkSamplesSection'
import ReviewsSection from '../../../components/ReviewsSection'
import PreferencesDisplay from '../../../components/PreferencesDisplay'

interface Profile {
  id: string
  full_name: string
  email: string
  bio?: string
  avatar_url?: string
  headline?: string
  location?: string
  website?: string
  linkedin_url?: string
  github_username?: string
  plan?: string
  is_founder?: boolean
  founder_number?: number
  created_at: string
}

export default function PortfolioPage({ params }: { params: { username: string } }) {
  const username = decodeURIComponent(params.username)
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    loadPortfolio()
  }, [username])

  const loadPortfolio = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.eq.${username},email.eq.${username}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) console.error('Profile error:', error)
      if (!data) {
        setLoading(false)
        return
      }

      setProfile(data)
      // Canonical redirect: if visiting by email but a username exists, redirect to /portfolio/[username]
      if (username.includes('@') && data.username) {
        const target = `/portfolio/${encodeURIComponent(data.username)}`
        if (window.location.pathname !== target) {
          router.replace(target)
        }
      }
      if (user && data) {
        setIsOwner(user.email === data.email || user.id === data.auth_uid)
      }
    } catch (err) {
      console.error('Error loading portfolio:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-forest-950">
        <div className="text-lg text-gray-700 dark:text-gray-300">Loading portfolio...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-forest-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">Portfolio Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400">User &quot;{username}&quot; does not exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-forest-950">
      {/* Cover Photo Banner */}
      <div className="h-48 bg-gradient-to-r from-sage-600 via-sage-500 to-emerald-500 dark:from-sage-700 dark:via-sage-600 dark:to-emerald-600"></div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 pb-12">
        {/* Profile Card */}
        <div className="bg-white dark:bg-forest-900 rounded-lg shadow-lg border border-gray-200 dark:border-forest-800 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.full_name || 'Profile'}
                  width={150}
                  height={150}
                  className="rounded-lg border-4 border-white dark:border-forest-800 shadow-lg"
                />
              ) : (
                <div className="w-36 h-36 rounded-lg bg-gradient-to-br from-sage-600 to-sage-700 flex items-center justify-center text-white text-5xl font-bold border-4 border-white dark:border-forest-800 shadow-lg">
                  {profile.full_name?.[0] || profile.email[0].toUpperCase()}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    {profile.full_name || profile.email.split('@')[0]}
                  </h1>
                  <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
                    {profile.headline || 'Professional • No headline set'}
                  </p>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {profile.location && (
                      <span className="flex items-center gap-1">
                        📍 {profile.location}
                      </span>
                    )}
                    {!profile.location && (
                      <span className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                        📍 Location not set
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      📧 {profile.email}
                    </span>
                  </div>
                  {profile.is_founder && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-earth-600 to-earth-500 text-white shadow-sm mb-3">
                      🎯 Founding Member #{profile.founder_number}
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                {!isOwner && currentUser && (
                  <div className="flex gap-2">
                    <a
                      href={`/employer/messages?to=${profile.id}`}
                      className="px-4 py-2 bg-sage-600 text-white font-medium rounded-lg hover:bg-sage-700 transition-colors"
                    >
                      Message
                    </a>
                    <button className="px-4 py-2 border border-gray-300 dark:border-forest-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-forest-800 transition-colors">
                      Connect
                    </button>
                  </div>
                )}
                {!currentUser && (
                  <a
                    href="/login"
                    className="px-4 py-2 bg-sage-600 text-white font-medium rounded-lg hover:bg-sage-700 transition-colors"
                  >
                    Sign In to Connect
                  </a>
                )}
              </div>

              {/* ProofScore */}
              <div className="mt-4">
                <ProofScoreV2 
                  professionalId={profile.id} 
                  size="small" 
                  showBreakdown={true}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Info Card */}
            <div className="bg-white dark:bg-forest-900 rounded-lg shadow border border-gray-200 dark:border-forest-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Contact Info</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Email</div>
                  <div className="text-gray-900 dark:text-gray-100 break-all">{profile.email}</div>
                </div>
                {profile.website ? (
                  <div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Website</div>
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-sage-600 hover:underline break-all">
                      {profile.website}
                    </a>
                  </div>
                ) : (
                  <div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Website</div>
                    <div className="text-gray-400 dark:text-gray-500 italic">Not provided</div>
                  </div>
                )}
                {profile.linkedin_url && (
                  <div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">LinkedIn</div>
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sage-600 hover:underline">
                      View LinkedIn Profile
                    </a>
                  </div>
                )}
                {profile.github_username && (
                  <div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">GitHub</div>
                    <a href={`https://github.com/${profile.github_username}`} target="_blank" rel="noopener noreferrer" className="text-sage-600 hover:underline">
                      @{profile.github_username}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Preferences/Dealbreakers Card */}
            <PreferencesDisplay profileId={profile.id} compact={false} />

            {/* Skills Card - Placeholder */}
            <div className="bg-white dark:bg-forest-900 rounded-lg shadow border border-gray-200 dark:border-forest-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Top Skills</h2>
              <div className="space-y-2">
                <div className="p-3 bg-gray-50 dark:bg-forest-800 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-900 dark:text-gray-100">React.js</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Based on work samples</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-forest-700 rounded-full h-2">
                    <div className="bg-sage-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-forest-800 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-900 dark:text-gray-100">TypeScript</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Based on work samples</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-forest-700 rounded-full h-2">
                    <div className="bg-sage-600 h-2 rounded-full" style={{ width: '72%' }}></div>
                  </div>
                </div>
                <div className="text-center pt-2">
                  <button className="text-sage-600 hover:text-sage-700 font-medium text-sm">
                    Show all verified skills →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            <div className="bg-white dark:bg-forest-900 rounded-lg shadow border border-gray-200 dark:border-forest-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">About</h2>
                {isOwner && (
                  <a href="/dashboard/profile#about" className="text-sm text-sage-600 hover:text-sage-700 font-medium">Edit</a>
                )}
              </div>
              {profile.bio ? (
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{profile.bio}</p>
              ) : (
                <p className="text-gray-400 dark:text-gray-500 italic">
                  This professional hasn&apos;t added an about section yet. When they do, it will appear here with their professional summary, career highlights, and what makes them unique.
                </p>
              )}
            </div>

            {/* Experience Section - Placeholder */}
            <div className="bg-white dark:bg-forest-900 rounded-lg shadow border border-gray-200 dark:border-forest-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Experience</h2>
                {isOwner && (
                  <a href="/dashboard/profile#experience" className="text-sm text-sage-600 hover:text-sage-700 font-medium">Add</a>
                )}
              </div>
              <div className="space-y-6">
                <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-lg mb-2">No work experience listed yet</p>
                  <p className="text-sm">Work history will appear here once added</p>
                </div>
              </div>
            </div>

            {/* Education Section - Placeholder */}
            <div className="bg-white dark:bg-forest-900 rounded-lg shadow border border-gray-200 dark:border-forest-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Education</h2>
                {isOwner && (
                  <a href="/dashboard/profile#education" className="text-sm text-sage-600 hover:text-sage-700 font-medium">Add</a>
                )}
              </div>
              <div className="space-y-6">
                <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                  <p className="text-lg mb-2">No education listed yet</p>
                  <p className="text-sm">Degrees, certifications, and courses will appear here</p>
                </div>
              </div>
            </div>

            {/* Work Samples */}
            <div className="bg-white dark:bg-forest-900 rounded-lg shadow border border-gray-200 dark:border-forest-800 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Verified Work Samples</h2>
              <WorkSamplesSection professionalId={profile.id} />
            </div>

            {/* Reviews */}
            <div className="bg-white dark:bg-forest-900 rounded-lg shadow border border-gray-200 dark:border-forest-800 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Recommendations</h2>
              <ReviewsSection 
                professionalId={profile.id} 
                professionalUsername={profile.full_name || profile.email.split('@')[0]}
                isOwnProfile={isOwner}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
