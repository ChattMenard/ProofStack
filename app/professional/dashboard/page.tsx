'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProofScoreModal from '@/components/ProofScoreModal';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ProfessionalDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalViews: 0,
    totalSaves: 0,
    totalMessages: 0,
    unreadMessages: 0,
    averageRating: 0,
    totalReviews: 0
  });
  const [activePromotion, setActivePromotion] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [showProofScoreModal, setShowProofScoreModal] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      // Get authenticated user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/auth/signin');
        return;
      }
      setUser(authUser);

      // Get profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      setProfile(profileData);

      // Get profile views count
      const { count: viewsCount } = await supabase
        .from('profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', authUser.id);

      // Get saves count
      const { count: savesCount } = await supabase
        .from('saved_candidates')
        .select('*', { count: 'exact', head: true })
        .eq('professional_id', authUser.id);

      // Get messages count (conversations where user is participant)
      const { data: participantData } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', authUser.id);

      const conversationIds = participantData?.map((p: any) => p.conversation_id) || [];
      let messagesCount = 0;
      let unreadCount = 0;

      if (conversationIds.length > 0) {
        const { count: totalMessages } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in('conversation_id', conversationIds)
          .neq('sender_id', authUser.id);
        messagesCount = totalMessages || 0;

        // Calculate unread messages
        for (const participant of participantData || []) {
          const { count: unread } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', participant.conversation_id)
            .neq('sender_id', authUser.id)
            .gt('created_at', participant.last_read_at || '1970-01-01');
          unreadCount += unread || 0;
        }
      }

      // Get ratings
      const { data: ratingsData } = await supabase
        .from('professional_ratings')
        .select('average_rating, total_reviews')
        .eq('professional_id', authUser.id)
        .single();

      // Get active promotion
      const { data: promotionData } = await supabase
        .from('professional_promotions')
        .select('*')
        .eq('professional_id', authUser.id)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .single();
      setActivePromotion(promotionData);

      // Get recent activity (views, saves, messages from last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentViews } = await supabase
        .from('profile_views')
        .select('*, profiles!viewer_id(username, full_name, organizations(name))')
        .eq('profile_id', authUser.id)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentActivity(recentViews || []);

      setStats({
        totalViews: viewsCount || 0,
        totalSaves: savesCount || 0,
        totalMessages: messagesCount,
        unreadMessages: unreadCount,
        averageRating: ratingsData?.average_rating || 0,
        totalReviews: ratingsData?.total_reviews || 0
      });
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {profile?.full_name || profile?.username || 'Professional'}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here's what's happening with your profile
          </p>
        </div>

        {/* Active Promotion Banner */}
        {activePromotion && (
          <div className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 sm:p-6 text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">
                  Your {activePromotion.tier.charAt(0).toUpperCase() + activePromotion.tier.slice(1)} Promotion is Active! 🚀
                </h3>
                <p className="text-blue-100 text-sm sm:text-base">
                  {activePromotion.views_count || 0} views • {activePromotion.saves_count || 0} saves • {activePromotion.messages_count || 0} messages this period
                </p>
              </div>
              <Link
                href="/professional/promote/manage"
                className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors w-full sm:w-auto text-center text-sm sm:text-base"
              >
                View Analytics
              </Link>
            </div>
          </div>
        )}

        {/* No Promotion CTA */}
        {!activePromotion && (
          <div className="mb-6 bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
                  🚀 Boost Your Profile Visibility
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
                  Get discovered by more employers. Promote your profile to appear first in search results.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/professional/promote"
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-center text-sm sm:text-base"
                  >
                    Browse Plans
                  </Link>
                  <a
                    href="#benefits"
                    className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center text-sm sm:text-base"
                  >
                    Learn More
                  </a>
                </div>
              </div>
              <div className="hidden md:block text-6xl">📈</div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Profile Views */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.totalViews}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Profile Views</div>
          </div>

          {/* Profile Saves */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.totalSaves}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Times Saved</div>
          </div>

          {/* Messages */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              {stats.unreadMessages > 0 && (
                <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                  {stats.unreadMessages}
                </span>
              )}
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.totalMessages}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Messages {stats.unreadMessages > 0 && `(${stats.unreadMessages} unread)`}
            </div>
          </div>

          {/* Rating */}
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setShowProofScoreModal(true)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                Click for details →
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '—'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Average Rating {stats.totalReviews > 0 && `(${stats.totalReviews} reviews)`}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href={`/portfolio/${profile?.username || profile?.email}`}
              className="flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors group"
            >
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-600 transition-colors">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  View My Profile
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">See what employers see</div>
              </div>
            </Link>

            <Link
              href="/upload"
              className="flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 dark:hover:border-green-500 transition-colors group"
            >
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:bg-green-600 transition-colors">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400">
                  Upload Work Sample
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Showcase your skills</div>
              </div>
            </Link>

            <Link
              href="/professional/promote"
              className="flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-500 transition-colors group"
            >
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-600 transition-colors">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                  {activePromotion ? 'Manage Promotion' : 'Promote Profile'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {activePromotion ? 'View analytics' : 'Boost visibility'}
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p>No recent activity yet. Your profile views will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 dark:text-white">
                      <span className="font-semibold">
                        {(activity.profiles as any)?.organizations?.name || 
                         (activity.profiles as any)?.full_name || 
                         (activity.profiles as any)?.username || 
                         'An employer'}
                      </span>
                      {' viewed your profile'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ProofScore Breakdown Modal */}
      {user && (
        <ProofScoreModal 
          isOpen={showProofScoreModal}
          onClose={() => setShowProofScoreModal(false)}
          professionalId={user.id}
        />
      )}
    </div>
  );
}
