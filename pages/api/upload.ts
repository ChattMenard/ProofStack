import type { NextApiRequest, NextApiResponse } from 'next'
import supabaseServer from '../../lib/supabaseServer'
import requireAuth from '../../lib/requireAuth'

const ALLOWED_TYPES = ['writing', 'code', 'design', 'audio', 'video', 'repo']

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = await requireAuth(req, res)
  if (!user) return

  const { type = 'writing', filename, storage_url, source_url, size_bytes, hash, content } = req.body

  // normalize size
  const size = typeof size_bytes === 'string' ? parseInt(size_bytes, 10) : typeof size_bytes === 'number' ? size_bytes : 0
  const MAX_UPLOAD_BYTES = parseInt(process.env.MAX_UPLOAD_BYTES || String(5 * 1024 * 1024), 10) // default 5MB
  if (size > MAX_UPLOAD_BYTES) return res.status(413).json({ error: 'Payload too large' })

  // validate type
  if (!ALLOWED_TYPES.includes(type)) return res.status(400).json({ error: 'Invalid sample type' })

  // require either inline content or storage_url
  if (!content && !storage_url) return res.status(400).json({ error: 'Missing content or storage_url' })

  try {
    // insert sample using owner_id to match schema
    const { data: sample, error: sampleErr } = await supabaseServer
      .from('samples')
      .insert({ owner_id: user.id, type, filename: filename ?? null, storage_url: storage_url ?? null, source_url: source_url ?? null, size_bytes: size, hash: hash ?? null, content: content ?? null })
      .select('*')
      .single()

    if (sampleErr) throw sampleErr

    const { data: analysis, error: analysisErr } = await supabaseServer
      .from('analyses')
      .insert({ sample_id: sample.id, status: 'queued' })
      .select('*')
      .single()

    if (analysisErr) throw analysisErr

    return res.status(200).json({ sample, analysis })
  } catch (err: any) {
    console.error('upload error', err)
    return res.status(500).json({ error: err.message || 'Upload failed' })
  }
}
