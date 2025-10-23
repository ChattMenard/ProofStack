'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import ReviewDetailModal from './ReviewDetailModal';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Review {
  id: string;
  rating: number;
  review_text: string;
  would_hire_again: boolean;
  position_title: string;
  work_start_date?: string;
  work_end_date?: string;
  skills_demonstrated?: string[];
  created_at: string;
  employer: {
    username: string;
    organization_id?: string;
    organization?: {
      name: string;
    };
  };
}

interface RatingStats {
  average_rating: number;
  total_reviews: number;
  five_star_count: number;
  four_star_count: number;
  three_star_count: number;
  two_star_count: number;
  one_star_count: number;
  would_hire_again_percentage: number;
}

interface ReviewsSectionProps {
  professionalId: string;
  professionalUsername: string;
  isOwnProfile?: boolean;
}

export default function ReviewsSection({
  professionalId,
  professionalUsername,
  isOwnProfile = false
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recent' | 'highest' | 'lowest'>('recent');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadReviews();
    loadStats();
  }, [professionalId]);

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('employer_reviews')
        .select(`
          id,
          rating,
          review_text,
          would_hire_again,
          position_title,
          work_start_date,
          work_end_date,
          skills_demonstrated,
          created_at,
          employer:profiles!employer_id (
            username,
            organization_id,
            organization:organizations!organization_id (
              name
            )
          )
        `)
        .eq('professional_id', professionalId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('professional_ratings')
        .select('*')
        .eq('professional_id', professionalId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" error - it's okay if no stats exist yet
        throw error;
      }

      setStats(data);
    } catch (error) {
      console.error('Failed to load rating stats:', error);
    }
  };

  const getSortedReviews = () => {
    const sorted = [...reviews];
    switch (sortBy) {
      case 'highest':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'lowest':
        return sorted.sort((a, b) => a.rating - b.rating);
      default:
        return sorted;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const formatWorkPeriod = (start?: string, end?: string) => {
    if (!start && !end) return null;
    const startStr = start ? formatDate(start) : 'Unknown';
    const endStr = end ? formatDate(end) : 'Present';
    return `${startStr} - ${endStr}`;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="text-gray-600 dark:text-gray-400">Loading reviews...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Overview */}
      {stats && stats.total_reviews > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Reviews & Ratings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Average Rating */}
            <div className="text-center md:border-r dark:border-gray-700">
              <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                {stats.average_rating.toFixed(1)}
              </div>
              <div className="flex justify-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-6 h-6 ${
                      i < Math.round(stats.average_rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Based on {stats.total_reviews} {stats.total_reviews === 1 ? 'review' : 'reviews'}
              </div>
              {stats.would_hire_again_percentage > 0 && (
                <div className="mt-4 text-green-600 dark:text-green-400 font-semibold">
                  ✓ {stats.would_hire_again_percentage.toFixed(0)}% would hire again
                </div>
              )}
            </div>

            {/* Right: Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const countsMap: Record<number, number> = {
                  5: stats.five_star_count || 0,
                  4: stats.four_star_count || 0,
                  3: stats.three_star_count || 0,
                  2: stats.two_star_count || 0,
                  1: stats.one_star_count || 0
                };
                const count = countsMap[star] || 0;
                const percentage = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-8">
                      {star} ★
                    </span>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-yellow-400 h-full rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            All Reviews ({reviews.length})
          </h3>
          {reviews.length > 1 && (
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="recent">Most Recent</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Reviews Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {isOwnProfile
                ? 'Your first review will appear here once an employer leaves one.'
                : `Be the first to leave a review for ${professionalUsername}!`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {getSortedReviews().map((review) => (
              <div
                key={review.id}
                className="border-b border-gray-200 dark:border-gray-700 last:border-0 pb-6 last:pb-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg p-4 -m-4 transition-colors"
                onClick={() => {
                  setSelectedReview(review);
                  setShowDetailModal(true);
                }}
              >
                {/* Review Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-5 h-5 ${
                            i < review.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {(review.employer as any)?.organization?.name || review.employer.username}
                      </span>
                      {' • '}
                      {new Date(review.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                  {review.would_hire_again && (
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm font-semibold">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Would Hire Again
                    </span>
                  )}
                </div>

                {/* Position & Work Period */}
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <span className="font-semibold">{review.position_title}</span>
                  {formatWorkPeriod(review.work_start_date, review.work_end_date) && (
                    <span> • {formatWorkPeriod(review.work_start_date, review.work_end_date)}</span>
                  )}
                </div>

                {/* Review Text */}
                <p className="text-gray-900 dark:text-white mb-3">{review.review_text}</p>

                {/* Skills Demonstrated */}
                {review.skills_demonstrated && review.skills_demonstrated.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {review.skills_demonstrated.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ReviewDetailModal 
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        review={selectedReview}
      />
    </div>
  );
}
