import { NextRequest, NextResponse } from 'next/server';

const linkedInClientId = process.env.LINKEDIN_CLIENT_ID!;

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { auth_uid } = await request.json();

    if (!auth_uid) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Build LinkedIn OAuth URL
    const redirectUri = `${request.nextUrl.origin}/api/auth/linkedin/callback`;
    const state = encodeURIComponent(JSON.stringify({ auth_uid }));
    const scope = 'openid profile email';

    const linkedInAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
      `response_type=code&` +
      `client_id=${linkedInClientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}&` +
      `scope=${encodeURIComponent(scope)}`;

    return NextResponse.json({ 
      auth_url: linkedInAuthUrl 
    });

  } catch (error) {
    console.error('LinkedIn initiate error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
