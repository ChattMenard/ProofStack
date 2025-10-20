import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseServer
    const { bio, headline, skills } = await request.json()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Combine text for analysis
    const profileText = `
Headline: ${headline || ''}

Bio: ${bio || ''}

Skills: ${skills ? skills.join(', ') : ''}
    `.trim()

    if (!profileText || profileText.length < 10) {
      return NextResponse.json(
        { error: 'Profile text too short to analyze' },
        { status: 400 }
      )
    }

    // Call AI text analysis endpoint
    const analysisResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', 'https://')}/api/analyze-text-quality`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: profileText,
          context: 'professional profile'
        })
      }
    )

    if (!analysisResponse.ok) {
      throw new Error('AI analysis failed')
    }

    const analysis = await analysisResponse.json()

    // Update profile with quality score
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        profile_quality_score: analysis.score,
        profile_quality_analysis: analysis.details,
        profile_quality_analyzed_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      throw updateError
    }

    // Trigger ProofScore recalculation (handled by database trigger)

    return NextResponse.json({
      success: true,
      quality_score: analysis.score,
      analysis: analysis.details,
      message: 'Profile quality analyzed and ProofScore updated'
    })

  } catch (error: any) {
    console.error('Profile analysis error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to analyze profile',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
