import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '../../../lib/supabaseServer'
import { analyzeSampleWithAI } from '../../../lib/analyzers/skillExtractor'

// This endpoint processes analysis jobs
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { analysis_id } = body

    if (!analysis_id) {
      return NextResponse.json({ error: 'analysis_id required' }, { status: 400 })
    }

    // Get analysis with sample
    const { data: analysis, error: analysisError } = await supabaseServer
      .from('analyses')
      .select(`
        *,
        samples (*)
      `)
      .eq('id', analysis_id)
      .single()

    if (analysisError || !analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }

    // Check if already processing or done
    if (analysis.status === 'processing' || analysis.status === 'done') {
      return NextResponse.json({
        message: 'Analysis already in progress or completed',
        status: analysis.status,
      })
    }

    // Update status to processing
    await supabaseServer
      .from('analyses')
      .update({
        status: 'processing',
        started_at: new Date().toISOString(),
      })
      .eq('id', analysis_id)

    const sample = Array.isArray(analysis.samples) ? analysis.samples[0] : analysis.samples

    if (!sample) {
      await supabaseServer
        .from('analyses')
        .update({
          status: 'error',
          last_error: 'Sample not found',
          completed_at: new Date().toISOString(),
        })
        .eq('id', analysis_id)

      return NextResponse.json({ error: 'Sample not found' }, { status: 404 })
    }

    try {
      // Perform AI analysis
      const startTime = Date.now()
      const result = await analyzeSampleWithAI(sample)
      const duration = Date.now() - startTime

      // Update analysis with results
      await supabaseServer
        .from('analyses')
        .update({
          status: 'done',
          summary: result.summary || 'Analysis complete',
          result: result,
          skills: result.skills || {},
          metrics: {
            duration_ms: duration,
            model: result.model || 'gpt-4o-mini',
            tokens_used: result.tokens_used || 0,
            ai_detection_score: result.ai_detection_score || 0,
          },
          completed_at: new Date().toISOString(),
        })
        .eq('id', analysis_id)

      // Create proof record
      await supabaseServer
        .from('proofs')
        .insert({
          analysis_id,
          proof_type: 'server_signed',
          proof_hash: `sha256:${analysis_id}`,
          signer: 'ProofStack AI Service',
          payload: {
            sample_id: sample.id,
            analyzed_at: new Date().toISOString(),
            model: result.model || 'gpt-4o-mini',
          },
          signature: {
            sig: 'DEMO-SIGNATURE',
          },
        })

      return NextResponse.json({
        success: true,
        analysis_id,
        status: 'done',
        result,
      })

    } catch (aiError: any) {
      console.error('AI analysis error:', aiError)

      // Update with error
      const retry_count = (analysis.retry_count || 0) + 1
      await supabaseServer
        .from('analyses')
        .update({
          status: retry_count < 3 ? 'queued' : 'error',
          last_error: aiError.message || 'Analysis failed',
          retry_count,
          completed_at: retry_count >= 3 ? new Date().toISOString() : null,
        })
        .eq('id', analysis_id)

      return NextResponse.json(
        {
          error: 'Analysis failed',
          message: aiError.message,
          retry_count,
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Analyze endpoint error:', error)
    return NextResponse.json(
      { error: error.message || 'Analysis failed' },
      { status: 500 }
    )
  }
}

// GET endpoint to check analysis status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const analysis_id = searchParams.get('id')

    if (!analysis_id) {
      return NextResponse.json({ error: 'analysis_id required' }, { status: 400 })
    }

    const { data: analysis, error } = await supabaseServer
      .from('analyses')
      .select(`
        *,
        samples (
          id,
          type,
          title,
          filename
        )
      `)
      .eq('id', analysis_id)
      .single()

    if (error || !analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }

    return NextResponse.json({
      analysis_id,
      status: analysis.status,
      summary: analysis.summary,
      result: analysis.result,
      skills: analysis.skills,
      metrics: analysis.metrics,
      created_at: analysis.created_at,
      completed_at: analysis.completed_at,
      sample: analysis.samples,
    })

  } catch (error: any) {
    console.error('GET analyze error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analysis' },
      { status: 500 }
    )
  }
}
