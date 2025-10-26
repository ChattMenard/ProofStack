// Simple server-side client that reads cookies for auth
// Works with @supabase/supabase-js 2.0.0
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export function createServerSupabaseClient() {
  const cookieStore = cookies()
  
  // Get all cookies and find the auth token
  // Supabase stores tokens with format: sb-<project-ref>-auth-token
  const allCookies = cookieStore.getAll()
  let accessToken = ''
  
  // Look for Supabase auth token (format: sb-xxxxx-auth-token)
  for (const cookie of allCookies) {
    if (cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')) {
      try {
        const parsed = JSON.parse(cookie.value)
        accessToken = parsed.access_token || parsed[0] // Try both formats
        if (accessToken) break
      } catch {
        // If not JSON, might be the token itself
        accessToken = cookie.value
        break
      }
    }
  }

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: accessToken ? {
          Authorization: `Bearer ${accessToken}`
        } : {}
      }
    }
  )

  return client
}
