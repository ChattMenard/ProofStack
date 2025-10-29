import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/forum/users/[id]/stats
 * Get forum reputation and contribution stats for a user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id

    // Get forum stats
    const { data: stats, error: statsError } = await supabase
      .from('forum_user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (statsError && statsError.code !== 'PGRST116') {
      // PGRST116 = no rows
      console.error('Error fetching stats:', statsError)
      return NextResponse.json(
        { error: 'Failed to fetch stats' },
        { status: 500 }
      )
    }

    // If no stats exist, return defaults
    if (!stats) {
      return NextResponse.json({
        user_id: userId,
        threads_created: 0,
        replies_posted: 0,
        replies_accepted: 0,
        total_upvotes: 0,
        forum_reputation: 0,
        reputation_tier: 'newcomer'
      })
    }

    return NextResponse.json(stats)
  } catch (err) {
    console.error('Error in GET /api/forum/users/[id]/stats:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
