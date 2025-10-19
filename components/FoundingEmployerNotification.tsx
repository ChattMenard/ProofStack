'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function FoundingEmployerNotification() {
  const [user, setUser] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [eligibility, setEligibility] = useState<any>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setUser(user);

    // Get organization
    const { data: orgData } = await supabase
      .from('organizations')
      .select('*')
      .eq('employer_id', user.id)
      .single();

    if (orgData) {
      setOrganization(orgData);

      // Don't show if already founding employer
      if (orgData.is_founding_employer) {
        return;
      }

      // Check eligibility
      const { data: eligData, error } = await supabase
        .rpc('check_founding_employer_eligibility', { employer_org_id: orgData.id });

      if (!error && eligData) {
        setEligibility(eligData);
        
        // Show notification if they qualify
        if (eligData.qualifies) {
          setShowNotification(true);
        }
      }
    }
  };

  const handleClaim = async () => {
    if (!organization) return;

    setClaiming(true);

    try {
      const { data, error } = await supabase
        .rpc('grant_founding_employer_status', { employer_org_id: organization.id });

      if (error) throw error;

      if (data) {
        // Success! Reload page to show founding status
        window.location.reload();
      } else {
        alert('Unable to claim founding status. Please contact support.');
      }
    } catch (error) {
      console.error('Error claiming founding status:', error);
      alert('Error claiming founding status');
    } finally {
      setClaiming(false);
    }
  };

  if (!showNotification || !eligibility?.qualifies) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-bounce">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-2xl p-6 border-4 border-amber-300">
        <button
          onClick={() => setShowNotification(false)}
          className="absolute top-2 right-2 text-white hover:text-amber-100"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center animate-pulse">
              <span className="text-4xl">🏆</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">
              🎉 You Qualify for Founding Employer Status!
            </h3>
            <p className="text-amber-50 mb-4">
              You've completed work and posted a review! Be one of the first 10 founding employers to get:
            </p>
            <ul className="text-amber-50 space-y-1 mb-4 text-sm">
              <li>✅ 1 Month Pro Tier FREE</li>
              <li>✅ Lifetime Founding Badge</li>
              <li>✅ Priority Support</li>
              <li>✅ Founding Member #{eligibility.spots_remaining > 0 ? (11 - eligibility.spots_remaining) : '?'}</li>
            </ul>
            <p className="text-xs text-amber-100 mb-4">
              ⚡ Only {eligibility.spots_remaining} spot{eligibility.spots_remaining !== 1 ? 's' : ''} remaining!
            </p>
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="w-full bg-white text-orange-600 font-bold py-3 px-6 rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {claiming ? 'Claiming...' : 'Claim Your Spot! 🚀'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
