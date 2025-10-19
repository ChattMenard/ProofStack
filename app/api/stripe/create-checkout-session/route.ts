import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_PRICES } from '../../../../lib/stripe'
import { supabase } from '../../../../lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    const { plan, userId, mode = 'hosted' } = await request.json()

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

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin

    // Create Stripe checkout session with support for both hosted and embedded modes
    const sessionConfig: any = {
      customer_email: profile.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      metadata: {
        userId,
        plan,
      },
    }

    if (mode === 'embedded') {
      // For embedded checkout
      sessionConfig.ui_mode = 'embedded'
      sessionConfig.return_url = `${baseUrl}/checkout/return?session_id={CHECKOUT_SESSION_ID}`
    } else {
      // For hosted checkout (legacy)
      sessionConfig.success_url = `${baseUrl}/dashboard?upgrade=success`
      sessionConfig.cancel_url = `${baseUrl}/dashboard?upgrade=cancelled`
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    // Return different responses based on mode
    if (mode === 'embedded') {
      return NextResponse.json({ clientSecret: session.client_secret })
    } else {
      return NextResponse.json({ url: session.url })
    }
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
