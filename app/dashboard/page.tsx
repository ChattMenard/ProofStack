'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
import UploadForm from '../../components/UploadForm'

interface UserProfile {
  id: string
  full_name: string | null
  email: string
  plan: string | null
  is_founder: boolean
  founder_number: number | null
}

interface Sample {
  id: string
  type: string
  title: string
  filename: string
  content?: string
  created_at: string
  analyses?: Array<{
    status: string
    metrics?: { 
      ai_detection_score?: number
      ai_detection_reasoning?: string
    }
  }>
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [samples, setSamples] = useState<Sample[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSamples, setExpandedSamples] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function loadDashboard() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_uid', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
      }

      // Load samples
      const { data: samplesData } = await supabase
        .from('samples')
        .select(`
          *,
          analyses (
            status,
            metrics
          )
        `)
        .eq('owner_id', profileData?.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (samplesData) {
        setSamples(samplesData)
      }

      setLoading(false)
    }

    loadDashboard()
  }, [router])

  if (loading) return <div className="p-8">Loading...</div>

  const completedSamples = samples.filter(s => 
    s.analyses?.some(a => a.status === 'done')
  ).length

  const portfolioUrl = `/portfolio/${encodeURIComponent(user?.email || '')}`

  const toggleSampleExpansion = (sampleId: string) => {
    setExpandedSamples(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sampleId)) {
        newSet.delete(sampleId)
      } else {
        newSet.add(sampleId)
      }
      return newSet
    })
  }

  return (
      <div className="min-h-screen bg-forest-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-forest-900 border border-forest-800 rounded-xl shadow-sm p-6 mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-forest-50 animate-gradient bg-gradient-to-r from-sage-400 to-earth-400 bg-clip-text text-transparent">
                AI Code Detection Tool
              </h1>
              <p className="text-forest-300 mt-1">{user?.email}</p>
              {profile?.is_founder && (
                <span className="inline-flex items-center px-3 py-1 mt-2 rounded-full text-sm font-medium bg-gradient-to-r from-earth-600 to-earth-500 text-forest-50 shadow-sm">
                  🎯 Founder #{profile.founder_number} - Unlimited Free Forever
                </span>
              )}
            </div>
            <div className="text-right">
              <Link 
                href={portfolioUrl}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-sage-600 to-sage-700 text-forest-50 font-medium hover:shadow-lg transition-shadow"
              >
                View Portfolio →
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stats */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-forest-900 border border-forest-800 rounded-xl shadow-sm p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 animate-fade-in">
              <div className="text-sm font-medium text-forest-300">Total Samples</div>
              <div className="text-3xl font-bold text-transparent bg-gradient-to-r from-sage-400 to-sage-300 bg-clip-text mt-2 animate-pulse-slow">{samples.length}</div>
              <div className="text-xs text-forest-400 mt-1">All uploads</div>
            </div>
            <div className="bg-forest-900 border border-forest-800 rounded-xl shadow-sm p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 animate-fade-in" style={{animationDelay: '0.1s'}}>
              <div className="text-sm font-medium text-forest-300">AI Detected</div>
              <div className="text-3xl font-bold text-transparent bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text mt-2 animate-pulse-slow">
                {samples.filter(s => s.analyses?.[0]?.metrics?.ai_detection_score && s.analyses[0].metrics.ai_detection_score > 50).length}
              </div>
              <div className="text-xs text-forest-400 mt-1">Likely AI-generated</div>
            </div>
            <div className="bg-forest-900 border border-forest-800 rounded-xl shadow-sm p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 animate-fade-in" style={{animationDelay: '0.2s'}}>
              <div className="text-sm font-medium text-forest-300">Human Verified</div>
              <div className="text-3xl font-bold text-transparent bg-gradient-to-r from-sage-400 to-earth-400 bg-clip-text mt-2 animate-pulse-slow">
                {samples.filter(s => s.analyses?.[0]?.metrics?.ai_detection_score && s.analyses[0].metrics.ai_detection_score <= 20).length}
              </div>
              <div className="text-xs text-forest-400 mt-1">
                {profile?.is_founder ? 'Unlimited forever' : 'Likely human-written'}
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div className="lg:col-span-1">
            <div className="bg-forest-900 border border-forest-800 rounded-xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 animate-fade-in" style={{animationDelay: '0.3s'}}>
              <h2 className="text-xl font-bold mb-4 text-forest-50 flex items-center gap-2">
                <span className="w-2 h-2 bg-sage-500 rounded-full animate-pulse"></span>
                Upload Sample
              </h2>
              <UploadForm />
            </div>
          </div>

          {/* Recent Samples */}
          <div className="lg:col-span-2">
            <div className="bg-forest-900 border border-forest-800 rounded-xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 animate-fade-in" style={{animationDelay: '0.4s'}}>
              <h2 className="text-xl font-bold mb-4 text-forest-50 flex items-center gap-2">
                <span className="w-2 h-2 bg-earth-500 rounded-full animate-pulse"></span>
                Recent Detections
              </h2>
              
              {samples.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📤</div>
                  <p className="text-forest-300 mb-4">No samples yet</p>
                  <p className="text-sm text-forest-400">Upload your first sample to get started!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {samples.map((sample, index) => {
                    const analysis = sample.analyses?.[0]
                    const aiScore = analysis?.metrics?.ai_detection_score || 0
                    const isExpanded = expandedSamples.has(sample.id)

                    return (
                      <div 
                        key={sample.id} 
                        className="border border-forest-700 bg-forest-800/30 rounded-lg hover:shadow-lg hover:border-sage-700/50 transition-all duration-300 overflow-hidden animate-fade-in"
                        style={{animationDelay: `${index * 0.1}s`}}
                      >
                        {/* Main Sample Info */}
                        <div 
                          className="p-4 cursor-pointer hover:bg-forest-700/20 transition-colors"
                          onClick={() => toggleSampleExpansion(sample.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sage-900/50 text-sage-300 border border-sage-700 capitalize">
                                  {sample.type}
                                </span>
                                {analysis && (
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    analysis.status === 'done' ? 'bg-sage-900/50 text-sage-300 border border-sage-700' :
                                    analysis.status === 'processing' ? 'bg-earth-900/50 text-earth-300 border border-earth-700 animate-pulse' :
                                    analysis.status === 'queued' ? 'bg-earth-900/50 text-earth-300 border border-earth-700' :
                                    'bg-forest-800 text-forest-300 border border-forest-700'
                                  }`}>
                                    {analysis.status}
                                  </span>
                                )}
                                {/* Expand/Collapse Icon */}
                                <svg 
                                  className={`w-4 h-4 text-forest-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                              <h3 className="font-semibold text-forest-50 flex items-center gap-2">
                                {sample.title}
                                {analysis?.status === 'done' && (
                                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                                    aiScore <= 20 ? 'bg-sage-500' :    
                                    aiScore <= 50 ? 'bg-earth-500' :   
                                    'bg-red-500'                        
                                  }`} />
                                )}
                              </h3>
                              <p className="text-xs text-forest-400 mt-1">{sample.filename}</p>
                            </div>
                            
                            {/* AI Detection Score */}
                            {analysis?.status === 'done' && (
                              <div className="text-right">
                                <div className="flex items-center gap-2">
                                  <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                    aiScore <= 20 ? 'bg-sage-900/50 text-sage-300 border-sage-600' :
                                    aiScore <= 50 ? 'bg-earth-900/50 text-earth-300 border-earth-600' :
                                    'bg-red-900/50 text-red-300 border-red-600'
                                  }`}>
                                    {aiScore <= 20 ? '✓ Human' : aiScore <= 50 ? '⚠️ Uncertain' : '🤖 AI Detected'}
                                  </div>
                                  <span className="text-sm font-mono text-forest-300">
                                    {aiScore.toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="mt-2 text-xs text-forest-400">
                            {new Date(sample.created_at).toLocaleString()}
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="border-t border-forest-700 bg-forest-800/50 p-4 animate-fade-in">
                            <div className="space-y-4">
                              {/* AI Detection Details */}
                              {analysis?.metrics && (
                                <div>
                                  <h4 className="font-semibold text-forest-50 mb-2 flex items-center gap-2">
                                    🤖 AI Detection Analysis
                                  </h4>
                                  <div className="bg-forest-900/50 rounded-lg p-3 border border-forest-700">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs text-forest-400">Confidence Score:</span>
                                      <span className="font-mono text-sm text-forest-200">{aiScore.toFixed(1)}%</span>
                                    </div>
                                    {analysis.metrics.ai_detection_reasoning && (
                                      <div>
                                        <span className="text-xs text-forest-400 block mb-1">Reasoning:</span>
                                        <p className="text-sm text-forest-300 italic">
                                          "{analysis.metrics.ai_detection_reasoning}"
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Sample Preview */}
                              {sample.content && (
                                <div>
                                  <h4 className="font-semibold text-forest-50 mb-2 flex items-center gap-2">
                                    📄 Sample Preview
                                  </h4>
                                  <div className="bg-forest-950/50 rounded-lg p-3 border border-forest-700 max-h-32 overflow-y-auto">
                                    <pre className="text-xs text-forest-300 whitespace-pre-wrap font-mono">
                                      {sample.content?.slice(0, 500)}
                                      {sample.content && sample.content.length > 500 ? '...' : ''}
                                    </pre>
                                  </div>
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex gap-2">
                                <Link 
                                  href={`/upload?view=${sample.id}`}
                                  className="px-3 py-1 bg-sage-900/50 hover:bg-sage-800/50 text-sage-300 text-xs rounded border border-sage-700 transition-colors"
                                >
                                  View Full Details
                                </Link>
                                {analysis?.status === 'done' && (
                                  <button className="px-3 py-1 bg-earth-900/50 hover:bg-earth-800/50 text-earth-300 text-xs rounded border border-earth-700 transition-colors">
                                    Re-analyze
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
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
