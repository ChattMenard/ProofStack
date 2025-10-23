'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProfessionals: 0,
    totalEmployers: 0,
    totalProSubscriptions: 0,
    activePromotions: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalSearches: 0,
    totalMessages: 0,
    totalReviews: 0,
    averagePlatformRating: 0
  });
  const [topProfessionals, setTopProfessionals] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [promotionBreakdown, setPromotionBreakdown] = useState({
    featured: 0,
    premium: 0,
    standard: 0
  });

  useEffect(() => {
    checkAdminAndLoadDashboard();
  }, []);

  const checkAdminAndLoadDashboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // DEV MODE: Allow specific email in development
      const isDev = process.env.NODE_ENV === 'development';
      const devEmail = 'mattchenard2009@gmail.com';
      
      if (isDev) {
        // In dev, just load the dashboard without auth
        setIsAdmin(true);
        await loadDashboardData();
        setLoading(false);
        return;
      }
      
      if (!user) {
        setLoading(false);
        return; // Show email login form
      }

      // Check if user is admin (founder or specific role)
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_founder, user_type, email')
        .eq('id', user.id)
        .single();

      if (!profile?.is_founder) {
        // Not admin, redirect
        alert('Access denied. Admin privileges required.');
        router.push('/');
        return;
      }

      setIsAdmin(true);
      await loadDashboardData();
    } catch (error) {
      console.error('Admin check error:', error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin/dashboard`,
        }
      });

      if (error) throw error;

      setEmailSent(true);
      alert('Check your email! We sent you a secure sign-in link.');
    } catch (error: any) {
      console.error('Magic link error:', error);
      alert(error.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Professionals
      const { count: totalProfessionals } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'professional');

      // Employers
      const { count: totalEmployers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'employer');

      // Pro subscriptions
      const { count: totalProSubscriptions } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('plan', 'pro');

      // Active promotions
      const { count: activePromotions } = await supabase
        .from('professional_promotions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString());

      // Promotion breakdown by tier
      const { data: promotionsData } = await supabase
        .from('professional_promotions')
        .select('tier')
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString());

      const breakdown = {
        featured: promotionsData?.filter((p: any) => p.tier === 'featured').length || 0,
        premium: promotionsData?.filter((p: any) => p.tier === 'premium').length || 0,
        standard: promotionsData?.filter((p: any) => p.tier === 'standard').length || 0
      };
      setPromotionBreakdown(breakdown);

      // Calculate revenue (estimated)
      const monthlyRevenue = (breakdown.featured * 99) + (breakdown.premium * 49) + (breakdown.standard * 19);
      const totalRevenue = monthlyRevenue; // For now, assume 1 month

      // Total searches
      const { count: totalSearches } = await supabase
        .from('search_history')
        .select('*', { count: 'exact', head: true });

      // Total messages
      const { count: totalMessages } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });

      // Total reviews
      const { count: totalReviews } = await supabase
        .from('employer_reviews')
        .select('*', { count: 'exact', head: true });

      // Average platform rating
      const { data: ratingsData } = await supabase
        .from('professional_ratings')
        .select('average_rating');

      const avgRating = ratingsData && ratingsData.length > 0
        ? ratingsData.reduce((sum: number, r: any) => sum + (r.average_rating || 0), 0) / ratingsData.length
        : 0;

      // Top professionals (by rating and reviews)
      const { data: topProfs } = await supabase
        .from('professional_ratings')
        .select(`
          professional_id,
          average_rating,
          total_reviews,
          profiles!professional_id (
            username,
            full_name,
            headline
          )
        `)
        .order('average_rating', { ascending: false })
        .order('total_reviews', { ascending: false })
        .limit(5);

      setTopProfessionals(topProfs || []);

      // Recent activity (searches, messages, reviews in last 24 hours)
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data: recentSearches } = await supabase
        .from('search_history')
        .select('*, profiles!employer_id(username, full_name)')
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentActivity((recentSearches || []).map((s: any) => ({
        type: 'search',
        user: (s.profiles as any)?.full_name || (s.profiles as any)?.username,
        timestamp: s.created_at,
        details: `${s.results_count} results`
      })));

      setStats({
        totalUsers: totalUsers || 0,
        totalProfessionals: totalProfessionals || 0,
        totalEmployers: totalEmployers || 0,
        totalProSubscriptions: totalProSubscriptions || 0,
        activePromotions: activePromotions || 0,
        totalRevenue,
        monthlyRevenue,
        totalSearches: totalSearches || 0,
        totalMessages: totalMessages || 0,
        totalReviews: totalReviews || 0,
        averagePlatformRating: avgRating
      });
    } catch (error) {
      console.error('Dashboard data load error:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading admin dashboard...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full mb-4">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-bold text-sm">ADMIN ACCESS</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {emailSent 
                ? 'Check your email for the secure sign-in link' 
                : 'Verify your identity to access admin panel'}
            </p>
          </div>

          {!emailSent ? (
            <form onSubmit={sendMagicLink} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Admin Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Verification Email 🔐'}
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                We'll send a secure one-time link to your email
              </p>
            </form>
          ) : (
            <div className="text-center">
              <div className="mb-4">
                <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Email Sent! ✉️
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Check <span className="font-semibold text-blue-600 dark:text-blue-400">{email}</span> for your secure sign-in link.
              </p>
              <button
                onClick={() => setEmailSent(false)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Resend email
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Admin Navigation Bar */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo + Admin Badge */}
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-xl font-bold text-gray-900 dark:text-white">ProofStack</span>
              </Link>
              <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                ADMIN
              </span>
            </div>

            {/* Center: Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <Link 
                href="/admin/dashboard" 
                className="text-gray-900 dark:text-white font-semibold border-b-2 border-blue-600 pb-1"
              >
                Dashboard
              </Link>
              <Link 
                href="/admin/security" 
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Security
              </Link>
              <Link 
                href="/admin/users" 
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Users
              </Link>
              <Link 
                href="/admin/analytics" 
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Analytics
              </Link>
            </div>

            {/* Right: Back to Site */}
            <div className="flex items-center gap-4">
              <Link 
                href="/" 
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                ← Back to Site
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Admin Dashboard
            </h1>
            <span className="px-3 py-1 bg-red-600 text-white text-sm font-semibold rounded-full">
              ADMIN
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Platform analytics and monitoring
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <svg className="w-8 h-8 opacity-80" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.totalUsers}</div>
            <div className="text-sm opacity-90">Total Users</div>
            <div className="text-xs opacity-75 mt-2">
              {stats.totalProfessionals} professionals • {stats.totalEmployers} employers
            </div>
          </div>

          {/* Revenue */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <svg className="w-8 h-8 opacity-80" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-3xl font-bold mb-1">{formatCurrency(stats.monthlyRevenue)}</div>
            <div className="text-sm opacity-90">Monthly Revenue (MRR)</div>
            <div className="text-xs opacity-75 mt-2">
              {stats.activePromotions} active promotions
            </div>
          </div>

          {/* Engagement */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <svg className="w-8 h-8 opacity-80" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
              </svg>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.totalMessages}</div>
            <div className="text-sm opacity-90">Total Messages</div>
            <div className="text-xs opacity-75 mt-2">
              {stats.totalSearches} searches performed
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <svg className="w-8 h-8 opacity-80" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.totalReviews}</div>
            <div className="text-sm opacity-90">Total Reviews</div>
            <div className="text-xs opacity-75 mt-2">
              {stats.averagePlatformRating > 0 ? stats.averagePlatformRating.toFixed(1) : '—'} avg rating
            </div>
          </div>
        </div>

        {/* Promotion Revenue Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Promotion Revenue Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="text-4xl mb-2">⭐</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {promotionBreakdown.featured}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Featured Promotions</div>
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(promotionBreakdown.featured * 99)}/mo
              </div>
            </div>

            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="text-4xl mb-2">💎</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {promotionBreakdown.premium}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Premium Promotions</div>
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(promotionBreakdown.premium * 49)}/mo
              </div>
            </div>

            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-4xl mb-2">🚀</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {promotionBreakdown.standard}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Standard Promotions</div>
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(promotionBreakdown.standard * 19)}/mo
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Professionals */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Top Rated Professionals
            </h2>
            {topProfessionals.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No rated professionals yet
              </p>
            ) : (
              <div className="space-y-3">
                {topProfessionals.map((prof, index) => (
                  <div
                    key={prof.professional_id}
                    className="flex items-center gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="text-2xl font-bold text-gray-400 dark:text-gray-600 w-8">
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {(prof.profiles as any)?.full_name || (prof.profiles as any)?.username}
                      </div>
                      {(prof.profiles as any)?.headline && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {(prof.profiles as any).headline}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-semibold">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {prof.average_rating.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {prof.total_reviews} reviews
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Recent Activity (24h)
            </h2>
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No recent activity
              </p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white">
                        <span className="font-semibold">{activity.user}</span>
                        {' performed a search'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {activity.details} • {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
