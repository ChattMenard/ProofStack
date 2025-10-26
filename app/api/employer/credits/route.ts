import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
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

    // Get employer's profile ID
    const { data: employerProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_uid', user.id)
      .single()

    if (!employerProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get or create credits record
    let { data: credits } = await supabase
      .from('employer_credits')
      .select('*')
      .eq('employer_id', employerProfile.id)
      .single()

    if (!credits) {
      // Create initial credits record
      const { data: newCredits } = await supabase
        .from('employer_credits')
        .insert({ employer_id: employerProfile.id, credits: 0 })
        .select()
        .single()
      
      credits = newCredits
    }

    // Get recent transactions
    const { data: transactions } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('employer_id', employerProfile.id)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      credits: credits.credits,
      transactions: transactions || []
    })

  } catch (error) {
    console.error('Get credits error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
