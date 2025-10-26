'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PostJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [organizationId, setOrganizationId] = useState<string>('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    jobType: 'full-time',
    experienceLevel: 'mid',
    location: '',
    remoteAllowed: false,
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: 'USD',
    requiredSkills: '',
    niceToHaveSkills: '',
    status: 'draft'
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*, organization_members(organization_id)')
      .eq('id', user.id)
      .single();

    if (profileData?.user_type !== 'employer') {
      alert('Only employers can post jobs');
      router.push('/');
      return;
    }

    setProfile(profileData);
    
    // Get organization ID
    const orgMember = profileData.organization_members?.[0];
    if (orgMember) {
      setOrganizationId(orgMember.organization_id);
    } else {
      alert('You must be part of an organization to post jobs');
      router.push('/employer/dashboard');
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  async function handleSubmit(e: React.FormEvent, publish: boolean = false) {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const jobData = {
        employer_id: user.id,
        organization_id: organizationId,
        title: formData.title,
        description: formData.description,
        job_type: formData.jobType,
        experience_level: formData.experienceLevel,
        location: formData.location || null,
        remote_allowed: formData.remoteAllowed,
        salary_min: formData.salaryMin ? parseInt(formData.salaryMin) : null,
        salary_max: formData.salaryMax ? parseInt(formData.salaryMax) : null,
        salary_currency: formData.salaryCurrency,
        required_skills: formData.requiredSkills
          .split(',')
          .map(s => s.trim())
          .filter(s => s.length > 0),
        nice_to_have_skills: formData.niceToHaveSkills
          .split(',')
          .map(s => s.trim())
          .filter(s => s.length > 0),
        status: publish ? 'published' : 'draft',
        published_at: publish ? new Date().toISOString() : null
      };

      const { data, error } = await supabase
        .from('job_postings')
        .insert(jobData)
        .select()
        .single();

      if (error) throw error;

      alert(publish ? 'Job posted successfully!' : 'Draft saved!');
      router.push('/employer/dashboard');
    } catch (error: any) {
      console.error('Error posting job:', error);
      alert(error.message || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  }

  if (!profile) {
    return <div className="container mx-auto p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Post a Job</h1>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {/* Job Title */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Job Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            placeholder="e.g. Senior Frontend Developer"
          />
        </div>

        {/* Job Description */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Job Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={10}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            placeholder="Describe the role, responsibilities, and what makes this opportunity unique..."
          />
        </div>

        {/* Job Type & Experience Level */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Job Type *
            </label>
            <select
              name="jobType"
              value={formData.jobType}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="full-time">Full-Time</option>
              <option value="part-time">Part-Time</option>
              <option value="contract">Contract</option>
              <option value="freelance">Freelance</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Experience Level *
            </label>
            <select
              name="experienceLevel"
              value={formData.experienceLevel}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="entry">Entry Level</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior Level</option>
              <option value="lead">Lead/Principal</option>
            </select>
          </div>
        </div>

        {/* Location & Remote */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              placeholder="e.g. New York, NY or Remote"
            />
          </div>

          <div className="flex items-center pt-8">
            <input
              type="checkbox"
              name="remoteAllowed"
              id="remoteAllowed"
              checked={formData.remoteAllowed}
              onChange={handleChange}
              className="w-4 h-4 mr-2"
            />
            <label htmlFor="remoteAllowed" className="text-sm font-medium">
              Remote work allowed
            </label>
          </div>
        </div>

        {/* Salary Range */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Salary Range (Annual)
          </label>
          <div className="grid grid-cols-3 gap-4">
            <input
              type="number"
              name="salaryMin"
              value={formData.salaryMin}
              onChange={handleChange}
              className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              placeholder="Min"
            />
            <input
              type="number"
              name="salaryMax"
              value={formData.salaryMax}
              onChange={handleChange}
              className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              placeholder="Max"
            />
            <select
              name="salaryCurrency"
              value={formData.salaryCurrency}
              onChange={handleChange}
              className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="CAD">CAD</option>
            </select>
          </div>
          <p className="text-sm text-gray-500 mt-1">Leave blank if not disclosed</p>
        </div>

        {/* Required Skills */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Required Skills *
          </label>
          <input
            type="text"
            name="requiredSkills"
            value={formData.requiredSkills}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            placeholder="e.g. React, TypeScript, Node.js (comma-separated)"
          />
          <p className="text-sm text-gray-500 mt-1">Separate skills with commas</p>
        </div>

        {/* Nice to Have Skills */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Nice to Have Skills
          </label>
          <input
            type="text"
            name="niceToHaveSkills"
            value={formData.niceToHaveSkills}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            placeholder="e.g. GraphQL, AWS, Docker (comma-separated)"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save as Draft'}
          </button>
          
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Publishing...' : 'Publish Job'}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
