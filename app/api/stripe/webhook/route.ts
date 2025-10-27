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
        const planType = session.metadata?.plan_type
        const organizationId = session.metadata?.organization_id
        const professionalId = session.metadata?.professional_id

        // Handle employer job posting subscriptions
        if (planType === 'job_post' && organizationId) {
          const subscriptionData: any = await stripe.subscriptions.retrieve(session.subscription as string)
          const priceId = subscriptionData.items.data[0].price.id
          const currentPeriodEnd = subscriptionData.current_period_end || Math.floor(Date.now() / 1000) + 2592000 // 30 days fallback

          // Map price IDs to plans
          const planMapping: Record<string, { tier: string; limit: number; price: number }> = {
            'price_basic_job_post': { tier: 'basic', limit: 1, price: 249 },
            'price_professional_job_post': { tier: 'professional', limit: 10, price: 949 },
            'price_enterprise_job_post': { tier: 'enterprise', limit: -1, price: 2499 }
          }

          const planDetails = planMapping[priceId] || { tier: 'basic', limit: 1, price: 249 }

          await supabase
            .from('organizations')
            .update({
              subscription_tier: planDetails.tier,
              subscription_price: planDetails.price,
              billing_cycle: priceId === 'price_enterprise_job_post' ? 'yearly' : 'monthly',
              stripe_subscription_id: subscriptionData.id,
              job_post_limit: planDetails.limit,
              job_posts_used: 0,
              next_renewal_date: new Date(currentPeriodEnd * 1000).toISOString(),
              subscription_status: 'active'
            })
            .eq('id', organizationId)

          console.log('Created employer subscription:', { organizationId, tier: planDetails.tier })
        }

        // Handle portfolio boost subscriptions
        if (planType === 'boost' && professionalId) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          const priceId = subscription.items.data[0].price.id

          const tierMapping: Record<string, string> = {
            'price_boost_standard': 'standard',
            'price_boost_premium': 'premium',
            'price_boost_featured': 'featured'
          }

          const tier = tierMapping[priceId] || 'standard'
          const startsAt = new Date()
          const expiresAt = new Date()
          expiresAt.setMonth(expiresAt.getMonth() + 1)

          await supabase
            .from('professional_promotions')
            .insert({
              professional_id: professionalId,
              tier: tier,
              starts_at: startsAt.toISOString(),
              expires_at: expiresAt.toISOString(),
              is_active: true,
              stripe_subscription_id: subscription.id,
              billing_cycle: 'monthly',
              views_count: 0,
              saves_count: 0,
              messages_count: 0
            })

          console.log('Created portfolio boost:', { professionalId, tier })
        }

        // Legacy promotion handling (backwards compatibility)
        if (session.metadata?.type === 'promotion_purchase') {
          const professionalIdLegacy = session.metadata.professional_id
          const tier = session.metadata.tier

          if (professionalIdLegacy && tier) {
            const startsAt = new Date()
            const expiresAt = new Date()
            expiresAt.setMonth(expiresAt.getMonth() + 1)

            await supabase
              .from('professional_promotions')
              .insert({
                professional_id: professionalIdLegacy,
                tier: tier,
                starts_at: startsAt.toISOString(),
                expires_at: expiresAt.toISOString(),
                is_active: true,
                stripe_subscription_id: session.subscription as string,
                views_count: 0,
                saves_count: 0,
                messages_count: 0
              })

            console.log('Created legacy promotion:', { professionalIdLegacy, tier })
          }
        }
        
        // Original Pro subscription handling (backwards compatibility)
        const userId = session.metadata?.userId
        if (userId) {
          await supabase
            .from('profiles')
            .update({
              plan: 'pro',
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
            })
            .eq('auth_uid', userId)

          console.log('Upgraded user to Pro:', userId)
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
