'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  jobPostLimit: number;
  features: string[];
  isPopular?: boolean;
  stripePriceId: string;
}

interface BoostTier {
  id: string;
  name: string;
  price: number;
  features: string[];
  stripePriceId: string;
}

export default function EmployerPricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [billingToggle, setBillingToggle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const jobPostPlans: PricingPlan[] = [
    {
      id: 'basic',
      name: 'Single Post',
      price: 249,
      billingCycle: 'monthly',
      jobPostLimit: 1,
      stripePriceId: 'price_basic_job_post',
      features: [
        '1 active job posting',
        '30-day listing duration',
        'Search verified talent pool',
        'Basic ProofScore filtering',
        'Message candidates',
        'Standard support'
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 949,
      billingCycle: 'monthly',
      jobPostLimit: 10,
      isPopular: true,
      stripePriceId: 'price_professional_job_post',
      features: [
        '10 active job postings',
        '60-day listing duration',
        'Priority search placement',
        'Advanced ProofScore filtering',
        'Unlimited candidate messaging',
        'Employer profile page',
        'Analytics dashboard',
        'Priority support (24h response)'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 2499,
      billingCycle: 'yearly',
      jobPostLimit: -1, // unlimited
      stripePriceId: 'price_enterprise_job_post',
      features: [
        'Unlimited job postings',
        'Unlimited listing duration',
        'Featured company badge',
        'Custom ProofScore filters',
        'Team seats (5+ recruiters)',
        'Dedicated account manager',
        'API access',
        'Custom branding',
        'White-glove support'
      ]
    }
  ];

  const boostTiers: BoostTier[] = [
    {
      id: 'standard',
      name: 'Standard Boost',
      price: 19,
      stripePriceId: 'price_boost_standard',
      features: [
        'Highlighted in search results',
        'Standard badge on profile',
        '2x profile views',
        'Basic analytics'
      ]
    },
    {
      id: 'premium',
      name: 'Premium Boost',
      price: 49,
      stripePriceId: 'price_boost_premium',
      features: [
        'Top 10 search placement',
        'Premium badge on profile',
        '5x profile views',
        'Advanced analytics',
        'Featured in newsletter'
      ]
    },
    {
      id: 'featured',
      name: 'Featured Boost',
      price: 99,
      stripePriceId: 'price_boost_featured',
      features: [
        'Top 3 guaranteed placement',
        'Featured badge on profile',
        '10x profile views',
        'Comprehensive analytics',
        'Homepage spotlight',
        'Social media promotion'
      ]
    }
  ];

  const handlePurchase = async (priceId: string, planType: 'job_post' | 'boost') => {
    if (!currentUser) {
      router.push('/signin?redirect=/pricing/employer');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          planType,
          successUrl: `${window.location.origin}/employer/dashboard?payment=success`,
          cancelUrl: `${window.location.origin}/pricing/employer?payment=canceled`
        })
      });

      const { sessionId, error } = await res.json();
      
      if (error) {
        alert(error);
        setLoading(false);
        return;
      }

      // Redirect to Stripe Checkout
      const stripe = await (window as any).Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      await stripe.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Failed to initiate checkout. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Hire Verified Developers
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Access ProofStack's curated talent pool. Every developer is skill-verified with real code evidence.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-800 font-medium">30-day money-back guarantee</span>
          </div>
        </div>

        {/* Job Posting Plans */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Job Posting Plans</h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {jobPostPlans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transition-transform hover:scale-105 ${
                  plan.isPopular ? 'ring-4 ring-indigo-600' : ''
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1 text-sm font-bold rounded-bl-lg">
                    ⭐ MOST POPULAR
                  </div>
                )}

                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className={`text-5xl font-bold ${plan.isPopular ? 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent' : 'text-gray-900'}`}>
                      ${plan.price}
                    </span>
                    <span className="text-gray-600 ml-2">/{plan.billingCycle === 'yearly' ? 'year' : 'month'}</span>
                    {plan.billingCycle === 'yearly' && (
                      <div className="text-sm text-green-600 font-medium mt-1">
                        Save ${(plan.price / 12).toFixed(0)}/month
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handlePurchase(plan.stripePriceId, 'job_post')}
                    disabled={loading}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                      plan.isPopular
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:scale-105'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    } disabled:opacity-50`}
                  >
                    {loading ? 'Processing...' : `Get ${plan.name}`}
                  </button>

                  <ul className="mt-8 space-y-4">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Portfolio Boost Add-Ons */}
        <div className="bg-white rounded-3xl shadow-2xl p-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Portfolio Boost Add-Ons</h2>
            <p className="text-lg text-gray-600">
              Promote your company profile to attract top developers actively seeking opportunities
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {boostTiers.map((tier) => (
              <div
                key={tier.id}
                className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border-2 border-gray-200 hover:border-indigo-600 transition-all hover:shadow-lg"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-indigo-600">${tier.price}</span>
                  <span className="text-gray-600">/month</span>
                </div>

                <button
                  onClick={() => handlePurchase(tier.stripePriceId, 'boost')}
                  disabled={loading}
                  className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Add Boost'}
                </button>

                <ul className="mt-6 space-y-3">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <svg className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <details className="bg-white rounded-lg p-6 shadow-md">
              <summary className="font-semibold text-gray-900 cursor-pointer">Can I switch plans anytime?</summary>
              <p className="mt-3 text-gray-600">Yes, you can upgrade or downgrade at any time. Changes take effect immediately, and we'll prorate your billing accordingly.</p>
            </details>

            <details className="bg-white rounded-lg p-6 shadow-md">
              <summary className="font-semibold text-gray-900 cursor-pointer">What payment methods do you accept?</summary>
              <p className="mt-3 text-gray-600">We accept all major credit cards (Visa, Mastercard, Amex, Discover) and ACH bank transfers for Enterprise plans.</p>
            </details>

            <details className="bg-white rounded-lg p-6 shadow-md">
              <summary className="font-semibold text-gray-900 cursor-pointer">How does the 30-day guarantee work?</summary>
              <p className="mt-3 text-gray-600">If you're not satisfied within 30 days of your first payment, contact support for a full refund—no questions asked.</p>
            </details>

            <details className="bg-white rounded-lg p-6 shadow-md">
              <summary className="font-semibold text-gray-900 cursor-pointer">What happens when I reach my job post limit?</summary>
              <p className="mt-3 text-gray-600">You'll receive a notification when you're close to your limit. You can either upgrade your plan or wait until your next billing cycle to post more jobs.</p>
            </details>

            <details className="bg-white rounded-lg p-6 shadow-md">
              <summary className="font-semibold text-gray-900 cursor-pointer">Are there team or recruiter seats?</summary>
              <p className="mt-3 text-gray-600">Enterprise plans include 5+ team seats. Contact sales for custom team configurations and additional recruiter access.</p>
            </details>

            <details className="bg-white rounded-lg p-6 shadow-md">
              <summary className="font-semibold text-gray-900 cursor-pointer">How is ProofStack different from Indeed or LinkedIn?</summary>
              <p className="mt-3 text-gray-600">Every developer on ProofStack is skill-verified through assessments and real code evidence (GitHub activity, work samples). You see ProofScore ratings before reaching out, saving 10-15 hours per hire on screening.</p>
            </details>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-20 text-center bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Hire Verified Developers?</h2>
          <p className="text-xl mb-8 opacity-90">Join employers who save time and reduce bad hires with ProofStack's verified talent pool.</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/employer/discover"
              className="px-8 py-4 bg-white text-indigo-600 rounded-lg font-bold text-lg hover:shadow-2xl transition-all hover:scale-105"
            >
              Browse Developers
            </Link>
            <Link
              href="mailto:sales@proofstack.com"
              className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-bold text-lg hover:bg-white hover:text-indigo-600 transition-all"
            >
              Talk to Sales
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-8 text-sm opacity-75">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Secure payment</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>30-day guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
