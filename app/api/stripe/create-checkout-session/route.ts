import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_PRICES } from '../../../../lib/stripe'
import { supabase } from '../../../../lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    const { plan, userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('auth_uid', userId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Determine price ID
    const priceId = plan === 'pro-yearly' 
      ? STRIPE_PRICES.PRO_YEARLY 
      : STRIPE_PRICES.PRO_MONTHLY

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: profile.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin}/dashboard?upgrade=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin}/dashboard?upgrade=cancelled`,
      metadata: {
        userId,
        plan,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
