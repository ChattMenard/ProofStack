'use client';

import { useState, useEffect } from 'react';

interface ProofScoreBreakdown {
  total_score: number;
  review_score: number;
  work_sample_score: number;
  skill_verification_score: number;
  experience_score: number;
  response_rate_score: number;
  factors: {
    total_reviews: number;
    average_rating: number;
    verified_work_samples: number;
    skills_verified: number;
    years_experience: number;
    response_rate: number;
  };
  improvements: string[];
}

interface ProofScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionalId: string;
}

export default function ProofScoreModal({ isOpen, onClose, professionalId }: ProofScoreModalProps) {
  const [breakdown, setBreakdown] = useState<ProofScoreBreakdown | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && professionalId) {
      loadBreakdown();
    }
  }, [isOpen, professionalId]);

  const loadBreakdown = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/professional/proof-score-v2?professional_id=${professionalId}`);
      if (!response.ok) {
        setBreakdown(null);
        return;
      }
      const data = await response.json();
      setBreakdown(data);
    } catch (error) {
      console.error('Failed to load ProofScore breakdown:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">ProofScore Breakdown</h2>
              <p className="text-blue-100 text-sm mt-1">See how your score is calculated</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 dark:text-gray-400 mt-4">Calculating your ProofScore...</p>
            </div>
          ) : breakdown ? (
            <>
              {/* Total Score */}
              <div className="text-center mb-8 p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl">
                <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
                  {breakdown.total_score}
                </div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">Your Total ProofScore</div>
              </div>

              {/* Score Components */}
              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Score Components</h3>
                
                {/* Reviews */}
                <ScoreComponent
                  icon="⭐"
                  title="Reviews & Ratings"
                  score={breakdown.review_score}
                  maxScore={40}
                  details={`${breakdown.factors.total_reviews} reviews, ${breakdown.factors.average_rating.toFixed(1)} avg rating`}
                />

                {/* Work Samples */}
                <ScoreComponent
                  icon="💼"
                  title="Work Samples"
                  score={breakdown.work_sample_score}
                  maxScore={30}
                  details={`${breakdown.factors.verified_work_samples} verified samples`}
                />

                {/* Skill Verification */}
                <ScoreComponent
                  icon="✅"
                  title="Skill Verification"
                  score={breakdown.skill_verification_score}
                  maxScore={15}
                  details={`${breakdown.factors.skills_verified} skills verified`}
                />

                {/* Experience */}
                <ScoreComponent
                  icon="📚"
                  title="Experience"
                  score={breakdown.experience_score}
                  maxScore={10}
                  details={`${breakdown.factors.years_experience} years experience`}
                />

                {/* Response Rate */}
                <ScoreComponent
                  icon="💬"
                  title="Response Rate"
                  score={breakdown.response_rate_score}
                  maxScore={5}
                  details={`${(breakdown.factors.response_rate * 100).toFixed(0)}% response rate`}
                />
              </div>

              {/* Improvement Tips */}
              {breakdown.improvements && breakdown.improvements.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">💡</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                        How to Improve Your Score
                      </h4>
                      <ul className="space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
                        {breakdown.improvements.map((tip, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Call to Action */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                  <a
                    href="/dashboard"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors text-center font-medium"
                  >
                    Go to Dashboard
                  </a>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">Failed to load ProofScore breakdown</p>
              <button
                onClick={loadBreakdown}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreComponent({ 
  icon, 
  title, 
  score, 
  maxScore, 
  details 
}: { 
  icon: string; 
  title: string; 
  score: number; 
  maxScore: number; 
  details: string;
}) {
  const percentage = (score / maxScore) * 100;
  
  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <span className="font-medium text-gray-900 dark:text-white">{title}</span>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{score}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">/{maxScore}</span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
        <div
          className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      
      <div className="text-xs text-gray-600 dark:text-gray-400">{details}</div>
    </div>
  );
}
