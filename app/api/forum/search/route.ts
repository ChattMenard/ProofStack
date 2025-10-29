import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/forum/search
 * Full-text search across forum threads and replies
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, limit = 20, offset = 0 } = body

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      )
    }

    // Full text search on threads
    let query_builder = supabase
      .from('forum_threads')
      .select(
        `
        id,
        title,
        content,
        category_id,
        created_at,
        reply_count,
        view_count,
        upvote_count,
        profiles!forum_threads_user_id_fkey(username),
        forum_categories(slug, name)
        `,
        { count: 'exact' }
      )
      .textSearch('search_vector', query)
      .eq('is_archived', false)
      .order('last_reply_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: threads, error: threadsError } = await query_builder

    if (threadsError) {
      console.error('Error searching threads:', threadsError)
      return NextResponse.json(
        { error: 'Search failed' },
        { status: 500 }
      )
    }

    // Also search replies and include their parent threads
    const { data: replyResults, error: repliesError } = await supabase
      .from('forum_replies')
      .select(
        `
        id,
        thread_id,
        content,
        created_at,
        upvote_count,
        forum_threads(
          id,
          title,
          category_id,
          forum_categories(slug, name)
        ),
        profiles!forum_replies_user_id_fkey(username)
        `
      )
      .textSearch('search_vector', query)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(Math.floor(limit / 2)) // Show fewer replies to prioritize threads

    if (repliesError) {
      console.error('Error searching replies:', repliesError)
      // Don't fail the whole search, just skip replies
    }

    return NextResponse.json({
      threads: threads || [],
      replies: replyResults || [],
      query
    })
  } catch (err) {
    console.error('Error in POST /api/forum/search:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
