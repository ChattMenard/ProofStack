'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const navItems = [
  { href: '/portfolios', label: 'For Hire' },
  { href: '/projectlistings', label: 'Hiring' },
]

const signupLinks = [
  { href: '/employer/signup', label: 'For Employers' },
  { href: '/signup', label: 'For Professionals' },
]

export default function Navigation() {
  const pathname = usePathname()
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

  const isActive = (href: string) => {
    const path = pathname ?? '/'
    if (href === '/' && path === '/') return true
    if (href !== '/' && path.startsWith(href)) return true
    return false
  }

  return (
    <nav className="hidden md:flex items-center gap-6">
      {/* Main navigation links - only show when signed in */}
      {isSignedIn && navItems.map((item) => (
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
      
      {/* Signup links - only show when NOT signed in */}
      {!isSignedIn && (
        <div className="flex items-center gap-2 ml-2">
          {signupLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                item.label === 'For Professionals'
                  ? 'text-sage-600 dark:text-sage-400 hover:text-sage-700 dark:hover:text-sage-300'
                  : 'text-gray-700 dark:text-gray-300 hover:text-sage-600 dark:hover:text-sage-400'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
