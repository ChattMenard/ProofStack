import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const linkedInClientId = process.env.LINKEDIN_CLIENT_ID!;
const linkedInClientSecret = process.env.LINKEDIN_CLIENT_SECRET!;

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      return NextResponse.redirect(
        new URL(`/professional/verify?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/professional/verify?error=no_code', request.url)
      );
    }

    // Parse state to get auth_uid
    let auth_uid: string;
    try {
      const stateData = JSON.parse(decodeURIComponent(state || '{}'));
      auth_uid = stateData.auth_uid;
    } catch {
      return NextResponse.redirect(
        new URL('/professional/verify?error=invalid_state', request.url)
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: linkedInClientId,
        client_secret: linkedInClientSecret,
        redirect_uri: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('supabase.co', '')}${request.nextUrl.origin}/api/auth/linkedin/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text());
      return NextResponse.redirect(
        new URL('/professional/verify?error=token_exchange_failed', request.url)
      );
    }

    const { access_token } = await tokenResponse.json();

    // Get LinkedIn profile
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!profileResponse.ok) {
      console.error('Profile fetch failed:', await profileResponse.text());
      return NextResponse.redirect(
        new URL('/professional/verify?error=profile_fetch_failed', request.url)
      );
    }

    const profile = await profileResponse.json();
    const linkedinProfileUrl = profile.sub ? `https://www.linkedin.com/in/${profile.sub}` : '';

    // Save verification to database
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_uid', auth_uid)
      .single();

    if (!userProfile) {
      return NextResponse.redirect(
        new URL('/professional/verify?error=profile_not_found', request.url)
      );
    }

    const { error: verificationError } = await supabase
      .from('profile_verifications')
      .upsert({
        profile_id: userProfile.id,
        linkedin_verified: true,
        linkedin_verified_at: new Date().toISOString(),
        linkedin_profile_url: linkedinProfileUrl,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'profile_id'
      });

    if (verificationError) {
      console.error('Verification save error:', verificationError);
      return NextResponse.redirect(
        new URL('/professional/verify?error=save_failed', request.url)
      );
    }

    // Success! Redirect back to verification page
    return NextResponse.redirect(
      new URL('/professional/verify?linkedin=success', request.url)
    );

  } catch (error) {
    console.error('LinkedIn callback error:', error);
    return NextResponse.redirect(
      new URL('/professional/verify?error=unknown', request.url)
    );
  }
}
