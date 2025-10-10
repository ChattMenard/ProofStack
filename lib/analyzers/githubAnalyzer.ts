import fetch from 'node-fetch'

type RepoAnalysis = {
  repo: string
  owner: string
  languages: Record<string, number>
  recent_commits: { sha: string; message: string; date: string; author: string }[]
  fetched_at: string
}

const CACHE: Record<string, { ts: number; value: RepoAnalysis }> = {}
const TTL = 1000 * 60 * 5 // 5 minutes

async function fetchJson(url: string, token?: string) {
  const headers: Record<string,string> = { 'User-Agent': 'proofstack-analyzer' }
  if (token) headers['Authorization'] = `token ${token}`
  const r = await fetch(url, { headers })
  if (!r.ok) throw new Error(`GitHub API ${r.status} ${await r.text()}`)
  return r.json()
}

export async function analyzeRepo(owner: string, repo: string, githubToken?: string): Promise<RepoAnalysis> {
  const key = `${owner}/${repo}`
  const now = Date.now()
  if (CACHE[key] && (now - CACHE[key].ts) < TTL) return CACHE[key].value

  const [langs, commits] = await Promise.all([
    fetchJson(`https://api.github.com/repos/${owner}/${repo}/languages`, githubToken),
    fetchJson(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=20`, githubToken)
  ])

  const recent_commits = Array.isArray(commits)
    ? commits.map((c: any) => ({ sha: c.sha, message: c.commit?.message ?? '', date: c.commit?.author?.date ?? '', author: c.commit?.author?.name ?? c.commit?.author?.email ?? '' }))
    : []

  const analysis: RepoAnalysis = {
    repo,
    owner,
    languages: langs || {},
    recent_commits,
    fetched_at: new Date().toISOString()
  }

  CACHE[key] = { ts: now, value: analysis }
  return analysis
}

export default analyzeRepo
