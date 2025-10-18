"use client"
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { supabase } from '../../../lib/supabaseClient'

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

  useEffect(() => {
    async function loadPortfolio() {
      try {
        // Get profile by email (username)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', username)
          .single()

        if (profileError) throw profileError
        setProfile(profileData)

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b">
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
                  className="rounded-full border-4 border-gray-200"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                  {profile.full_name?.[0] || profile.email[0].toUpperCase()}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {profile.full_name || profile.email.split('@')[0]}
                </h1>
                {profile.is_founder && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-sm">
                    🎯 Founder #{profile.founder_number}
                  </span>
                )}
              </div>

              <p className="text-gray-600 mb-3">{profile.email}</p>

              {profile.bio && (
                <p className="text-gray-700 mb-4 max-w-2xl">{profile.bio}</p>
              )}

              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{completedSamples.length}</span>
                  <span className="text-gray-600">Verified Samples</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{Object.keys(skills).length}</span>
                  <span className="text-gray-600">Skills</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{credentials.length}</span>
                  <span className="text-gray-600">Credentials</span>
                </div>
              </div>

              {/* AI Authenticity Score */}
              <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 max-w-md">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-green-900">Human Authenticity</div>
                    <div className="text-xs text-green-700 mt-1">
                      Average AI Detection: {averageAIScore.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-green-600">
                    {(100 - averageAIScore).toFixed(0)}%
                  </div>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all"
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
            <div className="bg-white rounded-xl shadow-sm p-6 border">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Skills</h2>
              {Object.keys(skills).length === 0 ? (
                <p className="text-gray-500 text-sm">No skills detected yet</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(skills)
                    .sort((a, b) => b[1].confidence - a[1].confidence)
                    .map(([skill, data]) => (
                      <div key={skill}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {skill}
                          </span>
                          <span className="text-xs text-gray-500">
                            {data.count} sample{data.count > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                            style={{ width: `${data.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Credentials */}
            <div className="bg-white rounded-xl shadow-sm p-6 border">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Credentials</h2>
              {credentials.length === 0 ? (
                <p className="text-gray-500 text-sm">No credentials added yet</p>
              ) : (
                <div className="space-y-3">
                  {credentials.map((cred, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900">{cred.name}</div>
                          {cred.issuer && (
                            <div className="text-xs text-gray-600 mt-1">{cred.issuer}</div>
                          )}
                          {cred.date && (
                            <div className="text-xs text-gray-500 mt-1">{cred.date}</div>
                          )}
                        </div>
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
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
            <div className="bg-white rounded-xl shadow-sm p-6 border">
              <h2 className="text-xl font-bold mb-6 text-gray-900">Work Samples</h2>

              {samples.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📁</div>
                  <p className="text-gray-500">No samples uploaded yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {samples.map(sample => {
                    const analysis = sample.analyses?.find(a => a.status === 'done')
                    const aiScore = analysis?.metrics?.ai_detection_score || 0
                    const humanScore = 100 - aiScore

                    return (
                      <div key={sample.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        {/* Type Badge */}
                        <div className="flex items-start justify-between mb-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                            {sample.type}
                          </span>
                          {analysis && (
                            <div className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${humanScore >= 80 ? 'bg-green-500' : humanScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                              <span className="text-xs font-medium text-gray-600">
                                {humanScore.toFixed(0)}% Human
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {sample.title}
                        </h3>

                        {/* Filename */}
                        <p className="text-xs text-gray-500 mb-3">{sample.filename}</p>

                        {/* Analysis Summary */}
                        {analysis?.summary && (
                          <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                            {analysis.summary}
                          </p>
                        )}

                        {/* Skills from this sample */}
                        {analysis?.skills && Object.keys(analysis.skills).length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {Object.keys(analysis.skills).slice(0, 4).map(skill => (
                              <span key={skill} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 capitalize">
                                {skill}
                              </span>
                            ))}
                            {Object.keys(analysis.skills).length > 4 && (
                              <span className="text-xs text-gray-500">
                                +{Object.keys(analysis.skills).length - 4} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Status */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">
                            {new Date(sample.created_at).toLocaleDateString()}
                          </span>
                          {sample.analyses?.[0] && (
                            <span className={`px-2 py-1 rounded-full ${
                              sample.analyses[0].status === 'done' ? 'bg-green-100 text-green-800' :
                              sample.analyses[0].status === 'processing' ? 'bg-blue-100 text-blue-800' :
                              sample.analyses[0].status === 'queued' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {sample.analyses[0].status}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
