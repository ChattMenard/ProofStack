import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function isValidUrl(u: string) {
  try {
    // eslint-disable-next-line no-new
    new URL(u)
    return true
  } catch (e) {
    return false
  }
}

let _supabaseServer: any

if (!isValidUrl(supabaseUrl) || !supabaseServiceRole) {
  console.warn('Warning: SUPABASE service env vars missing or invalid. Server-side API will fail without SUPABASE_SERVICE_ROLE_KEY and a valid NEXT_PUBLIC_SUPABASE_URL')
  _supabaseServer = {
    auth: {
      async getUser() {
        return { data: { user: null } }
      }
    },
    from() {
      return {
        insert: async () => ({ error: new Error('Supabase server not configured') }),
        select: () => ({ single: async () => ({ error: new Error('Supabase server not configured') }) })
      }
    }
  }
} else {
  _supabaseServer = createClient(supabaseUrl, supabaseServiceRole)
}

export const supabaseServer = _supabaseServer
export default supabaseServer
