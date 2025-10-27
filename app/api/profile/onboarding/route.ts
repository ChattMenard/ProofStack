import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    const { profileId, completed } = await req.json();

    if (!profileId) {
      return NextResponse.json({ error: 'profileId required' }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from('profiles')
      .update({
        onboarding_completed: completed,
        onboarding_completed_at: completed ? new Date().toISOString() : null
      })
      .eq('id', profileId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Onboarding update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update onboarding status' },
      { status: 500 }
    );
  }
}
