"use client"
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function UserProfile() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      const { data } = await supabase.auth.getUser()
      if (!mounted) return
      setUser(data.user ?? null)
    }
    load()

    const { data: listener } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      if (!mounted) return
      setUser(session?.user ?? null)
    })

    return () => {
      mounted = false
      listener?.subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  if (!user) return null

  return (
    <div className="p-4 border rounded max-w-sm">
      <div className="flex items-center space-x-3">
        <div className="text-sm">
          <div className="font-medium">{user.email}</div>
          <div className="text-gray-500 text-xs">Signed in</div>
        </div>
      </div>
      <div className="mt-3">
        <button onClick={handleSignOut} className="text-sm text-red-600">Sign out</button>
      </div>
    </div>
  )
}
