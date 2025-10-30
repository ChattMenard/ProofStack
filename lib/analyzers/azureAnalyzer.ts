import fetch from 'node-fetch'

export type AzureRepoAnalysis = {
  repo: string
  organization?: string
  project?: string
  recent_commits: { commitId: string; message: string; date: string; author: string }[]
  fetched_at: string
}

const CACHE: Record<string, { ts: number; value: AzureRepoAnalysis }> = {}
const TTL = 1000 * 60 * 5 // 5 minutes

async function fetchJson(url: string, token?: string) {
  const headers: Record<string,string> = { 'User-Agent': 'proofstack-analyzer' }
  if (token) headers['Authorization'] = `Basic ${token}` // Azure often expects Basic with PAT, caller can provide
  const r = await fetch(url, { headers })
  if (!r.ok) throw new Error(`Azure DevOps API ${r.status} ${await r.text()}`)
  return r.json()
}

/**
 * Analyze Azure DevOps repository commits.
 * projectPath should be of the form organization/project/_git/repo or provide components separately
 */
export async function analyzeAzureRepo(organization: string, project: string, repoIdOrName: string, azureToken?: string): Promise<AzureRepoAnalysis> {
  const key = `azure:${organization}/${project}/${repoIdOrName}`
  const now = Date.now()
  if (CACHE[key] && (now - CACHE[key].ts) < TTL) return CACHE[key].value

  // Get commits (API version 6.0)
  const commitsUrl = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${encodeURIComponent(repoIdOrName)}/commits?api-version=6.0&$top=20`
  const commitsResp = await fetchJson(commitsUrl, azureToken)

  const commits = Array.isArray(commitsResp?.value) ? commitsResp.value : []

  const recent_commits = commits.map((c: any) => ({ commitId: c.commitId, message: c.comment || '', date: c.committer?.date || c.author?.date || '', author: c.committer?.name || c.author?.name || '' }))

  const analysis: AzureRepoAnalysis = {
    repo: repoIdOrName,
    organization,
    project,
    recent_commits,
    fetched_at: new Date().toISOString()
  }

  CACHE[key] = { ts: now, value: analysis }
  return analysis
}

export default analyzeAzureRepo
