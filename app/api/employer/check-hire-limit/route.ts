import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: Request) {
  try {
    const { employer_org_id, employer_user_id, professional_id, attempt_type } = await request.json()

    if (!employer_org_id || !employer_user_id || !professional_id || !attempt_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check hire limit and record the attempt
    const { data, error } = await supabase
      .rpc('check_hire_limit_and_record', {
        p_employer_org_id: employer_org_id,
        p_employer_user_id: employer_user_id,
        p_professional_id: professional_id,
        p_attempt_type: attempt_type
      })

    if (error) {
      console.error('Error checking hire limit:', error)
      return NextResponse.json(
        { error: 'Failed to check hire limit', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in check-hire-limit API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to just check status without recording
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const employer_org_id = searchParams.get('employer_org_id')

    if (!employer_org_id) {
      return NextResponse.json(
        { error: 'Missing employer_org_id' },
        { status: 400 }
      )
    }

    // Just check if they can hire (doesn't record attempt)
    const { data, error } = await supabase
      .rpc('can_employer_hire', {
        p_employer_org_id: employer_org_id
      })

    if (error) {
      console.error('Error checking hire eligibility:', error)
      return NextResponse.json(
        { error: 'Failed to check hire eligibility', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in check-hire-limit GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
