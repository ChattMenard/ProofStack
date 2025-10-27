'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const tierInfo = {
  standard: { name: 'Standard Promotion', badge: '🚀 Promoted', color: 'blue', price: 19 },
  premium: { name: 'Premium Promotion', badge: '💎 Premium', color: 'purple', price: 49 },
  featured: { name: 'Featured Promotion', badge: '⭐ Featured', color: 'gold', price: 99 }
};

function ManagePromotionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [promotion, setPromotion] = useState<any>(null);
  const [canceling, setCanceling] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Check for success parameter
    if (searchParams?.get('success') === 'true') {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
    
    loadPromotion();
  }, [searchParams]);

  const loadPromotion = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/login');
        return;
      }

      setUser(authUser);

      // Get active promotion
      const { data, error } = await supabase
        .from('professional_promotions')
        .select('*')
        .eq('professional_id', authUser.id)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading promotion:', error);
      }

      setPromotion(data);
    } catch (error) {
      console.error('Failed to load promotion:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!promotion) return;

    const confirmed = confirm(
      'Are you sure you want to cancel your promotion? Your profile will no longer appear in promoted search results at the end of your current billing period.'
    );

    if (!confirmed) return;

    setCanceling(true);
    try {
      const response = await fetch('/api/promotions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promotion_id: promotion.id,
          stripe_subscription_id: promotion.stripe_subscription_id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel promotion');
      }

      alert('Promotion canceled successfully. It will remain active until the end of your billing period.');
      await loadPromotion();
    } catch (error: any) {
      console.error('Cancel error:', error);
      alert(error.message || 'Failed to cancel promotion');
    } finally {
      setCanceling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffTime = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!promotion) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
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
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            No Active Promotion
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don't have an active promotion at the moment.
          </p>
          <Link
            href="/professional/promote"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Promotion Plans
          </Link>
        </div>
      </div>
    );
  }

  const tier = tierInfo[promotion.tier as keyof typeof tierInfo];
  const daysRemaining = getDaysRemaining(promotion.expires_at);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Success Banner */}
        {showSuccess && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-green-800 dark:text-green-200 font-semibold">Promotion Activated Successfully!</p>
              <p className="text-green-700 dark:text-green-300 text-sm">Your profile is now being promoted to employers.</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <Link href="/professional/promote" className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block">
            ← Back to Promotion Plans
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Manage Your Promotion
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track performance and manage your active promotion subscription
          </p>
        </div>

        {/* Active Promotion Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">{tier.badge.split(' ')[0]}</span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {tier.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    ${tier.price}/month
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                ● Active
              </span>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Renews on</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatDate(promotion.expires_at)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
              </div>
            </div>
          </div>

          {/* Subscription Period */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-6">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Started</div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {formatDate(promotion.starts_at)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Next Billing</div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {formatDate(promotion.expires_at)}
              </div>
            </div>
          </div>

          {/* Cancel Button */}
          <button
            onClick={handleCancel}
            disabled={canceling}
            className="w-full py-3 border-2 border-red-600 text-red-600 dark:text-red-400 font-semibold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {canceling ? 'Canceling...' : 'Cancel Promotion'}
          </button>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
            Your promotion will remain active until the end of your current billing period
          </p>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Performance Metrics
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Views */}
            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-blue-600 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-1">
                {promotion.views_count || 0}
              </div>
              <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Profile Views
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                Since promotion started
              </div>
            </div>

            {/* Saves */}
            <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-purple-600 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-purple-900 dark:text-purple-100 mb-1">
                {promotion.saves_count || 0}
              </div>
              <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Profile Saves
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                Employers who saved you
              </div>
            </div>

            {/* Messages */}
            <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-green-600 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-green-900 dark:text-green-100 mb-1">
                {promotion.messages_count || 0}
              </div>
              <div className="text-sm font-medium text-green-700 dark:text-green-300">
                Messages Received
              </div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-2">
                Employers who contacted you
              </div>
            </div>
          </div>

          {/* ROI Insight */}
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                  Your Investment is Working
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Your promoted profile has been viewed <strong>{promotion.views_count || 0} times</strong> this billing period. 
                  {promotion.messages_count > 0 && (
                    <> You've received <strong>{promotion.messages_count} message{promotion.messages_count !== 1 ? 's' : ''}</strong> from interested employers.</>
                  )}
                  {promotion.messages_count === 0 && ' Keep your profile updated to increase engagement!'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* What You're Getting */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            What You're Getting
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">Priority in Search Results</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Your profile appears {tier.name === 'Featured Promotion' ? 'first' : tier.name === 'Premium Promotion' ? 'near the top' : 'above organic results'} when employers search
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">Profile Badge</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Eye-catching "{tier.badge}" badge on your profile
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">Enhanced Visibility</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Stand out from non-promoted profiles
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">Performance Analytics</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Track views, saves, and messages in real-time
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ManagePromotionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">Loading promotion...</div>
        </div>
      </div>
    }>
      <ManagePromotionContent />
    </Suspense>
  );
}
