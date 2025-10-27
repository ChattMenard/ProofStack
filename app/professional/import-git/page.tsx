'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ImportGitActivityPage() {
  const [repos, setRepos] = useState('');
  const [daysBack, setDaysBack] = useState(90);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  async function handleImport() {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Parse repos - one per line or comma-separated
      const repoList = repos
        .split(/[\n,]/)
        .map(r => r.trim())
        .filter(r => r.length > 0);

      if (repoList.length === 0) {
        setError('Please enter at least one repository');
        setLoading(false);
        return;
      }

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('You must be logged in to import git activity');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/git-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          repos: repoList,
          daysBack
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to import git activity');
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-3xl mx-auto px-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Import Git Activity
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Import your commits from GitHub to showcase your coding activity on your portfolio
          </p>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Before you start:</h3>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
              <li>Make sure your GitHub account is connected (verify in your profile)</li>
              <li>Enter repository names in the format: owner/repo (e.g., facebook/react)</li>
              <li>You can enter multiple repos, one per line or comma-separated</li>
              <li>Only commits authored by your GitHub username will be imported</li>
            </ul>
          </div>

          {/* Form */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Repository Names
              </label>
              <textarea
                value={repos}
                onChange={(e) => setRepos(e.target.value)}
                placeholder="owner/repo1&#10;owner/repo2&#10;owner/repo3"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                rows={6}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Enter repositories in the format: owner/repo (one per line or comma-separated)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Import commits from the last
              </label>
              <select
                value={daysBack}
                onChange={(e) => setDaysBack(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-sage-500 focus:border-transparent"
              >
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
                <option value={180}>180 days</option>
                <option value={365}>1 year</option>
              </select>
            </div>

            <button
              onClick={handleImport}
              disabled={loading || !repos.trim()}
              className="w-full px-6 py-3 bg-gradient-to-r from-sage-600 to-sage-500 text-white font-semibold rounded-lg hover:from-sage-500 hover:to-sage-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Importing...
                </span>
              ) : (
                'Import Git Activity'
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Success Result */}
          {result && (
            <div className="mt-6 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h3 className="font-semibold text-green-900 dark:text-green-200 mb-2">
                ✓ Import Complete!
              </h3>
              <div className="text-sm text-green-800 dark:text-green-300 space-y-1">
                <p><strong>{result.imported}</strong> new commits imported</p>
                <p><strong>{result.skipped}</strong> duplicates skipped</p>
                {result.errors && result.errors.length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-green-700 dark:text-green-400 hover:underline">
                      View errors ({result.errors.length})
                    </summary>
                    <ul className="mt-2 space-y-1 text-xs list-disc list-inside">
                      {result.errors.map((err: string, i: number) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
              <a
                href="/professional/dashboard"
                className="inline-block mt-4 text-sm text-green-700 dark:text-green-400 hover:underline"
              >
                View your portfolio →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
