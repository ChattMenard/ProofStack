import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const supabase = supabaseServer

/**
 * GET /api/forum/threads/[id]
 * Fetch thread with replies and increment view count
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const threadId = params.id

    // Increment view count
    await supabase.rpc('increment_thread_views', {
      thread_id: parseInt(threadId)
    })

    // Get thread
    const { data: thread, error: threadError } = await supabase
      .from('forum_threads')
      .select(
        `
        *,
        profiles!forum_threads_user_id_fkey(id, username, avatar_url, user_type),
        forum_user_stats!forum_threads_user_id_fkey(forum_reputation, reputation_tier)
        `
      )
      .eq('id', threadId)
      .eq('is_archived', false)
      .single()

    if (threadError || !thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      )
    }

    // Get replies
    const { data: replies, error: repliesError } = await supabase
      .from('forum_replies')
      .select(
        `
        id,
        user_id,
        content,
        is_accepted_answer,
        upvote_count,
        created_at,
        updated_at,
        profiles!forum_replies_user_id_fkey(id, username, avatar_url, user_type),
        forum_user_stats!forum_replies_user_id_fkey(forum_reputation, reputation_tier)
        `
      )
      .eq('thread_id', threadId)
      .eq('is_deleted', false)
      .order('is_accepted_answer', { ascending: false })
      .order('upvote_count', { ascending: false })
      .order('created_at', { ascending: true })

    if (repliesError) {
      console.error('Error fetching replies:', repliesError)
      return NextResponse.json(
        { error: 'Failed to fetch replies' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      thread,
      replies
    })
  } catch (err) {
    console.error('Error in GET /api/forum/threads/[id]:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/forum/threads/[id]
 * Update thread (title/content only, owner can edit)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const threadId = params.id
    const body = await request.json()
    const { title, content } = body

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

    // Get thread and verify ownership
    const { data: thread, error: getError } = await supabase
      .from('forum_threads')
      .select('user_id, is_archived')
      .eq('id', threadId)
      .single()

    if (getError || !thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      )
    }

    if (thread.user_id !== userId) {
      return NextResponse.json(
        { error: 'Only thread creator can edit' },
        { status: 403 }
      )
    }

    if (thread.is_archived) {
      return NextResponse.json(
        { error: 'Cannot edit archived thread' },
        { status: 400 }
      )
    }

    // Validate input
    if (title && (title.length < 5 || title.length > 255)) {
      return NextResponse.json(
        { error: 'Title must be 5-255 characters' },
        { status: 400 }
      )
    }

    if (content && content.length < 20) {
      return NextResponse.json(
        { error: 'Content must be at least 20 characters' },
        { status: 400 }
      )
    }

    // Update thread
    const updates: any = {}
    if (title) updates.title = title
    if (content) updates.content = content

    const { data: updated, error: updateError } = await supabase
      .from('forum_threads')
      .update(updates)
      .eq('id', threadId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating thread:', updateError)
      return NextResponse.json(
        { error: 'Failed to update thread' },
        { status: 500 }
      )
    }

    return NextResponse.json(updated)
  } catch (err) {
    console.error('Error in PATCH /api/forum/threads/[id]:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/forum/threads/[id]
 * Soft delete thread (owner can delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const threadId = params.id

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

    // Get thread and verify ownership or admin status
    const { data: thread, error: getError } = await supabase
      .from('forum_threads')
      .select('user_id')
      .eq('id', threadId)
      .single()

    if (getError || !thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      )
    }

    // Check if user is owner or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single()

    if (thread.user_id !== userId && !profile?.is_admin) {
      return NextResponse.json(
        { error: 'Only thread creator or admin can delete' },
        { status: 403 }
      )
    }

    // Soft delete
    const { error: deleteError } = await supabase
      .from('forum_threads')
      .update({ is_archived: true })
      .eq('id', threadId)

    if (deleteError) {
      console.error('Error deleting thread:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete thread' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error in DELETE /api/forum/threads/[id]:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
