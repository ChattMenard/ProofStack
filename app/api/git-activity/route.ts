import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabaseServer
      .from('profiles')
      .select('id, github_username')
      .eq('auth_uid', user.id)
      .single();

    if (profileError || !profile || !profile.github_username) {
      return NextResponse.json({ 
        error: 'GitHub username not found. Please connect your GitHub account first.' 
      }, { status: 400 });
    }

    const { repos, daysBack = 90 } = await req.json();

    if (!repos || !Array.isArray(repos) || repos.length === 0) {
      return NextResponse.json({ 
        error: 'Please provide an array of repository names (e.g., ["owner/repo"])' 
      }, { status: 400 });
    }

    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      return NextResponse.json({ 
        error: 'GitHub token not configured' 
      }, { status: 500 });
    }

    let totalImported = 0;
    let totalSkipped = 0;
    const errors: string[] = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    // Import commits from each repo
    for (const repoFullName of repos) {
      try {
        const [owner, repo] = repoFullName.split('/');
        if (!owner || !repo) {
          errors.push(`Invalid repo format: ${repoFullName}`);
          continue;
        }

        // Fetch commits from GitHub
        const commitsUrl = `https://api.github.com/repos/${owner}/${repo}/commits`;
        const params = new URLSearchParams({
          author: profile.github_username,
          since: cutoffDate.toISOString(),
          per_page: '100'
        });

        const response = await fetch(`${commitsUrl}?${params}`, {
          headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'ProofStack'
          }
        });

        if (!response.ok) {
          errors.push(`Failed to fetch commits from ${repoFullName}: ${response.statusText}`);
          continue;
        }

        const commits = await response.json();

        // Import each commit
        for (const commit of commits) {
          try {
            // Fetch detailed commit info for stats
            const detailResponse = await fetch(commit.url, {
              headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'ProofStack'
              }
            });

            if (!detailResponse.ok) {
              totalSkipped++;
              continue;
            }

            const detail = await detailResponse.json();
            const stats = detail.stats || {};
            const files = detail.files?.map((f: any) => f.filename) || [];

            // Insert into database (will skip duplicates due to UNIQUE constraint)
            const { error: insertError } = await supabaseServer
              .from('git_activity')
              .insert({
                profile_id: profile.id,
                repo_name: repo,
                repo_url: `https://github.com/${owner}/${repo}`,
                repo_owner: owner,
                commit_sha: commit.sha,
                commit_message: commit.commit.message,
                commit_date: commit.commit.author.date,
                additions: stats.additions || 0,
                deletions: stats.deletions || 0,
                files_changed: files
              });

            if (insertError) {
              // Check if it's a duplicate (expected and okay)
              if (insertError.code === '23505') {
                totalSkipped++;
              } else {
                errors.push(`Error inserting commit ${commit.sha.substring(0, 7)}: ${insertError.message}`);
              }
            } else {
              totalImported++;
            }

            // Rate limiting - wait 100ms between detailed commit fetches
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (commitError: any) {
            errors.push(`Error processing commit: ${commitError.message}`);
          }
        }
      } catch (repoError: any) {
        errors.push(`Error processing repo ${repoFullName}: ${repoError.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      imported: totalImported,
      skipped: totalSkipped,
      errors: errors.length > 0 ? errors : undefined,
      message: `Imported ${totalImported} commits, skipped ${totalSkipped} duplicates`
    });

  } catch (error: any) {
    console.error('Git activity import error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import git activity' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch activity summary
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get('profileId');

    if (!profileId) {
      return NextResponse.json({ error: 'profileId required' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('git_activity')
      .select('*')
      .eq('profile_id', profileId)
      .order('commit_date', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get summary stats
    const { data: summary } = await supabaseServer
      .rpc('get_git_activity_summary', { p_profile_id: profileId });

    return NextResponse.json({
      activity: data,
      summary: summary?.[0] || {
        total_commits: 0,
        total_additions: 0,
        total_deletions: 0,
        repos_count: 0,
        last_commit_date: null
      }
    });

  } catch (error: any) {
    console.error('Git activity fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch git activity' },
      { status: 500 }
    );
  }
}
