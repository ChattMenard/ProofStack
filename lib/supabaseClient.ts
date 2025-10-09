import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

function isValidUrl(u: string) {
  try {
    // new URL will throw for invalid inputs
    // if value is a placeholder like 'your-supabase-url' this will throw
    // which prevents createClient from constructing invalid endpoints during build
    // eslint-disable-next-line no-new
    new URL(u)
    return true
  } catch (e) {
    return false
  }
}

// Use a local variable and export at the top-level to avoid conditional exports
// which are not allowed in TypeScript modules.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabase: any

const SUPABASE_CONFIGURED = isValidUrl(supabaseUrl) && !!supabaseAnonKey

if (!SUPABASE_CONFIGURED) {
  console.warn('Supabase not configured or NEXT_PUBLIC_SUPABASE_URL is invalid. Exposing a noop stub for local dev/build.')

  _supabase = {
    auth: {
      async getUser() {
        return { data: { user: null } }
      },
      async getSession() {
        return { data: null }
      },
      async signInWithOtp() {
        return { error: new Error('Supabase not configured') }
      },
      async signInWithOAuth() {
        return { error: new Error('Supabase not configured') }
      },
      async signOut() {
        return { error: new Error('Supabase not configured') }
      }
    },
    from() {
      return {
        // simple chainable stub
        insert: async () => ({ error: new Error('Supabase not configured') }),
        select: () => ({ single: async () => ({ error: new Error('Supabase not configured') }) })
      }
    }
  }
} else {
  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      detectSessionInUrl: true
    }
  })
}

export const supabase = _supabase
export { SUPABASE_CONFIGURED }
export default supabase
