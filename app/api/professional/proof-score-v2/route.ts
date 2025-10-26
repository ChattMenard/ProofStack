import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const professionalId = searchParams.get('professional_id');

    if (!professionalId) {
      return NextResponse.json(
        { error: 'professional_id is required' },
        { status: 400 }
      );
    }

    // Fetch ProofScore V2 data from professional_ratings
    const { data, error } = await supabase
      .from('professional_ratings')
      .select('proof_score, proof_score_breakdown')
      .eq('professional_id', professionalId)
      .single();

    if (error) {
      console.error('Error fetching ProofScore V2:', error);
      return NextResponse.json(
        { error: 'Failed to fetch ProofScore' },
        { status: 500 }
      );
    }

    // If no ratings exist yet, calculate from profile
    if (!data) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('profile_quality_score')
        .eq('id', professionalId)
        .single();

      const profileQuality = profileData?.profile_quality_score || 0;

      return NextResponse.json({
        proof_score: profileQuality * 3, // Max 30 points for new users
        breakdown: {
          communication_quality: {
            total: profileQuality * 3,
            profile_quality: profileQuality,
            message_quality: 0,
            response_speed: 0
          },
          historical_performance: {
            total: 0,
            average_rating: 0,
            delivery_rate: 0,
            completion_rate: 0
          },
          work_quality: {
            total: 0,
            task_correctness: 0,
            employer_satisfaction: 0,
            revisions_score: 0,
            hire_again_score: 0
          },
          total_projects: 0
        }
      });
    }

    return NextResponse.json({
      proof_score: data.proof_score,
      breakdown: data.proof_score_breakdown
    });

  } catch (error) {
    console.error('Error in proof-score-v2 API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
