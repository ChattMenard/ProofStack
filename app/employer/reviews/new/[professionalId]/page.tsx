'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function NewReviewPage() {
  const params = useParams();
  const router = useRouter();
  const professionalId = params?.professionalId as string;

  const [professional, setProfessional] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    rating: 5,
    review_text: '',
    would_hire_again: true,
    position_title: '',
    work_start_date: '',
    work_end_date: '',
    skills_demonstrated: [] as string[]
  });

  const [skillInput, setSkillInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfessional();
  }, [professionalId]);

  const loadProfessional = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, headline')
        .eq('id', professionalId)
        .single();

      if (error) throw error;
      setProfessional(data);
    } catch (err: any) {
      setError('Failed to load professional profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills_demonstrated.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills_demonstrated: [...prev.skills_demonstrated, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills_demonstrated: prev.skills_demonstrated.filter(s => s !== skill)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.review_text.trim()) {
      setError('Please write a review');
      return;
    }

    if (formData.review_text.length > 500) {
      setError('Review must be 500 characters or less');
      return;
    }

    if (!formData.position_title.trim()) {
      setError('Please enter the position title');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/signin');
        return;
      }

      const response = await fetch('/api/reviews/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employer_id: user.id,
          professional_id: professionalId,
          ...formData
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit review');
      }

      router.push(`/portfolio/${professional.username}?reviewSubmitted=true`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Professional Not Found</h2>
          <Link href="/employer/discover" className="text-blue-600 hover:underline">
            Back to Discover
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/portfolio/${professional.username}`} className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Profile
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Write a Review
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            for <span className="font-semibold">{professional.username}</span>
            {professional.headline && ` - ${professional.headline}`}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Star Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Overall Rating *
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                  className="focus:outline-none"
                >
                  <svg
                    className={`w-10 h-10 ${
                      star <= formData.rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
              <span className="ml-2 text-gray-600 dark:text-gray-400 self-center">
                {formData.rating} {formData.rating === 1 ? 'star' : 'stars'}
              </span>
            </div>
          </div>

          {/* Review Text */}
          <div>
            <label htmlFor="review_text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Review * <span className="text-gray-500 text-xs">({formData.review_text.length}/500 characters)</span>
            </label>
            <textarea
              id="review_text"
              value={formData.review_text}
              onChange={(e) => setFormData(prev => ({ ...prev, review_text: e.target.value }))}
              placeholder="Share your experience working with this professional..."
              rows={6}
              maxLength={500}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {/* Would Hire Again */}
          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.would_hire_again}
                onChange={(e) => setFormData(prev => ({ ...prev, would_hire_again: e.target.checked }))}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                I would hire this professional again
              </span>
            </label>
          </div>

          {/* Position Title */}
          <div>
            <label htmlFor="position_title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Position Title *
            </label>
            <input
              type="text"
              id="position_title"
              value={formData.position_title}
              onChange={(e) => setFormData(prev => ({ ...prev, position_title: e.target.value }))}
              placeholder="e.g., Senior Full-Stack Developer"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {/* Work Period */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="work_start_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="work_start_date"
                value={formData.work_start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, work_start_date: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="work_end_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                id="work_end_date"
                value={formData.work_end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, work_end_date: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Skills Demonstrated */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Skills Demonstrated
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="Add a skill and press Enter"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Add
              </button>
            </div>
            {formData.skills_demonstrated.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.skills_demonstrated.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm flex items-center gap-2"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
            <Link
              href={`/portfolio/${professional.username}`}
              className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </Link>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            You can edit your review within 48 hours of submission
          </p>
        </form>
      </div>
    </div>
  );
}
