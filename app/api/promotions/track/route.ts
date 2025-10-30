import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

const supabase = supabaseServer;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { professional_id, action } = body;

    // Validation
    if (!professional_id || !action) {
      return NextResponse.json(
        { error: 'Professional ID and action are required' },
        { status: 400 }
      );
    }

    if (!['view', 'save', 'message'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: view, save, or message' },
        { status: 400 }
      );
    }

    // Find active promotion for this professional
    const { data: promotion, error: promotionError } = await supabase
      .from('professional_promotions')
      .select('id')
      .eq('professional_id', professional_id)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .single();

    // If no active promotion, just return success (no tracking needed)
    if (promotionError || !promotion) {
      return NextResponse.json({ success: true, tracked: false });
    }

    // Increment the appropriate counter
    const columnMap = {
      view: 'views_count',
      save: 'saves_count',
      message: 'messages_count'
    };

    const column = columnMap[action as keyof typeof columnMap];

    const { error: updateError } = await supabase.rpc('increment_promotion_metric', {
      promotion_id: promotion.id,
      metric_column: column
    });

    // If RPC doesn't exist, fall back to manual increment
    if (updateError) {
      const { data: currentPromotion } = await supabase
        .from('professional_promotions')
        .select(column)
        .eq('id', promotion.id)
        .single();

      if (currentPromotion) {
        await supabase
          .from('professional_promotions')
          .update({
            [column]: ((currentPromotion as any)[column] || 0) + 1
          })
          .eq('id', promotion.id);
      }
    }

    return NextResponse.json({
      success: true,
      tracked: true,
      action
    });
  } catch (error: any) {
    console.error('Promotion tracking error:', error);
    // Don't fail the request if tracking fails
    return NextResponse.json({
      success: true,
      tracked: false,
      error: error.message
    });
  }
}
