// Simple server-side client that reads cookies for auth
// Works with @supabase/supabase-js 2.0.0
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export function createServerSupabaseClient() {
  const cookieStore = cookies()
  
  // Get the session token from cookies
  const accessToken = cookieStore.get('sb-access-token')?.value || 
                     cookieStore.get('supabase-auth-token')?.value ||
                     cookieStore.get('sb:token')?.value

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
