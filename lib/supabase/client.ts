import supabase, { SUPABASE_CONFIGURED, supabase as supabaseNamed } from '../supabaseClient'
import { createServerSupabaseClient } from '../supabaseServerClient'

// Re-export existing client helpers for compatibility with import paths
export { SUPABASE_CONFIGURED } from '../supabaseClient'
export { createServerSupabaseClient }

// Provide both default and named exports
export const supabaseClient = supabaseNamed ?? supabase
export default supabaseClient
