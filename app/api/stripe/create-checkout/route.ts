import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseServer } from '@/lib/supabaseServer';

async function handler(req: NextRequest) {
  try {
    const { priceId, planType, successUrl, cancelUrl } = await req.json();

    // Get current user
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseServer
      .from('profiles')
      .select('id, email, organization_id, organizations(stripe_customer_id)')
      .eq('auth_uid', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get or create Stripe customer
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe not configured (missing STRIPE_SECRET_KEY)' }, { status: 500 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-09-30.clover' });

    let customerId = (profile.organizations as any)?.stripe_customer_id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        metadata: {
          profile_id: profile.id,
          organization_id: profile.organization_id || ''
        }
      });
      customerId = customer.id;

      // Save customer ID to organization
      if (profile.organization_id) {
        await supabaseServer
          .from('organizations')
          .update({ stripe_customer_id: customerId })
          .eq('id', profile.organization_id);
      }
    }

    // Determine session mode (subscription vs one-time payment)
    const mode: Stripe.Checkout.SessionCreateParams.Mode = planType === 'boost' ? 'subscription' : 'subscription';

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        profile_id: profile.id,
        organization_id: profile.organization_id || '',
        plan_type: planType
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      automatic_tax: {
        enabled: true
      }
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error: any) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

export const POST = handler;
