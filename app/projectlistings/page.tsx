'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

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
  organization: {
    name: string;
    logo_url: string | null;
  };
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ProjectListingsPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    jobType: 'all',
    experienceLevel: 'all',
    remoteOnly: false
  });

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    try {
      let query = supabase
        .from('job_postings')
        .select(`
          *,
          organization:organizations(name, logo_url)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      setJobs(data || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredJobs = jobs.filter(job => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        job.title.toLowerCase().includes(searchLower) ||
        job.description.toLowerCase().includes(searchLower) ||
        job.required_skills.some(skill => skill.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }

    // Job type filter
    if (filters.jobType !== 'all' && job.job_type !== filters.jobType) {
      return false;
    }

    // Experience level filter
    if (filters.experienceLevel !== 'all' && job.experience_level !== filters.experienceLevel) {
      return false;
    }

    // Remote filter
    if (filters.remoteOnly && !job.remote_allowed) {
      return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Hiring
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Browse {jobs.length} job{jobs.length !== 1 ? 's' : ''} from verified employers
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, skills, or description..."
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            {/* Job Type Filter */}
            <div>
              <select
                value={filters.jobType}
                onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="all">All Types</option>
                <option value="full-time">Full-Time</option>
                <option value="part-time">Part-Time</option>
                <option value="contract">Contract</option>
                <option value="freelance">Freelance</option>
              </select>
            </div>

            {/* Experience Level Filter */}
            <div>
              <select
                value={filters.experienceLevel}
                onChange={(e) => setFilters({ ...filters, experienceLevel: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="all">All Levels</option>
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior Level</option>
                <option value="lead">Lead/Principal</option>
              </select>
            </div>
          </div>

          {/* Remote Filter */}
          <div className="mt-4 flex items-center">
            <input
              type="checkbox"
              id="remoteOnly"
              checked={filters.remoteOnly}
              onChange={(e) => setFilters({ ...filters, remoteOnly: e.target.checked })}
              className="w-4 h-4 mr-2"
            />
            <label htmlFor="remoteOnly" className="text-sm font-medium">
              Remote jobs only
            </label>
          </div>
        </div>

        {/* Job Listings */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading jobs...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="inline-block p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                <svg
                  className="w-12 h-12 text-gray-400"
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
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No jobs found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your search or filters
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Link
                key={job.id}
                href={`/projectlistings/${job.id}`}
                className="block bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {job.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">{job.organization.name}</span>
                      <span>•</span>
                      <span>{job.location || 'Location not specified'}</span>
                      {job.remote_allowed && (
                        <>
                          <span>•</span>
                          <span className="text-green-600 dark:text-green-400">Remote OK</span>
                        </>
                      )}
                    </div>
                  </div>
                  {job.organization.logo_url && (
                    <img
                      src={job.organization.logo_url}
                      alt={job.organization.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                </div>

                <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
                  {job.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {job.required_skills.slice(0, 5).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                  {job.required_skills.length > 5 && (
                    <span className="px-3 py-1 text-gray-600 dark:text-gray-400 text-sm">
                      +{job.required_skills.length - 5} more
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center text-sm">
                  <div className="flex gap-4 text-gray-600 dark:text-gray-400">
                    <span className="capitalize">{job.job_type.replace('-', ' ')}</span>
                    <span>•</span>
                    <span className="capitalize">{job.experience_level} Level</span>
                    {job.salary_min && job.salary_max && (
                      <>
                        <span>•</span>
                        <span>
                          ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()} {job.salary_currency}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-gray-500">
                    {job.applications_count} application{job.applications_count !== 1 ? 's' : ''}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
