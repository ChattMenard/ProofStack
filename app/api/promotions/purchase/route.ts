import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseServer } from '@/lib/supabaseServer';

const supabase = supabaseServer;

const tierPrices = {
  standard: 19,
  premium: 49,
  featured: 99
};

const tierNames = {
  standard: 'Standard Promotion',
  premium: 'Premium Promotion',
  featured: 'Featured Promotion'
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { professional_id, tier } = body;

    // Validation
    if (!professional_id || !tier) {
      return NextResponse.json(
        { error: 'Professional ID and tier are required' },
        { status: 400 }
      );
    }

    if (!['standard', 'premium', 'featured'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be: standard, premium, or featured' },
        { status: 400 }
      );
    }

    // Verify professional exists and is actually a professional (not employer)
    const { data: professional, error: professionalError } = await supabase
      .from('profiles')
      .select('id, email, username, full_name, user_type')
      .eq('id', professional_id)
      .single();

    if (professionalError || !professional) {
      return NextResponse.json(
        { error: 'Professional not found' },
        { status: 404 }
      );
    }

    // ENFORCEMENT: Only professionals (talent) can purchase portfolio boosts
    // Employers purchase subscriptions separately
    if (professional.user_type !== 'professional') {
      return NextResponse.json(
        { error: 'Only professionals can purchase portfolio boosts. Employers should purchase subscriptions.' },
        { status: 403 }
      );
    }

    // Check for existing active promotion
    const { data: existingPromotion } = await supabase
      .from('professional_promotions')
      .select('*')
      .eq('professional_id', professional_id)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (existingPromotion) {
      return NextResponse.json(
        { error: 'You already have an active promotion. Please cancel it first or wait for it to expire.' },
        { status: 409 }
      );
    }

    // Create Stripe Checkout Session (lazy initialize Stripe client)
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe not configured (missing STRIPE_SECRET_KEY)' }, { status: 500 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-09-30.clover' });

    const price = tierPrices[tier as keyof typeof tierPrices];
    const tierName = tierNames[tier as keyof typeof tierNames];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: tierName,
              description: `Monthly subscription for ${tierName} on ProofStack`,
              images: ['https://proofstack.com/logo.png']
            },
            recurring: {
              interval: 'month'
            },
            unit_amount: price * 100 // Stripe uses cents
          },
          quantity: 1
        }
      ],
      customer_email: professional.email,
      metadata: {
        professional_id: professional_id,
        tier: tier,
        type: 'promotion_purchase'
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/professional/promote/manage?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/professional/promote?canceled=true`,
      subscription_data: {
        metadata: {
          professional_id: professional_id,
          tier: tier
        }
      }
    });

    return NextResponse.json({
      url: session.url,
      session_id: session.id
    });
  } catch (error: any) {
    console.error('Promotion purchase error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
