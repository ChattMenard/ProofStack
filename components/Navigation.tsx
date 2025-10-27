'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { publicNavigation, professionalQuickLinks, employerQuickLinks } from '@/lib/navigationConfig'

export default function Navigation() {
  const pathname = usePathname()
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }: any) => {
      setIsSignedIn(!!data.user)
      if (data.user) {
        const { data: profile } = await supabase.from('profiles').select('user_type').eq('auth_uid', data.user.id).single()
        setUserRole(profile?.user_type || null)
      }
    })
  }, [])

  const isActive = (href: string) => {
    const path = pathname ?? '/'
    return href === '/' ? path === '/' : path.startsWith(href)
  }

  return (
    <nav className="hidden md:flex items-center gap-6">
      {publicNavigation.map((item) => (
        <Link 
          key={item.href} 
          href={item.href} 
          className={`text-sm font-medium transition-colors ${isActive(item.href) ? 'text-sage-400 dark:text-sage-300 border-b-2 border-sage-400' : 'text-gray-600 dark:text-gray-400 hover:text-sage-400'}`}
        >
          {item.label}
        </Link>
      ))}
      {isSignedIn && userRole === 'professional' && professionalQuickLinks.map((link) => (
        <Link key={link.href} href={link.href} className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-sage-400">
          {link.label}
        </Link>
      ))}
      {isSignedIn && userRole === 'employer' && employerQuickLinks.map((link) => (
        <Link key={link.href} href={link.href} className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-sage-400">
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
