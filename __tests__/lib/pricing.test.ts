import { EMPLOYER_TIERS, DEVELOPER_BOOSTS, ADD_ONS, getEmployerTier, getDeveloperBoost, getAddOn, calculateYearlyPrice, getEffectivePrice } from '../../lib/pricing';

describe('Pricing Module', () => {
  describe('Employer Tiers', () => {
    it('should have correct starter tier pricing', () => {
      const tier = EMPLOYER_TIERS.starter;
      expect(tier.name).toBe('Starter');
      expect(tier.monthlyPrice).toBe(399);
      expect(tier.limits.jobPostings).toBe(5);
      expect(tier.limits.candidateContacts).toBe(25);
    });

    it('should have correct professional tier pricing', () => {
      const tier = EMPLOYER_TIERS.professional;
      expect(tier.name).toBe('Professional');
      expect(tier.monthlyPrice).toBe(999);
      expect(tier.limits.jobPostings).toBe(15);
      expect(tier.limits.candidateContacts).toBe(-1); // unlimited
    });

    it('should have correct enterprise tier pricing', () => {
      const tier = EMPLOYER_TIERS.enterprise;
      expect(tier.name).toBe('Enterprise');
      expect(tier.monthlyPrice).toBe(2499);
      expect(tier.limits.jobPostings).toBe(-1); // unlimited
    });
  });

  describe('Developer Boosts', () => {
    it('should have correct basic boost pricing', () => {
      const boost = DEVELOPER_BOOSTS.basic;
      expect(boost.name).toBe('Basic Boost');
      expect(boost.monthlyPrice).toBe(15);
      expect(boost.yearlyPrice).toBe(149);
    });

    it('should have correct premium boost pricing', () => {
      const boost = DEVELOPER_BOOSTS.premium;
      expect(boost.name).toBe('Premium Boost');
      expect(boost.monthlyPrice).toBe(25);
      expect(boost.yearlyPrice).toBe(299);
    });
  });

  describe('Add-ons', () => {
    it('should have custom assessment add-on', () => {
      const addon = ADD_ONS.customAssessment;
      expect(addon.name).toBe('Custom Skill Assessment');
      expect(addon.priceRange).toEqual([99, 299]);
    });

    it('should have pay-per-hire add-on', () => {
      const addon = ADD_ONS.payPerHire;
      expect(addon.name).toBe('Pay-per-Hire');
      expect(addon.priceRange).toEqual([1500, 3000]);
    });
  });

  describe('Utility Functions', () => {
    it('should get employer tier by name', () => {
      const tier = getEmployerTier('starter');
      expect(tier?.name).toBe('Starter');
    });

    it('should return undefined for invalid tier', () => {
      const tier = getEmployerTier('invalid');
      expect(tier).toBeUndefined();
    });

    it('should get developer boost by name', () => {
      const boost = getDeveloperBoost('basic');
      expect(boost?.name).toBe('Basic Boost');
    });

    it('should get add-on by name', () => {
      const addon = getAddOn('codeReview');
      expect(addon?.name).toBe('Project Code Review');
    });

    it('should calculate yearly price', () => {
      expect(calculateYearlyPrice(100)).toBe(1200);
    });

    it('should apply environment discount', () => {
      expect(getEffectivePrice(100, 'staging')).toBe(90); // 10% discount
      expect(getEffectivePrice(100, 'production')).toBe(100); // no discount
    });
  });
});