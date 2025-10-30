import { NextResponse } from 'next/server'
import { requireAuthAppRouter } from '@/lib/requireAuthAppRouter'
import { supabaseServer } from '@/lib/supabaseServer'
import analyzeRepo from '@/lib/analyzers/githubAnalyzer'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { user, error: authError } = await requireAuthAppRouter(req as any)
    if (!user) return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })

    // Find profile for auth uid
    const { data: profile, error: profileError } = await (supabaseServer as any)
      .from('profiles')
      .select('id, full_name, bio, github_username')
      .eq('auth_uid', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const githubUsername = profile.github_username

    if (!githubUsername) {
      return NextResponse.json({ error: 'No linked GitHub account found. Please connect GitHub first.' }, { status: 400 })
    }

    // Fetch public repos for user
    const headers: Record<string,string> = { 'User-Agent': 'ProofStack' }
    if (process.env.GITHUB_TOKEN) headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`

    const reposResp = await fetch(`https://api.github.com/users/${encodeURIComponent(githubUsername)}/repos?per_page=50&sort=updated`, { headers })
    if (!reposResp.ok) return NextResponse.json({ error: 'Failed to fetch repos from GitHub' }, { status: 502 })
    const repos = await reposResp.json()

    // Analyze top 5 repos
    const top = Array.isArray(repos) ? repos.slice(0, 5) : []
    const analyses = [] as any[]
    for (const r of top) {
      try {
        const owner = r.owner?.login || githubUsername
        const name = r.name
        const a = await analyzeRepo(owner, name, process.env.GITHUB_TOKEN)
        analyses.push({ repo: `${owner}/${name}`, html_url: r.html_url, languages: a.languages, recent_commits: a.recent_commits })
      } catch (e) {
        console.warn('Repo analysis failed for', r.name, e)
      }
    }

    // Build human-readable proof content
    let content = `Proof Package for ${profile.full_name || githubUsername}\n\n`
    content += `Bio: ${profile.bio || 'N/A'}\n\n`

    for (const a of analyses) {
      content += `Repository: ${a.repo}\nURL: ${a.html_url}\nLanguages: ${Object.keys(a.languages).join(', ') || 'unknown'}\nRecent Commits:\n`
      for (const c of (a.recent_commits || []).slice(0,3)) {
        content += ` - ${c.sha || c.id}: ${c.message?.replace(/\s+/g,' ').slice(0,200)} (${c.date}) by ${c.author}\n`
      }
      content += '\n'
    }

    // Ensure content meets work_samples length constraints (500-2000). If short, pad with summary.
    if (content.length < 500) {
      const pad = '\n'.repeat(5) + 'Summary:\n' + (analyses.map(a => `${a.repo} (${Object.keys(a.languages).join(', ')})`).join('\n'))
      content = (content + '\n' + pad).slice(0, 1900)
    }

    // Insert work_sample (use service role client)
    const insertPayload: any = {
      professional_id: profile.id,
      employer_id: profile.id, // self-published
      review_id: null,
      content: content.slice(0, 2000),
      content_type: 'writing',
      language: null,
      title: `Compiled Proof - ${new Date().toISOString().slice(0,10)}`,
      description: `Auto-generated proof package from connected GitHub account ${githubUsername}`,
      project_context: null,
      confidentiality_level: 'public',
      verified: true,
      verified_at: new Date().toISOString()
    }

    const { data: sampleData, error: sampleError } = await (supabaseServer as any)
      .from('work_samples')
      .insert(insertPayload)
      .select('id')
      .single()

    if (sampleError) {
      console.error('Failed to save compiled proof:', sampleError)
      return NextResponse.json({ error: 'Failed to save compiled proof' }, { status: 500 })
    }

    return NextResponse.json({ success: true, work_sample_id: sampleData.id, content_preview: content.slice(0,800) })
  } catch (err: any) {
    console.error('Compile proof error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
