import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

function getProviderConfig(provider: string, origin: string) {
  const redirectBase = `${origin}/api/auth/${provider}/callback`
  switch (provider) {
    case 'gitlab':
      return {
        authorizeUrl: `https://gitlab.com/oauth/authorize?client_id=${process.env.GITLAB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectBase)}&response_type=code&scope=read_user+read_api+read_repository`,
      }
    case 'azure':
      return {
        authorizeUrl: `https://app.vssps.visualstudio.com/oauth2/authorize?client_id=${process.env.AZURE_CLIENT_ID}&response_type=Assertion&state=STATE&scope=vso.profile%20vso.code&redirect_uri=${encodeURIComponent(redirectBase)}`,
      }
    case 'gitbucket':
      // expects GITBUCKET_BASE_URL env var (e.g. https://gitbucket.example.com)
      if (!process.env.GITBUCKET_BASE_URL) return null
      return {
        authorizeUrl: `${process.env.GITBUCKET_BASE_URL.replace(/\/$/, '')}/login/oauth/authorize?client_id=${process.env.GITBUCKET_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectBase)}&response_type=code&scope=repo`,
      }
    case 'github':
    default:
      return {
        authorizeUrl: `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectBase)}&scope=repo%20read:user`
      }
  }
}

export async function GET(req: Request, { params }: { params: { provider: string } }) {
  try {
    const { provider } = params
    const url = new URL(req.url)
    // Always use the request's actual origin for redirect URIs (handles production/staging/localhost)
    const origin = `${url.protocol}//${url.host}`

    const cfg = getProviderConfig(provider, origin)
    if (!cfg) return NextResponse.json({ error: 'Provider not configured' }, { status: 501 })

    // create a short-lived state and store in cookie
    const state = crypto.randomUUID()
    const res = NextResponse.redirect(cfg.authorizeUrl.replace('STATE', state))
    const cookieStore = cookies()
    res.headers.append('Set-Cookie', `ps_oauth_state=${state}; Path=/api/auth; HttpOnly; SameSite=Lax; Max-Age=300`)
    return res
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to start OAuth' }, { status: 500 })
  }
}
