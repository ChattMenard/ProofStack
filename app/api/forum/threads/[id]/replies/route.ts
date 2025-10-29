import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/forum/threads/[id]/replies
 * Create a reply on a thread
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const threadId = params.id
    const body = await request.json()
    const { content, parent_reply_id } = body

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

    // Validation
    if (!content || content.length < 5) {
      return NextResponse.json(
        { error: 'Reply must be at least 5 characters' },
        { status: 400 }
      )
    }

    // Check thread exists and not locked
    const { data: thread, error: threadError } = await supabase
      .from('forum_threads')
      .select('is_locked, user_id')
      .eq('id', threadId)
      .single()

    if (threadError || !thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      )
    }

    if (thread.is_locked) {
      return NextResponse.json(
        { error: 'Thread is locked' },
        { status: 403 }
      )
    }

    // Create reply
    const { data: reply, error: replyError } = await supabase
      .from('forum_replies')
      .insert({
        thread_id: parseInt(threadId),
        user_id: userId,
        content,
        parent_reply_id: parent_reply_id || null
      })
      .select(
        `
        *,
        profiles!forum_replies_user_id_fkey(id, username, avatar_url, user_type),
        forum_user_stats!forum_replies_user_id_fkey(forum_reputation, reputation_tier)
        `
      )
      .single()

    if (replyError) {
      console.error('Error creating reply:', replyError)
      return NextResponse.json(
        { error: 'Failed to create reply' },
        { status: 500 }
      )
    }

    // Update thread reply count
    try {
      await supabase
        .from('forum_threads')
        .update({ reply_count: (await supabase.from('forum_threads').select('reply_count').eq('id', threadId).single()).data?.reply_count || 0 + 1 })
        .eq('id', threadId)
    } catch {
      // Fall back to manual increment if RPC fails
    }

    // TODO: Send notification to thread creator if not the same user

    return NextResponse.json(reply, { status: 201 })
  } catch (err) {
    console.error('Error in POST /api/forum/threads/[id]/replies:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/forum/threads/[id]/replies
 * Fetch all replies for a thread with pagination
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const threadId = params.id
    const page = request.nextUrl.searchParams.get('page') || '1'
    const pageNum = Math.max(1, parseInt(page) || 1)
    const pageSize = 20
    const offset = (pageNum - 1) * pageSize

    // Get replies
    const { data: replies, error: repliesError, count } = await supabase
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
        `,
        { count: 'exact' }
      )
      .eq('thread_id', threadId)
      .eq('is_deleted', false)
      .order('is_accepted_answer', { ascending: false })
      .order('upvote_count', { ascending: false })
      .order('created_at', { ascending: true })
      .range(offset, offset + pageSize - 1)

    if (repliesError) {
      console.error('Error fetching replies:', repliesError)
      return NextResponse.json(
        { error: 'Failed to fetch replies' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      replies,
      pagination: {
        current_page: pageNum,
        page_size: pageSize,
        total_count: count || 0,
        total_pages: Math.ceil((count || 0) / pageSize)
      }
    })
  } catch (err) {
    console.error('Error in GET /api/forum/threads/[id]/replies:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
