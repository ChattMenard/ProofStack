import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyName, industry, companySize, website, role, email, password } = body;

    // Validation
    if (!companyName || !industry || !companySize || !role || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Use guarded supabaseServer instance
    const supabase = supabaseServer;

    // 1. Create user account with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Set to true if you want to require email verification
      user_metadata: {
        user_type: 'employer',
        role: role
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: authError.message || 'Failed to create user account' },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // Wait a moment for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get the profile ID (which is different from auth user ID)
    const { data: profileData, error: profileLookupError } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_uid', userId)
      .single();

    if (profileLookupError || !profileData) {
      console.error('Profile lookup error:', profileLookupError);
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    const profileId = profileData.id;

    // 2. Create organization slug from company name
    const slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Math.random().toString(36).substring(2, 6);

    // 3. Create organization record
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: companyName,
        slug: slug,
        industry: industry,
        company_size: companySize,
        website: website || null,
        created_by: profileId,
        subscription_tier: 'free'
      })
      .select()
      .single();

    if (orgError) {
      console.error('Organization creation error:', orgError);
      // Rollback: Delete the user if org creation fails
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Failed to create organization' },
        { status: 500 }
      );
    }

    // 4. Create organization member record (owner role)
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: orgData.id,
        user_id: profileId,
        role: 'owner',
        joined_at: new Date().toISOString(),
        is_active: true
      });

    if (memberError) {
      console.error('Member creation error:', memberError);
      // Rollback: Delete org and user
      await supabase.from('organizations').delete().eq('id', orgData.id);
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Failed to create organization membership' },
        { status: 500 }
      );
    }

    // 5. Update user's profile with organization_id and user_type
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        user_type: 'employer',
        organization_id: orgData.id
      })
      .eq('id', profileId);

    if (profileError) {
      console.error('Profile update error:', profileError);
      // Note: Don't rollback here as this is less critical
      // The user can still function without this update
    }

    // 6. Send verification email (if enabled)
    // You can enable this by setting email_confirm: true above
    // await supabase.auth.admin.generateLink({
    //   type: 'signup',
    //   email: email
    // });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      data: {
        userId: userId,
        organizationId: orgData.id,
        organizationSlug: slug
      }
    });

  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
