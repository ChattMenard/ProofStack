"use client"
import { SUPABASE_CONFIGURED } from '../lib/supabaseClient'

export default function SupabaseWarning() {
  if (SUPABASE_CONFIGURED) return null

  return (
    <div className="rounded border border-yellow-400 bg-yellow-50 text-yellow-800 p-3 mb-4">
      <strong>Supabase not configured</strong>
      <div className="text-sm">Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your <code>.env.local</code> to enable authentication and uploads.</div>
    </div>
  )
}
