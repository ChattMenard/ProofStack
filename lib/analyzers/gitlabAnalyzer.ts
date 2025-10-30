import fetch from 'node-fetch'

export type RepoAnalysis = {
  repo: string
  owner: string
  languages: Record<string, number>
  recent_commits: { id: string; message: string; date: string; author: string }[]
  fetched_at: string
}

const CACHE: Record<string, { ts: number; value: RepoAnalysis }> = {}
const TTL = 1000 * 60 * 5 // 5 minutes

async function fetchJson(url: string, token?: string) {
  const headers: Record<string,string> = { 'User-Agent': 'proofstack-analyzer' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const r = await fetch(url, { headers })
  if (!r.ok) throw new Error(`GitLab API ${r.status} ${await r.text()}`)
  return r.json()
}

export async function analyzeGitLabRepo(projectPath: string, gitlabToken?: string): Promise<RepoAnalysis> {
  // projectPath should be URL-encoded group%2Frepo
  const key = `gitlab:${projectPath}`
  const now = Date.now()
  if (CACHE[key] && (now - CACHE[key].ts) < TTL) return CACHE[key].value

  // languages
  const langs = await fetchJson(`https://gitlab.com/api/v4/projects/${encodeURIComponent(projectPath)}/languages`, gitlabToken)
  // commits
  const commits = await fetchJson(`https://gitlab.com/api/v4/projects/${encodeURIComponent(projectPath)}/repository/commits?per_page=20`, gitlabToken)

  const recent_commits = Array.isArray(commits)
    ? commits.map((c: any) => ({ id: c.id, message: c.message ?? '', date: c.committed_date ?? c.created_at ?? '', author: c.author_name || c.author_email || '' }))
    : []

  const analysis: RepoAnalysis = {
    repo: projectPath.split('/').pop() || projectPath,
    owner: projectPath.split('/')[0] || '',
    languages: langs || {},
    recent_commits,
    fetched_at: new Date().toISOString()
  }

  CACHE[key] = { ts: now, value: analysis }
  return analysis
}

export default analyzeGitLabRepo
