'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Review {
  id: string;
  employer_id: string;
  rating: number;
  review_text: string;
  created_at: string;
  employer: {
    name: string;
    industry?: string;
  };
}

interface AggregateRatings {
  overall_rating: number;
  total_reviews: number;
  communication_rating: number;
  skill_rating: number;
  professionalism_rating: number;
}

export default function ProfessionalReviewsPage() {
  const [user, setUser] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [aggregateRatings, setAggregateRatings] = useState<AggregateRatings | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all');

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadReviews();
      loadAggregateRatings();
    }
  }, [user, filter]);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
    }
  };

  const loadReviews = async () => {
    if (!user) return;

    setLoading(true);
    let query = supabase
      .from('reviews')
      .select(`
        id,
        employer_id,
        rating,
        review_text,
        created_at,
        organizations!employer_id (
          name,
          industry
        )
      `)
      .eq('professional_id', user.id)
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('rating', parseInt(filter));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading reviews:', error);
    } else {
      setReviews(data as any || []);
    }
    setLoading(false);
  };

  const loadAggregateRatings = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('professional_ratings')
      .select('*')
      .eq('professional_id', user.id)
      .single();

    if (!error && data) {
      setAggregateRatings(data);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">⭐ Your Reviews</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            View feedback from employers who've worked with you
          </p>
        </div>

        {/* Aggregate Ratings */}
        {aggregateRatings && aggregateRatings.total_reviews > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border-2 border-blue-500">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  {aggregateRatings.overall_rating.toFixed(1)}
                </div>
                <div className="mt-2">{renderStars(Math.round(aggregateRatings.overall_rating))}</div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {aggregateRatings.total_reviews} {aggregateRatings.total_reviews === 1 ? 'review' : 'reviews'}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Communication</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {aggregateRatings.communication_rating.toFixed(1)}
              </div>
              <div className="mt-2">{renderStars(Math.round(aggregateRatings.communication_rating))}</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Skills</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {aggregateRatings.skill_rating.toFixed(1)}
              </div>
              <div className="mt-2">{renderStars(Math.round(aggregateRatings.skill_rating))}</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Professionalism</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {aggregateRatings.professionalism_rating.toFixed(1)}
              </div>
              <div className="mt-2">{renderStars(Math.round(aggregateRatings.professionalism_rating))}</div>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="mb-6">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
              }`}
            >
              All Reviews
            </button>
            {[5, 4, 3, 2, 1].map((rating) => (
              <button
                key={rating}
                onClick={() => setFilter(rating.toString() as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === rating.toString()
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                }`}
              >
                {rating} ⭐
              </button>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              {filter === 'all' ? 'No reviews yet' : `No ${filter}-star reviews`}
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {filter === 'all'
                ? "When employers leave reviews about your work, they'll appear here. Keep promoting your portfolio to get discovered!"
                : `You don't have any ${filter}-star reviews. Try selecting a different filter.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {(review as any).organizations?.name || 'Anonymous'}
                    </h3>
                    {(review as any).organizations?.industry && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {(review as any).organizations.industry}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {renderStars(review.rating)}
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {review.review_text && (
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    "{review.review_text}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
