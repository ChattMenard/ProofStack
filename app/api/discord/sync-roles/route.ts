import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withRateLimit } from '@/lib/security/rateLimiting'
import { discordClient } from '@/lib/discordClient'
import { 
  DISCORD_ROLE_CONFIG, 
  SkillLevel, 
  UserType, 
  EmployerSubscriptionTier,
  TalentBoostTier 
} from '@/lib/discordRoles'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Apply rate limiting (5 syncs per minute to avoid Discord rate limits)
  const getUserId = async () => user.id
  const rateLimitResponse = await withRateLimit(req, 'apiGeneral', getUserId)
  if (rateLimitResponse) {
    return rateLimitResponse
  }
  try {
    const { discordUserId, guildId } = await req.json()

    if (!discordUserId || !guildId) {
      return NextResponse.json(
        { error: 'Missing discordUserId or guildId' },
        { status: 400 }
      )
    }

    // Fetch user profile with subscription and boost status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        user_type,
        skill_level,
        organization_id,
        organizations (
          subscription_tier,
          subscription_status
        ),
        professional_promotions (
          tier,
          status,
          expires_at
        )
      `)
      .eq('auth_uid', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get all existing roles in the guild
    const guildRoles = await discordClient.getGuildRoles(guildId)
    const roleMap = new Map(guildRoles.map(r => [r.name, r.id]))

    // Determine which roles to assign
    const rolesToAssign: string[] = []

    // 1. User type role (always assign)
    const userTypeConfig = DISCORD_ROLE_CONFIG.userTypes[profile.user_type as UserType]
    let userTypeRoleId = roleMap.get(userTypeConfig.name)
    
    if (!userTypeRoleId) {
      const newRole = await discordClient.createRole(guildId, userTypeConfig.name, userTypeConfig.color)
      userTypeRoleId = newRole.id
      roleMap.set(userTypeConfig.name, newRole.id)
    }
    
    rolesToAssign.push(userTypeRoleId)

    // 2. Skill level role (for talent only)
    if (profile.user_type === 'professional' && profile.skill_level) {
      const skillConfig = DISCORD_ROLE_CONFIG.skills[profile.skill_level as SkillLevel]
      let skillRoleId = roleMap.get(skillConfig.name)
      
      if (!skillRoleId) {
        const newRole = await discordClient.createRole(guildId, skillConfig.name, skillConfig.color)
        skillRoleId = newRole.id
        roleMap.set(skillConfig.name, newRole.id)
      }
      
      rolesToAssign.push(skillRoleId)
    }

    // 3. Talent boost role (for talent with active promotions)
    if (profile.user_type === 'professional' && profile.professional_promotions) {
      const promotions = Array.isArray(profile.professional_promotions) 
        ? profile.professional_promotions 
        : [profile.professional_promotions]
      
      // Find active promotion (not expired)
      const activePromotion = promotions.find((p: any) => 
        p.status === 'active' && new Date(p.expires_at) > new Date()
      )

      if (activePromotion) {
        const boostConfig = DISCORD_ROLE_CONFIG.talentBoosts[activePromotion.tier as TalentBoostTier]
        let boostRoleId = roleMap.get(boostConfig.name)
        
        if (!boostRoleId) {
          const newRole = await discordClient.createRole(guildId, boostConfig.name, boostConfig.color)
          boostRoleId = newRole.id
          roleMap.set(boostConfig.name, newRole.id)
        }
        
        rolesToAssign.push(boostRoleId)
      }
    }

    // 4. Employer subscription role (for employers only)
    if (profile.user_type === 'employer' && profile.organizations) {
      const org = Array.isArray(profile.organizations) 
        ? profile.organizations[0] 
        : profile.organizations
      
      if (org?.subscription_status === 'active' && org.subscription_tier) {
        const subConfig = DISCORD_ROLE_CONFIG.employerSubscriptions[org.subscription_tier as EmployerSubscriptionTier]
        let subRoleId = roleMap.get(subConfig.name)
        
        if (!subRoleId) {
          const newRole = await discordClient.createRole(guildId, subConfig.name, subConfig.color)
          subRoleId = newRole.id
          roleMap.set(subConfig.name, newRole.id)
        }
        
        rolesToAssign.push(subRoleId)
      }
    }

    // Get user's current Discord roles
    const member = await discordClient.getMember(guildId, discordUserId)
    const currentRoles = new Set(member.roles)

    // Remove old ProofStack roles (any role in our config that user has)
    const allProofStackRoles = [
      ...Object.values(DISCORD_ROLE_CONFIG.skills).map(r => r.name),
      ...Object.values(DISCORD_ROLE_CONFIG.userTypes).map(r => r.name),
      ...Object.values(DISCORD_ROLE_CONFIG.employerSubscriptions).map(r => r.name),
      ...Object.values(DISCORD_ROLE_CONFIG.talentBoosts).map(r => r.name),
    ]

    for (const roleName of allProofStackRoles) {
      const roleId = roleMap.get(roleName)
      if (roleId && currentRoles.has(roleId) && !rolesToAssign.includes(roleId)) {
        await discordClient.removeMemberRole(guildId, discordUserId, roleId)
      }
    }

    // Assign new roles
    for (const roleId of rolesToAssign) {
      if (!currentRoles.has(roleId)) {
        await discordClient.addMemberRole(guildId, discordUserId, roleId)
      }
    }

    // Log to security audit (insert directly to database)
    await supabase.from('security_audit_log').insert({
      user_id: user.id,
      action: 'discord_role_sync',
      resource_type: 'discord_integration',
      resource_id: discordUserId,
      details: {
        guildId,
        rolesAssigned: rolesToAssign.length,
        skillLevel: profile.skill_level,
        userType: profile.user_type,
        hasActiveBoost: profile.user_type === 'professional' && profile.professional_promotions?.length > 0,
      },
    })

    return NextResponse.json({
      success: true,
      rolesAssigned: rolesToAssign.length,
      message: 'Discord roles synced successfully',
    })

  } catch (error: any) {
    console.error('Discord role sync error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync Discord roles' },
      { status: 500 }
    )
  }
}
