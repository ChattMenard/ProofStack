'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const navItems = [
  { href: '/portfolios', label: 'Hire' },
  { href: '/projectlistings', label: 'Hiring' },
]

const signupLinks = [
  { href: '/employer/signup', label: 'Employers' },
  { href: '/signup', label: 'Professionals' },
]

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [isSignedIn, setIsSignedIn] = useState(false)

  useEffect(() => {
    // Check if user is signed in
    supabase.auth.getUser().then(({ data }: any) => {
      setIsSignedIn(!!data.user)
    })

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      setIsSignedIn(!!session?.user)
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
    <nav className="hidden md:flex items-center gap-4">
      {/* Main navigation links - only show when signed in */}
      {isSignedIn && (
        <>
          {navItems.map((item, index) => (
            <span key={item.href} className="flex items-center gap-4">
              <Link
                href={item.href}
                className={`text-lg font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-sage-400 dark:text-sage-300 border-b-2 border-sage-400 dark:border-sage-300'
                    : 'text-gray-600 dark:text-gray-400 hover:text-sage-400 dark:hover:text-sage-300'
                }`}
              >
                {item.label}
              </Link>
              {index < navItems.length - 1 && (
                <span className="text-gray-400 dark:text-gray-600 text-lg">|</span>
              )}
            </span>
          ))}
        </>
      )}
      
      {/* Signup links - only show when NOT signed in */}
      {!isSignedIn && (
        <>
          {signupLinks.map((item, index) => (
            <span key={item.href} className="flex items-center gap-4">
              <Link
                href={item.href}
                className={`px-4 py-2 text-lg font-medium transition-colors ${
                  item.label === 'Professionals'
                    ? 'text-sage-600 dark:text-sage-400 hover:text-sage-700 dark:hover:text-sage-300'
                    : 'text-gray-700 dark:text-gray-300 hover:text-sage-600 dark:hover:text-sage-400'
                }`}
              >
                {item.label}
              </Link>
              {index < signupLinks.length - 1 && (
                <span className="text-gray-400 dark:text-gray-600 text-lg">|</span>
              )}
            </span>
          ))}
          <span className="text-gray-400 dark:text-gray-600 text-lg">|</span>
          <Link
            href="/login"
            className="text-lg font-medium text-gray-700 dark:text-gray-300 hover:text-sage-600 dark:hover:text-sage-400 transition-colors"
          >
            Sign In
          </Link>
        </>
      )}

      {/* Sign Out link - only show when signed in */}
      {isSignedIn && (
        <>
          <span className="text-gray-400 dark:text-gray-600 text-lg">|</span>
          <button
            onClick={handleSignOut}
            className="text-lg font-medium text-gray-700 dark:text-gray-300 hover:text-sage-600 dark:hover:text-sage-400 transition-colors"
          >
            Sign Out
          </button>
        </>
      )}
    </nav>
  )
}
