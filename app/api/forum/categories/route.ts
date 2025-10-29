import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/forum/categories
 * Fetch all public forum categories
 */
export async function GET(request: NextRequest) {
  try {
    const { data: categories, error } = await supabase
      .from('forum_categories')
      .select('*')
      .eq('is_archived', false)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      )
    }

    // Enhance with thread counts
    const categoriesWithCounts = await Promise.all(
      categories.map(async (cat) => {
        const { count } = await supabase
          .from('forum_threads')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', cat.id)
          .eq('is_archived', false)

        return {
          ...cat,
          thread_count: count || 0
        }
      })
    )

    return NextResponse.json(categoriesWithCounts)
  } catch (err) {
    console.error('Error in GET /api/forum/categories:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
