import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
})

// Stripe price IDs (you'll create these in Stripe dashboard)
export const STRIPE_PRICES = {
  PRO_MONTHLY: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_xxx',
  PRO_YEARLY: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_yyy',
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
