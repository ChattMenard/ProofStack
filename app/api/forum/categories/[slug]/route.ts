import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const supabase = supabaseServer

/**
 * GET /api/forum/categories/[slug]
 * Fetch category with paginated threads
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug
    const page = request.nextUrl.searchParams.get('page') || '1'
    const pageNum = Math.max(1, parseInt(page) || 1)
    const pageSize = 20
    const offset = (pageNum - 1) * pageSize

    // Get category
    const { data: category, error: categoryError } = await supabase
      .from('forum_categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_archived', false)
      .single()

    if (categoryError || !category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Get threads in category (paginated)
    const { data: threads, error: threadsError, count } = await supabase
      .from('forum_threads')
      .select(
        `
        id,
        title,
        content,
        user_id,
        is_pinned,
        is_locked,
        view_count,
        reply_count,
        upvote_count,
        created_at,
        updated_at,
        last_reply_at,
        profiles!forum_threads_user_id_fkey(id, username, avatar_url, user_type)
        `,
        { count: 'exact' }
      )
      .eq('category_id', category.id)
      .eq('is_archived', false)
      .order('is_pinned', { ascending: false })
      .order('last_reply_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (threadsError) {
      console.error('Error fetching threads:', threadsError)
      return NextResponse.json(
        { error: 'Failed to fetch threads' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      category,
      threads,
      pagination: {
        current_page: pageNum,
        page_size: pageSize,
        total_count: count || 0,
        total_pages: Math.ceil((count || 0) / pageSize)
      }
    })
  } catch (err) {
    console.error('Error in GET /api/forum/categories/[slug]:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
