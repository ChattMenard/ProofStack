import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabaseServerClient';

export default async function PortfolioRedirectPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Not logged in, redirect to dashboard
    redirect('/dashboard');
  }

  // Fetch user's username
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  if (profile?.username) {
    // Redirect to user's portfolio
    redirect(`/portfolio/${profile.username}`);
  } else {
    // No username set, redirect to dashboard
    redirect('/dashboard');
  }
}
