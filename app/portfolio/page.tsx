import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabaseServerClient';

export default async function PortfolioRedirectPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Not logged in, redirect to dashboard
    redirect('/dashboard');
  }

  // Redirect to user's portfolio using their email
  redirect(`/portfolio/${encodeURIComponent(user.email || '')}`);
}
