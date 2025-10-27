'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import OnboardingFlow from '@/components/OnboardingFlow';

export default function OnboardingPage() {
  const router = useRouter();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboarding();
  }, []);

  async function checkOnboarding() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Get profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, onboarding_completed, user_type')
        .eq('auth_uid', user.id)
        .single();

      if (error || !profile) {
        router.push('/login');
        return;
      }

      // Only show onboarding for professionals who haven't completed it
      if (profile.user_type !== 'professional') {
        router.push('/dashboard');
        return;
      }

      if (profile.onboarding_completed) {
        router.push('/professional/dashboard');
        return;
      }

      setProfileId(profile.id);
    } catch (error) {
      console.error('Onboarding check error:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-950 via-forest-900 to-forest-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-sage-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!profileId) {
    return null;
  }

  return <OnboardingFlow profileId={profileId} />;
}
