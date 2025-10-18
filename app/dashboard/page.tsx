'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
import { ensureUserProfile } from '../../lib/ensureProfile'
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
  created_at: string
  analyses?: Array<{
    status: string
    metrics?: { ai_detection_score?: number }
  }>
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [samples, setSamples] = useState<Sample[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Ensure user has a profile (will create if missing)
      const profileData = await ensureUserProfile()
      
      if (profileData) {
        setProfile(profileData)
      } else {
        // Fallback: try to load profile manually
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('auth_uid', user.id)
          .single()
        
        if (existingProfile) {
          setProfile(existingProfile)
        }
      }

      // Load samples only if we have a profile
      if (profileData) {
        const { data: samplesData } = await supabase
          .from('samples')
          .select(`
            *,
            analyses (
              status,
              metrics
            )
          `)
          .eq('owner_id', profileData.id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (samplesData) {
          setSamples(samplesData)
        }
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

  return (
    <div className="min-h-screen bg-forest-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-forest-900 border border-forest-800 rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-forest-50">Welcome back!</h1>
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
            <div className="bg-forest-900 border border-forest-800 rounded-xl shadow-sm p-6">
              <div className="text-sm font-medium text-forest-300">Total Samples</div>
              <div className="text-3xl font-bold text-forest-50 mt-2">{samples.length}</div>
              <div className="text-xs text-forest-400 mt-1">All uploads</div>
            </div>
            <div className="bg-forest-900 border border-forest-800 rounded-xl shadow-sm p-6">
              <div className="text-sm font-medium text-forest-300">Analyzed</div>
              <div className="text-3xl font-bold text-sage-400 mt-2">{completedSamples}</div>
              <div className="text-xs text-forest-400 mt-1">Completed analyses</div>
            </div>
            <div className="bg-forest-900 border border-forest-800 rounded-xl shadow-sm p-6">
              <div className="text-sm font-medium text-forest-300">Plan</div>
              <div className="text-3xl font-bold text-earth-400 mt-2 capitalize">
                {profile?.plan || 'Free'}
              </div>
              <div className="text-xs text-forest-400 mt-1">
                {profile?.is_founder ? 'Unlimited forever' : 'Current plan'}
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div className="lg:col-span-1">
            <div className="bg-forest-900 border border-forest-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4 text-forest-50">Upload Sample</h2>
              <UploadForm />
            </div>
          </div>

          {/* Recent Samples */}
          <div className="lg:col-span-2">
            <div className="bg-forest-900 border border-forest-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4 text-forest-50">Recent Samples</h2>
              
              {samples.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📤</div>
                  <p className="text-forest-300 mb-4">No samples yet</p>
                  <p className="text-sm text-forest-400">Upload your first sample to get started!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {samples.map(sample => {
                    const analysis = sample.analyses?.[0]
                    const aiScore = analysis?.metrics?.ai_detection_score || 0
                    const humanScore = 100 - aiScore

                    return (
                      <div key={sample.id} className="border border-forest-700 bg-forest-800/30 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sage-900/50 text-sage-300 border border-sage-700 capitalize">
                                {sample.type}
                              </span>
                              {analysis && (
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  analysis.status === 'done' ? 'bg-sage-900/50 text-sage-300 border border-sage-700' :
                                  analysis.status === 'processing' ? 'bg-earth-900/50 text-earth-300 border border-earth-700' :
                                  analysis.status === 'queued' ? 'bg-earth-900/50 text-earth-300 border border-earth-700' :
                                  'bg-forest-800 text-forest-300 border border-forest-700'
                                }`}>
                                  {analysis.status}
                                </span>
                              )}
                            </div>
                            <h3 className="font-semibold text-forest-50">{sample.title}</h3>
                            <p className="text-xs text-forest-400 mt-1">{sample.filename}</p>
                          </div>
                          {analysis?.status === 'done' && (
                            <div className="text-right">
                              <div className="text-sm font-semibold text-forest-50">
                                {humanScore.toFixed(0)}% Human
                              </div>
                              <div className={`w-2 h-2 rounded-full mx-auto mt-1 ${
                                humanScore >= 80 ? 'bg-sage-500' : 
                                humanScore >= 50 ? 'bg-earth-500' : 
                                'bg-red-500'
                              }`} />
                            </div>
                          )}
                        </div>
                        <div className="mt-2 text-xs text-forest-400">
                          {new Date(sample.created_at).toLocaleString()}
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
