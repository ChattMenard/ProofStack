import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/forum/replies/[id]/upvote
 * Upvote a reply
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const replyId = params.id

    // Get bearer token from auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]

    // Get authenticated user
    const { data: authData, error: authError } = await supabase.auth.getUser(token)
    if (authError || !authData?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = authData.user.id

    // Check if reply exists
    const { data: reply } = await supabase
      .from('forum_replies')
      .select('user_id, upvote_count')
      .eq('id', replyId)
      .single()

    if (!reply) {
      return NextResponse.json(
        { error: 'Reply not found' },
        { status: 404 }
      )
    }

    // Check if already upvoted (UNIQUE constraint will prevent duplicate)
    const { data: existingVote } = await supabase
      .from('forum_reply_upvotes')
      .select('id')
      .eq('reply_id', replyId)
      .eq('user_id', userId)
      .single()

    if (existingVote) {
      return NextResponse.json(
        { error: 'Already upvoted this reply' },
        { status: 400 }
      )
    }

    // Create upvote
    const { error: voteError } = await supabase
      .from('forum_reply_upvotes')
      .insert({
        reply_id: parseInt(replyId),
        user_id: userId
      })

    if (voteError) {
      console.error('Error creating upvote:', voteError)
      return NextResponse.json(
        { error: 'Failed to upvote' },
        { status: 500 }
      )
    }

    // Increment upvote count on reply
    const { data: updated, error: updateError } = await supabase
      .from('forum_replies')
      .update({ upvote_count: (reply.upvote_count || 0) + 1 })
      .eq('id', replyId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating upvote count:', updateError)
      return NextResponse.json(
        { error: 'Failed to update upvote count' },
        { status: 500 }
      )
    }

    // Update user reputation
    try {
      await supabase.rpc('recalculate_user_reputation', {
        user_id: reply.user_id
      })
    } catch {
      // Silently fail if function doesn't exist
    }

    return NextResponse.json({ success: true, upvote_count: updated.upvote_count })
  } catch (err) {
    console.error('Error in POST /api/forum/replies/[id]/upvote:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/forum/replies/[id]/upvote
 * Remove upvote from a reply
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const replyId = params.id

    // Get bearer token from auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]

    // Get authenticated user
    const { data: authData, error: authError } = await supabase.auth.getUser(token)
    if (authError || !authData?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = authData.user.id

    // Check if upvote exists
    const { data: upvote } = await supabase
      .from('forum_reply_upvotes')
      .select('id')
      .eq('reply_id', replyId)
      .eq('user_id', userId)
      .single()

    if (!upvote) {
      return NextResponse.json(
        { error: 'No upvote found' },
        { status: 404 }
      )
    }

    // Delete upvote
    const { error: deleteError } = await supabase
      .from('forum_reply_upvotes')
      .delete()
      .eq('reply_id', replyId)
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Error deleting upvote:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove upvote' },
        { status: 500 }
      )
    }

    // Decrement upvote count on reply
    const { data: reply } = await supabase
      .from('forum_replies')
      .select('user_id, upvote_count')
      .eq('id', replyId)
      .single()

    if (reply) {
      const { data: updated } = await supabase
        .from('forum_replies')
        .update({ upvote_count: Math.max(0, (reply.upvote_count || 1) - 1) })
        .eq('id', replyId)
        .select('*')
        .single()

      // Update user reputation
      try {
        await supabase.rpc('recalculate_user_reputation', {
          user_id: reply.user_id
        })
      } catch {
        // Silently fail if function doesn't exist
      }

      return NextResponse.json({ success: true, upvote_count: updated?.upvote_count })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error in DELETE /api/forum/replies/[id]/upvote:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
