import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '../../../../lib/stripe'
import { supabase } from '../../../../lib/supabaseClient'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log('Stripe webhook event:', event.type)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Get user ID from metadata
        const userId = session.metadata?.userId
        if (!userId) break

        // Update profile with subscription info
        await supabase
          .from('profiles')
          .update({
            plan: 'pro',
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          })
          .eq('auth_uid', userId)

        console.log('Upgraded user to Pro:', userId)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Update subscription status
        const status = subscription.status
        const plan = status === 'active' ? 'pro' : 'free'

        await supabase
          .from('profiles')
          .update({
            plan,
            stripe_subscription_status: status,
          })
          .eq('stripe_customer_id', subscription.customer as string)

        console.log('Updated subscription status:', subscription.id, status)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        // Downgrade to free
        await supabase
          .from('profiles')
          .update({
            plan: 'free',
            stripe_subscription_status: 'canceled',
          })
          .eq('stripe_customer_id', subscription.customer as string)

        console.log('Subscription canceled:', subscription.id)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        // Notify user of failed payment
        console.log('Payment failed for customer:', invoice.customer)
        // TODO: Send email notification
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
