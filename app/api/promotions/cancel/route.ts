import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseServer } from '@/lib/supabaseServer';

const supabase = supabaseServer;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { promotion_id, stripe_subscription_id } = body;

    // Validation
    if (!promotion_id || !stripe_subscription_id) {
      return NextResponse.json(
        { error: 'Promotion ID and Stripe subscription ID are required' },
        { status: 400 }
      );
    }

    // Verify promotion exists and is active
    const { data: promotion, error: promotionError } = await supabase
      .from('professional_promotions')
      .select('*')
      .eq('id', promotion_id)
      .eq('is_active', true)
      .single();

    if (promotionError || !promotion) {
      return NextResponse.json(
        { error: 'Active promotion not found' },
        { status: 404 }
      );
    }

    // Cancel Stripe subscription (lazy-initialize Stripe client and guard missing key)
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Stripe secret key missing; cannot cancel subscription in Stripe')
    } else {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-09-30.clover' });
      try {
        await stripe.subscriptions.cancel(stripe_subscription_id);
        console.log('Stripe subscription canceled:', stripe_subscription_id);
      } catch (stripeError: any) {
        console.error('Stripe cancellation error:', stripeError);
        // If subscription doesn't exist in Stripe (already canceled), continue
        if (stripeError.code !== 'resource_missing') {
          throw stripeError;
        }
      }
    }

    // Mark promotion as inactive
    const { error: updateError } = await supabase
      .from('professional_promotions')
      .update({ is_active: false })
      .eq('id', promotion_id);

    if (updateError) {
      console.error('Promotion update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update promotion status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Promotion canceled successfully. It will remain active until the end of your billing period.'
    });
  } catch (error: any) {
    console.error('Promotion cancellation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
