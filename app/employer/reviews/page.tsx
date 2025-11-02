'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface Review {
  id: string;
  created_at: string;
  professional_id: string;
  rating: number;
  communication_rating: number;
  technical_rating: number;
  professionalism_rating: number;
  would_hire_again: boolean;
  review_text: string;
  response_time_rating: number;
  quality_rating: number;
  professional?: {
    full_name: string;
    username: string;
  };
}

export default function EmployerReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [employerId, setEmployerId] = useState<string | null>(null);

  useEffect(() => {
    loadEmployerReviews();
  }, []);

  const loadEmployerReviews = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get employer profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_uid', user.id)
        .eq('user_type', 'employer')
        .single();

      if (!profile) return;
      setEmployerId(profile.id);

      // Get reviews created by this employer
      const { data: reviewsData, error } = await supabase
        .from('employer_reviews')
        .select(`
          *,
          professional:profiles!employer_reviews_professional_id_fkey(
            full_name,
            username
          )
        `)
        .eq('employer_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(reviewsData || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sage-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            ⭐ My Reviews
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Reviews you've written for talent you've worked with
          </p>
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              No reviews yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              When you work with talent and leave reviews, they'll appear here.
            </p>
            <Link
              href="/employer/discover"
              className="inline-block px-6 py-3 bg-sage-600 text-white rounded-lg hover:bg-sage-700 transition-colors"
            >
              Discover Talent
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                {/* Review Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Link
                      href={`/portfolio/${review.professional?.username}`}
                      className="text-xl font-semibold text-gray-900 dark:text-white hover:text-sage-600 dark:hover:text-sage-400"
                    >
                      {review.professional?.full_name || 'Unknown Professional'}
                    </Link>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(review.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-sage-600 dark:text-sage-400">
                      {review.rating.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Overall
                    </div>
                  </div>
                </div>

                {/* Review Ratings */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Communication</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {review.communication_rating}/5
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Technical</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {review.technical_rating}/5
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Quality</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {review.quality_rating}/5
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Response Time</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {review.response_time_rating}/5
                    </div>
                  </div>
                </div>

                {/* Review Text */}
                {review.review_text && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {review.review_text}
                    </p>
                  </div>
                )}

                {/* Hire Again Badge */}
                {review.would_hire_again && (
                  <div className="mt-4">
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                      ✓ Would hire again
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
