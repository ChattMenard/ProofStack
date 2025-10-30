'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import VerificationBadges from '@/components/VerificationBadges';

// use guarded browser supabase client from lib

export default function VerificationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [verifications, setVerifications] = useState<any>(null);

  const [githubUsername, setGithubUsername] = useState('');
  const [githubVerifying, setGithubVerifying] = useState(false);
  const [githubMessage, setGithubMessage] = useState('');

  const [linkedinVerifying, setLinkedinVerifying] = useState(false);
  const [linkedinMessage, setLinkedinMessage] = useState('');

  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  useEffect(() => {
    loadData();
    
    // Check for LinkedIn OAuth callback success/error
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('linkedin') === 'success') {
      setLinkedinMessage('✅ LinkedIn account verified successfully!');
      window.history.replaceState({}, '', '/professional/verify');
      loadData(); // Reload to show new badge
    } else if (urlParams.get('error')) {
      const error = urlParams.get('error');
      setLinkedinMessage(`❌ LinkedIn verification failed: ${error}`);
      window.history.replaceState({}, '', '/professional/verify');
    }
  }, []);

  const loadData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/login');
        return;
      }
      setUser(authUser);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_uid', authUser.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setGithubUsername(profileData.github_username || '');
        setLinkedinUrl(profileData.linkedin_url || '');
        setPortfolioUrl(profileData.website || '');
      }

      const { data: verificationData } = await supabase
        .from('profile_verifications')
        .select('*')
        .eq('profile_id', profileData?.id)
        .single();

      if (verificationData) {
        setVerifications(verificationData);
        setVerificationCode(verificationData.portfolio_verification_code || generateVerificationCode());
      } else {
        setVerificationCode(generateVerificationCode());
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateVerificationCode = () => {
    return `proofstack-verify-${Math.random().toString(36).substring(2, 15)}`;
  };

  const verifyGitHub = async () => {
    if (!githubUsername.trim()) {
      setGithubMessage('Please enter your GitHub username');
      return;
    }

    setGithubVerifying(true);
    setGithubMessage('');

    try {
      const response = await fetch('/api/verify/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for auth
        body: JSON.stringify({ 
          github_username: githubUsername.trim(),
          auth_uid: user.id 
        })
      });

      const data = await response.json();

      if (data.verified) {
        setGithubMessage(`✅ ${data.message}`);
        await loadData(); // Reload to show new badge
      } else {
        const errorMsg = data.details 
          ? `${data.error || data.message}: ${data.details}`
          : (data.message || data.error);
        setGithubMessage(`⚠️ ${errorMsg}`);
      }
    } catch (error) {
      setGithubMessage('❌ Failed to verify GitHub account');
      console.error('GitHub verification error:', error);
    } finally {
      setGithubVerifying(false);
    }
  };

  const verifyLinkedIn = async () => {
    if (!user) {
      setLinkedinMessage('Please log in first');
      return;
    }

    setLinkedinVerifying(true);
    setLinkedinMessage('');

    try {
      const response = await fetch('/api/verify/linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auth_uid: user.id })
      });

      const data = await response.json();

      if (data.auth_url) {
        // Redirect to LinkedIn OAuth
        window.location.href = data.auth_url;
      } else {
        setLinkedinMessage(`❌ ${data.error || 'Failed to initiate LinkedIn verification'}`);
        setLinkedinVerifying(false);
      }
    } catch (error) {
      setLinkedinMessage('❌ Failed to verify LinkedIn account');
      console.error('LinkedIn verification error:', error);
      setLinkedinVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Account Verification
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Verify your accounts to build trust and stand out to employers
          </p>
        </div>

        {/* Current Verifications */}
        {verifications && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Your Verifications
            </h2>
            <VerificationBadges 
              profileId={profile?.id} 
              size="large" 
              showLabels={true}
              layout="horizontal"
            />
            {(!verifications.github_verified && !verifications.linkedin_verified && !verifications.portfolio_verified) && (
              <p className="text-gray-500 dark:text-gray-400 mt-4">
                No verifications yet. Complete the steps below to get started.
              </p>
            )}
          </div>
        )}

        {/* GitHub Verification */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                GitHub Verification
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Verify your GitHub account and show recent commit activity
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                GitHub Username
              </label>
              <input
                type="text"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                placeholder="octocat"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            <button
              onClick={verifyGitHub}
              disabled={githubVerifying}
              className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {githubVerifying ? 'Verifying...' : 'Verify GitHub Account'}
            </button>

            {githubMessage && (
              <div className={`p-4 rounded-lg ${
                githubMessage.startsWith('✅') 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                  : githubMessage.startsWith('⚠️')
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
              }`}>
                {githubMessage}
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">How it works:</h3>
              <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                <li>• We check that your GitHub account exists</li>
                <li>• We verify you have commits in the last 6 months</li>
                <li>• Your commit history shows real development activity</li>
              </ul>
            </div>
          </div>
        </div>

        {/* LinkedIn Verification */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                LinkedIn Verification
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Connect your LinkedIn profile to verify professional identity
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {verifications?.linkedin_verified ? (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-800 dark:text-green-200">
                  ✅ LinkedIn account verified!
                </p>
                {verifications.linkedin_profile_url && (
                  <a 
                    href={verifications.linkedin_profile_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm mt-1 inline-block"
                  >
                    View Profile →
                  </a>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={verifyLinkedIn}
                  disabled={linkedinVerifying}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {linkedinVerifying ? 'Connecting...' : 'Connect LinkedIn Account'}
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  You'll be redirected to LinkedIn to authorize the connection
                </p>
              </>
            )}

            {linkedinMessage && (
              <div className={`p-3 rounded-lg ${
                linkedinMessage.includes('✅') 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                  : linkedinMessage.includes('⚠️')
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
              }`}>
                {linkedinMessage}
              </div>
            )}
          </div>
        </div>

        {/* Portfolio Verification - Coming Soon */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 opacity-60">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🌐</span>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Portfolio Verification
                <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">Coming Soon</span>
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Verify ownership of your portfolio website
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
