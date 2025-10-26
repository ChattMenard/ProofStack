import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withRateLimit } from '@/lib/security/rateLimiting';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const githubToken = process.env.GITHUB_TOKEN; // Optional: for higher rate limits

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // Parse request body first
    const { github_username, auth_uid } = await request.json();

    if (!github_username) {
      return NextResponse.json({ error: 'GitHub username required' }, { status: 400 });
    }

    if (!auth_uid) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Create service client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the auth_uid is valid by checking if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, auth_uid')
      .eq('auth_uid', auth_uid)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ 
        error: 'Unauthorized - Please log in',
        details: 'Invalid session'
      }, { status: 401 });
    }

    // Rate limiting
    const getUserId = async () => auth_uid;
    const rateLimitResponse = await withRateLimit(request, 'apiGeneral', getUserId);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Verify GitHub account exists and check commit activity
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'ProofStack'
    };

    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`;
    }

    // Get user info
    const userResponse = await fetch(`https://api.github.com/users/${github_username}`, {
      headers
    });

    if (!userResponse.ok) {
      return NextResponse.json({ 
        error: 'GitHub user not found',
        verified: false 
      }, { status: 404 });
    }

    const userData = await userResponse.json();

    // Get user's events (includes commits)
    const eventsResponse = await fetch(`https://api.github.com/users/${github_username}/events?per_page=100`, {
      headers
    });

    if (!eventsResponse.ok) {
      return NextResponse.json({ 
        error: 'Could not fetch GitHub activity',
        verified: false 
      }, { status: 500 });
    }

    const events = await eventsResponse.json();

    // Count commits in last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentCommits = events.filter((event: any) => {
      if (event.type !== 'PushEvent') return false;
      const eventDate = new Date(event.created_at);
      return eventDate >= sixMonthsAgo;
    });

    const totalCommits = recentCommits.reduce((sum: number, event: any) => {
      return sum + (event.payload?.commits?.length || 0);
    }, 0);

    const lastCommitDate = recentCommits.length > 0 
      ? new Date(recentCommits[0].created_at)
      : null;

    // Verification criteria: account exists and has activity
    const verified = totalCommits > 0;

    // Create or update verification record
    const { error: verificationError } = await supabase
      .from('profile_verifications')
      .upsert({
        profile_id: profile.id,
        github_verified: verified,
        github_verified_at: verified ? new Date().toISOString() : null,
        github_username,
        github_profile_url: userData.html_url,
        github_last_commit_date: lastCommitDate?.toISOString(),
        github_total_commits: totalCommits,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'profile_id'
      });

    if (verificationError) {
      console.error('Error saving verification:', verificationError);
      return NextResponse.json({ 
        error: 'Failed to save verification',
        details: verificationError.message,
        hint: 'Make sure the profile_verifications table exists'
      }, { status: 500 });
    }

    // Also update profile with github_username
    await supabase
      .from('profiles')
      .update({ github_username })
      .eq('id', profile.id);

    return NextResponse.json({
      verified,
      username: github_username,
      profile_url: userData.html_url,
      total_commits: totalCommits,
      last_commit_date: lastCommitDate,
      message: verified 
        ? `GitHub account verified! Found ${totalCommits} commits in the last 6 months.`
        : 'GitHub account found but no recent commits. Add some activity to verify.'
    });

  } catch (error) {
    console.error('GitHub verification error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage,
      verified: false 
    }, { status: 500 });
  }
}
