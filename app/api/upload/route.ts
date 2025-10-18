import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '../../../lib/supabaseServer'
import { checkRateLimit } from '../../../lib/rateLimit'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
})

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
const ALLOWED_TYPES = ['writing', 'code', 'design', 'audio', 'video', 'repo']

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = checkRateLimit(`upload:${ip}`)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many uploads. Please wait a moment.' },
        { status: 429 }
      )
    }

    // Get user from auth header
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('id, plan, is_founder')
      .eq('auth_uid', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const body = await req.json()
    const { type, filename, size_bytes, content, fileData } = body

    // Validate type
    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Invalid sample type' }, { status: 400 })
    }

    // Validate size
    if (size_bytes > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 20MB)' }, { status: 400 })
    }

    let storage_url = ''
    let cloudinary_public_id = ''

    // Upload to Cloudinary if file data provided
    if (fileData) {
      try {
        const uploadResult = await cloudinary.uploader.upload(fileData, {
          folder: 'proofstack',
          resource_type: 'auto',
          use_filename: true,
          unique_filename: true,
        })
        storage_url = uploadResult.secure_url
        cloudinary_public_id = uploadResult.public_id
      } catch (uploadError: any) {
        console.error('Cloudinary upload error:', uploadError)
        return NextResponse.json(
          { error: 'File upload failed' },
          { status: 500 }
        )
      }
    }

    // Create sample record
    const { data: sample, error: sampleError } = await supabaseServer
      .from('samples')
      .insert({
        owner_id: profile.id,
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
      return NextResponse.json(
        { error: 'Failed to create sample' },
        { status: 500 }
      )
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

    // TODO: Queue analysis job to worker
    // For now, trigger immediate analysis
    if (analysis) {
      // Trigger async analysis (fire and forget)
      fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis_id: analysis.id }),
      }).catch(err => console.error('Failed to trigger analysis:', err))
    }

    return NextResponse.json({
      success: true,
      sample_id: sample.id,
      analysis_id: analysis?.id,
      message: 'Upload successful. Analysis queued.',
    })

  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
}

// GET endpoint to list user's uploads
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('id')
      .eq('auth_uid', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get user's samples with analysis data
    const { data: samples, error } = await supabaseServer
      .from('samples')
      .select(`
        *,
        analyses (
          id,
          status,
          summary,
          result,
          skills,
          metrics,
          created_at,
          completed_at
        )
      `)
      .eq('owner_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Samples query error:', error)
      return NextResponse.json({ error: 'Failed to fetch samples' }, { status: 500 })
    }

    return NextResponse.json({ samples })

  } catch (error: any) {
    console.error('GET uploads error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch uploads' },
      { status: 500 }
    )
  }
}
