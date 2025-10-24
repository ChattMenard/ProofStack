import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '../../lib/requireAuth'
import supabaseServer from '../../lib/supabaseServer'
import extractSkillsFromText from '../../lib/ai/skillExtractor'
import analyzeRepo from '../../lib/analyzers/githubAnalyzer'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Auth check (tests mock requireAuth)
  const user = await requireAuth(req as any, res as any)
  if (!user) return

  try {
    const { sample_id } = req.body || {}
    if (!sample_id) {
      return res.status(400).json({ error: 'sample_id required' })
    }

    // Fetch sample
    const { data: sample, error: fetchError } = await supabaseServer
      .from('samples')
      .select('*')
      .eq('id', sample_id)
      .single()

    if (fetchError) {
      return res.status(500).json({ error: fetchError.message })
    }

    if (!sample) {
      return res.status(404).json({ error: 'Sample not found' })
    }

    // Insert analysis row
    const { data: analysisRow, error: insertError } = await supabaseServer
      .from('analyses')
      .insert({
        sample_id: sample.id,
        status: 'processing',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      return res.status(500).json({ error: insertError.message })
    }

    // Default response object we'll return (include result after analysis)
    let responseAnalysis: any = { ...(analysisRow || {}) }

    // Handle different sample types
    if (sample.type === 'writing' || sample.type === 'code') {
      // Extract skills from text/code
      const skills = await extractSkillsFromText(sample.content)

      // Update analysis with computed result
      await supabaseServer
        .from('analyses')
        .update({ result: { skills }, skills })
        .eq('id', analysisRow.id)

      responseAnalysis = { ...responseAnalysis, result: { skills } }

      return res.status(200).json({ analysis: responseAnalysis })
    }

    if (sample.type === 'repo') {
      // Parse owner/repo from GitHub url
      const url = sample.source_url || ''
      let owner: string | undefined
      let repo: string | undefined
      try {
        const parsed = new URL(url)
        const parts = parsed.pathname.split('/').filter(Boolean)
        owner = parts[0]
        repo = parts[1]
      } catch (err) {
        // Ignore parse errors - analyzeRepo will handle undefined
      }

      const repoData = await analyzeRepo(owner, repo, undefined)

      await supabaseServer
        .from('analyses')
        .update({ result: { github: repoData } })
        .eq('id', analysisRow.id)

      responseAnalysis = { ...responseAnalysis, result: { github: repoData } }

      return res.status(200).json({ analysis: responseAnalysis })
    }

    // For other sample types, simply return the created analysis
    return res.status(200).json({ analysis: responseAnalysis })

  } catch (err: any) {
    console.error('Analyze handler error:', err)
    return res.status(500).json({ error: err.message || 'Analysis failed' })
  }
}
