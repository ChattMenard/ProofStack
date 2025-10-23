'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface WorkSample {
  id: string;
  title: string | null;
  description: string | null;
  content_type: 'code' | 'writing' | 'design_doc' | 'technical_spec';
  language: string | null;
  confidentiality_level: 'public' | 'encrypted' | 'redacted';
  content: string;
  redacted_content: string | null;
  overall_quality_score: number | null;
  code_quality_score: number | null;
  technical_depth_score: number | null;
  problem_solving_score: number | null;
  documentation_quality_score: number | null;
  best_practices_score: number | null;
  writing_clarity_score: number | null;
  technical_accuracy_score: number | null;
  ai_feedback: any;
  verified: boolean;
  verified_at: string | null;
  created_at: string;
  professional_id: string;
  employer_id: string;
  review_id: string | null;
  professional?: {
    full_name: string;
    email: string;
  };
  employer?: {
    full_name: string;
    email: string;
  };
}

export default function WorkSamplePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [sample, setSample] = useState<WorkSample | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullContent, setShowFullContent] = useState(false);

  useEffect(() => {
    loadWorkSample();
  }, [params.id]);

  const loadWorkSample = async () => {
    try {
      const { data, error } = await supabase
        .from('work_samples')
        .select(`
          *,
          professional:profiles!professional_id(full_name, email),
          employer:profiles!employer_id(full_name, email)
        `)
        .eq('id', params.id)
        .eq('verified', true)
        .single();

      if (error) throw error;
      
      if (!data) {
        setError('Work sample not found or not yet verified');
        return;
      }

      setSample(data);
    } catch (err: any) {
      console.error('Error loading work sample:', err);
      setError(err.message || 'Failed to load work sample');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'code': return '💻';
      case 'writing': return '📝';
      case 'design_doc': return '🎨';
      case 'technical_spec': return '📋';
      default: return '📄';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'code': return 'Code Sample';
      case 'writing': return 'Writing Sample';
      case 'design_doc': return 'Design Document';
      case 'technical_spec': return 'Technical Specification';
      default: return 'Work Sample';
    }
  };

  const renderScore = (label: string, value: number | null) => {
    if (value === null) return null;

    const percentage = (value / 10) * 100;
    const color = value >= 8 ? 'bg-green-500' : value >= 6 ? 'bg-blue-500' : value >= 4 ? 'bg-yellow-500' : 'bg-red-500';

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">{value.toFixed(1)}/10</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`${color} h-2 rounded-full transition-all`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading work sample...</p>
        </div>
      </div>
    );
  }

  if (error || !sample) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {error || 'Work Sample Not Found'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This work sample may not exist or hasn't been verified yet.
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const displayContent = sample.confidentiality_level === 'redacted' && sample.redacted_content
    ? sample.redacted_content
    : sample.confidentiality_level === 'encrypted'
    ? '[Content Encrypted - Contact employer for access]'
    : sample.content;

  const hasCodeScores = sample.code_quality_score !== null;
  const hasWritingScores = sample.writing_clarity_score !== null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">{getTypeIcon(sample.content_type)}</span>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {sample.title || getTypeLabel(sample.content_type)}
                      </h1>
                      {sample.language && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {sample.language}
                        </span>
                      )}
                    </div>
                  </div>
                  {sample.description && (
                    <p className="text-gray-700 dark:text-gray-300 mt-2">{sample.description}</p>
                  )}
                </div>

                {sample.verified && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-green-700 dark:text-green-300 font-semibold text-sm">Verified</span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Content</h2>
                  {displayContent.length > 500 && (
                    <button
                      onClick={() => setShowFullContent(!showFullContent)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {showFullContent ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </div>
                <div className={`bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 ${sample.content_type === 'code' ? 'font-mono text-sm' : ''}`}>
                  <pre className="whitespace-pre-wrap break-words text-gray-900 dark:text-gray-100">
                    {showFullContent ? displayContent : displayContent.substring(0, 500) + (displayContent.length > 500 ? '...' : '')}
                  </pre>
                </div>
              </div>
            </div>

            {sample.ai_feedback && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  AI Analysis Feedback
                </h2>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300">
                    {typeof sample.ai_feedback === 'string' 
                      ? sample.ai_feedback 
                      : JSON.stringify(sample.ai_feedback, null, 2)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {sample.overall_quality_score !== null && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    {sample.overall_quality_score.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Overall Quality Score</div>
                </div>

                <div className="space-y-4">
                  {hasCodeScores && (
                    <>
                      {renderScore('Code Quality', sample.code_quality_score)}
                      {renderScore('Technical Depth', sample.technical_depth_score)}
                      {renderScore('Problem Solving', sample.problem_solving_score)}
                      {renderScore('Best Practices', sample.best_practices_score)}
                      {renderScore('Documentation', sample.documentation_quality_score)}
                    </>
                  )}
                  {hasWritingScores && (
                    <>
                      {renderScore('Writing Clarity', sample.writing_clarity_score)}
                      {renderScore('Technical Accuracy', sample.technical_accuracy_score)}
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Details</h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Professional:</span>
                  <div className="font-semibold text-gray-900 dark:text-white mt-1">
                    {sample.professional?.full_name || 'Unknown'}
                  </div>
                </div>

                <div>
                  <span className="text-gray-600 dark:text-gray-400">Submitted by:</span>
                  <div className="font-semibold text-gray-900 dark:text-white mt-1">
                    {sample.employer?.full_name || 'Unknown'}
                  </div>
                </div>

                <div>
                  <span className="text-gray-600 dark:text-gray-400">Type:</span>
                  <div className="font-semibold text-gray-900 dark:text-white mt-1">
                    {getTypeLabel(sample.content_type)}
                  </div>
                </div>

                <div>
                  <span className="text-gray-600 dark:text-gray-400">Privacy:</span>
                  <div className="mt-1">
                    {sample.confidentiality_level === 'public' && (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded text-xs">
                        Public
                      </span>
                    )}
                    {sample.confidentiality_level === 'redacted' && (
                      <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded text-xs">
                        Redacted
                      </span>
                    )}
                    {sample.confidentiality_level === 'encrypted' && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded text-xs">
                        Confidential
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-gray-600 dark:text-gray-400">Submitted:</span>
                  <div className="font-semibold text-gray-900 dark:text-white mt-1">
                    {new Date(sample.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              {sample.review_id && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    href={`/reviews/${sample.review_id}`}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-semibold transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    View Associated Review
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
