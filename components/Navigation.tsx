'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const marketplaceLinks = [
  { href: '/portfolios', label: 'Professionals' },
  { href: '/projectlistings', label: 'Jobs' },
]

const signupLinks = [
  { href: '/employer/signup', label: 'Employers' },
  { href: '/signup', label: 'Professionals' },
]

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is signed in and get role
    supabase.auth.getUser().then(async ({ data }: any) => {
      setIsSignedIn(!!data.user)
      
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('auth_uid', data.user.id)
          .single()
        
        setUserRole(profile?.user_type || null)
      }
    })

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      setIsSignedIn(!!session?.user)
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('auth_uid', session.user.id)
          .single()
        
        setUserRole(profile?.user_type || null)
      } else {
        setUserRole(null)
      }
    })

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const isActive = (href: string) => {
    const path = pathname ?? '/'
    if (href === '/' && path === '/') return true
    if (href !== '/' && path.startsWith(href)) return true
    return false
  }

  return (
    <nav className="hidden md:flex items-center gap-6">
      {/* Signed In - Show role-specific quick links + marketplace */}
      {isSignedIn && (
        <>
          {/* Employer Quick Links */}
          {userRole === 'employer' && (
            <>
              <Link
                href="/employer/dashboard"
                className={`text-sm font-medium transition-colors ${
                  isActive('/employer/dashboard')
                    ? 'text-sage-400 dark:text-sage-300'
                    : 'text-gray-600 dark:text-gray-400 hover:text-sage-400 dark:hover:text-sage-300'
                }`}
              >
                🏠 Dashboard
              </Link>
              <Link
                href="/employer/post-job"
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-sage-400 dark:hover:text-sage-300 transition-colors"
              >
                ➕ Post Job
              </Link>
              <Link
                href="/employer/applications"
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-sage-400 dark:hover:text-sage-300 transition-colors"
              >
                📋 Applications
              </Link>
              <Link
                href="/employer/discover"
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-sage-400 dark:hover:text-sage-300 transition-colors"
              >
                🔍 Discover
              </Link>
            </>
          )}
          
          {/* Professional Quick Links */}
          {userRole === 'professional' && (
            <>
              <Link
                href="/professional/dashboard"
                className={`text-sm font-medium transition-colors ${
                  isActive('/professional/dashboard')
                    ? 'text-sage-400 dark:text-sage-300'
                    : 'text-gray-600 dark:text-gray-400 hover:text-sage-400 dark:hover:text-sage-300'
                }`}
              >
                📊 Dashboard
              </Link>
              <Link
                href="/upload"
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-sage-400 dark:hover:text-sage-300 transition-colors"
              >
                📤 Upload
              </Link>
            </>
          )}
          
          {/* Marketplace Links - Always show when signed in */}
          {marketplaceLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? 'text-sage-400 dark:text-sage-300 border-b-2 border-sage-400 dark:border-sage-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-sage-400 dark:hover:text-sage-300'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </>
      )}
      
      {/* When NOT signed in - show marketplace links only */}
      {!isSignedIn && (
        <>
          {marketplaceLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? 'text-sage-400 dark:text-sage-300 border-b-2 border-sage-400 dark:border-sage-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-sage-400 dark:hover:text-sage-300'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </>
      )}
    </nav>
  )
}
