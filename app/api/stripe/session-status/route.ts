import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '../../../../lib/stripe'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      )
    }

    // Retrieve the session from Stripe
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured (missing STRIPE_SECRET_KEY)' }, { status: 500 })
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)

    return NextResponse.json({
      status: session.status,
      customer_email: session.customer_details?.email,
      payment_status: session.payment_status,
    })
  } catch (error: any) {
    console.error('Session status check error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve session status' },
      { status: 500 }
    )
  }
}
