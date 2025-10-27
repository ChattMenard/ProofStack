import { NextRequest, NextResponse } from 'next/server'
import { requireAuthAppRouter } from '@/lib/requireAuthAppRouter'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(req: NextRequest) {
  const { user, error: authError } = await requireAuthAppRouter(req)
  
  if (!user) {
    return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
  }

  try {
    // Verify user is admin
    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('is_admin')
      .eq('auth_uid', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get skill level distribution
    const { data: levelDistribution } = await supabaseServer
      .from('profiles')
      .select('skill_level')
      .eq('user_type', 'professional')

    const distribution = {
      unverified: 0,
      junior: 0,
      mid: 0,
      senior: 0,
      lead: 0
    }

    levelDistribution?.forEach((p: any) => {
      const level = p.skill_level || 'unverified'
      if (level in distribution) {
        distribution[level as keyof typeof distribution]++
      }
    })

    // Get assessment stats
    const { data: assessments } = await supabaseServer
      .from('skill_assessments')
      .select('target_level, passed, created_at, completed_at')
      .order('created_at', { ascending: false })
      .limit(1000)

    // Calculate pass rates by level
    const passRates: Record<string, { total: number; passed: number }> = {
      junior: { total: 0, passed: 0 },
      mid: { total: 0, passed: 0 },
      senior: { total: 0, passed: 0 },
      lead: { total: 0, passed: 0 }
    }

    assessments?.forEach((a: any) => {
      if (a.target_level in passRates) {
        passRates[a.target_level].total++
        if (a.passed) passRates[a.target_level].passed++
      }
    })

    // Calculate promotion velocity (time to advance from unverified to each level)
    const { data: profilesWithLevels } = await supabaseServer
      .from('profiles')
      .select('id, skill_level, skill_level_verified_at, created_at')
      .eq('user_type', 'professional')
      .not('skill_level', 'is', null)
      .not('skill_level', 'eq', 'unverified')

    const velocityByLevel: Record<string, number[]> = {
      junior: [],
      mid: [],
      senior: [],
      lead: []
    }

    profilesWithLevels?.forEach((p: any) => {
      if (p.skill_level_verified_at && p.created_at) {
        const daysToVerify = Math.floor(
          (new Date(p.skill_level_verified_at).getTime() - new Date(p.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
        )
        if (p.skill_level in velocityByLevel) {
          velocityByLevel[p.skill_level].push(daysToVerify)
        }
      }
    })

    const avgVelocity = Object.entries(velocityByLevel).reduce((acc, [level, days]) => {
      acc[level] = days.length > 0
        ? Math.round(days.reduce((sum, d) => sum + d, 0) / days.length)
        : 0
      return acc
    }, {} as Record<string, number>)

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentAssessments } = await supabaseServer
      .from('skill_assessments')
      .select('created_at, passed')
      .gte('created_at', thirtyDaysAgo.toISOString())

    const recentActivity = {
      totalAssessments: recentAssessments?.length || 0,
      passedAssessments: recentAssessments?.filter((a: any) => a.passed).length || 0
    }

    return NextResponse.json({
      distribution,
      passRates,
      avgPromotionVelocity: avgVelocity,
      recentActivity,
      totalProfessionals: levelDistribution?.length || 0,
      totalAssessments: assessments?.length || 0
    })
  } catch (error: any) {
    console.error('Error fetching skill analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}