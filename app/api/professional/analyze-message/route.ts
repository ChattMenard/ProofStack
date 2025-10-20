import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseServer
    const { message_id, professional_id, message_text } = await request.json()

    if (!message_id || !professional_id || !message_text) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if this is the first message from professional to this employer
    const { data: existingMessages, error: checkError } = await supabase
      .from('messages')
      .select('id')
      .eq('sender_id', professional_id)
      .eq('id', message_id)
      .single()

    if (checkError || !existingMessages) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Call AI text analysis endpoint
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'
    
    const analysisResponse = await fetch(`${baseUrl}/api/analyze-text-quality`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: message_text,
        context: 'initial employer contact message'
      })
    })

    if (!analysisResponse.ok) {
      throw new Error('AI analysis failed')
    }

    const analysis = await analysisResponse.json()

    // Update professional_ratings with initial message quality
    const { error: updateError } = await supabase
      .from('professional_ratings')
      .upsert({
        professional_id: professional_id,
        initial_message_quality_score: analysis.score,
        initial_message_quality_analysis: analysis.details
      }, {
        onConflict: 'professional_id'
      })

    if (updateError) {
      throw updateError
    }

    // Mark message as analyzed
    await supabase
      .from('messages')
      .update({ is_quality_analyzed: true })
      .eq('id', message_id)

    // Trigger ProofScore recalculation (handled by database trigger)

    return NextResponse.json({
      success: true,
      quality_score: analysis.score,
      analysis: analysis.details,
      message: 'Message quality analyzed and ProofScore updated'
    })

  } catch (error: any) {
    console.error('Message analysis error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to analyze message',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
