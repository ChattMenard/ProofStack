'use client';

import { useEffect, useState } from 'react';

interface ProofScoreBreakdown {
  communication_quality: {
    total: number;
    profile_quality: number;
    message_quality: number;
    response_speed: number;
  };
  historical_performance: {
    total: number;
    average_rating: number;
    delivery_rate: number;
    completion_rate: number;
  };
  work_quality: {
    total: number;
    task_correctness: number;
    employer_satisfaction: number;
    revisions_score: number;
    hire_again_score: number;
  };
  total_projects: number;
}

interface ProofScoreV2Props {
  professionalId: string;
  size?: 'small' | 'medium' | 'large';
  showBreakdown?: boolean;
}

export default function ProofScoreV2({ 
  professionalId, 
  size = 'medium',
  showBreakdown = false 
}: ProofScoreV2Props) {
  const [score, setScore] = useState<number | null>(null);
  const [breakdown, setBreakdown] = useState<ProofScoreBreakdown | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchScore() {
      try {
        const response = await fetch(`/api/professional/proof-score-v2?professional_id=${professionalId}`);
        if (!response.ok) {
          // Gracefully handle no data yet
          setScore(null);
          setBreakdown(null);
          return;
        }
        const data = await response.json();

        if (data) {
          setScore(typeof data.proof_score === 'number' ? data.proof_score : null);
          setBreakdown((data.breakdown || null) as ProofScoreBreakdown | null);
        }
      } catch (error) {
        console.error('Error fetching ProofScore V2:', error);
        setScore(null);
      } finally {
        setLoading(false);
      }
    }

    fetchScore();
  }, [professionalId]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-forest-800 rounded w-32"></div>
      </div>
    );
  }

  if (!loading && score === null) {
    return (
      <div className="rounded-xl border border-forest-800 bg-forest-900/40 p-4">
        <div className="text-sm text-forest-400 font-medium mb-1">ProofScore V2</div>
        <div className="text-forest-300 text-sm">Not enough data yet. Add verified work samples and reviews to generate your score.</div>
      </div>
    );
  }

  const displayScore = score || 0;
  const percentage = (displayScore / 100) * 100;

  // Color tiers
  const getTier = (score: number) => {
    if (score >= 90) return { name: 'Elite', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
    if (score >= 80) return { name: 'Excellent', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' };
    if (score >= 70) return { name: 'Good', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' };
    if (score >= 60) return { name: 'Average', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' };
    return { name: 'Fair', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' };
  };

  const tier = getTier(displayScore);

  // Size classes
  const sizeClasses = {
    small: 'text-2xl',
    medium: 'text-4xl',
    large: 'text-5xl'
  };

  return (
    <div className="space-y-4">
      {/* Main Score Display */}
      <div className={`rounded-xl border ${tier.border} ${tier.bg} p-6`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-forest-400 font-medium mb-1">ProofScore V2</div>
            <div className={`${sizeClasses[size]} font-bold ${tier.color}`}>
              {displayScore.toFixed(0)}<span className="text-2xl text-forest-400">/100</span>
            </div>
            <div className={`text-sm font-medium mt-1 ${tier.color}`}>{tier.name}</div>
          </div>
          
          {/* Progress Circle */}
          <div className="relative w-20 h-20">
            <svg className="transform -rotate-90 w-20 h-20">
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                className="text-forest-800"
              />
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${2 * Math.PI * 32 * (1 - percentage / 100)}`}
                className={tier.color}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-sm font-bold ${tier.color}`}>{percentage.toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 bg-forest-800 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full ${tier.color.replace('text-', 'bg-')} transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Detailed Breakdown (Optional) */}
      {showBreakdown && breakdown && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-forest-300">Score Breakdown</h3>

          {/* Communication Quality (30pts) */}
          <div className="bg-forest-800/50 rounded-lg p-4 border border-forest-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                <span className="font-medium text-forest-200">Communication Quality</span>
              </div>
              <span className="text-blue-400 font-bold">
                {breakdown.communication_quality.total.toFixed(1)}<span className="text-forest-400 text-sm">/30</span>
              </span>
            </div>
            <div className="space-y-1 text-sm pl-4">
              <div className="flex justify-between text-forest-400">
                <span>Profile Quality</span>
                <span>{breakdown.communication_quality.profile_quality.toFixed(1)}/10</span>
              </div>
              <div className="flex justify-between text-forest-400">
                <span>Message Quality</span>
                <span>{breakdown.communication_quality.message_quality.toFixed(1)}/10</span>
              </div>
              <div className="flex justify-between text-forest-400">
                <span>Response Speed</span>
                <span>{breakdown.communication_quality.response_speed.toFixed(1)}/10</span>
              </div>
            </div>
          </div>

          {/* Historical Performance (30pts) */}
          <div className="bg-forest-800/50 rounded-lg p-4 border border-forest-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                <span className="font-medium text-forest-200">Historical Track Record</span>
              </div>
              <span className="text-purple-400 font-bold">
                {breakdown.historical_performance.total.toFixed(1)}<span className="text-forest-400 text-sm">/30</span>
              </span>
            </div>
            <div className="space-y-1 text-sm pl-4">
              <div className="flex justify-between text-forest-400">
                <span>Average Rating</span>
                <span>{breakdown.historical_performance.average_rating.toFixed(1)}/15</span>
              </div>
              <div className="flex justify-between text-forest-400">
                <span>On-Time Delivery</span>
                <span>{breakdown.historical_performance.delivery_rate.toFixed(1)}/10</span>
              </div>
              <div className="flex justify-between text-forest-400">
                <span>Completion Rate</span>
                <span>{breakdown.historical_performance.completion_rate.toFixed(1)}/5</span>
              </div>
            </div>
          </div>

          {/* Work Quality (40pts) */}
          <div className="bg-forest-800/50 rounded-lg p-4 border border-forest-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                <span className="font-medium text-forest-200">Work Quality</span>
              </div>
              <span className="text-emerald-400 font-bold">
                {breakdown.work_quality.total.toFixed(1)}<span className="text-forest-400 text-sm">/40</span>
              </span>
            </div>
            <div className="space-y-1 text-sm pl-4">
              <div className="flex justify-between text-forest-400">
                <span>Task Correctness</span>
                <span>{breakdown.work_quality.task_correctness.toFixed(1)}/20</span>
              </div>
              <div className="flex justify-between text-forest-400">
                <span>Employer Satisfaction</span>
                <span>{breakdown.work_quality.employer_satisfaction.toFixed(1)}/10</span>
              </div>
              <div className="flex justify-between text-forest-400">
                <span>Low Revisions</span>
                <span>{breakdown.work_quality.revisions_score.toFixed(1)}/5</span>
              </div>
              <div className="flex justify-between text-forest-400">
                <span>Would Hire Again</span>
                <span>{breakdown.work_quality.hire_again_score.toFixed(1)}/5</span>
              </div>
            </div>
          </div>

          {/* Total Projects */}
          {breakdown.total_projects > 0 && (
            <div className="text-center text-sm text-forest-400">
              Based on {breakdown.total_projects} completed {breakdown.total_projects === 1 ? 'project' : 'projects'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
