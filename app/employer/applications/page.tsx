'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface JobWithApplications {
  id: string;
  title: string;
  status: string;
  published_at: string;
  views_count: number;
  applications_count: number;
}

interface Application {
  id: string;
  status: string;
  applied_at: string;
  professional: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
    bio: string | null;
    location: string | null;
  };
}

export default function JobApplicationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<JobWithApplications[]>([]);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    newApplications: 0
  });

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (selectedJob) {
      loadApplications(selectedJob);
    }
  }, [selectedJob]);

  async function loadJobs() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Load jobs with application counts
      const { data: jobsData, error: jobsError } = await supabase
        .from('job_postings')
        .select('id, title, status, published_at, views_count, applications_count')
        .eq('employer_id', user.id)
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      setJobs(jobsData || []);

      // Calculate stats
      const totalJobs = jobsData?.length || 0;
      const activeJobs = jobsData?.filter(j => j.status === 'published').length || 0;
      const totalApplications = jobsData?.reduce((sum, j) => sum + (j.applications_count || 0), 0) || 0;

      setStats({
        totalJobs,
        activeJobs,
        totalApplications,
        newApplications: totalApplications
      });

      // Auto-select first job with applications
      const firstJobWithApps = jobsData?.find(j => j.applications_count > 0);
      if (firstJobWithApps) {
        setSelectedJob(firstJobWithApps.id);
      }

    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadApplications(jobId: string) {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          id,
          status,
          applied_at,
          professional:profiles!professional_id(
            id,
            full_name,
            username,
            avatar_url,
            bio,
            location
          )
        `)
        .eq('job_id', jobId)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error loading applications:', error);
    }
  }

  async function updateApplicationStatus(applicationId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ 
          status: newStatus,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) throw error;

      // Reload applications
      if (selectedJob) {
        loadApplications(selectedJob);
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert(error.message || 'Failed to update status');
    }
  }

  async function updateJobStatus(jobId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('job_postings')
        .update({ status: newStatus })
        .eq('id', jobId);

      if (error) throw error;

      // Reload jobs
      loadJobs();
    } catch (error: any) {
      console.error('Error updating job status:', error);
      alert(error.message || 'Failed to update job status');
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'reviewing': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'shortlisted': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'accepted': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Job Applications
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Manage applications to your job postings
              </p>
            </div>
            <Link
              href="/employer/post-job"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              ➕ Post New Job
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Jobs</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalJobs}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Jobs</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.activeJobs}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Applications</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalApplications}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">New Applications</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.newApplications}</p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Jobs List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Jobs</h2>
              
              {jobs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">No jobs posted yet</p>
                  <Link
                    href="/employer/post-job"
                    className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                  >
                    Post Your First Job
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJob(job.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedJob === job.id
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{job.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          job.status === 'published' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>{job.applications_count} applications</span>
                        <span>•</span>
                        <span>{job.views_count} views</span>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Link
                          href={`/projectlistings/${job.id}`}
                          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View
                        </Link>
                        {job.status === 'published' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateJobStatus(job.id, 'closed');
                            }}
                            className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
                          >
                            Close
                          </button>
                        )}
                        {job.status === 'closed' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateJobStatus(job.id, 'published');
                            }}
                            className="text-xs text-green-600 hover:text-green-700 dark:text-green-400"
                          >
                            Reopen
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Applications Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Applications
                {selectedJob && ` (${applications.length})`}
              </h2>

              {!selectedJob ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400">Select a job to view applications</p>
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400">No applications yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {app.professional.avatar_url ? (
                            <img
                              src={app.professional.avatar_url}
                              alt={app.professional.full_name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold">
                              {app.professional.full_name.charAt(0)}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {app.professional.full_name}
                              </h3>
                              {app.professional.location && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {app.professional.location}
                                </p>
                              )}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                              {app.status}
                            </span>
                          </div>

                          {app.professional.bio && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
                              {app.professional.bio}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-2 mb-3">
                            <Link
                              href={`/portfolio/${app.professional.username}`}
                              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                            >
                              View Portfolio →
                            </Link>
                            <span className="text-sm text-gray-400">•</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Applied {new Date(app.applied_at).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            {app.status === 'submitted' && (
                              <>
                                <button
                                  onClick={() => updateApplicationStatus(app.id, 'reviewing')}
                                  className="px-3 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 dark:text-yellow-300 rounded text-sm transition-colors"
                                >
                                  Mark Reviewing
                                </button>
                                <button
                                  onClick={() => updateApplicationStatus(app.id, 'shortlisted')}
                                  className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-300 rounded text-sm transition-colors"
                                >
                                  Shortlist
                                </button>
                                <button
                                  onClick={() => updateApplicationStatus(app.id, 'rejected')}
                                  className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300 rounded text-sm transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {app.status === 'reviewing' && (
                              <>
                                <button
                                  onClick={() => updateApplicationStatus(app.id, 'shortlisted')}
                                  className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-300 rounded text-sm transition-colors"
                                >
                                  Shortlist
                                </button>
                                <button
                                  onClick={() => updateApplicationStatus(app.id, 'rejected')}
                                  className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300 rounded text-sm transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {app.status === 'shortlisted' && (
                              <>
                                <button
                                  onClick={() => updateApplicationStatus(app.id, 'accepted')}
                                  className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 dark:text-purple-300 rounded text-sm transition-colors"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => updateApplicationStatus(app.id, 'rejected')}
                                  className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300 rounded text-sm transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
