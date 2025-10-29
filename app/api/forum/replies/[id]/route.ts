import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/forum/replies/[id]
 * Update or delete a reply (owner can edit)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const replyId = params.id
    const body = await request.json()
    const { content, is_accepted_answer } = body

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

    // Get reply and verify ownership (unless marking accepted answer - only thread owner can do that)
    const { data: reply, error: getError } = await supabase
      .from('forum_replies')
      .select('user_id, thread_id')
      .eq('id', replyId)
      .single()

    if (getError || !reply) {
      return NextResponse.json(
        { error: 'Reply not found' },
        { status: 404 }
      )
    }

    // For marking accepted answer, only thread owner can do this
    if (is_accepted_answer !== undefined) {
      const { data: thread } = await supabase
        .from('forum_threads')
        .select('user_id')
        .eq('id', reply.thread_id)
        .single()

      if (thread?.user_id !== userId) {
        return NextResponse.json(
          { error: 'Only thread creator can mark accepted answer' },
          { status: 403 }
        )
      }
    } else {
      // For editing content, only reply owner can do this
      if (reply.user_id !== userId) {
        return NextResponse.json(
          { error: 'Only reply creator can edit' },
          { status: 403 }
        )
      }

      if (content && content.length < 5) {
        return NextResponse.json(
          { error: 'Content must be at least 5 characters' },
          { status: 400 }
        )
      }
    }

    // Update reply
    const updates: any = {}
    if (content) updates.content = content
    if (is_accepted_answer !== undefined) updates.is_accepted_answer = is_accepted_answer

    const { data: updated, error: updateError } = await supabase
      .from('forum_replies')
      .update(updates)
      .eq('id', replyId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating reply:', updateError)
      return NextResponse.json(
        { error: 'Failed to update reply' },
        { status: 500 }
      )
    }

    return NextResponse.json(updated)
  } catch (err) {
    console.error('Error in PATCH /api/forum/replies/[id]:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/forum/replies/[id]
 * Soft delete a reply (owner or admin)
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

    // Get reply and verify ownership or admin status
    const { data: reply, error: getError } = await supabase
      .from('forum_replies')
      .select('user_id')
      .eq('id', replyId)
      .single()

    if (getError || !reply) {
      return NextResponse.json(
        { error: 'Reply not found' },
        { status: 404 }
      )
    }

    // Check if user is owner or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single()

    if (reply.user_id !== userId && !profile?.is_admin) {
      return NextResponse.json(
        { error: 'Only reply creator or admin can delete' },
        { status: 403 }
      )
    }

    // Soft delete
    const { error: deleteError } = await supabase
      .from('forum_replies')
      .update({ is_deleted: true })
      .eq('id', replyId)

    if (deleteError) {
      console.error('Error deleting reply:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete reply' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error in DELETE /api/forum/replies/[id]:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
