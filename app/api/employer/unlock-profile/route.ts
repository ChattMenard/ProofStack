import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const UNLOCK_COST = 1 // Credits per profile unlock

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the user's session
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { professionalId } = await request.json()

    if (!professionalId) {
      return NextResponse.json({ error: 'Professional ID required' }, { status: 400 })
    }

    // Get employer's profile ID
    const { data: employerProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_uid', user.id)
      .single()

    if (!employerProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const employerId = employerProfile.id

    // Check if already unlocked
    const { data: existingUnlock } = await supabase
      .from('profile_unlocks')
      .select('id')
      .eq('employer_id', employerId)
      .eq('professional_id', professionalId)
      .single()

    if (existingUnlock) {
      return NextResponse.json({ 
        success: true, 
        message: 'Profile already unlocked',
        alreadyUnlocked: true 
      })
    }

    // Get or create employer credits record
    let { data: credits } = await supabase
      .from('employer_credits')
      .select('*')
      .eq('employer_id', employerId)
      .single()

    if (!credits) {
      // Create initial credits record with 0 credits
      const { data: newCredits } = await supabase
        .from('employer_credits')
        .insert({ employer_id: employerId, credits: 0 })
        .select()
        .single()
      
      credits = newCredits
    }

    // Check if enough credits
    if (!credits || credits.credits < UNLOCK_COST) {
      return NextResponse.json({ 
        error: 'Insufficient credits', 
        required: UNLOCK_COST,
        available: credits?.credits || 0,
        insufficientCredits: true
      }, { status: 402 })
    }

    // Deduct credits
    const newBalance = credits.credits - UNLOCK_COST
    await supabase
      .from('employer_credits')
      .update({ credits: newBalance })
      .eq('employer_id', employerId)

    // Create unlock record
    const { data: unlock, error: unlockError } = await supabase
      .from('profile_unlocks')
      .insert({
        employer_id: employerId,
        professional_id: professionalId,
        credits_spent: UNLOCK_COST
      })
      .select()
      .single()

    if (unlockError) {
      // Rollback credits if unlock fails
      await supabase
        .from('employer_credits')
        .update({ credits: credits.credits })
        .eq('employer_id', employerId)

      return NextResponse.json({ error: 'Failed to unlock profile' }, { status: 500 })
    }

    // Log transaction
    await supabase
      .from('credit_transactions')
      .insert({
        employer_id: employerId,
        transaction_type: 'unlock',
        amount: -UNLOCK_COST,
        balance_after: newBalance,
        description: `Unlocked profile ${professionalId}`,
        reference_id: unlock.id
      })

    return NextResponse.json({
      success: true,
      message: 'Profile unlocked successfully',
      creditsRemaining: newBalance,
      unlockId: unlock.id
    })

  } catch (error) {
    console.error('Unlock profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
