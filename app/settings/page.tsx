'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    
    setUser(user);

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_uid', user.id)
      .single();

    setProfile(profileData);
    setLoading(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('New passwords do not match');
      setSaving(false);
      return;
    }

    if (formData.newPassword.length < 8) {
      setMessage('Password must be at least 8 characters');
      setSaving(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (error) throw error;

      setMessage('Password updated successfully!');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      setMessage('Error: ' + error.message);
    } finally {
      setSaving(false);
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Account Settings
        </h1>

        {/* Account Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Account Information
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">Email</label>
              <p className="text-gray-900 dark:text-white font-medium">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">Account Type</label>
              <p className="text-gray-900 dark:text-white font-medium capitalize">
                {profile?.user_type || profile?.role || 'Professional'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">Account ID</label>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-mono">{user?.id}</p>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Change Password
          </h2>
          
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                minLength={8}
              />
            </div>

            {message && (
              <div className={`p-4 rounded-lg ${message.includes('Error') ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200' : 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'}`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Delete Account */}
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border-2 border-red-200 dark:border-red-800 p-6 mt-6">
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
            Danger Zone
          </h2>
          <p className="text-sm text-red-600 dark:text-red-300 mb-4">
            Account deletion is permanent and cannot be undone. Contact support if you need to delete your account.
          </p>
          <a
            href="mailto:support@proofstack.com?subject=Account Deletion Request"
            className="inline-block px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Request Account Deletion
          </a>
        </div>
      </div>
    </div>
  );
}
