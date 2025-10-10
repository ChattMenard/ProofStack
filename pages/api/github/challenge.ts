import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '../../../lib/requireAuth'
import supabaseServer from '../../../lib/supabaseServer'
import crypto from 'crypto'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = await requireAuth(req, res)
  if (!user) return

  const { repo_url } = req.body
  if (!repo_url) return res.status(400).json({ error: 'repo_url required' })

  try {
    // Generate a unique challenge
    const challenge = crypto.randomBytes(16).toString('hex')

    // Store challenge in database (we'll add a challenges table or use samples metadata)
    // For now, store in samples metadata
    const challengeId = crypto.randomUUID()

    // Create a sample for the challenge
    const { data: sample, error: sampleErr } = await supabaseServer
      .from('samples')
      .insert({
        owner_id: user.id,
        type: 'github_challenge',
        source_url: repo_url,
        title: `Ownership challenge for ${repo_url}`,
        metadata: {
          challenge_id: challengeId,
          challenge,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      })
      .select('*')
      .single()

    if (sampleErr) throw sampleErr

    res.status(200).json({
      id: challengeId,
      repo_url,
      challenge,
      status: 'pending',
      instructions: `Create a file named 'proofstack-challenge-${challenge}.txt' in your repository with any content.`
    })
  } catch (err: any) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}