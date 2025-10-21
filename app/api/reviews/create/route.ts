import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendNewReviewEmail } from '@/lib/email/notifications';
import { validateWorkSampleSecurity } from '@/lib/security/secretDetection';

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
      skills_demonstrated,
      // Work sample fields (optional)
      work_sample,
      sample_title,
      sample_description,
      sample_type,
      sample_language,
      confidentiality_level
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

    // Validate work sample if provided
    if (work_sample) {
      if (work_sample.length < 500 || work_sample.length > 2000) {
        return NextResponse.json(
          { error: 'Work sample must be between 500 and 2000 characters' },
          { status: 400 }
        );
      }

      if (!sample_type || !['code', 'writing', 'design_doc', 'technical_spec'].includes(sample_type)) {
        return NextResponse.json(
          { error: 'Invalid work sample type' },
          { status: 400 }
        );
      }

      if (!confidentiality_level || !['public', 'encrypted', 'redacted'].includes(confidentiality_level)) {
        return NextResponse.json(
          { error: 'Invalid confidentiality level' },
          { status: 400 }
        );
      }

      // SECURITY: Check for secrets in work sample
      const securityValidation = await validateWorkSampleSecurity(work_sample);
      
      if (!securityValidation.safe) {
        console.error('Secret detection blocked work sample:', {
          employer_id,
          professional_id,
          errors: securityValidation.errors
        });
        
        return NextResponse.json(
          { 
            error: 'Work sample contains sensitive information that cannot be stored',
            details: securityValidation.errors,
            type: 'security_validation_failed'
          },
          { status: 400 }
        );
      }

      // Log warnings but allow submission
      if (securityValidation.warnings && securityValidation.warnings.length > 0) {
        console.warn('Work sample security warnings:', {
          employer_id,
          professional_id,
          warnings: securityValidation.warnings
        });
      }
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

    // Insert work sample if provided
    let workSampleId = null;
    if (work_sample && work_sample.length >= 500) {
      const { data: sampleData, error: sampleError } = await supabase
        .from('work_samples')
        .insert({
          professional_id,
          employer_id,
          review_id: review.id,
          content: work_sample.trim(),
          content_type: sample_type || 'code',
          language: sample_language || null,
          title: sample_title?.trim() || null,
          description: sample_description?.trim() || null,
          project_context: sample_description?.trim() || null,
          confidentiality_level: confidentiality_level || 'public',
          verified: false // Will be verified after AI analysis
        })
        .select('id')
        .single();

      if (sampleError) {
        console.error('Work sample insert error:', sampleError);
        // Don't fail the review creation if work sample fails
      } else if (sampleData) {
        workSampleId = sampleData.id;

        // Trigger AI analysis in background (fire and forget)
        fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/work-samples/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ work_sample_id: sampleData.id })
        }).catch((err: any) => console.error('Failed to trigger work sample analysis:', err));
      }
    }

    // Send email notification to professional (fire and forget)
    sendReviewEmailNotification(professional_id, employer_id, rating, review_text.trim())
      .catch((err: any) => console.error('Failed to send review notification:', err));

    return NextResponse.json({
      success: true,
      review,
      work_sample_id: workSampleId
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

    // Upsert professional_ratings using current DB column names
    const { error: upsertError } = await supabase
      .from('professional_ratings')
      .upsert({
        professional_id: professionalId,
        average_rating: parseFloat(averageRating.toFixed(2)),
        total_reviews: totalReviews,
        five_star_count: ratingCounts['5'],
        four_star_count: ratingCounts['4'],
        three_star_count: ratingCounts['3'],
        two_star_count: ratingCounts['2'],
        one_star_count: ratingCounts['1'],
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

    // Resolve employer organization name using the new 'organizations' table.
    let employerName: string | null = null;

    // First, check if employer created an organization
    const { data: orgByCreator } = await supabase
      .from('organizations')
      .select('name')
      .eq('created_by', employerId)
      .single();

    if (orgByCreator?.name) {
      employerName = orgByCreator.name;
    } else {
      // Otherwise, check organization membership
      const { data: memberRecord } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', employerId)
        .single();

      if (memberRecord?.organization_id) {
        const { data: orgByMember } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', memberRecord.organization_id)
          .single();
        employerName = orgByMember?.name || null;
      }
    }

    const resolvedEmployerName = employerName ||
      employerProfile.full_name ||
      employerProfile.username ||
      'An employer';

    const reviewPreview = reviewText.length > 150 
      ? reviewText.substring(0, 150) + '...' 
      : reviewText;

    await sendNewReviewEmail(professional.email, {
      professionalName: professional.full_name || professional.username || 'User',
      employerName: resolvedEmployerName,
      rating,
      reviewPreview,
      professionalUsername: professional.username || professionalId
    });
  } catch (error) {
    console.error('Error sending review email:', error);
  }
}
