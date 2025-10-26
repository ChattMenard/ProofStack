import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Ensure this runs in Node.js runtime for cookie access
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')
  const next = requestUrl.searchParams.get('next') || '/professional/dashboard'

  console.log('Auth callback:', { 
    code: !!code, 
    token_hash: !!token_hash,
    type,
    error, 
    error_description, 
    next 
  })

  // If there's an OAuth error, redirect to home with error message
  if (error) {
    const homeUrl = new URL('/', requestUrl.origin)
    homeUrl.searchParams.set('error', error_description || error)
    return NextResponse.redirect(homeUrl)
  }

  const cookieStore = cookies()
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce'
      }
    }
  )

  // Handle magic link (token_hash) or OAuth (code)
  if (token_hash && type) {
    // Magic link or email confirmation
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any
    })
    
    console.log('Token verification:', { success: !!data?.session, error: verifyError?.message })
    
    if (!verifyError && data.session) {
      // Store session in cookies for server-side access
      cookieStore.set('sb-access-token', data.session.access_token, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
      
      cookieStore.set('sb-refresh-token', data.session.refresh_token, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })

      // Redirect to the requested page or dashboard
      const redirectUrl = next.startsWith('/') ? next : '/professional/dashboard'
      return NextResponse.redirect(new URL(redirectUrl, requestUrl.origin))
    } else {
      // Verification failed
      console.error('Token verification failed:', verifyError)
      const homeUrl = new URL('/', requestUrl.origin)
      homeUrl.searchParams.set('error', verifyError?.message || 'Failed to verify magic link')
      return NextResponse.redirect(homeUrl)
    }
  } else if (code) {
    // OAuth code exchange
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('Code exchange:', { success: !!data?.session, error: exchangeError?.message })
    
    if (!exchangeError && data.session) {
      // Store session in cookies for server-side access
      // The session will be automatically managed by Supabase on the client side
      cookieStore.set('sb-access-token', data.session.access_token, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
      
      cookieStore.set('sb-refresh-token', data.session.refresh_token, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })

      // Redirect to the requested page or dashboard
      const redirectUrl = next.startsWith('/') ? next : '/professional/dashboard'
      return NextResponse.redirect(new URL(redirectUrl, requestUrl.origin))
    } else {
      // Exchange failed
      console.error('Session exchange failed:', exchangeError)
      const homeUrl = new URL('/', requestUrl.origin)
      homeUrl.searchParams.set('error', exchangeError?.message || 'Failed to exchange code for session')
      return NextResponse.redirect(homeUrl)
    }
  }

  // If no code or error, redirect home
  return NextResponse.redirect(new URL('/', requestUrl.origin))
}
