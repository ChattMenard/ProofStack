import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPromotionExpiringEmail } from '@/lib/email/notifications';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate 7 days from now
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const eightDaysFromNow = new Date();
    eightDaysFromNow.setDate(eightDaysFromNow.getDate() + 8);

    // Find active promotions expiring in 7 days that haven't been notified yet
    const { data: expiringPromotions, error } = await supabase
      .from('professional_promotions')
      .select(`
        id,
        professional_id,
        tier,
        expires_at,
        expiry_notified,
        profiles!professional_id (
          id,
          email,
          full_name,
          username
        )
      `)
      .eq('is_active', true)
      .gte('expires_at', sevenDaysFromNow.toISOString())
      .lt('expires_at', eightDaysFromNow.toISOString())
      .or('expiry_notified.is.null,expiry_notified.eq.false');

    if (error) {
      console.error('Error fetching expiring promotions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch expiring promotions' },
        { status: 500 }
      );
    }

    if (!expiringPromotions || expiringPromotions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expiring promotions to notify',
        count: 0
      });
    }

    let notifiedCount = 0;
    let failedCount = 0;

    // Send email to each professional
    for (const promotion of expiringPromotions) {
      const profile = promotion.profiles as any;
      
      if (!profile || !profile.email) {
        console.log(`No email for professional ${promotion.professional_id}`);
        failedCount++;
        continue;
      }

      const expiresAt = new Date(promotion.expires_at);
      const now = new Date();
      const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      try {
        await sendPromotionExpiringEmail(profile.email, {
          professionalName: profile.full_name || profile.username || 'User',
          tier: promotion.tier,
          expiresAt: promotion.expires_at,
          daysRemaining
        });

        // Mark as notified
        await supabase
          .from('professional_promotions')
          .update({ expiry_notified: true })
          .eq('id', promotion.id);

        notifiedCount++;
      } catch (emailError) {
        console.error(`Failed to send email to ${profile.email}:`, emailError);
        failedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${expiringPromotions.length} expiring promotions`,
      notified: notifiedCount,
      failed: failedCount
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
