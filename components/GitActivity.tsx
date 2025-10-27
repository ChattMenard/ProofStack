'use client';

import { useEffect, useState } from 'react';

interface GitCommit {
  id: string;
  repo_name: string;
  repo_url: string;
  repo_owner: string;
  commit_sha: string;
  commit_message: string;
  commit_date: string;
  additions: number;
  deletions: number;
  files_changed: string[];
}

interface GitSummary {
  total_commits: number;
  total_additions: number;
  total_deletions: number;
  repos_count: number;
  last_commit_date: string | null;
}

interface GitActivityProps {
  profileId: string;
}

export default function GitActivity({ profileId }: GitActivityProps) {
  const [activity, setActivity] = useState<GitCommit[]>([]);
  const [summary, setSummary] = useState<GitSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadActivity();
  }, [profileId]);

  async function loadActivity() {
    try {
      const response = await fetch(`/api/git-activity?profileId=${profileId}`);
      if (response.ok) {
        const data = await response.json();
        setActivity(data.activity || []);
        setSummary(data.summary || null);
      }
    } catch (error) {
      console.error('Failed to load git activity:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!activity || activity.length === 0) {
    return null; // Don't show section if no activity
  }

  const displayedActivity = showAll ? activity : activity.slice(0, 10);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Git Activity
      </h2>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-sage-600 dark:text-sage-400">
              {summary.total_commits.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Commits</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              +{summary.total_additions.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Additions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              -{summary.total_deletions.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Deletions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {summary.repos_count}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Repositories</div>
          </div>
        </div>
      )}

      {/* Activity Timeline */}
      <div className="space-y-4">
        {displayedActivity.map((commit) => {
          const commitDate = new Date(commit.commit_date);
          const isToday = commitDate.toDateString() === new Date().toDateString();
          const isYesterday = new Date(Date.now() - 86400000).toDateString() === commitDate.toDateString();
          
          let dateLabel = commitDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: commitDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined 
          });
          
          if (isToday) dateLabel = 'Today';
          if (isYesterday) dateLabel = 'Yesterday';

          return (
            <div 
              key={commit.id}
              className="flex gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-sage-400 dark:hover:border-sage-600 transition-colors"
            >
              {/* Timeline dot */}
              <div className="flex-shrink-0 mt-1">
                <div className="w-3 h-3 rounded-full bg-sage-500"></div>
              </div>

              <div className="flex-1 min-w-0">
                {/* Commit message */}
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1 break-words">
                  {commit.commit_message.split('\n')[0]}
                </h3>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                  <a 
                    href={`${commit.repo_url}/commit/${commit.commit_sha}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono hover:text-sage-600 dark:hover:text-sage-400 transition-colors"
                  >
                    {commit.commit_sha.substring(0, 7)}
                  </a>
                  <span>•</span>
                  <a
                    href={commit.repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-sage-600 dark:hover:text-sage-400 transition-colors"
                  >
                    {commit.repo_owner}/{commit.repo_name}
                  </a>
                  <span>•</span>
                  <span>{dateLabel}</span>
                  {commit.additions > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-green-600 dark:text-green-400">
                        +{commit.additions}
                      </span>
                    </>
                  )}
                  {commit.deletions > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-red-600 dark:text-red-400">
                        -{commit.deletions}
                      </span>
                    </>
                  )}
                </div>

                {/* Files changed */}
                {commit.files_changed && commit.files_changed.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                    {commit.files_changed.slice(0, 3).join(', ')}
                    {commit.files_changed.length > 3 && ` +${commit.files_changed.length - 3} more`}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Show more/less button */}
      {activity.length > 10 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 w-full py-2 text-sm font-medium text-sage-600 dark:text-sage-400 hover:text-sage-700 dark:hover:text-sage-300 transition-colors"
        >
          {showAll ? 'Show Less' : `Show ${activity.length - 10} More Commits`}
        </button>
      )}
    </div>
  );
}
