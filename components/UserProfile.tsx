"use client"
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'

export default function UserProfile() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    
    async function load() {
      const { data } = await supabase.auth.getUser()
      if (!mounted) return
      setUser(data.user ?? null)
      setLoading(false)
    }
    
    load()

    const { data: listener } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      if (!mounted) return
      setUser(session?.user ?? null)
      
      // Auto-redirect after sign in from login page
      if (event === 'SIGNED_IN' && session && pathname === '/login') {
        setTimeout(() => {
          router.push('/dashboard')
        }, 500)
      }
    })

    return () => {
      mounted = false
      listener?.subscription.unsubscribe()
    }
  }, [router, pathname])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  // Show sign in link if not on login/signup pages and not logged in
  if (!user && pathname !== '/login' && pathname !== '/signup') {
    return (
      <>
        <a 
          href="/login" 
          className="text-sm text-gray-600 hover:text-blue-600 hover:underline"
        >
          Sign In
        </a>
        <a 
          href="/dashboard" 
          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          Dashboard
        </a>
      </>
    )
  }

  // Don't show anything on login/signup pages or if still loading
  if (pathname === '/login' || pathname === '/signup' || loading) {
    return null
  }

  // Show user info and sign out if logged in
  if (user) {
    return (
      <>
        {pathname !== '/dashboard' && (
          <a 
            href="/dashboard" 
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            Dashboard
          </a>
        )}
        <div className="flex items-center gap-3 px-3 py-1.5 bg-gray-100 rounded-lg">
          <span className="text-sm text-gray-700">{user.email}</span>
          <button 
            onClick={handleSignOut} 
            className="text-sm text-red-600 hover:text-red-700 hover:underline"
          >
            Sign out
          </button>
        </div>
      </>
    )
  }

  return null
}
