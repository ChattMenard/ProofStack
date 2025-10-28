export const DISCORD_ROLE_CONFIG = {
  // ProofStack skill levels → Discord roles
  skills: {
    unverified: { name: '🔍 Unverified', color: 0x9CA3AF },      // Gray
    junior: { name: '🌱 Junior Developer', color: 0x10B981 },    // Green
    mid: { name: '💼 Mid-Level Developer', color: 0x3B82F6 },   // Blue
    senior: { name: '🎯 Senior Developer', color: 0x8B5CF6 },    // Purple
    lead: { name: '👑 Lead Developer', color: 0xF59E0B },        // Amber
  },
  
  // User types
  userTypes: {
    professional: { name: '👨‍💻 Talent', color: 0x10B981 },      // Green
    employer: { name: '💰 Hiring Manager', color: 0x3B82F6 },   // Blue
  },
  
  // Employer subscription tiers
  employerSubscriptions: {
    free: { name: '🆓 Free Tier', color: 0x9CA3AF },            // Gray
    basic: { name: '⭐ Basic Plan', color: 0x3B82F6 },          // Blue
    professional: { name: '💎 Professional Plan', color: 0x8B5CF6 }, // Purple
    enterprise: { name: '👔 Enterprise Plan', color: 0xF59E0B }, // Amber
  },
  
  // Talent boost tiers
  talentBoosts: {
    standard: { name: '✨ Standard Boost', color: 0x10B981 },   // Green
    premium: { name: '💎 Premium Boost', color: 0x8B5CF6 },     // Purple
    featured: { name: '🌟 Featured Talent', color: 0xF59E0B },  // Amber/Gold
  },
} as const

export type SkillLevel = keyof typeof DISCORD_ROLE_CONFIG.skills
export type UserType = keyof typeof DISCORD_ROLE_CONFIG.userTypes
export type EmployerSubscriptionTier = keyof typeof DISCORD_ROLE_CONFIG.employerSubscriptions
export type TalentBoostTier = keyof typeof DISCORD_ROLE_CONFIG.talentBoosts
