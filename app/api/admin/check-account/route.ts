import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get user from auth
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users.users.find(u => u.email === email);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_uid', user.id)
      .single();

    // Get organization if employer
    let organization = null;
    if (profile?.user_type === 'employer') {
      const { data: orgs } = await supabase
        .from('organizations')
        .select('*')
        .eq('created_by', user.id);
      organization = orgs?.[0];
    }

    return NextResponse.json({
      auth_user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        email_confirmed_at: user.email_confirmed_at
      },
      profile,
      organization
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, action } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get user
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users.users.find(u => u.email === email);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'make_employer') {
      // Update profile to employer
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          user_type: 'employer',
          role: 'employer',
          updated_at: new Date().toISOString()
        })
        .eq('auth_uid', user.id);

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 500 });
      }

      return NextResponse.json({ message: 'Updated to employer', user_id: user.id });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
