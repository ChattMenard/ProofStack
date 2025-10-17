import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '../../../lib/requireAuth'
import supabaseServer from '../../../lib/supabaseServer'
import { fetchGitHubWithCache } from '../../../lib/githubCache'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = await requireAuth(req, res)
  if (!user) return

  const { challenge_id } = req.body
  if (!challenge_id) return res.status(400).json({ error: 'challenge_id required' })

  try {
    // Find the challenge sample
    const { data: sample, error: sampleErr } = await supabaseServer
      .from('samples')
      .select('*')
      .eq('owner_id', user.id)
      .eq('type', 'github_challenge')
      .eq('metadata->challenge_id', challenge_id)
      .single()

    if (sampleErr || !sample) return res.status(404).json({ error: 'Challenge not found' })

    const metadata = sample.metadata as any
    if (metadata.status === 'verified') return res.status(200).json({ verified: true })

    const repoUrl = sample.source_url
    const challenge = metadata.challenge

    // Extract owner/repo from URL
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\/|$)/i)
    if (!match) return res.status(400).json({ error: 'Invalid GitHub URL' })

    const [, owner, repo] = match
    const filename = `proofstack-challenge-${challenge}.txt`

    // Check if file exists in the repository
    const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filename}`

    // Get user's GitHub token from their auth session
    const { data: userData, error: authError } = await supabaseServer.auth.admin.getUserById(user.id)
    if (authError) throw authError

    const githubToken = userData?.user?.user_metadata?.provider_token ||
                       userData?.user?.app_metadata?.provider_token

    if (!githubToken) return res.status(400).json({ error: 'GitHub not connected' })

    // Use cached GitHub API request with shorter TTL (5 minutes) for verification checks
    const { data: fileData, fromCache } = await fetchGitHubWithCache(
      fileUrl,
      githubToken,
      user.id,
      5 // Cache for 5 minutes
    )

    if (fileData) {
      // File exists, mark as verified
      await supabaseServer
        .from('samples')
        .update({
          metadata: {
            ...metadata,
            status: 'verified',
            verified_at: new Date().toISOString()
          }
        })
        .eq('id', sample.id)

      res.status(200).json({ verified: true, fromCache })
    } else {
      // File doesn't exist (404 from GitHub)
      res.status(200).json({ verified: false })
    }
  } catch (err: any) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}