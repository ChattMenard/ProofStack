'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

interface JobPosting {
  id: string
  title: string
  description: string
  job_type: string
  experience_level: string
  location: string | null
  remote_allowed: boolean
  salary_min: number | null
  salary_max: number | null
  salary_currency: string
  required_skills: string[]
  status: string
  published_at: string | null
  applications_count: number
  views_count: number
  created_at: string
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function MyJobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
  })

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setCurrentUser(user)
    loadJobs(user.id)
  }

  async function loadJobs(userId: string) {
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('employer_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setJobs(data || [])

      // Calculate stats
      const totalJobs = data?.length || 0
      const activeJobs = data?.filter(j => j.status === 'published').length || 0
      const totalApplications = data?.reduce((sum, j) => sum + (j.applications_count || 0), 0) || 0

      setStats({
        totalJobs,
        activeJobs,
        totalApplications,
      })
    } catch (error) {
      console.error('Error loading jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  async function deleteJob(jobId: string) {
    if (!confirm('Are you sure you want to delete this job?')) return

    try {
      const { error } = await supabase
        .from('job_postings')
        .delete()
        .eq('id', jobId)

      if (error) throw error

      setJobs(jobs.filter(j => j.id !== jobId))
    } catch (error) {
      console.error('Error deleting job:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your jobs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Job Listings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your posted jobs and view applications
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.totalJobs}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Total Jobs Posted
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="text-3xl font-bold text-green-600">
              {stats.activeJobs}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Active Listings
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="text-3xl font-bold text-blue-600">
              {stats.totalApplications}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Total Applications
            </p>
          </div>
        </div>

        {/* Jobs List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-block p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No job listings yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start by posting your first job
              </p>
              <Link
                href="/employer/post-job"
                className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Post a Job
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {job.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Posted {new Date(job.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          job.status === 'published'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                    {job.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <span className="capitalize">{job.job_type.replace('-', ' ')}</span>
                    <span>•</span>
                    <span className="capitalize">{job.experience_level} Level</span>
                    <span>•</span>
                    <span>{job.applications_count} applications</span>
                    <span>•</span>
                    <span>{job.views_count} views</span>
                  </div>

                  {job.required_skills.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {job.required_skills.slice(0, 5).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                        {job.required_skills.length > 5 && (
                          <span className="px-2 py-1 text-gray-600 dark:text-gray-400 text-xs">
                            +{job.required_skills.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Link
                      href={`/projectlistings/${job.id}`}
                      className="flex-1 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-center"
                    >
                      View Public Listing
                    </Link>
                    <button
                      onClick={() => deleteJob(job.id)}
                      className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
