import Stripe from 'stripe'
import { supabase } from './supabaseClient'

// Guarded Stripe instance: only create if the secret key is provided.
// During local builds we avoid throwing at import time so the build can proceed
// without production secrets. Callers should check `stripe` before using it.
export const stripe: Stripe | null = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
      typescript: true,
    })
  : null

// Stripe price IDs (you'll create these in Stripe dashboard)
export const STRIPE_PRICES = {
  PRO_MONTHLY: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_xxx',
  PRO_YEARLY: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_yyy',
}

// Stripe coupon codes
export const STRIPE_COUPONS = {
  FOUNDING_MEMBER: 'FOUNDING100', // 100% off for first month for first 100 members
}

// Check if user qualifies for founding member discount
export async function checkFoundingMemberEligibility(): Promise<boolean> {
  try {
    // Check how many founding members have been created
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_founder', true)
    
    return (data?.length || 0) < 100
  } catch (error) {
    console.error('Error checking founding member eligibility:', error)
    return false
  }
}

// Create Stripe checkout session with optional coupon
export async function createCheckoutSession(
  priceId: string,
  userId: string,
  couponCode?: string
): Promise<string> {
  const sessionConfig: any = {
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [{
      price: priceId,
      quantity: 1,
    }],
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
    metadata: {
      userId,
    },
  }

  // Add coupon if provided
  if (couponCode) {
    sessionConfig.discounts = [{
      coupon: couponCode,
    }]
  }

  if (!stripe) throw new Error('Missing STRIPE_SECRET_KEY environment variable')

  const session = await stripe.checkout.sessions.create(sessionConfig)
  return session.id
}

// Plan features
export const PLAN_FEATURES = {
  free: {
    name: 'Free',
    price: 0,
    features: [
      '5 samples per month',
      'Basic AI analysis',
      'Public portfolio',
      'Standard support',
    ],
    limits: {
      samplesPerMonth: 5,
      customDomain: false,
      priorityAnalysis: false,
    },
  },
  pro: {
    name: 'Pro',
    price: 9,
    features: [
      'Unlimited samples',
      'Advanced AI analysis',
      'Custom domain',
      'Priority support',
      'Detailed analytics',
      'Portfolio themes',
    ],
    limits: {
      samplesPerMonth: -1, // unlimited
      customDomain: true,
      priorityAnalysis: true,
    },
  },
}
