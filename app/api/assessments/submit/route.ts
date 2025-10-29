import { NextRequest, NextResponse } from 'next/server'
import { requireAuthAppRouter } from '@/lib/requireAuthAppRouter'
import { supabaseServer } from '@/lib/supabaseServer'

interface SubmitAssessmentRequest {
  assessmentType: 'coding_challenge' | 'technical_quiz' | 'portfolio_review' | 'project_complexity'
  targetLevel: 'junior' | 'mid' | 'senior' | 'lead'
  answers: any // JSON data with questions/answers
  score: number
  timeTakenSeconds: number
}

async function handler(req: NextRequest) {
  const { user, error: authError } = await requireAuthAppRouter(req)
  
  if (!user) {
    return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
  }

  try {
    const body: SubmitAssessmentRequest = await req.json()
    const { assessmentType, targetLevel, answers, score, timeTakenSeconds } = body

    // Validation
    if (!assessmentType || !targetLevel || score === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: assessmentType, targetLevel, score' },
        { status: 400 }
      )
    }

    if (score < 0 || score > 100) {
      return NextResponse.json(
        { error: 'Score must be between 0 and 100' },
        { status: 400 }
      )
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabaseServer
      .from('profiles')
      .select('id, skill_level')
      .eq('auth_uid', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Define passing scores by level
    const passingScores: Record<string, number> = {
      junior: 70,
      mid: 75,
      senior: 80,
      lead: 85
    }

    const passed = score >= passingScores[targetLevel]

    // Insert assessment result (trigger will auto-update skill_level if passed)
    const { data: assessment, error: insertError } = await supabaseServer
      .from('skill_assessments')
      .insert({
        profile_id: profile.id,
        assessment_type: assessmentType,
        target_level: targetLevel,
        score,
        passed,
        questions_data: answers,
        time_taken_seconds: timeTakenSeconds,
        completed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      // Check if it's a duplicate (UNIQUE constraint violation)
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'You have already completed this assessment' },
          { status: 409 }
        )
      }
      throw insertError
    }

    // Fetch updated profile to get new skill_level (trigger may have updated it)
    const { data: updatedProfile } = await supabaseServer
      .from('profiles')
      .select('skill_level, skill_level_verified_at')
      .eq('id', profile.id)
      .single()

    const levelChanged = updatedProfile?.skill_level !== profile.skill_level

    return NextResponse.json({
      success: true,
      assessment,
      passed,
      levelChanged,
      newLevel: updatedProfile?.skill_level,
      message: passed
        ? levelChanged
          ? `Congratulations! You've advanced to ${updatedProfile?.skill_level} level! 🎉`
          : 'Assessment passed! Keep completing assessments to level up.'
        : `Score ${score}% - You need ${passingScores[targetLevel]}% to pass. Try again after reviewing the material.`
    })
  } catch (error: any) {
    console.error('Error submitting assessment:', error)
    return NextResponse.json(
      { error: 'Failed to submit assessment' },
      { status: 500 }
    )
  }
}

// Note: Rate limiting with withRateLimit is for Pages Router
// For App Router, consider middleware-based rate limiting
// For now, exporting handler directly
export const POST = handler
