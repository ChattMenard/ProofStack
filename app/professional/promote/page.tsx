'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const tiers = [
  {
    id: 'standard',
    name: 'Standard Promotion',
    price: 19,
    badge: '🚀 Promoted',
    color: 'blue',
    features: [
      'Stand out from organic results',
      'Profile badge: "Promoted"',
      'Higher visibility in search results',
      'Monthly renewal',
      'Cancel anytime'
    ]
  },
  {
    id: 'premium',
    name: 'Premium Promotion',
    price: 49,
    badge: '💎 Premium',
    color: 'purple',
    popular: true,
    features: [
      'Everything in Standard',
      'Profile badge: "Premium"',
      'Priority above Standard profiles',
      'Featured in "Premium Professionals" section',
      'Enhanced profile highlighting',
      'Monthly renewal',
      'Cancel anytime'
    ]
  },
  {
    id: 'featured',
    name: 'Featured Promotion',
    price: 99,
    badge: '⭐ Featured',
    color: 'gold',
    features: [
      'Everything in Premium',
      'Profile badge: "Featured"',
      'Top priority in all search results',
      'Homepage featured section',
      'Highlighted with special styling',
      'Maximum visibility',
      'Monthly renewal',
      'Cancel anytime'
    ]
  }
];

export default function PromotePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activePromotion, setActivePromotion] = useState<any>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/auth/signin');
        return;
      }

      setUser(authUser);

      // Check for active promotion
      const { data: promotion } = await supabase
        .from('professional_promotions')
        .select('*')
        .eq('professional_id', authUser.id)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .single();

      setActivePromotion(promotion);
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (tierId: string) => {
    setPurchasing(tierId);
    try {
      const response = await fetch('/api/promotions/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professional_id: user.id,
          tier: tierId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      alert(error.message || 'Failed to start checkout');
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Promote Your Profile
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Get discovered by top employers. Stand out from the crowd with profile promotion.
          </p>
          {activePromotion && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-800 dark:text-green-200 font-semibold">
                You have an active {activePromotion.tier} promotion
              </span>
              <Link href="/professional/promote/manage" className="ml-2 text-green-600 dark:text-green-400 hover:underline">
                Manage →
              </Link>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {tiers.map((tier) => {
            const isActive = activePromotion?.tier === tier.id;
            const colorClasses = {
              blue: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20',
              purple: 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20',
              gold: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20'
            };

            return (
              <div
                key={tier.id}
                className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 ${
                  tier.popular ? 'ring-4 ring-blue-500 dark:ring-blue-400' : 'border-gray-200 dark:border-gray-700'
                } ${isActive ? colorClasses[tier.color as keyof typeof colorClasses] : ''}`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                {isActive && (
                  <div className="absolute -top-4 right-4">
                    <span className="bg-green-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Active
                    </span>
                  </div>
                )}

                <div className="p-6">
                  {/* Badge */}
                  <div className="text-center mb-4">
                    <span className="text-3xl">{tier.badge.split(' ')[0]}</span>
                    <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mt-1">
                      {tier.badge.split(' ')[1]}
                    </div>
                  </div>

                  {/* Tier Name */}
                  <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">
                    {tier.name}
                  </h3>

                  {/* Price */}
                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-5xl font-bold text-gray-900 dark:text-white">
                        ${tier.price}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">/month</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <svg
                          className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => handlePurchase(tier.id)}
                    disabled={isActive || purchasing === tier.id}
                    className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                      isActive
                        ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : purchasing === tier.id
                        ? 'bg-gray-400 dark:bg-gray-600 text-white cursor-wait'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isActive
                      ? 'Current Plan'
                      : purchasing === tier.id
                      ? 'Processing...'
                      : `Get ${tier.name}`}
                  </button>

                  {isActive && (
                    <Link
                      href="/professional/promote/manage"
                      className="block text-center mt-3 text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Manage Promotion
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Benefits Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Why Promote Your Profile?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-3">👁️</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Increased Visibility</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Appear at the top of search results when employers are looking for talent like you.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">💼</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">More Opportunities</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Get noticed by top companies actively seeking professionals with your skills.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Stand Out</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your profile gets special badges and highlighting that catches employer attention.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <details className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <summary className="font-semibold text-gray-900 dark:text-white cursor-pointer">
                Can I cancel anytime?
              </summary>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Yes! All promotions are month-to-month with no long-term commitment. Cancel anytime from your promotion management page.
              </p>
            </details>
            <details className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <summary className="font-semibold text-gray-900 dark:text-white cursor-pointer">
                How does the priority system work?
              </summary>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Featured profiles appear first, followed by Premium, then Standard, and finally organic (non-promoted) profiles. Within each tier, profiles are sorted by rating and experience.
              </p>
            </details>
            <details className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <summary className="font-semibold text-gray-900 dark:text-white cursor-pointer">
                Can I upgrade or downgrade my tier?
              </summary>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Yes! You can change your promotion tier at any time. Changes take effect immediately, with proration applied to your billing.
              </p>
            </details>
            <details className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <summary className="font-semibold text-gray-900 dark:text-white cursor-pointer">
                What payment methods do you accept?
              </summary>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                We accept all major credit cards, debit cards, and digital wallets through Stripe's secure payment processing.
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
