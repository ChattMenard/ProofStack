import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '../../../lib/supabaseServer'

// Simple rate limiting for waitlist (prevent spam)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour
const MAX_REQUESTS = 3 // 3 signups per hour per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }
  
  if (entry.count >= MAX_REQUESTS) {
    return false
  }
  
  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    // Insert into waitlist table
    const { data, error } = await supabaseServer
      .from('waitlist')
      .insert({
        email: email.toLowerCase().trim(),
        created_at: new Date().toISOString(),
        source: 'landing_page'
      })
      .select()

    if (error) {
      // Handle duplicate email gracefully
      if (error.code === '23505') {
        return NextResponse.json(
          { message: 'Email already on waitlist' },
          { status: 200 }
        )
      }
      
      console.warn('Waitlist database error:', error)
      return NextResponse.json(
        { error: 'Failed to join waitlist' },
        { status: 500 }
      )
    }

    // Future: Send welcome email via email service
    // Future: Track analytics event (PostHog, etc.)

    return NextResponse.json(
      { message: 'Successfully joined waitlist', id: data?.[0]?.id },
      { status: 201 }
    )
  } catch (error) {
    console.warn('Waitlist API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check waitlist stats (optional, for admin use)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const adminKey = searchParams.get('admin_key')
    
    // Simple admin protection (replace with proper auth)
    if (adminKey !== process.env.WAITLIST_ADMIN_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error, count } = await supabaseServer
      .from('waitlist')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('Waitlist stats error:', error)
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }

    return NextResponse.json({
      total: count,
      recent: data?.slice(0, 10) || []
    })
  } catch (error) {
    console.warn('Waitlist stats API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}