import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { withRateLimit } from '@/lib/security/rateLimiting'
import analyzeGitLabRepo from '@/lib/analyzers/gitlabAnalyzer'
import analyzeAzureRepo from '@/lib/analyzers/azureAnalyzer'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { provider, username, auth_uid, projectPath, repo_url } = body

    if (!provider) return NextResponse.json({ error: 'provider required' }, { status: 400 })
    if (!auth_uid) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const supabase = supabaseServer

    // Verify profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, auth_uid')
      .eq('auth_uid', auth_uid)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Unauthorized - invalid session' }, { status: 401 })
    }

    // Rate limiting
    const getUserId = async () => auth_uid
    const rateLimitResponse = await withRateLimit(request, 'apiGeneral', getUserId)
    if (rateLimitResponse) return rateLimitResponse

    // Dispatch by provider
    if (provider === 'gitlab') {
      if (!username && !projectPath) return NextResponse.json({ error: 'username or projectPath required for gitlab' }, { status: 400 })

      // Try project-level analysis if projectPath provided
      let verified = false
      let profileUrl = null
      let totalCommits = 0
      let lastCommitDate: string | null = null

      try {
        if (projectPath) {
          const analysis = await analyzeGitLabRepo(projectPath, process.env.GITLAB_TOKEN)
          verified = true
          profileUrl = `https://gitlab.com/${projectPath}`
          totalCommits = analysis.recent_commits.length
          lastCommitDate = analysis.recent_commits[0]?.date ?? null
        } else {
          // Fallback: check user exists
          const headers: HeadersInit = { 'User-Agent': 'ProofStack' }
          if (process.env.GITLAB_TOKEN) headers['Authorization'] = `Bearer ${process.env.GITLAB_TOKEN}`
          const userResp = await fetch(`https://gitlab.com/api/v4/users?username=${encodeURIComponent(username)}`, { headers })
          const users = await userResp.json()
          if (Array.isArray(users) && users.length > 0) {
            verified = true
            profileUrl = users[0].web_url
          }
        }
      } catch (err) {
        console.error('GitLab verify error', err)
      }

      // Upsert verification
      await supabase
        .from('profile_verifications')
        .upsert({
          profile_id: profile.id,
          gitlab_verified: verified,
          gitlab_verified_at: verified ? new Date().toISOString() : null,
          gitlab_username: username ?? null,
          gitlab_profile_url: profileUrl,
          gitlab_total_commits: totalCommits,
          gitlab_last_commit_date: lastCommitDate,
          updated_at: new Date().toISOString()
        }, { onConflict: 'profile_id' })

      return NextResponse.json({ verified, profile_url: profileUrl, total_commits: totalCommits, last_commit_date: lastCommitDate })
    }

    if (provider === 'azure') {
      // Expect organization, project and repo in body
      const { organization, project, repo } = body
      if (!organization || !project || !repo) return NextResponse.json({ error: 'organization, project and repo required for azure' }, { status: 400 })

      let verified = false
      let totalCommits = 0
      let lastCommitDate: string | null = null

      try {
        const analysis = await analyzeAzureRepo(organization, project, repo, process.env.AZURE_DEVOPS_PAT)
        verified = Array.isArray(analysis.recent_commits) && analysis.recent_commits.length > 0
        totalCommits = analysis.recent_commits.length
        lastCommitDate = analysis.recent_commits[0]?.date ?? null
      } catch (err) {
        console.error('Azure verify error', err)
      }

      await supabase
        .from('profile_verifications')
        .upsert({
          profile_id: profile.id,
          azure_verified: verified,
          azure_verified_at: verified ? new Date().toISOString() : null,
          azure_repository: repo,
          azure_total_commits: totalCommits,
          azure_last_commit_date: lastCommitDate,
          updated_at: new Date().toISOString()
        }, { onConflict: 'profile_id' })

      return NextResponse.json({ verified, total_commits: totalCommits, last_commit_date: lastCommitDate })
    }

    if (provider === 'gitbucket' || provider === 'github') {
      // Treat as GitHub-compatible by default. For GitBucket self-hosted instances the client can provide repo_url.
      const name = username
      const baseUrl = body.base_url || 'https://api.github.com'

      let verified = false
      let profileUrl = null
      let totalCommits = 0
      let lastCommitDate: string | null = null

      try {
        const headers: HeadersInit = { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'ProofStack' }
        if (process.env.GITHUB_TOKEN) headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`

        const userResp = await fetch(`${baseUrl.replace(/\/$/, '')}/users/${encodeURIComponent(name)}`, { headers })
        if (userResp.ok) {
          const userData = await userResp.json()
          verified = true
          profileUrl = userData.html_url || userData.web_url || null

          // Try events for commit counts (best-effort)
          try {
            const eventsResp = await fetch(`${baseUrl.replace(/\/$/, '')}/users/${encodeURIComponent(name)}/events?per_page=100`, { headers })
            if (eventsResp.ok) {
              const events = await eventsResp.json()
              const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
              const recentCommits = Array.isArray(events) ? events.filter((e:any) => e.type === 'PushEvent' && new Date(e.created_at) >= sixMonthsAgo) : []
              totalCommits = recentCommits.reduce((s:any, e:any) => s + (e.payload?.commits?.length || 0), 0)
              lastCommitDate = recentCommits[0]?.created_at ?? null
            }
          } catch (e) {
            // ignore
          }
        }
      } catch (err) {
        console.error('Git provider verify error', err)
      }

      await supabase
        .from('profile_verifications')
        .upsert({
          profile_id: profile.id,
          github_verified: verified,
          github_verified_at: verified ? new Date().toISOString() : null,
          github_username: username ?? null,
          github_profile_url: profileUrl,
          github_total_commits: totalCommits,
          github_last_commit_date: lastCommitDate,
          updated_at: new Date().toISOString()
        }, { onConflict: 'profile_id' })

      return NextResponse.json({ verified, profile_url: profileUrl, total_commits: totalCommits, last_commit_date: lastCommitDate })
    }

    return NextResponse.json({ error: 'unknown provider' }, { status: 400 })
  } catch (error) {
    console.error('Provider verify error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 })
  }
}
