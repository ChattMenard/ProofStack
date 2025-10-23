import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')
  const next = requestUrl.searchParams.get('next') || '/professional/dashboard'

  console.log('Auth callback:', { code: !!code, error, error_description, next })

  // If there's an OAuth error, redirect to home with error message
  if (error) {
    const homeUrl = new URL('/', requestUrl.origin)
    homeUrl.searchParams.set('error', error_description || error)
    return NextResponse.redirect(homeUrl)
  }

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('Code exchange:', { success: !!data?.session, error: exchangeError?.message })
    
    if (!exchangeError && data.session) {
      // Redirect to the requested page or dashboard
      const redirectUrl = next.startsWith('/') ? next : '/professional/dashboard'
      const response = NextResponse.redirect(new URL(redirectUrl, requestUrl.origin))
      
      response.cookies.set('sb-access-token', data.session.access_token, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
      
      response.cookies.set('sb-refresh-token', data.session.refresh_token, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })

      return response
    } else {
      // Exchange failed
      const homeUrl = new URL('/', requestUrl.origin)
      homeUrl.searchParams.set('error', exchangeError?.message || 'Failed to exchange code for session')
      return NextResponse.redirect(homeUrl)
    }
  }

  // If no code or error, redirect home
  return NextResponse.redirect(new URL('/', requestUrl.origin))
}
