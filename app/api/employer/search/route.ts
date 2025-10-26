import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withRateLimit } from '@/lib/security/rateLimiting';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // SECURITY: Rate limiting to prevent scraping
    const getUserId = async () => {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    };
    
    const rateLimitResponse = await withRateLimit(request, 'apiGeneral', getUserId);
    if (rateLimitResponse) {
      return rateLimitResponse; // Rate limit exceeded (100 requests/min)
    }

    const filters = await request.json();
    const {
      skills = [],
      minExperience = 0,
      maxExperience = 20,
      location = '',
      minRating = 0,
      remoteOnly = false,
      availability = '',
      proMembersOnly = false
    } = filters;

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Build the query
    let query = supabase
      .from('profiles')
      .select(`
        id,
        username,
        headline,
        location,
        years_experience,
        remote_available,
        availability_status,
        is_pro,
        skills,
        user_type,
        professional_ratings (
          average_rating,
          total_reviews
        )
      `)
      .eq('user_type', 'professional');

    // Apply filters
    if (minExperience > 0) {
      query = query.gte('years_experience', minExperience);
    }

    if (maxExperience < 20) {
      query = query.lte('years_experience', maxExperience);
    }

    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    if (remoteOnly) {
      query = query.eq('remote_available', true);
    }

    if (availability) {
      query = query.eq('availability_status', availability);
    }

    if (proMembersOnly) {
      query = query.eq('is_pro', true);
    }

    // Execute query
    const { data: profiles, error: profilesError } = await query;

    if (profilesError) {
      console.error('Profiles query error:', profilesError);
      return NextResponse.json({ error: 'Failed to fetch professionals' }, { status: 500 });
    }

    // Get active promotions for all professionals
    const { data: promotions } = await supabase
      .from('professional_promotions')
      .select('professional_id, tier')
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .lte('starts_at', new Date().toISOString());

    // Create promotion map
    const promotionMap = new Map();
    if (promotions) {
      promotions.forEach((promo: any) => {
        promotionMap.set(promo.professional_id, promo.tier);
      });
    }

    // Enrich profiles with promotion data and apply filters
    let enrichedProfiles = profiles.map((profile: any) => ({
      ...profile,
      promotion_tier: promotionMap.get(profile.id),
      average_rating: profile.professional_ratings?.[0]?.average_rating || null,
      total_reviews: profile.professional_ratings?.[0]?.total_reviews || 0
    }));

    // Filter by skills (if any)
    if (skills.length > 0) {
      enrichedProfiles = enrichedProfiles.filter((profile: any) => {
        if (!profile.skills || !Array.isArray(profile.skills)) return false;
        return skills.some((skill: string) =>
          profile.skills.some((pSkill: string) =>
            pSkill.toLowerCase().includes(skill.toLowerCase())
          )
        );
      });
    }

    // Filter by minimum rating
    if (minRating > 0) {
      enrichedProfiles = enrichedProfiles.filter((profile: any) => {
        return profile.average_rating && profile.average_rating >= minRating;
      });
    }

    // Sort by promotion tier (FEATURED > PREMIUM > STANDARD > ORGANIC)
    // Then by rating, then by experience
    enrichedProfiles.sort((a: any, b: any) => {
      // Priority scoring
      const tierPriority: { [key: string]: number } = {
        featured: 4,
        premium: 3,
        standard: 2
      };

      const aPriority = tierPriority[a.promotion_tier] || 1;
      const bPriority = tierPriority[b.promotion_tier] || 1;

      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }

      // If same tier, sort by rating
      const aRating = a.average_rating || 0;
      const bRating = b.average_rating || 0;

      if (aRating !== bRating) {
        return bRating - aRating; // Higher rating first
      }

      // If same rating, sort by experience
      return (b.years_experience || 0) - (a.years_experience || 0);
    });

    // Log search for analytics
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        await supabase.from('search_history').insert({
          employer_id: user.id,
          query: '',
          filters: filters,
          results_count: enrichedProfiles.length
        });
      }
    }

    return NextResponse.json({
      success: true,
      professionals: enrichedProfiles,
      total: enrichedProfiles.length
    });

  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
