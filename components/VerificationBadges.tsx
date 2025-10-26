'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface VerificationBadgesProps {
  profileId: string;
  size?: 'small' | 'medium' | 'large';
  showLabels?: boolean;
  layout?: 'horizontal' | 'vertical';
}

interface Verifications {
  email_verified: boolean;
  github_verified: boolean;
  linkedin_verified: boolean;
  portfolio_verified: boolean;
  work_samples_verified: boolean;
  identity_verified: boolean;
  github_username?: string;
  linkedin_profile_url?: string;
  portfolio_url?: string;
}

export default function VerificationBadges({
  profileId,
  size = 'medium',
  showLabels = true,
  layout = 'horizontal'
}: VerificationBadgesProps) {
  const [verifications, setVerifications] = useState<Verifications | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVerifications();
  }, [profileId]);

  const loadVerifications = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_verifications')
        .select('*')
        .eq('profile_id', profileId)
        .single();

      if (error) {
        console.error('Error loading verifications:', error);
        setLoading(false);
        return;
      }

      if (data) {
        setVerifications(data);
      }
    } catch (err) {
      console.error('Verification load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex gap-2 items-center">
        <div className="animate-pulse flex gap-2">
          <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!verifications) {
    return null;
  }

  const sizeClasses = {
    small: {
      container: 'text-xs',
      icon: 'w-3 h-3',
      badge: 'px-2 py-0.5',
      gap: 'gap-1'
    },
    medium: {
      container: 'text-sm',
      icon: 'w-4 h-4',
      badge: 'px-2.5 py-1',
      gap: 'gap-1.5'
    },
    large: {
      container: 'text-base',
      icon: 'w-5 h-5',
      badge: 'px-3 py-1.5',
      gap: 'gap-2'
    }
  };

  const colorClasses: { [key: string]: string } = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700',
    gray: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-700',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700'
  };

  const badges: Array<{
    type: string;
    icon: any;
    label: string;
    color: string;
    link?: string;
  }> = [];

  // Email verification
  if (verifications.email_verified) {
    badges.push({
      type: 'email',
      icon: '✉️',
      label: 'Email Verified',
      color: 'blue'
    });
  }

  // GitHub verification
  if (verifications.github_verified) {
    badges.push({
      type: 'github',
      icon: (
        <svg className={`${sizeClasses[size].icon}`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      ),
      label: 'GitHub Verified',
      color: 'gray',
      link: verifications.github_username ? `https://github.com/${verifications.github_username}` : undefined
    });
  }

  // LinkedIn verification
  if (verifications.linkedin_verified) {
    badges.push({
      type: 'linkedin',
      icon: (
        <svg className={`${sizeClasses[size].icon}`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
      label: 'LinkedIn Verified',
      color: 'blue',
      link: verifications.linkedin_profile_url
    });
  }

  // Portfolio verification
  if (verifications.portfolio_verified) {
    badges.push({
      type: 'portfolio',
      icon: '🌐',
      label: 'Portfolio Verified',
      color: 'green',
      link: verifications.portfolio_url
    });
  }

  // Work samples verification
  if (verifications.work_samples_verified) {
    badges.push({
      type: 'work_samples',
      icon: '💼',
      label: 'Work Verified',
      color: 'purple'
    });
  }

  // Identity verification
  if (verifications.identity_verified) {
    badges.push({
      type: 'identity',
      icon: '🆔',
      label: 'Identity Verified',
      color: 'amber'
    });
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className={`flex ${layout === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col'} ${sizeClasses[size].gap} ${sizeClasses[size].container}`}>
      {badges.map((badge) => {
        const content = (
          <span className={`inline-flex items-center ${sizeClasses[size].gap} ${sizeClasses[size].badge} rounded-full font-medium border ${colorClasses[badge.color]} transition-all ${badge.link ? 'hover:scale-105 cursor-pointer' : ''}`}>
            {typeof badge.icon === 'string' ? (
              <span className={sizeClasses[size].icon}>{badge.icon}</span>
            ) : (
              badge.icon
            )}
            {showLabels && <span>{badge.label}</span>}
            <svg className={`${sizeClasses[size].icon} text-current`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </span>
        );

        if (badge.link) {
          return (
            <a
              key={badge.type}
              href={badge.link}
              target="_blank"
              rel="noopener noreferrer"
              title={badge.label}
            >
              {content}
            </a>
          );
        }

        return (
          <span key={badge.type} title={badge.label}>
            {content}
          </span>
        );
      })}
    </div>
  );
}
