/**
 * Anonymization utilities for Ghost Mode
 * Masks professional identity while preserving key information
 * Identity hidden at professional's discretion - cannot be bypassed
 */

export interface AnonymizedProfile {
  isAnonymous: boolean
  displayName: string
  displayAvatar: string
  showContact: boolean
  showPortfolioLink: boolean
}

/**
 * Generate anonymous display name based on headline and location
 * Examples:
 * - "Senior React Developer in Austin, TX"
 * - "Full Stack Engineer (Remote)"
 * - "Mobile Developer in California"
 */
export function generateAnonymousName(
  headline?: string,
  location?: string,
  yearsExperience?: number
): string {
  let name = ''

  // If we have a headline, use it
  if (headline) {
    name = headline
  } else if (yearsExperience !== undefined) {
    // Fallback to experience level
    const level = yearsExperience < 2 ? 'Junior' : yearsExperience < 5 ? 'Mid-Level' : 'Senior'
    name = `${level} Developer`
  } else {
    name = 'Professional Developer'
  }

  // Add location if available
  if (location) {
    if (location.toLowerCase().includes('remote')) {
      name += ' (Remote)'
    } else {
      name += ` in ${location}`
    }
  }

  return name
}

/**
 * Get generic avatar based on seniority/experience
 * Returns path to placeholder avatar
 */
export function getAnonymousAvatar(yearsExperience?: number): string {
  // Use different generic avatars based on seniority
  if (yearsExperience === undefined) return '/avatars/anonymous-default.svg'
  if (yearsExperience < 2) return '/avatars/anonymous-junior.svg'
  if (yearsExperience < 5) return '/avatars/anonymous-mid.svg'
  return '/avatars/anonymous-senior.svg'
}

/**
 * Check if a profile should be shown as anonymous
 */
export async function shouldShowAnonymous(
  professionalId: string,
  supabase: any
): Promise<boolean> {
  const { data: prefs } = await supabase
    .from('professional_preferences')
    .select('anonymous_mode')
    .eq('profile_id', professionalId)
    .single()

  return prefs?.anonymous_mode === true
}

/**
 * Get anonymized version of a profile
 */
export function anonymizeProfile(profile: any): AnonymizedProfile & typeof profile {
  const anonymousName = generateAnonymousName(
    profile.headline,
    profile.location,
    profile.years_experience
  )
  
  const anonymousAvatar = getAnonymousAvatar(profile.years_experience)

  return {
    ...profile,
    isAnonymous: true,
    displayName: anonymousName,
    displayAvatar: anonymousAvatar,
    showContact: false,
    showPortfolioLink: false,
    // Mask identifying fields
    full_name: anonymousName,
    username: `anonymous-${profile.id.slice(0, 8)}`,
    email: null,
    avatar_url: anonymousAvatar,
    linkedin_url: null,
    github_username: null,
    website: null,
  }
}
