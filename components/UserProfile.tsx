"use client"
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'

export default function UserProfile() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    let mounted = true
    
    async function load() {
      const { data } = await supabase.auth.getUser()
      if (!mounted) return
      setUser(data.user ?? null)
      
      // Fetch user profile to determine role
      if (data.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role, is_founder, user_type, is_admin')
          .eq('auth_uid', data.user.id)
          .single()
        
        if (mounted && profileData) {
          setProfile(profileData)
        }
      }
      
      setLoading(false)
    }
    
    load()

    const { data: listener } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      if (!mounted) return
      setUser(session?.user ?? null)
      
      // Fetch profile on auth change
      if (session?.user) {
        supabase
          .from('profiles')
          .select('role, is_founder, user_type, is_admin')
          .eq('auth_uid', session.user.id)
          .single()
          .then(({ data: profileData }: { data: any }) => {
            if (mounted && profileData) {
              setProfile(profileData)
            }
          })
      } else {
        setProfile(null)
      }
      
      // Auto-redirect after sign in from login page
      if (event === 'SIGNED_IN' && session && pathname === '/login') {
        setTimeout(() => {
          router.push('/dashboard')
        }, 500)
      }
    })

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.user-profile-dropdown')) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)

    return () => {
      mounted = false
      listener?.subscription.unsubscribe()
      document.removeEventListener('click', handleClickOutside)
    }
  }, [router, pathname])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  // Don't show anything if not logged in - CTA buttons are now in layout header
  if (!user && pathname !== '/login' && pathname !== '/signup') {
    return null
  }

  // Don't show anything on login/signup pages or if still loading
  if (pathname === '/login' || pathname === '/signup' || loading) {
    return null
  }

  // Show user info and sign out if logged in
  if (user) {
    return (
      <div className="flex items-center gap-3">
        {/* Role-based Navigation Dropdown */}
        <div className="relative user-profile-dropdown">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border-2 border-sage-600 dark:border-sage-500 text-sage-700 dark:text-sage-300 text-sm rounded-lg hover:bg-sage-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 font-medium"
          >
            {pathname === '/' && '🏠 Welcome'}
            {pathname !== '/' && profile?.role === 'employer' && '🏢 Employer'}
            {pathname !== '/' && profile?.role === 'professional' && '👤 Professional'}
            {pathname !== '/' && profile?.role === 'admin' && '⚙️ Admin'}
            {pathname !== '/' && !profile?.role && '📊 Dashboard'}
            <svg className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 animate-fadeIn">
              <div className="py-2">
              {/* Employer Menu */}
              {profile?.role === 'employer' && (
                <>
                  <a href="/employer/messages" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    💬 Messages
                  </a>
                  <a href="/employer/saved" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    ⭐ Saved Professionals
                  </a>
                  <a href="/employer/settings" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    ⚙️ Settings
                  </a>
                </>
              )}
              
              {/* Professional Menu */}
              {profile?.role === 'professional' && (
                <>
                  <a href="/professional/dashboard" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    📊 My Dashboard
                  </a>
                  <a href="/portfolio" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    📁 My Portfolio
                  </a>
                  <a href="/professional/messages" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    💬 Messages
                  </a>
                  <a href="/professional/promote/manage" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    🚀 Manage Promotion
                  </a>
                  <a href="/professional/reviews" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    ⭐ My Reviews
                  </a>
                </>
              )}
              
              {/* Admin Menu */}
              {(profile?.role === 'admin' || profile?.is_admin) && (
                <>
                  <a href="/admin/dashboard" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    📊 Admin Dashboard
                  </a>
                  <a href="/admin/security" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    🔒 Security
                  </a>
                </>
              )}
              
              {/* Default if no role - show all options */}
              {!profile?.role && (
                <>
                  <a href="/professional/dashboard" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    📊 My Dashboard
                  </a>
                  <a href="/portfolio" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    📁 My Portfolio
                  </a>
                  <a href="/upload" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    📤 Upload Work
                  </a>
                  {profile?.is_founder && (
                    <a href="/admin/dashboard" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                      ⚙️ Admin Dashboard
                    </a>
                  )}
                </>
              )}
              
              <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
              
              {/* Admin Dashboard - Only for admin users */}
              {profile?.is_admin && (
                <a href="/admin/dashboard" className="block px-4 py-2 text-sm text-amber-600 dark:text-amber-400 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold">
                  ⚙️ Admin Dashboard
                </a>
              )}
              
              {profile?.is_founder && (
                <div className="px-4 py-2 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                  🏆 FOUNDING MEMBER
                </div>
              )}
              
              <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                {user.email}
              </div>
            </div>
          </div>
          )}
        </div>
        
        <button 
          onClick={handleSignOut} 
          className="px-4 py-2 text-sm text-forest-300 dark:text-forest-200 hover:text-sage-400 dark:hover:text-sage-300 transition-colors"
        >
          Sign out
        </button>
      </div>
    )
  }

  return null
}
