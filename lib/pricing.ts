// Canonical pricing constants for ProofStack
// Central source of truth for all pricing tiers, add-ons, and boosts
// Wire into Stripe products, billing code, and UI displays

export interface PricingTier {
  name: string;
  monthlyPrice: number;
  yearlyPrice?: number; // optional, calculate as monthly * 12 if not set
  features: string[];
  limits: {
    jobPostings?: number; // -1 = unlimited
    candidateContacts?: number; // -1 = unlimited
    [key: string]: any;
  };
}

// BoostTier and developer boosts removed: all talent boosts are now free.
export interface AddOn {
  name: string;
  priceRange: [number, number]; // min-max per candidate
  description: string;
}

// Employer subscription tiers (Glassdoor-based pricing)
export const EMPLOYER_TIERS: Record<string, PricingTier> = {
  starter: {
    name: 'Starter',
    monthlyPrice: 399,
    features: [
      '5 active job postings',
      'Search/filter by verified skills',
      'Contact 25 candidates/month',
      'Basic skill match scoring',
      'Standard verification reports'
    ],
    limits: {
      jobPostings: 5,
      candidateContacts: 25
    }
  },
  professional: {
    name: 'Professional',
    monthlyPrice: 999,
    features: [
      '15 active postings',
      'Unlimited candidate contact',
      'Advanced filters (specific tech stacks, project complexity)',
      'Detailed verification breakdowns',
      'ATS integration and skill gap analysis tools'
    ],
    limits: {
      jobPostings: 15,
      candidateContacts: -1 // unlimited
    }
  },
  enterprise: {
    name: 'Enterprise',
    monthlyPrice: 2499, // base, can go up to 5000+
    features: [
      'Unlimited postings',
      'Custom verification criteria',
      'API access and white-label badges',
      'Dedicated account manager, bulk hiring tools, custom skill assessments'
    ],
    limits: {
      jobPostings: -1, // unlimited
      candidateContacts: -1
    }
  }
};

// Developer boost tiers (optional portfolio boosts)
// Developer boosts removed: all talent boosts are now free.

// High-value add-ons (à la carte services)
export const ADD_ONS: Record<string, AddOn> = {
  customAssessment: {
    name: 'Custom Skill Assessment',
    priceRange: [99, 299],
    description: 'Custom tests for specific roles'
  },
  backgroundCheck: {
    name: 'Deep Background Check',
    priceRange: [49, 99],
    description: 'Integration for comprehensive background checks'
  },
  referenceVerification: {
    name: 'Reference Verification',
    priceRange: [75, 75], // fixed price
    description: 'Verify professional references'
  },
  codeReview: {
    name: 'Project Code Review',
    priceRange: [149, 149], // fixed price
    description: 'Senior developer code review of actual work'
  },
  payPerHire: {
    name: 'Pay-per-Hire',
    priceRange: [1500, 3000],
    description: 'Success-based pricing per verified hire'
  }
};

// Utility functions
export function getEmployerTier(tier: string): PricingTier | undefined {
  return EMPLOYER_TIERS[tier.toLowerCase()];
}



export function getAddOn(name: string): AddOn | undefined {
  return ADD_ONS[name];
}

// Calculate yearly price if not explicitly set
export function calculateYearlyPrice(monthlyPrice: number): number {
  return monthlyPrice * 12;
}

// Environment overrides for staging/production (e.g., discounts)
export const PRICING_ENV_OVERRIDES: Record<string, { discountPercent?: number }> = {
  development: {
    // No overrides, use base prices
  },
  staging: {
    // e.g., 10% discount for testing
    discountPercent: 10
  },
  production: {
    // Full prices
  }
};

// Get effective price with environment overrides
export function getEffectivePrice(basePrice: number, env: string = 'production'): number {
  const override = PRICING_ENV_OVERRIDES[env as keyof typeof PRICING_ENV_OVERRIDES];
  if (override?.discountPercent) {
    return basePrice * (1 - override.discountPercent / 100);
  }
  return basePrice;
}


// Stripe product ID mappings (placeholders - replace with actual Stripe product IDs)
export const STRIPE_PRODUCT_IDS = {
  employer: {
    starter: {
      monthly: 'prod_starter_monthly', // replace with real ID
      yearly: 'prod_starter_yearly'
    },
    professional: {
      monthly: 'prod_professional_monthly',
      yearly: 'prod_professional_yearly'
    },
    enterprise: {
      monthly: 'prod_enterprise_monthly',
      yearly: 'prod_enterprise_yearly'
    }
  }
};


// Export all for easy import
export default {
  EMPLOYER_TIERS,
  ADD_ONS,
  getEmployerTier,
  getAddOn,
  calculateYearlyPrice,
  getEffectivePrice,
  STRIPE_PRODUCT_IDS
};
