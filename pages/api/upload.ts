import type { NextApiRequest, NextApiResponse } from 'next'
import supabaseServer from '../../lib/supabaseServer'
import { requireAuth } from '../../lib/requireAuth'
import cloudinary from '../../lib/cloudinaryClient'
import crypto from 'crypto'

const ALLOWED_TYPES = ['writing', 'code', 'design', 'audio', 'video', 'repo']

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = await requireAuth(req, res)
  if (!user) return

  const { type = 'writing', filename, storage_url, source_url, size_bytes, hash, content, fileData } = req.body

  // normalize size
  const size = typeof size_bytes === 'string' ? parseInt(size_bytes, 10) : typeof size_bytes === 'number' ? size_bytes : 0
  const MAX_UPLOAD_BYTES = parseInt(process.env.MAX_UPLOAD_BYTES || String(5 * 1024 * 1024), 10) // default 5MB
  if (size > MAX_UPLOAD_BYTES) return res.status(413).json({ error: 'Payload too large' })

  // validate type
  if (!ALLOWED_TYPES.includes(type)) return res.status(400).json({ error: 'Invalid sample type' })

  // require either inline content, fileData, or storage_url
  if (!content && !fileData && !storage_url) return res.status(400).json({ error: 'Missing content, fileData, or storage_url' })

  try {
    let uploadedUrl = storage_url ?? null
    let computedHash = hash ?? null
    
    // If fileData is present, upload to Cloudinary and compute hash
    if (fileData) {
      // Validate Cloudinary configuration
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        return res.status(500).json({ error: 'File storage not configured. Please set Cloudinary credentials.' })
      }

      // fileData is a base64 data URL
      const uploadRes = await cloudinary.uploader.upload(fileData, {
        resource_type: 'auto',
        folder: 'proofstack',
        public_id: filename ? filename.replace(/[^a-zA-Z0-9-_]/g, '_').split('.')[0] : `upload_${Date.now()}`,
      })
      uploadedUrl = uploadRes.secure_url

      // Compute hash of the file content
      const base64Data = fileData.split(',')[1] // Remove data URL prefix
      if (!base64Data) {
        return res.status(400).json({ error: 'Invalid file data format' })
      }
      const buffer = Buffer.from(base64Data, 'base64')
      computedHash = crypto.createHash('sha256').update(buffer).digest('hex')
    } else if (content) {
      // Compute hash of text content
      computedHash = crypto.createHash('sha256').update(content).digest('hex')
    }

    // insert sample using owner_id to match schema
    const { data: sample, error: sampleErr } = await supabaseServer
      .from('samples')
      .insert({ 
        owner_id: user.id, 
        type, 
        filename: filename ?? null, 
        storage_url: uploadedUrl, 
        source_url: source_url ?? null, 
        size_bytes: size, 
        hash: computedHash, 
        content: content ?? null 
      })
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
