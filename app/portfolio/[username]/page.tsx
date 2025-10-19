"use client"
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { supabase } from '../../../lib/supabaseClient'
import PortfolioSamples from '../../../components/PortfolioSamples'
import ReviewsSection from '../../../components/ReviewsSection'

interface Profile {
  id: string
  full_name: string
  email: string
  bio?: string
  avatar_url?: string
  github_username?: string
  plan?: string
  is_founder?: boolean
  founder_number?: number
  created_at: string
}

interface Sample {
  id: string
  type: string
  title: string
  filename: string
  storage_url?: string
  created_at: string
  analyses?: Array<{
    id: string
    status: string
    summary?: string
    result?: any
    skills?: any
    metrics?: any
  }>
}

interface Credential {
  type: string
  name: string
  issuer?: string
  date?: string
  confidence: number
}

export default function PortfolioPage({ params }: { params: { username: string } }) {
  // Decode the username in case it's URL encoded
  const username = decodeURIComponent(params.username)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [samples, setSamples] = useState<Sample[]>([])
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [skills, setSkills] = useState<Record<string, { confidence: number; count: number }>>({})
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(false)

  const loadPortfolio = async () => {
      try {
        console.log('Loading portfolio for:', username)
        
        // Check if current user is viewing their own portfolio
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user)
        
        // Try to get profile by email first (take most recent if duplicates exist)
        let profileData = null
        let profileError = null
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', username)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        profileData = data
        profileError = error

        // If not found by email, try by full_name (for demo/display names)
        if (!profileData && !username.includes('@')) {
          const { data: nameData, error: nameError } = await supabase
            .from('profiles')
            .select('*')
            .ilike('full_name', `%${username}%`)
            .limit(1)
            .maybeSingle()
          
          profileData = nameData
          profileError = nameError
        }

        console.log('Profile query result:', { profileData, profileError })

        if (profileError) {
          console.error('Profile error:', profileError)
        }
        
        if (!profileData) {
          console.error('No profile found for:', username)
          setLoading(false)
          return
        }
        
        setProfile(profileData)
        
        // Check if current user is the owner
        if (user && profileData) {
          setIsOwner(user.email === profileData.email || user.id === profileData.auth_uid)
        }

        // Get samples with analyses
        const { data: samplesData, error: samplesError } = await supabase
          .from('samples')
          .select(`
            *,
            analyses (
              id,
              status,
              summary,
              result,
              skills,
              metrics
            )
          `)
          .eq('owner_id', profileData.id)
          .eq('visibility', 'public')
          .order('created_at', { ascending: false })

        if (samplesError) throw samplesError
        setSamples(samplesData || [])

        // Extract credentials and skills from analyses
        const extractedCredentials: Credential[] = []
        const skillsMap: Record<string, { confidence: number; count: number }> = {}

        samplesData?.forEach((sample: any) => {
          const analyses = Array.isArray(sample.analyses) ? sample.analyses : [sample.analyses].filter(Boolean)
          analyses.forEach((analysis: any) => {
            if (analysis?.status === 'done') {
              // Extract credentials
              if (analysis.result?.credentials) {
                extractedCredentials.push(...analysis.result.credentials)
              }

              // Aggregate skills
              if (analysis.skills) {
                Object.entries(analysis.skills).forEach(([skill, data]: [string, any]) => {
                  if (!skillsMap[skill]) {
                    skillsMap[skill] = { confidence: data.confidence || 0, count: 0 }
                  }
                  skillsMap[skill].count += 1
                  // Average confidence
                  skillsMap[skill].confidence = (skillsMap[skill].confidence + data.confidence) / 2
                })
              }
            }
          })
        })

        setCredentials(extractedCredentials)
        setSkills(skillsMap)

      } catch (error) {
        console.error('Error loading portfolio:', error)
      } finally {
        setLoading(false)
      }
  }

  useEffect(() => {
    if (username) {
      loadPortfolio()
    }
  }, [username])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading portfolio...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Portfolio Not Found</h1>
          <p className="text-gray-600">User &quot;{username}&quot; does not exist.</p>
        </div>
      </div>
    )
  }

  const completedSamples = samples.filter(s => 
    s.analyses?.some(a => a.status === 'done')
  )

  const averageAIScore = completedSamples.length > 0
    ? completedSamples.reduce((sum, s) => {
        const analysis = s.analyses?.find(a => a.status === 'done')
        return sum + (analysis?.metrics?.ai_detection_score || 0)
      }, 0) / completedSamples.length
    : 0

  return (
    <div className="min-h-screen bg-forest-950">
      {/* Header */}
      <div className="bg-forest-900 border-b border-forest-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.full_name || 'Profile'}
                  width={120}
                  height={120}
                  className="rounded-full border-4 border-forest-700"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-sage-600 to-sage-700 flex items-center justify-center text-forest-50 text-4xl font-bold border-2 border-sage-500">
                  {profile.full_name?.[0] || profile.email[0].toUpperCase()}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-forest-50">
                  {profile.full_name || profile.email.split('@')[0]}
                </h1>
                {profile.is_founder && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-earth-600 to-earth-500 text-forest-50 shadow-sm">
                    🎯 Founder #{profile.founder_number}
                  </span>
                )}
              </div>

              <p className="text-forest-300 mb-3">{profile.email}</p>

              {profile.bio && (
                <p className="text-forest-200 mb-4 max-w-2xl">{profile.bio}</p>
              )}

              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-forest-50">{completedSamples.length}</span>
                    <span className="text-forest-300">Verified Samples</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-forest-50">{Object.keys(skills).length}</span>
                    <span className="text-forest-300">Skills</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-forest-50">{credentials.length}</span>
                    <span className="text-forest-300">Credentials</span>
                  </div>
                </div>

                {/* Action Buttons for Employers */}
                {currentUser && !isOwner && (
                  <div className="flex gap-3">
                    <a
                      href={`/employer/messages?to=${profile.id}`}
                      className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Send Message
                    </a>
                    <a
                      href={`/employer/reviews/new/${profile.id}`}
                      className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      Write Review
                    </a>
                  </div>
                )}
                
                {/* Sign In CTA for Non-Logged In Users */}
                {!currentUser && (
                  <div className="flex gap-3">
                    <a
                      href="/login"
                      className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Sign In to Contact
                    </a>
                    <a
                      href="/employer/signup"
                      className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Hire Talent
                    </a>
                  </div>
                )}
              </div>

              {/* AI Authenticity Score */}
              <div className="mt-4 p-4 bg-sage-900/30 rounded-lg border border-sage-700 max-w-md">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-sage-300">Human Authenticity</div>
                    <div className="text-xs text-sage-400 mt-1">
                      Average AI Detection: {averageAIScore.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-sage-400">
                    {(100 - averageAIScore).toFixed(0)}%
                  </div>
                </div>
                <div className="mt-2 w-full bg-forest-800 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-sage-600 to-sage-500 h-2 rounded-full transition-all"
                    style={{ width: `${100 - averageAIScore}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Skills & Credentials */}
          <div className="lg:col-span-1 space-y-6">
            {/* Skills */}
            <div className="bg-forest-900 border border-forest-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4 text-forest-50">Skills</h2>
              {Object.keys(skills).length === 0 ? (
                <p className="text-forest-400 text-sm">No skills detected yet</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(skills)
                    .sort((a, b) => b[1].confidence - a[1].confidence)
                    .map(([skill, data]) => (
                      <div key={skill}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-forest-50 capitalize">
                            {skill}
                          </span>
                          <span className="text-xs text-forest-400">
                            {data.count} sample{data.count > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="w-full bg-forest-800 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-sage-600 to-sage-500 h-2 rounded-full"
                            style={{ width: `${data.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Credentials */}
            <div className="bg-forest-900 border border-forest-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4 text-forest-50">Credentials</h2>
              {credentials.length === 0 ? (
                <p className="text-forest-400 text-sm">No credentials added yet</p>
              ) : (
                <div className="space-y-3">
                  {credentials.map((cred, idx) => (
                    <div key={idx} className="p-3 bg-earth-900/30 rounded-lg border border-earth-700">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm text-forest-50">{cred.name}</div>
                          {cred.issuer && (
                            <div className="text-xs text-forest-300 mt-1">{cred.issuer}</div>
                          )}
                          {cred.date && (
                            <div className="text-xs text-forest-400 mt-1">{cred.date}</div>
                          )}
                        </div>
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-earth-900/50 text-earth-300 border border-earth-700">
                          {cred.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Work Samples */}
          <div className="lg:col-span-2">
            <div className="bg-forest-900 border border-forest-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-6 text-forest-50">Work Samples</h2>
              <PortfolioSamples 
                samples={samples} 
                isOwner={isOwner}
                onRefresh={() => {
                  // Reload the portfolio
                  if (username) {
                    loadPortfolio()
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Reviews Section - Full Width Below */}
        <div className="mt-8">
          {profile && (
            <ReviewsSection
              professionalId={profile.id}
              professionalUsername={username}
              isOwnProfile={isOwner}
            />
          )}
        </div>
      </div>
    </div>
  )
}
