import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '../../../../lib/stripe'
import { supabase } from '../../../../lib/supabaseClient'
import Stripe from 'stripe'
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    if (!stripe) {
      console.error('Stripe not configured; webhook cannot be verified')
      return NextResponse.json({ error: 'Stripe not configured (missing STRIPE_SECRET_KEY)' }, { status: 500 })
    }

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
        const planType = session.metadata?.plan_type
        const organizationId = session.metadata?.organization_id

        // Handle employer job posting subscriptions only
        if (planType === 'job_post' && organizationId) {
          const subscriptionData: any = await stripe.subscriptions.retrieve(session.subscription as string)
          const priceId = subscriptionData.items.data[0].price.id
          const currentPeriodEnd = subscriptionData.current_period_end || Math.floor(Date.now() / 1000) + 2592000 // 30 days fallback

          // Map price IDs to plans
          const planMapping: Record<string, { tier: string; limit: number; price: number }> = {
            'price_1SMrExEQExutgDZV4l5aJXcr': { tier: 'basic', limit: 1, price: 249 },
            'price_1SMrEyEQExutgDZVhqSCfHuC': { tier: 'professional', limit: 10, price: 949 },
            'price_1SMrEyEQExutgDZVZG4GabS3': { tier: 'enterprise', limit: -1, price: 2499 }
          }

          const planDetails = planMapping[priceId] || { tier: 'basic', limit: 1, price: 249 }

          await supabase
            .from('organizations')
            .update({
              subscription_tier: planDetails.tier,
              subscription_price: planDetails.price,
              billing_cycle: priceId === 'price_1SMrEyEQExutgDZVZG4GabS3' ? 'yearly' : 'monthly',
              stripe_subscription_id: subscriptionData.id,
              job_post_limit: planDetails.limit,
              job_posts_used: 0,
              next_renewal_date: new Date(currentPeriodEnd * 1000).toISOString(),
              subscription_status: 'active'
            })
            .eq('id', organizationId)

          console.log('Created employer subscription:', { organizationId, tier: planDetails.tier })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription: any = event.data.object
        const status = subscription.status
        const currentPeriodEnd = subscription.current_period_end || Math.floor(Date.now() / 1000) + 2592000

        // Update organization subscription status
        await supabase
          .from('organizations')
          .update({
            subscription_status: status,
            next_renewal_date: new Date(currentPeriodEnd * 1000).toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)

        // Legacy profile subscription update
        await supabase
          .from('profiles')
          .update({
            plan: status === 'active' ? 'pro' : 'free',
            stripe_subscription_status: status,
          })
          .eq('stripe_customer_id', subscription.customer as string)

        console.log('Updated subscription status:', subscription.id, status)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        // Check if this is an employer subscription
        const { data: org } = await supabase
          .from('organizations')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (org) {
          await supabase
            .from('organizations')
            .update({
              subscription_tier: 'free',
              subscription_status: 'canceled',
              job_post_limit: 0,
              stripe_subscription_id: null
            })
            .eq('id', org.id)

          console.log('Employer subscription canceled:', subscription.id)
        }

        // Check if this is a promotion subscription
        const professionalId = subscription.metadata?.professional_id
        if (professionalId) {
          await supabase
            .from('professional_promotions')
            .update({ is_active: false })
            .eq('stripe_subscription_id', subscription.id)
            .eq('professional_id', professionalId)

          console.log('Promotion subscription canceled:', subscription.id)
        }

        // Legacy Pro subscription cancellation
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

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice

        // Reset monthly job post usage on successful renewal
        if (invoice.billing_reason === 'subscription_cycle') {
          const { data: org } = await supabase
            .from('organizations')
            .select('id')
            .eq('stripe_customer_id', invoice.customer as string)
            .single()

          if (org) {
            await supabase
              .from('organizations')
              .update({ job_posts_used: 0 })
              .eq('id', org.id)

            console.log('Reset job posts usage for org:', org.id)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        // Update subscription status
        await supabase
          .from('organizations')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_customer_id', invoice.customer as string)

        console.log('Payment failed for customer:', invoice.customer)

        // Send email notification
        if (invoice.customer_email) {
          if (!process.env.RESEND_API_KEY) {
            console.error('RESEND_API_KEY not configured; skipping payment failed email')
          } else {
            const resendClient = new Resend(process.env.RESEND_API_KEY);
            await resendClient.emails.send({
              from: 'no-reply@proofstack.com',
              to: invoice.customer_email,
              subject: 'Payment Failed',
              html: `<p>Dear Customer,</p><p>Your recent payment attempt failed. Please update your payment details to avoid service interruptions.</p>`
            })
          }
        }
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
