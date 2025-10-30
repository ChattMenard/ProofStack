import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { Resend } from 'resend'

// Force dynamic route - don't try to statically generate cron endpoints
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Do not instantiate Resend at module load time (build can run without env vars)

/**
 * Weekly Digest Email Cron Job
 * 
 * Runs: Friday & Saturday at 6pm MST (11pm UTC Friday, 12am UTC Sunday)
 * 
 * Vercel Cron Config (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/weekly-digest",
 *     "schedule": "0 23 * * 5,6"
 *   }]
 * }
 * 
 * Authorization: Uses CRON_SECRET env var
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured')
      return NextResponse.json({ error: 'Server configuration error: RESEND_API_KEY not set' }, { status: 500 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    const supabase = supabaseServer
    const now = new Date()
    const dayOfWeek = now.getUTCDay() // 0 = Sunday, 5 = Friday, 6 = Saturday

    // Get all active employers with email notifications enabled
    const { data: employers, error: employersError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        username,
        email_notifications,
        organization_id
      `)
      .eq('user_type', 'employer')
      .eq('email_notifications', true)

    if (employersError) throw employersError

    if (!employers || employers.length === 0) {
      return NextResponse.json({ 
        message: 'No recipients yet',
        count: 0 
      })
    }

    // Get featured professionals (promoted listings)
    const { data: featuredPros } = await supabase
      .from('professional_promotions')
      .select(`
        professional_id,
        tier,
        profiles:professional_id (
          id,
          username,
          headline,
          location,
          skills,
          years_experience
        )
      `)
      .gte('expires_at', now.toISOString())
      .in('tier', ['featured', 'premium'])
      .order('tier', { ascending: false })
      .limit(10)

    // Get newly joined professionals (last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const { data: newPros } = await supabase
      .from('profiles')
      .select('id, username, headline, location, skills, created_at')
      .eq('user_type', 'professional')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(5)

    // Send emails
    const emailsSent = []
    const emailsFailed = []

    for (const employer of employers) {
      try {
        const { data, error } = await resend.emails.send({
          from: 'ProofStack <digest@proofstack.com>',
          to: employer.email,
          subject: `${dayOfWeek === 5 ? 'Friday' : 'Saturday'} Talent Digest 🚀`,
          html: generateDigestHTML({
            employerName: employer.username,
            featuredPros: featuredPros || [],
            newPros: newPros || [],
            dayOfWeek
          })
        })

        if (error) {
          emailsFailed.push({ email: employer.email, error: error.message })
        } else {
          emailsSent.push({ email: employer.email, id: data?.id })
        }
      } catch (err: any) {
        emailsFailed.push({ email: employer.email, error: err.message })
      }
    }

    return NextResponse.json({
      success: true,
      sent: emailsSent.length,
      failed: emailsFailed.length,
      recipients: employers.length,
      failedEmails: emailsFailed
    })

  } catch (error: any) {
    console.error('Weekly digest cron error:', error)
    return NextResponse.json(
      { error: 'Cron job failed', details: error.message },
      { status: 500 }
    )
  }
}

function generateDigestHTML({
  employerName,
  featuredPros,
  newPros,
  dayOfWeek
}: {
  employerName: string
  featuredPros: any[]
  newPros: any[]
  dayOfWeek: number
}) {
  const greeting = dayOfWeek === 5 ? 'Happy Friday' : 'Happy Saturday'
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ProofStack Weekly Digest</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; margin-bottom: 30px;">
    <h1 style="color: white; margin: 0; font-size: 28px;">${greeting}, ${employerName}! 🎉</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your weekly talent digest from ProofStack</p>
  </div>

  ${featuredPros.length > 0 ? `
  <div style="margin-bottom: 30px;">
    <h2 style="color: #667eea; font-size: 22px; margin-bottom: 15px;">✨ Featured Professionals</h2>
    ${featuredPros.map((promo: any) => {
      const pro = promo.profiles
      return `
      <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin-bottom: 15px; border-radius: 5px;">
        <h3 style="margin: 0 0 5px 0; font-size: 18px;">
          <a href="https://proofstack-two.vercel.app/portfolios/${pro.username}" style="color: #667eea; text-decoration: none;">
            ${pro.username}
          </a>
        </h3>
        <p style="margin: 5px 0; color: #666; font-size: 14px;">${pro.headline || 'Professional Developer'}</p>
        <p style="margin: 5px 0; color: #999; font-size: 13px;">
          📍 ${pro.location || 'Remote'} • 
          💼 ${pro.years_experience || 0}+ years • 
          ${promo.tier === 'featured' ? '⭐ Featured' : '💎 Premium'}
        </p>
        ${pro.skills && pro.skills.length > 0 ? `
        <p style="margin: 10px 0 0 0; font-size: 13px;">
          ${pro.skills.slice(0, 5).map((skill: string) => `<span style="background: white; padding: 3px 8px; border-radius: 3px; margin-right: 5px; display: inline-block; margin-bottom: 5px;">${skill}</span>`).join('')}
        </p>
        ` : ''}
      </div>
      `
    }).join('')}
  </div>
  ` : ''}

  ${newPros.length > 0 ? `
  <div style="margin-bottom: 30px;">
    <h2 style="color: #764ba2; font-size: 22px; margin-bottom: 15px;">🆕 New Talent This Week</h2>
    ${newPros.map((pro: any) => `
      <div style="background: #f8f9fa; border-left: 4px solid #764ba2; padding: 15px; margin-bottom: 15px; border-radius: 5px;">
        <h3 style="margin: 0 0 5px 0; font-size: 18px;">
          <a href="https://proofstack-two.vercel.app/portfolios/${pro.username}" style="color: #764ba2; text-decoration: none;">
            ${pro.username}
          </a>
        </h3>
        <p style="margin: 5px 0; color: #666; font-size: 14px;">${pro.headline || 'Professional Developer'}</p>
        <p style="margin: 5px 0; color: #999; font-size: 13px;">📍 ${pro.location || 'Remote'}</p>
      </div>
    `).join('')}
  </div>
  ` : ''}

  <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 30px; text-align: center;">
    <p style="margin: 0 0 15px 0; color: #666;">Ready to discover more talent?</p>
    <a href="https://proofstack-two.vercel.app/employer/discover" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; font-weight: 600;">
      Browse All Professionals →
    </a>
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 13px;">
    <p>You're receiving this because you signed up for weekly talent digests.</p>
    <p>
      <a href="https://proofstack-two.vercel.app/employer/settings" style="color: #667eea; text-decoration: none;">Update preferences</a> • 
      <a href="https://proofstack-two.vercel.app" style="color: #667eea; text-decoration: none;">ProofStack</a>
    </p>
  </div>
</body>
</html>
  `
}
