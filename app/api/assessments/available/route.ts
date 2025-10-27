import { NextRequest, NextResponse } from 'next/server'
import { requireAuthAppRouter } from '@/lib/requireAuthAppRouter'
import { supabaseServer } from '@/lib/supabaseServer'

interface Assessment {
  id: string
  type: 'coding_challenge' | 'technical_quiz' | 'portfolio_review' | 'project_complexity'
  targetLevel: 'junior' | 'mid' | 'senior' | 'lead'
  title: string
  description: string
  durationMinutes: number
  passingScore: number
  locked: boolean
  completedAt?: string
}

// Define available assessments (could be moved to DB later)
const assessmentLibrary: Omit<Assessment, 'locked' | 'completedAt'>[] = [
  // Junior level
  {
    id: 'junior-quiz-1',
    type: 'technical_quiz',
    targetLevel: 'junior',
    title: 'JavaScript Fundamentals',
    description: 'Test your knowledge of core JavaScript concepts: variables, functions, arrays, objects',
    durationMinutes: 20,
    passingScore: 70
  },
  {
    id: 'junior-code-1',
    type: 'coding_challenge',
    targetLevel: 'junior',
    title: 'Array Manipulation',
    description: 'Solve basic array problems: filtering, mapping, reducing',
    durationMinutes: 30,
    passingScore: 70
  },
  // Mid level
  {
    id: 'mid-quiz-1',
    type: 'technical_quiz',
    targetLevel: 'mid',
    title: 'React & State Management',
    description: 'Advanced React patterns, hooks, and state management strategies',
    durationMinutes: 30,
    passingScore: 75
  },
  {
    id: 'mid-code-1',
    type: 'coding_challenge',
    targetLevel: 'mid',
    title: 'API Design',
    description: 'Build a RESTful API with proper error handling and validation',
    durationMinutes: 45,
    passingScore: 75
  },
  // Senior level
  {
    id: 'senior-quiz-1',
    type: 'technical_quiz',
    targetLevel: 'senior',
    title: 'System Design',
    description: 'Architecture patterns, scalability, performance optimization',
    durationMinutes: 45,
    passingScore: 80
  },
  {
    id: 'senior-code-1',
    type: 'coding_challenge',
    targetLevel: 'senior',
    title: 'Complex Algorithm',
    description: 'Solve advanced data structure and algorithm problems',
    durationMinutes: 60,
    passingScore: 80
  },
  {
    id: 'senior-portfolio-1',
    type: 'portfolio_review',
    targetLevel: 'senior',
    title: 'Portfolio Review',
    description: 'Submit your best work for expert review and feedback',
    durationMinutes: 0,
    passingScore: 80
  },
  // Lead level
  {
    id: 'lead-quiz-1',
    type: 'technical_quiz',
    targetLevel: 'lead',
    title: 'Engineering Leadership',
    description: 'Team management, mentorship, technical decision-making',
    durationMinutes: 45,
    passingScore: 85
  },
  {
    id: 'lead-project-1',
    type: 'project_complexity',
    targetLevel: 'lead',
    title: 'Architecture Review',
    description: 'Design and present a complex system architecture',
    durationMinutes: 90,
    passingScore: 85
  },
  {
    id: 'lead-portfolio-1',
    type: 'portfolio_review',
    targetLevel: 'lead',
    title: 'Leadership Portfolio',
    description: 'Demonstrate leadership through past projects and mentorship',
    durationMinutes: 0,
    passingScore: 85
  }
]

export async function GET(req: NextRequest) {
  const { user, error: authError } = await requireAuthAppRouter(req)
  
  if (!user) {
    return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get user's profile to check current skill level
    const { data: profile, error: profileError } = await supabaseServer
      .from('profiles')
      .select('id, skill_level')
      .eq('auth_uid', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get user's completed assessments
    const { data: completedAssessments } = await supabaseServer
      .from('skill_assessments')
      .select('assessment_type, target_level, passed, completed_at')
      .eq('profile_id', profile.id)

    const completedMap = new Map(
      completedAssessments?.map((a: any) => [`${a.assessment_type}-${a.target_level}`, a]) || []
    )

    // Determine which assessments are unlocked based on current skill level
    const levelOrder = ['unverified', 'junior', 'mid', 'senior', 'lead']
    const currentLevelIndex = levelOrder.indexOf(profile.skill_level || 'unverified')

    const assessments: Assessment[] = assessmentLibrary.map(assessment => {
      const targetLevelIndex = levelOrder.indexOf(assessment.targetLevel)
      const completed: any = completedMap.get(`${assessment.type}-${assessment.targetLevel}`)
      
      // Unlock if: target level is current or below, OR user is already above this level
      const locked = targetLevelIndex > currentLevelIndex + 1

      return {
        ...assessment,
        locked,
        completedAt: completed?.completed_at
      }
    })

    // Group by level for easier UI rendering
    const grouped = {
      junior: assessments.filter(a => a.targetLevel === 'junior'),
      mid: assessments.filter(a => a.targetLevel === 'mid'),
      senior: assessments.filter(a => a.targetLevel === 'senior'),
      lead: assessments.filter(a => a.targetLevel === 'lead')
    }

    return NextResponse.json({
      currentLevel: profile.skill_level || 'unverified',
      assessments: grouped,
      stats: {
        total: assessments.length,
        completed: completedAssessments?.filter((a: any) => a.passed).length || 0,
        available: assessments.filter(a => !a.locked && !a.completedAt).length
      }
    })
  } catch (error: any) {
    console.error('Error fetching available assessments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    )
  }
}
