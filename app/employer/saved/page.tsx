 'use client';

import { useState, useEffect } from 'react';
import supabase from '@/lib/supabaseClient';
import Link from 'next/link';

interface SavedCandidate {
  id: string;
  professional_id: string;
  saved_at: string;
  notes?: string;
  profile: {
    username: string;
    full_name?: string;
    headline?: string;
    location?: string;
  };
  professional_ratings?: {
    average_rating: number;
    total_reviews: number;
  };
}

export default function SavedCandidatesPage() {
  const [user, setUser] = useState<any>(null);
  const [savedCandidates, setSavedCandidates] = useState<SavedCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadSavedCandidates();
    }
  }, [user]);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
    }
  };

  const loadSavedCandidates = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('saved_candidates')
      .select(`
        id,
        professional_id,
        saved_at,
        notes,
        profiles!professional_id (
          username,
          full_name,
          headline,
          location
        ),
        professional_ratings!professional_id (
          average_rating,
          total_reviews
        )
      `)
      .eq('employer_id', user.id)
      .order('saved_at', { ascending: false });

    if (error) {
      console.error('Error loading saved candidates:', error);
    } else {
      setSavedCandidates(data as any || []);
    }
    setLoading(false);
  };

  const handleUnsave = async (savedId: string) => {
    const { error } = await supabase
      .from('saved_candidates')
      .delete()
      .eq('id', savedId);

    if (!error) {
      setSavedCandidates(prev => prev.filter(s => s.id !== savedId));
    }
  };

  const handleAddNote = async (savedId: string, notes: string) => {
    const { error } = await supabase
      .from('saved_candidates')
      .update({ notes })
      .eq('id', savedId);

    if (!error) {
      setSavedCandidates(prev =>
        prev.map(s => s.id === savedId ? { ...s, notes } : s)
      );
    }
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">⭐ Saved Professionals</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Professionals you've saved for future consideration
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : savedCandidates.length === 0 ? (
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
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No saved professionals yet
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              When you find professionals you're interested in, save them here for easy access later.
            </p>
            <Link
              href="/employer/discover"
              className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Discover Professionals
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {savedCandidates.map((saved) => {
              const profile = (saved as any).profiles;
              const ratings = (saved as any).professional_ratings;

              return (
                <div
                  key={saved.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Link
                          href={`/portfolio/${profile?.username}`}
                          className="text-xl font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {profile?.full_name || profile?.username || 'Unknown'}
                        </Link>
                        {ratings && ratings.total_reviews > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-400">⭐</span>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {ratings.average_rating.toFixed(1)}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              ({ratings.total_reviews})
                            </span>
                          </div>
                        )}
                      </div>

                      {profile?.headline && (
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                          {profile.headline}
                        </p>
                      )}

                      {profile?.location && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          📍 {profile.location}
                        </p>
                      )}

                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Saved {new Date(saved.saved_at).toLocaleDateString()}
                      </p>

                      {/* Notes Section */}
                      <div className="mt-4">
                        <textarea
                          placeholder="Add private notes about this candidate..."
                          value={saved.notes || ''}
                          onChange={(e) => handleAddNote(saved.id, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none"
                          rows={2}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 ml-4">
                      <Link
                        href={`/portfolio/${profile?.username}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        View Portfolio
                      </Link>
                      <Link
                        href={`/employer/messages?to=${saved.professional_id}`}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        Message
                      </Link>
                      <button
                        onClick={() => handleUnsave(saved.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
