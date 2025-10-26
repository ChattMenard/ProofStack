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
          .select('role, is_founder, user_type, is_admin, username, email')
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

    const { data: listener } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      if (!mounted) return
      setUser(session?.user ?? null)
      
      // Fetch profile on auth change
      if (session?.user) {
        supabase
          .from('profiles')
          .select('role, is_founder, user_type, is_admin, username, email')
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
            {pathname?.startsWith('/professional/dashboard') && '📊 My Dashboard'}
            {pathname?.startsWith('/professional/preferences') && '🎯 Preferences'}
            {pathname?.startsWith('/professional/verify') && '✓ Verify Accounts'}
            {pathname?.startsWith('/professional') && '👤 Professional'}
            {pathname?.startsWith('/portfolio') && '📁 My Portfolio'}
            {pathname?.startsWith('/upload') && '📤 Upload Work'}
            {pathname?.startsWith('/employer') && '🏢 Employer'}
            {pathname?.startsWith('/admin') && '⚙️ Admin'}
            {pathname && pathname !== '/' && !pathname.startsWith('/professional') && !pathname.startsWith('/employer') && !pathname.startsWith('/admin') && !pathname.startsWith('/portfolio') && !pathname.startsWith('/upload') && '📊 Dashboard'}
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
              
              {/* Professional Menu - show for professionals AND admins */}
              {(profile?.role === 'professional' || user.email === 'mattchenard2009@gmail.com') && (
                <>
                  <a href="/professional/dashboard" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    📊 My Dashboard
                  </a>
                  <a href={username ? `/portfolio/${username}` : '/portfolio'} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    📁 My Portfolio
                  </a>
                  <a href="/upload" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    📤 Upload Work
                  </a>
                  <a href="/professional/preferences" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    🎯 Preferences
                  </a>
                  <a href="/professional/verify" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    ✓ Verify Accounts
                  </a>
                </>
              )}
              
              <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
              
              {/* Admin Menu - Only for mattchenard2009@gmail.com */}
              {user.email === 'mattchenard2009@gmail.com' && (
                <>
                  <a href="/admin/dashboard" className="block px-4 py-2 text-sm text-amber-600 dark:text-amber-400 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold">
                    ⚙️ Admin Dashboard
                  </a>
                  <a href="/admin/security" className="block px-4 py-2 text-sm text-amber-600 dark:text-amber-400 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold">
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
                  <a href={username ? `/portfolio/${username}` : '/portfolio'} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    📁 My Portfolio
                  </a>
                  <a href="/upload" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    📤 Upload Work
                  </a>
                </>
              )}
              
              {/* Founder badge - keep this for "founding employer" program participants */}
              {profile?.is_founder && user.email !== 'mattchenard2009@gmail.com' && (
                <>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                  <div className="px-4 py-2 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    🏆 FOUNDING EMPLOYER
                  </div>
                </>
              )}
              
              <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
              
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
