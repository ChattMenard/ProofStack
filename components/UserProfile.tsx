"use client"
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'
import { 
  professionalNavigation, 
  employerNavigation, 
  adminNavigation,
  getAllLinksFlat
} from '@/lib/navigationConfig'

export default function UserProfile() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    
    async function load() {
      const { data } = await supabase.auth.getUser()
      if (!mounted) return
      setUser(data.user ?? null)
      
      // Fetch user profile to determine role
      if (data.user) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('role, user_type, is_admin, username, email')
          .eq('auth_uid', data.user.id)
          .single()
        
        console.log('🔍 UserProfile load - auth_uid:', data.user.id)
        console.log('🔍 UserProfile load - profileData:', profileData)
        console.log('🔍 UserProfile load - error:', error)
        
        if (mounted && profileData) {
          setProfile(profileData)
          setUsername(profileData.username || profileData.email)
        }
      }
      
      setLoading(false)
    }
    
    load()

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.user-profile-dropdown')) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)

    // Listen for auth changes - check if method exists
    let authListener: any = null
    if (supabase.auth.onAuthStateChange) {
      const { data: listener } = supabase.auth.onAuthStateChange((event: string, session: any) => {
        if (!mounted) return
        setUser(session?.user ?? null)
        
        // Fetch profile on auth change
        if (session?.user) {
          supabase
            .from('profiles')
            .select('role, user_type, is_admin, username, email')
            .eq('auth_uid', session.user.id)
            .single()
            .then(({ data: profileData, error }: { data: any, error: any }) => {
              console.log('🔍 UserProfile auth change - auth_uid:', session.user.id)
              console.log('🔍 UserProfile auth change - profileData:', profileData)
              console.log('🔍 UserProfile auth change - error:', error)
              
              if (mounted && profileData) {
                setProfile(profileData)
                setUsername(profileData.username || profileData.email)
              }
            })
        } else {
          setProfile(null)
          setUsername(null)
        }
        
        // Auto-redirect after sign in from login page
        if (event === 'SIGNED_IN' && session && pathname === '/login') {
          setTimeout(() => {
            router.push('/dashboard')
          }, 500)
        }
      })
      authListener = listener
    }

    return () => {
      mounted = false
      authListener?.subscription?.unsubscribe()
      document.removeEventListener('click', handleClickOutside)
    }
  }, [router, pathname])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  // Don't show anything on login/signup pages
  if (pathname === '/login' || pathname === '/signup') {
    return null
  }

  // Show Sign In / Sign Up buttons if not logged in (or still loading)
  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-sage-600 dark:hover:text-sage-400 transition-colors px-4 py-2"
        >
          Sign In
        </Link>
        <Link
          href="/signup"
          className="text-sm font-medium px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 transition-colors"
        >
          Sign Up
        </Link>
      </div>
    )
  }

  // Show user info and sign out if logged in
  if (user) {
    return (
      <div className="flex items-center gap-3">
        {/* Role-based Navigation Dropdown */}
        <div className="relative user-profile-dropdown">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="px-5 py-2.5 bg-white dark:bg-gray-800 border-2 border-sage-600 dark:border-sage-500 text-sage-700 dark:text-sage-300 text-base rounded-lg hover:bg-sage-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 font-medium"
          >
            My Account
            <svg className={`w-5 h-5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 animate-fadeIn">
              <div className="py-2">
              {/* Employer Menu */}
              {profile?.user_type === 'employer' && (
                <>
                  {employerNavigation.map((section) => (
                    <div key={section.title}>
                      {section.links.map((link) => (
                        <a 
                          key={link.href}
                          href={link.href} 
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          {link.icon} {link.label}
                        </a>
                      ))}
                    </div>
                  ))}
                </>
              )}
              
              {/* Professional Menu - show for professionals AND admins */}
              {(profile?.user_type === 'professional' || user.email === 'mattchenard2009@gmail.com') && (
                <>
                  {professionalNavigation.map((section) => (
                    <div key={section.title}>
                      {section.links.map((link) => {
                        // Replace [username] placeholder with actual username
                        const href = link.href.replace('[username]', username || profile?.email || '')
                        return (
                          <a 
                            key={link.href}
                            href={href} 
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            {link.icon} {link.label}
                          </a>
                        )
                      })}
                    </div>
                  ))}
                </>
              )}
              
              <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
              
              {/* Admin Menu - Only for mattchenard2009@gmail.com */}
              {user.email === 'mattchenard2009@gmail.com' && (
                <>
                  {adminNavigation.map((section) => (
                    <div key={section.title}>
                      {section.links.map((link) => (
                        <a 
                          key={link.href}
                          href={link.href} 
                          className="block px-4 py-2 text-sm text-amber-600 dark:text-amber-400 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold"
                        >
                          {link.icon} {link.label}
                        </a>
                      ))}
                    </div>
                  ))}
                </>
              )}
              
              <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
              
              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
          )}
        </div>
      </div>
    )
  }

  return null
}
