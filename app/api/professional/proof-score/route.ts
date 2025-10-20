import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const professional_id = searchParams.get('professional_id')

    if (!professional_id) {
      return NextResponse.json(
        { error: 'Missing professional_id' },
        { status: 400 }
      )
    }

    // Get ProofScore and metrics
    const { data: rating, error: ratingError } = await supabase
      .from('professional_ratings')
      .select('proof_score, proof_score_breakdown, total_projects_completed')
      .eq('professional_id', professional_id)
      .single()

    if (ratingError || !rating) {
      // No ratings yet - return 0 score
      return NextResponse.json({
        proof_score: 0,
        breakdown: {
          response_score: 0,
          delivery_score: 0,
          communication_score: 0,
          quality_score: 0,
          professionalism_score: 0,
          total_projects: 0
        },
        percentile: 0,
        tier: 'No Reviews'
      })
    }

    // Get percentile ranking
    const { data: percentileData, error: percentileError } = await supabase
      .rpc('get_professional_percentile', {
        p_professional_id: professional_id
      })

    const percentile = percentileError ? null : percentileData

    // Determine tier
    const score = rating.proof_score || 0
    let tier = 'Fair'
    if (score >= 90) tier = 'Elite'
    else if (score >= 80) tier = 'Excellent'
    else if (score >= 70) tier = 'Good'
    else if (score >= 60) tier = 'Average'

    return NextResponse.json({
      proof_score: score,
      breakdown: rating.proof_score_breakdown || {},
      percentile,
      tier,
      total_projects: rating.total_projects_completed || 0
    })
  } catch (error) {
    console.error('Error in proof-score API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
