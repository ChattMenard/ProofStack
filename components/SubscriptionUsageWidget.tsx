'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface UsageData {
  subscription_tier: string;
  job_post_limit: number;
  job_posts_used: number;
  next_renewal_date: string | null;
  subscription_status: string;
}

export default function SubscriptionUsageWidget() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsage();
  }, []);

  async function loadUsage() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('auth_uid', user.id)
        .single();

      if (!profile?.organization_id) return;

      const { data: org } = await supabase
        .from('organizations')
        .select('subscription_tier, job_post_limit, job_posts_used, next_renewal_date, subscription_status')
        .eq('id', profile.organization_id)
        .single();

      if (org) {
        setUsage(org);
      }
    } catch (error) {
      console.error('Error loading usage:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  if (!usage) return null;

  const isUnlimited = usage.job_post_limit === -1;
  const usagePercent = isUnlimited ? 0 : (usage.job_posts_used / usage.job_post_limit) * 100;
  const isNearLimit = usagePercent > 80;
  const isAtLimit = usage.job_posts_used >= usage.job_post_limit && !isUnlimited;

  const tierDisplay: Record<string, string> = {
    'free': 'Free',
    'basic': 'Single Post ($249/mo)',
    'professional': 'Professional ($949/mo)',
    'enterprise': 'Enterprise ($2499/yr)'
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-indigo-600">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Subscription Usage</h3>
        {usage.subscription_status === 'active' && (
          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            Active
          </span>
        )}
        {usage.subscription_status === 'past_due' && (
          <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
            Payment Failed
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Current Plan */}
        <div>
          <p className="text-sm text-gray-600 mb-1">Current Plan</p>
          <p className="text-xl font-bold text-gray-900">
            {tierDisplay[usage.subscription_tier] || 'Free'}
          </p>
        </div>

        {/* Job Posts Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Job Posts This Month
            </span>
            <span className={`text-sm font-bold ${isAtLimit ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-gray-900'}`}>
              {usage.job_posts_used} / {isUnlimited ? '∞' : usage.job_post_limit}
            </span>
          </div>
          
          {!isUnlimited && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all ${
                  isAtLimit ? 'bg-red-600' : isNearLimit ? 'bg-yellow-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              ></div>
            </div>
          )}
        </div>

        {/* Renewal Date */}
        {usage.next_renewal_date && (
          <div>
            <p className="text-sm text-gray-600">Next Renewal</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(usage.next_renewal_date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
        )}

        {/* Upgrade CTA */}
        {(isAtLimit || isNearLimit || usage.subscription_tier === 'free') && (
          <div className={`mt-4 p-4 rounded-lg ${isAtLimit ? 'bg-red-50 border border-red-200' : 'bg-indigo-50 border border-indigo-200'}`}>
            {isAtLimit ? (
              <>
                <p className="text-sm font-medium text-red-900 mb-2">
                  ⚠️ You've reached your limit
                </p>
                <p className="text-xs text-red-700 mb-3">
                  Upgrade to post more jobs this month
                </p>
              </>
            ) : isNearLimit ? (
              <>
                <p className="text-sm font-medium text-yellow-900 mb-2">
                  ⚡ Running low on job posts
                </p>
                <p className="text-xs text-yellow-700 mb-3">
                  Upgrade now to avoid hitting your limit
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-indigo-900 mb-2">
                  🚀 Unlock more opportunities
                </p>
                <p className="text-xs text-indigo-700 mb-3">
                  Post more jobs and reach verified developers
                </p>
              </>
            )}
            
            <Link
              href="/pricing/employer"
              className="block w-full text-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              View Plans
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
