import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendNewReviewEmail } from '@/lib/email/notifications';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      employer_id,
      professional_id,
      rating,
      review_text,
      would_hire_again,
      position_title,
      work_start_date,
      work_end_date,
      skills_demonstrated
    } = body;

    // Validation
    if (!employer_id || !professional_id) {
      return NextResponse.json(
        { error: 'Employer ID and Professional ID are required' },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    if (!review_text || review_text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Review text is required' },
        { status: 400 }
      );
    }

    if (review_text.length > 500) {
      return NextResponse.json(
        { error: 'Review text must be 500 characters or less' },
        { status: 400 }
      );
    }

    if (!position_title || position_title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Position title is required' },
        { status: 400 }
      );
    }

    // Verify employer exists and has employer role
    const { data: employer, error: employerError } = await supabase
      .from('profiles')
      .select('id, user_type')
      .eq('id', employer_id)
      .single();

    if (employerError || !employer) {
      return NextResponse.json(
        { error: 'Employer not found' },
        { status: 404 }
      );
    }

    if (employer.user_type !== 'employer') {
      return NextResponse.json(
        { error: 'Only employers can leave reviews' },
        { status: 403 }
      );
    }

    // Verify professional exists
    const { data: professional, error: professionalError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', professional_id)
      .single();

    if (professionalError || !professional) {
      return NextResponse.json(
        { error: 'Professional not found' },
        { status: 404 }
      );
    }

    // Check if review already exists
    const { data: existingReview } = await supabase
      .from('employer_reviews')
      .select('id')
      .eq('employer_id', employer_id)
      .eq('professional_id', professional_id)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this professional. You can edit your existing review.' },
        { status: 409 }
      );
    }

    // Insert review
    const { data: review, error: reviewError } = await supabase
      .from('employer_reviews')
      .insert({
        employer_id,
        professional_id,
        rating,
        review_text: review_text.trim(),
        would_hire_again: would_hire_again || false,
        position_title: position_title.trim(),
        work_start_date: work_start_date || null,
        work_end_date: work_end_date || null,
        skills_demonstrated: skills_demonstrated || []
      })
      .select()
      .single();

    if (reviewError) {
      console.error('Review insert error:', reviewError);
      return NextResponse.json(
        { error: 'Failed to create review' },
        { status: 500 }
      );
    }

    // Update professional_ratings aggregate
    await updateProfessionalRatings(professional_id);

    // Send email notification to professional (fire and forget)
    sendReviewEmailNotification(professional_id, employer_id, rating, review_text.trim())
      .catch((err: any) => console.error('Failed to send review notification:', err));

    return NextResponse.json({
      success: true,
      review
    });
  } catch (error: any) {
    console.error('Review creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

async function updateProfessionalRatings(professionalId: string) {
  try {
    // Get all reviews for this professional
    const { data: reviews, error: reviewsError } = await supabase
      .from('employer_reviews')
      .select('rating, would_hire_again')
      .eq('professional_id', professionalId);

    if (reviewsError || !reviews || reviews.length === 0) {
      return;
    }

    // Calculate aggregates
    const totalReviews = reviews.length;
    const averageRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews;
    const wouldHireAgainCount = reviews.filter((r: any) => r.would_hire_again).length;
    const wouldHireAgainPercentage = (wouldHireAgainCount / totalReviews) * 100;

    // Count ratings by star
    const ratingCounts = {
      '5': reviews.filter((r: any) => r.rating === 5).length,
      '4': reviews.filter((r: any) => r.rating === 4).length,
      '3': reviews.filter((r: any) => r.rating === 3).length,
      '2': reviews.filter((r: any) => r.rating === 2).length,
      '1': reviews.filter((r: any) => r.rating === 1).length
    };

    // Upsert professional_ratings
    const { error: upsertError } = await supabase
      .from('professional_ratings')
      .upsert({
        professional_id: professionalId,
        average_rating: parseFloat(averageRating.toFixed(2)),
        total_reviews: totalReviews,
        rating_5_count: ratingCounts['5'],
        rating_4_count: ratingCounts['4'],
        rating_3_count: ratingCounts['3'],
        rating_2_count: ratingCounts['2'],
        rating_1_count: ratingCounts['1'],
        would_hire_again_percentage: parseFloat(wouldHireAgainPercentage.toFixed(2))
      }, {
        onConflict: 'professional_id'
      });

    if (upsertError) {
      console.error('Ratings update error:', upsertError);
    }
  } catch (error) {
    console.error('Failed to update professional ratings:', error);
  }
}

async function sendReviewEmailNotification(
  professionalId: string, 
  employerId: string, 
  rating: number, 
  reviewText: string
) {
  try {
    // Get professional details
    const { data: professional } = await supabase
      .from('profiles')
      .select('email, full_name, username')
      .eq('id', professionalId)
      .single();

    if (!professional || !professional.email) {
      return;
    }

    // Get employer details
    const { data: employerProfile } = await supabase
      .from('profiles')
      .select('username, full_name')
      .eq('id', employerId)
      .single();

    if (!employerProfile) {
      return;
    }

    // Get organization name if employer has one
    const { data: org } = await supabase
      .from('employer_organizations')
      .select('company_name')
      .eq('employer_id', employerId)
      .single();

    const employerName = org?.company_name || 
                        employerProfile.full_name || 
                        employerProfile.username || 
                        'An employer';

    const reviewPreview = reviewText.length > 150 
      ? reviewText.substring(0, 150) + '...' 
      : reviewText;

    await sendNewReviewEmail(professional.email, {
      professionalName: professional.full_name || professional.username || 'User',
      employerName,
      rating,
      reviewPreview,
      professionalUsername: professional.username || professionalId
    });
  } catch (error) {
    console.error('Error sending review email:', error);
  }
}
