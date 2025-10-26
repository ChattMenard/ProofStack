import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { plan, amount } = await req.json()

    // Get user from session
    const authHeader = req.headers.get('cookie')
    if (!authHeader) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Create or retrieve customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, stripe_customer_id, email')
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId && profile?.email) {
      const customer = await stripe.customers.create({
        email: profile.email,
        metadata: {
          userId: profile.id,
        },
      })
      customerId = customer.id

      // Save customer ID
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', profile.id)
    }

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: 'usd',
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        plan,
        userId: profile?.id || '',
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error: any) {
    console.error('Create Payment Intent error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
