/**
 * Centralized Navigation Configuration
 * Single source of truth for all navigation links across the platform
 * Ensures URL paths match their labels/titles
 */

export interface NavLink {
  href: string
  label: string
  icon?: string
  description?: string
}

export interface NavSection {
  title: string
  links: NavLink[]
}

// Public navigation - available to all users
export const publicNavigation: NavLink[] = [
  { href: '/portfolios', label: 'Talent Marketplace', icon: '👥', description: 'Browse verified professionals' },
  { href: '/projectlistings', label: 'Job Marketplace', icon: '💼', description: 'Find project opportunities' },
]

// Professional (Talent) navigation
export const professionalNavigation: NavSection[] = [
  {
    title: 'My Account',
    links: [
      { href: '/professional/dashboard', label: 'Dashboard', icon: '📊' },
      { href: '/portfolio/[username]', label: 'My Portfolio', icon: '�' },
      { href: '/professional/reviews', label: 'My Reviews', icon: '⭐' },
      { href: '/upload', label: 'Upload Work', icon: '📤' },
      { href: '/professional/assessments', label: 'Skill Assessments', icon: '🎯' },
      { href: '/professional/import-git', label: 'Import from GitHub', icon: '🔗' },
      { href: '/professional/promote', label: 'Promote Profile', icon: '🚀' },
    ]
  },
  {
    title: 'Settings',
    links: [
      { href: '/professional/preferences', label: 'Preferences', icon: '⚙️' },
      { href: '/professional/settings', label: 'Account Settings', icon: '🔧' },
      { href: '/professional/verify', label: 'Verify Accounts', icon: '✓' },
    ]
  }
]

// Employer navigation
export const employerNavigation: NavSection[] = [
  {
    title: 'Dashboard',
    links: [
      { href: '/employer/dashboard', label: 'Dashboard', icon: '🏠' },
    ]
  },
  {
    title: 'Hiring',
    links: [
      { href: '/employer/post-job', label: 'Post a Job', icon: '➕' },
      { href: '/employer/applications', label: 'Applications', icon: '📋' },
      { href: '/employer/discover', label: 'Discover Talent', icon: '🔍' },
      { href: '/employer/saved', label: 'Saved Professionals', icon: '💾' },
    ]
  },
  {
    title: 'Reviews',
    links: [
      { href: '/employer/reviews', label: 'My Reviews', icon: '⭐' },
    ]
  },
  {
    title: 'Communication',
    links: [
      { href: '/employer/messages', label: 'Messages', icon: '💬' },
    ]
  },
  {
    title: 'Account',
    links: [
      { href: '/employer/profile', label: 'Company Profile', icon: '🏢' },
      { href: '/employer/settings', label: 'Settings', icon: '⚙️' },
    ]
  }
]

// Admin navigation
export const adminNavigation: NavSection[] = [
  {
    title: 'Admin',
    links: [
      { href: '/admin/dashboard', label: 'Admin Dashboard', icon: '👑' },
      { href: '/admin/analytics/skills', label: 'Skills Analytics', icon: '📈' },
      { href: '/admin/security', label: 'Security', icon: '🔐' },
    ]
  }
]

// Helper function to get all links for a user type
export function getNavigationForUserType(userType: 'professional' | 'employer' | 'admin' | null): NavSection[] {
  if (userType === 'professional') return professionalNavigation
  if (userType === 'employer') return employerNavigation
  if (userType === 'admin') return [...professionalNavigation, ...adminNavigation]
  return []
}

// Helper function to flatten all links
export function getAllLinksFlat(sections: NavSection[]): NavLink[] {
  return sections.flatMap(section => section.links)
}

// Quick access links for main navigation (most important items)
export const professionalQuickLinks: NavLink[] = [
  { href: '/professional/messages', label: 'Messages', icon: '💬' },
]

export const employerQuickLinks: NavLink[] = [
  { href: '/employer/messages', label: 'Messages', icon: '💬' },
]
