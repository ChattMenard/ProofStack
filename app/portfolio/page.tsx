import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabaseServerClient';

export default async function PortfolioRedirectPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Not logged in, redirect to dashboard
    redirect('/dashboard');
  }

  // Prefer username/handle when available; fallback to email
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_uid', user.id)
      .single();

    const slug = (profile as any)?.username || user.email || '';
    redirect(`/portfolio/${encodeURIComponent(slug)}`);
  } catch {
    // If anything goes wrong, fall back to email
    redirect(`/portfolio/${encodeURIComponent(user.email || '')}`);
  }
}
