import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET() {
  try {
    // Call the database function to get spots remaining
    const { data, error } = await supabase
      .rpc('founding_employer_spots_remaining')
    
    if (error) {
      console.error('Error fetching spots remaining:', error)
      return NextResponse.json({ spots_remaining: 10 }, { status: 200 })
    }

    return NextResponse.json({ spots_remaining: data || 10 })
  } catch (error) {
    console.error('Error in spots-remaining API:', error)
    return NextResponse.json({ spots_remaining: 10 }, { status: 200 })
  }
}
