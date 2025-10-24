import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '../../lib/requireAuth'
import supabaseServer from '../../lib/supabaseServer'
import cloudinary from '../../lib/cloudinaryClient'

const DEFAULT_MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Auth check (tests mock requireAuth)
  const user = await requireAuth(req as any, res as any)
  if (!user) return

  try {
    const { type, filename, size_bytes, content, fileData } = req.body || {}

    const MAX_FILE_SIZE = process.env.MAX_UPLOAD_BYTES ? parseInt(process.env.MAX_UPLOAD_BYTES, 10) : DEFAULT_MAX_FILE_SIZE

    const ALLOWED_TYPES = ['writing', 'code', 'design', 'audio', 'video', 'repo']

    // Validate type
    if (!ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Invalid sample type' })
    }

    // Ensure some content is provided for content-based uploads
    let storage_url = (req.body && (req.body.storage_url || req.body.storageUrl)) || ''
    if (!content && !fileData && !storage_url) {
      return res.status(400).json({ error: 'Missing content, fileData, or storage_url' })
    }

    // Validate size
    if (typeof size_bytes === 'number' && size_bytes > MAX_FILE_SIZE) {
      return res.status(413).json({ error: 'Payload too large' })
    }

    let cloudinary_public_id = ''

    // Upload to Cloudinary if file data provided
    if (fileData) {
      try {
        const uploadResult: any = await cloudinary.uploader.upload(fileData, {
          folder: 'proofstack',
          resource_type: 'auto',
          use_filename: true,
          unique_filename: true,
        })
        storage_url = uploadResult.secure_url
        cloudinary_public_id = uploadResult.public_id
      } catch (uploadError: any) {
        console.error('Cloudinary upload error:', uploadError)
        return res.status(500).json({ error: 'File upload failed' })
      }
    }

    // Create sample record
    const { data: sample, error: sampleError } = await supabaseServer
      .from('samples')
      .insert({
        owner_id: user.id,
        type,
        title: filename || 'Untitled',
        content: content || '',
        storage_url,
        filename: filename || 'sample.txt',
        size_bytes,
        visibility: 'private',
        metadata: {
          cloudinary_public_id,
          uploaded_at: new Date().toISOString(),
        },
      })
      .select()
      .single()

    if (sampleError) {
      console.error('Sample creation error:', sampleError)
      return res.status(500).json({ error: sampleError.message || 'Failed to create sample' })
    }

    // Create analysis job
    const { data: analysis, error: analysisError } = await supabaseServer
      .from('analyses')
      .insert({
        sample_id: sample.id,
        status: 'queued',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (analysisError) {
      console.error('Analysis creation error:', analysisError)
      // Sample created but analysis failed - still return success
    }

    // Trigger analysis async (fire-and-forget)
    if (analysis) {
      // Only call global fetch if available (Node/Jest may not provide it)
      if (typeof (global as any).fetch === 'function') {
        fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ analysis_id: analysis.id }),
        }).catch(err => console.error('Failed to trigger analysis:', err))
      } else {
        // In test environments or older Node, fetch may be undefined — ignore trigger
        // A real worker/queue should handle analysis triggering in production
      }
    }

    return res.status(200).json({ sample, analysis })
  } catch (error: any) {
    console.error('Upload handler error:', error)
    return res.status(500).json({ error: error.message || 'Upload failed' })
  }
}
