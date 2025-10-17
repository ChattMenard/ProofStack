import type { NextApiRequest, NextApiResponse } from 'next'
import supabaseServer from '../../lib/supabaseServer'
import { requireAuth } from '../../lib/requireAuth'
import extractSkillsFromText from '../../lib/ai/skillExtractor'
import analyzeRepo from '../../lib/analyzers/githubAnalyzer'
import { withRateLimit } from '@/lib/rateLimitRedis'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = await requireAuth(req, res)
  if (!user) return

  const { sample_id } = req.body || {}
  if (!sample_id) return res.status(400).json({ error: 'sample_id required' })

  try {
    const { data: sample, error: sampleErr } = await supabaseServer.from('samples').select('*').eq('id', sample_id).single()
    if (sampleErr) throw sampleErr
    if (!sample) return res.status(404).json({ error: 'Sample not found' })

    // Update analysis status to processing
    const { data: analysisRow } = await supabaseServer.from('analyses').insert({ sample_id: sample.id, status: 'processing' }).select('*').single()

    let result: any = { skills: [] }

    if (sample.type === 'writing' || sample.type === 'code') {
      const text = sample.content ?? ''
      const skills = await extractSkillsFromText(text)
      result = { skills }
    } else if (sample.type === 'repo') {
      // expect source_url like https://github.com/owner/repo
      const url = sample.source_url || ''
      const m = url.match(/github.com\/([^\/]+)\/([^\/]+)(?:\/|$)/i)
      if (m) {
        const owner = m[1]
        const repo = m[2].replace(/\.git$/, '')
        const gh = await analyzeRepo(owner, repo, process.env.GITHUB_TOKEN)
        result = { github: gh }
      }
    }

    await supabaseServer.from('analyses').update({ status: 'done', result }).eq('id', analysisRow.id)

    return res.status(200).json({ analysis: { id: analysisRow.id, status: 'done', result } })
  } catch (err: any) {
    console.error('analysis error', err)
    return res.status(500).json({ error: err.message || 'Analysis failed' })
  }
}

// Export with rate limiting (20 analysis requests per minute max)
export default withRateLimit(handler, { maxRequests: 20, windowMs: 60000 })
