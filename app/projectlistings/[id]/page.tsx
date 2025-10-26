'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface JobPosting {
  id: string;
  title: string;
  description: string;
  job_type: string;
  experience_level: string;
  location: string | null;
  remote_allowed: boolean;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  required_skills: string[];
  nice_to_have_skills: string[];
  published_at: string;
  applications_count: number;
  views_count: number;
  organization: {
    name: string;
    logo_url: string | null;
    website: string | null;
  };
  employer: {
    full_name: string;
  };
}

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    loadJob();
    checkUser();
    incrementViewCount();
  }, [params.id]);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUser(user);
      
      // Check if user has already applied
      const { data } = await supabase
        .from('job_applications')
        .select('id')
        .eq('job_id', params.id)
        .eq('professional_id', user.id)
        .single();
      
      setHasApplied(!!data);
    }
  }

  async function loadJob() {
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select(`
          *,
          organization:organizations(name, logo_url, website),
          employer:profiles!employer_id(full_name)
        `)
        .eq('id', params.id)
        .eq('status', 'published')
        .single();

      if (error) throw error;
      setJob(data);
    } catch (error) {
      console.error('Error loading job:', error);
      alert('Job not found');
      router.push('/projectlistings');
    } finally {
      setLoading(false);
    }
  }

  async function incrementViewCount() {
    try {
      await supabase.rpc('increment', {
        table_name: 'job_postings',
        row_id: params.id,
        column_name: 'views_count'
      });
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  }

  async function handleApply() {
    if (!currentUser) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    setApplying(true);
    try {
      const { error } = await supabase
        .from('job_applications')
        .insert({
          job_id: params.id,
          professional_id: currentUser.id,
          status: 'submitted'
        });

      if (error) throw error;

      alert('Application submitted successfully!');
      setHasApplied(true);
    } catch (error: any) {
      console.error('Error applying:', error);
      alert(error.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading job...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href="/projectlistings"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 mb-6"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Jobs
        </Link>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          {/* Header */}
          <div className="p-8 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  {job.title}
                </h1>
                <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400 mb-4">
                  {job.organization.logo_url && (
                    <img
                      src={job.organization.logo_url}
                      alt={job.organization.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {job.organization.name}
                    </div>
                    {job.organization.website && (
                      <a
                        href={job.organization.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        Visit website →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {job.location || 'Location not specified'}
              </div>
              {job.remote_allowed && (
                <div className="flex items-center text-green-600 dark:text-green-400">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Remote OK
                </div>
              )}
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="capitalize">{job.job_type.replace('-', ' ')}</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="capitalize">{job.experience_level} Level</span>
              </div>
            </div>

            {job.salary_min && job.salary_max && (
              <div className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
                ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()} {job.salary_currency}
              </div>
            )}
          </div>

          {/* Apply Button */}
          <div className="p-8 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            {hasApplied ? (
              <div className="flex items-center justify-center gap-2 px-8 py-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-semibold">You've already applied to this job</span>
              </div>
            ) : (
              <button
                onClick={handleApply}
                disabled={applying}
                className="w-full px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors disabled:opacity-50"
              >
                {applying ? 'Submitting...' : currentUser ? 'Apply Now' : 'Sign In to Apply'}
              </button>
            )}
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
              {job.applications_count} application{job.applications_count !== 1 ? 's' : ''} • {job.views_count} views
            </p>
          </div>

          {/* Job Description */}
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Job Description
            </h2>
            <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
              {job.description}
            </div>
          </div>

          {/* Required Skills */}
          {job.required_skills.length > 0 && (
            <div className="p-8 border-t border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Required Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.required_skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Nice to Have Skills */}
          {job.nice_to_have_skills.length > 0 && (
            <div className="p-8 border-t border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Nice to Have
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.nice_to_have_skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Apply Button Bottom */}
          <div className="p-8 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
            {hasApplied ? (
              <div className="flex items-center justify-center gap-2 px-8 py-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-semibold">You've already applied to this job</span>
              </div>
            ) : (
              <button
                onClick={handleApply}
                disabled={applying}
                className="w-full px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors disabled:opacity-50"
              >
                {applying ? 'Submitting...' : currentUser ? 'Apply Now' : 'Sign In to Apply'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
