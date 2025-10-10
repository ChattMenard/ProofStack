import type { NextApiRequest, NextApiResponse } from 'next'
import requireAuth from '../../../lib/requireAuth'
import supabaseServer from '../../../lib/supabaseServer'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = await requireAuth(req, res)
  if (!user) return

  const { repo_url } = req.body
  if (!repo_url) return res.status(400).json({ error: 'repo_url required' })

  try {
    // Insert sample
    const { data: sample, error: sampleErr } = await supabaseServer
      .from('samples')
      .insert({
        owner_id: user.id,
        type: 'repo',
        source_url: repo_url,
        filename: repo_url.split('/').pop(),
        size_bytes: 0 // repos don't have size
      })
      .select('*')
      .single()

    if (sampleErr) throw sampleErr

    // Queue analysis
    const { data: analysis, error: analysisErr } = await supabaseServer
      .from('analyses')
      .insert({ sample_id: sample.id, status: 'queued' })
      .select('*')
      .single()

    if (analysisErr) throw analysisErr

    res.status(200).json({ sample, analysis })
  } catch (err: any) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}