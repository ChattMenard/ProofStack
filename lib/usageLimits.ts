import { NextApiRequest, NextApiResponse } from 'next'
import supabaseServer from './supabaseServer'

export interface UserWithLimits {
  id: string
  email: string
  plan: string
  is_founder: boolean
  founder_number?: number
  usage_limits: {
    uploads_per_month: number
    analysis_per_month: number
    storage_gb: number
  }
}

/**
 * Check if user can perform an action based on their plan limits
 * Returns user object if allowed, null if over limit
 */
export async function checkUsageLimit(
  userId: string,
  actionType: 'upload' | 'analysis'
): Promise<{ allowed: boolean; user: UserWithLimits | null; message?: string }> {
  try {
    // Get user with plan info
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select('id, email, plan, is_founder, founder_number, usage_limits')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return { allowed: false, user: null, message: 'User not found' }
    }

    // Founders have unlimited access
    if (user.is_founder || user.plan === 'founder') {
      return { allowed: true, user: user as UserWithLimits }
    }

    // Check current month usage
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    
    const { data: usage, error: usageError } = await supabaseServer
      .from('usage_tracking')
      .select('uploads_count, analysis_count')
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .single()

    // If no usage record yet, user is within limits
    if (usageError?.code === 'PGRST116') { // No rows returned
      return { allowed: true, user: user as UserWithLimits }
    }

    if (usageError) {
      console.error('Usage check error:', usageError)
      // Fail open - allow the request but log the error
      return { allowed: true, user: user as UserWithLimits }
    }

    // Check limits based on action type
    const limits = user.usage_limits as UserWithLimits['usage_limits']
    
    if (actionType === 'upload') {
      const uploadsUsed = usage?.uploads_count || 0
      const uploadsLimit = limits.uploads_per_month
      
      if (uploadsUsed >= uploadsLimit) {
        return {
          allowed: false,
          user: user as UserWithLimits,
          message: `Upload limit reached (${uploadsLimit}/month). Please upgrade your plan.`
        }
      }
    } else if (actionType === 'analysis') {
      const analysisUsed = usage?.analysis_count || 0
      const analysisLimit = limits.analysis_per_month
      
      if (analysisUsed >= analysisLimit) {
        return {
          allowed: false,
          user: user as UserWithLimits,
          message: `Analysis limit reached (${analysisLimit}/month). Please upgrade your plan.`
        }
      }
    }

    return { allowed: true, user: user as UserWithLimits }
  } catch (error) {
    console.error('checkUsageLimit error:', error)
    // Fail open on errors to avoid blocking legitimate users
    return { allowed: true, user: null }
  }
}

/**
 * Increment usage counter after successful action
 */
export async function incrementUsage(
  userId: string,
  actionType: 'upload' | 'analysis',
  costUsd: number = 0
): Promise<void> {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM

    // Upsert usage record
    const { error } = await supabaseServer
      .from('usage_tracking')
      .upsert({
        user_id: userId,
        month: currentMonth,
        uploads_count: actionType === 'upload' ? 1 : 0,
        analysis_count: actionType === 'analysis' ? 1 : 0,
        api_cost_usd: costUsd,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,month',
        ignoreDuplicates: false
      })

    if (error) {
      console.error('incrementUsage error:', error)
    }
  } catch (error) {
    console.error('incrementUsage exception:', error)
  }
}

/**
 * Get current usage for a user
 */
export async function getUserUsage(userId: string): Promise<{
  uploads_used: number
  uploads_limit: number
  analysis_used: number
  analysis_limit: number
  plan: string
  is_founder: boolean
  founder_number?: number
} | null> {
  try {
    const { data, error } = await supabaseServer
      .from('user_usage_summary')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('getUserUsage error:', error)
      return null
    }

    return {
      uploads_used: data.uploads_used || 0,
      uploads_limit: data.uploads_limit || 10,
      analysis_used: data.analysis_used || 0,
      analysis_limit: data.analysis_limit || 20,
      plan: data.plan,
      is_founder: data.is_founder,
      founder_number: data.founder_number
    }
  } catch (error) {
    console.error('getUserUsage exception:', error)
    return null
  }
}

export default checkUsageLimit
