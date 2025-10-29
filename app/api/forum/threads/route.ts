import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/forum/threads
 * Create a new thread (authenticated users)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { category_id, title, content } = body

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
    if (!category_id || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: category_id, title, content' },
        { status: 400 }
      )
    }

    if (title.length < 5 || title.length > 255) {
      return NextResponse.json(
        { error: 'Title must be 5-255 characters' },
        { status: 400 }
      )
    }

    if (content.length < 20) {
      return NextResponse.json(
        { error: 'Content must be at least 20 characters' },
        { status: 400 }
      )
    }

    // Check category exists
    const { data: category } = await supabase
      .from('forum_categories')
      .select('id')
      .eq('id', category_id)
      .eq('is_archived', false)
      .single()

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Create thread
    const { data: thread, error: threadError } = await supabase
      .from('forum_threads')
      .insert({
        category_id,
        user_id: userId,
        title,
        content
      })
      .select(
        `
        *,
        profiles!forum_threads_user_id_fkey(id, username, avatar_url)
        `
      )
      .single()

    if (threadError) {
      console.error('Error creating thread:', threadError)
      return NextResponse.json(
        { error: 'Failed to create thread' },
        { status: 500 }
      )
    }

    // Update user stats via trigger (should happen automatically)
    // But we can explicitly call the function if needed
    try {
      await supabase.rpc('update_user_stats_on_thread', {
        user_id: userId
      })
    } catch {
      // Silently fail if function doesn't exist yet
    }

    return NextResponse.json(thread, { status: 201 })
  } catch (err) {
    console.error('Error in POST /api/forum/threads:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
