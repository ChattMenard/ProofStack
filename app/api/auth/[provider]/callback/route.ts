import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireAuthAppRouter } from '@/lib/requireAuthAppRouter'

export const runtime = 'nodejs'

async function exchangeToken(provider: string, code: string, redirectUri: string) {
  if (provider === 'gitlab') {
    const body = new URLSearchParams({
      client_id: process.env.GITLAB_CLIENT_ID || '',
      client_secret: process.env.GITLAB_CLIENT_SECRET || '',
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    })
    const resp = await fetch('https://gitlab.com/oauth/token', { method: 'POST', body })
    return resp.ok ? resp.json() : null
  }

  if (provider === 'github') {
    const body = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID || '',
      client_secret: process.env.GITHUB_CLIENT_SECRET || '',
      code,
      redirect_uri: redirectUri,
    })
    const resp = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body
    })
    return resp.ok ? resp.json() : null
  }

  if (provider === 'gitbucket') {
    const base = process.env.GITBUCKET_BASE_URL
    if (!base) return null
    const body = new URLSearchParams({ client_id: process.env.GITBUCKET_CLIENT_ID || '', client_secret: process.env.GITBUCKET_CLIENT_SECRET || '', code, redirect_uri: redirectUri })
    const resp = await fetch(`${base.replace(/\/$/, '')}/login/oauth/access_token`, { method: 'POST', headers: { Accept: 'application/json' }, body })
    return resp.ok ? resp.json() : null
  }

  if (provider === 'azure') {
    // Azure DevOps OAuth token exchange
    const body = new URLSearchParams({
      client_id: process.env.AZURE_CLIENT_ID || '',
      client_secret: process.env.AZURE_CLIENT_SECRET || '',
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    })
    const resp = await fetch('https://app.vssps.visualstudio.com/oauth2/token', { method: 'POST', body })
    return resp.ok ? resp.json() : null
  }

  return null
}

async function fetchProviderUser(provider: string, accessToken: string) {
  try {
    if (provider === 'gitlab') {
      const resp = await fetch('https://gitlab.com/api/v4/user', { headers: { Authorization: `Bearer ${accessToken}` } })
      if (!resp.ok) return null
      return resp.json()
    }

    if (provider === 'github' || provider === 'gitbucket') {
      const apiBase = provider === 'github' ? 'https://api.github.com/user' : (process.env.GITBUCKET_BASE_URL ? `${process.env.GITBUCKET_BASE_URL.replace(/\/$/, '')}/api/v3/user` : null)
      if (!apiBase) return null
      const resp = await fetch(apiBase, { headers: { Authorization: `token ${accessToken}`, Accept: 'application/json' } })
      if (!resp.ok) return null
      return resp.json()
    }

    if (provider === 'azure') {
      const resp = await fetch('https://app.vssps.visualstudio.com/_apis/profile/profiles/me?api-version=6.0', { headers: { Authorization: `Bearer ${accessToken}` } })
      if (!resp.ok) return null
      return resp.json()
    }
  } catch (e) {
    return null
  }
  return null
}

export async function GET(req: Request, { params }: { params: { provider: string } }) {
  try {
    const { provider } = params
    const url = new URL(req.url)
    // Always use the request's actual origin for redirect URIs (handles production/staging/localhost)
    const origin = `${url.protocol}//${url.host}`
    const redirectUri = `${origin}/api/auth/${provider}/callback`

    const q = Object.fromEntries(url.searchParams.entries()) as Record<string,string>
    const code = q.code
    const state = q.state
    const cookieStore = cookies()
    const storedState = cookieStore.get('ps_oauth_state')?.value
    if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })
    if (!state || !storedState || state !== storedState) return NextResponse.json({ error: 'Invalid state' }, { status: 400 })

    const tokenResp: any = await exchangeToken(provider, code, redirectUri)
    if (!tokenResp) return NextResponse.json({ error: 'Token exchange failed or provider not configured' }, { status: 502 })

    const accessToken = tokenResp.access_token || tokenResp.accessToken || tokenResp.token
    if (!accessToken) return NextResponse.json({ error: 'No access token returned' }, { status: 502 })

    const userInfo = await fetchProviderUser(provider, accessToken)

    // Try to attach to current logged-in profile if available
    try {
      const { user } = await requireAuthAppRouter(req as any)
      if (user) {
        const username = userInfo?.username || userInfo?.login || userInfo?.displayName || userInfo?.name || null
        if (username) {
          const update: any = {}
          update[`${provider}_username`] = username
          try {
            await (supabaseServer as any).from('profiles').update(update).eq('auth_uid', user.id)
          } catch (e) {
            // non-fatal — if DB schema doesn't have the column, skip
            console.warn('Failed to attach provider username to profiles table', e)
          }
        }
      }
    } catch (e) {
      // not authenticated — caller may finish link client-side
    }

    return NextResponse.json({ success: true, provider, user: userInfo })
  } catch (err: any) {
    console.error('OAuth callback error', err)
    return NextResponse.json({ error: err.message || 'OAuth callback failed' }, { status: 500 })
  }
}
