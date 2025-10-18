/**
 * Ensure a user has a profile in the profiles table
 * This is a client-side fallback in case the trigger doesn't fire
 */

import { supabase } from './supabaseClient'

export async function ensureUserProfile() {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('No user found:', userError)
      return null
    }

    // Check if profile exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('auth_uid', user.id)
      .single()

    if (existingProfile) {
      console.log('✅ Profile exists:', existingProfile.email)
      return existingProfile
    }

    // Profile doesn't exist - create it
    console.log('Creating profile for user:', user.email)
    
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        auth_uid: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || 
                   user.user_metadata?.name || 
                   user.email?.split('@')[0] || 
                   'User',
        avatar_url: user.user_metadata?.avatar_url,
        github_username: user.user_metadata?.user_name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create profile:', insertError)
      return null
    }

    console.log('✅ Profile created:', newProfile.email)
    return newProfile
  } catch (error) {
    console.error('Error ensuring profile:', error)
    return null
  }
}
