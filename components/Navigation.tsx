'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { publicNavigation, professionalQuickLinks, employerQuickLinks } from '@/lib/navigationConfig'

interface NavigationProps {
  showMarketplacesOnly?: boolean
  showMessagesOnly?: boolean
}

export default function Navigation({ showMarketplacesOnly = false, showMessagesOnly = false }: NavigationProps) {
  const pathname = usePathname()
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }: any) => {
      setIsSignedIn(!!data.user)
      if (data.user) {
        const { data: profile } = await supabase.from('profiles').select('id, user_type').eq('auth_uid', data.user.id).single()
        setUserRole(profile?.user_type || null)
        setProfileId(profile?.id || null)
        
        if (profile?.id) {
          loadUnreadCount(profile.id)
          subscribeToMessages(profile.id)
        }
      }
    })
  }, [])

  async function loadUnreadCount(profileId: string) {
    try {
      const { data, error } = await supabase
        .from('conversation_participants')
        .select('unread_count')
        .eq('profile_id', profileId)
      
      if (!error && data) {
        const total = data.reduce((sum: number, p: any) => sum + (p.unread_count || 0), 0)
        setUnreadCount(total)
      }
    } catch (err) {
      console.error('Error loading unread count:', err)
    }
  }

  function subscribeToMessages(profileId: string) {
    const subscription = supabase
      .channel('unread-messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversation_participants',
        filter: `profile_id=eq.${profileId}`
      }, () => {
        loadUnreadCount(profileId)
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const isActive = (href: string) => {
    const path = pathname ?? '/'
    return href === '/' ? path === '/' : path.startsWith(href)
  }

  return (
    <nav className="hidden md:flex items-center gap-3">
      {/* Marketplaces with Community - centered */}
      {!showMessagesOnly && (
        <>
          <Link 
            href="/portfolios" 
            className={`text-sm font-semibold transition-colors ${isActive('/portfolios') ? 'text-sage-400 dark:text-sage-300' : 'text-gray-600 dark:text-gray-400 hover:text-sage-400'}`}
          >
            Talent Marketplace
          </Link>
          <span className="text-gray-400 dark:text-gray-500">|</span>
          <a 
            href="https://discord.gg/tR83acbmUs" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-sage-400 transition-colors"
          >
            Community
          </a>
          <span className="text-gray-400 dark:text-gray-500">|</span>
          <Link 
            href="/projectlistings" 
            className={`text-sm font-semibold transition-colors ${isActive('/projectlistings') ? 'text-sage-400 dark:text-sage-300' : 'text-gray-600 dark:text-gray-400 hover:text-sage-400'}`}
          >
            Job Marketplace
          </Link>
        </>
      )}

      
      {/* My Messages - for logged-in users */}
      {!showMarketplacesOnly && isSignedIn && userRole === 'professional' && professionalQuickLinks.map((link) => (
        <Link 
          key={link.href} 
          href={link.href} 
          className="relative px-4 py-2 text-sm font-medium text-white bg-sage-600 dark:bg-sage-700 rounded-lg hover:bg-sage-700 dark:hover:bg-sage-600 transition-colors shadow-sm"
        >
          {link.label}
          {link.href.includes('/messages') && unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      ))}
      {!showMarketplacesOnly && isSignedIn && userRole === 'employer' && employerQuickLinks.map((link) => (
        <Link 
          key={link.href} 
          href={link.href} 
          className="relative px-4 py-2 text-sm font-medium text-white bg-sage-600 dark:bg-sage-700 rounded-lg hover:bg-sage-700 dark:hover:bg-sage-600 transition-colors shadow-sm"
        >
          {link.label}
          {link.href.includes('/messages') && unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      ))}
    </nav>
  )
}
