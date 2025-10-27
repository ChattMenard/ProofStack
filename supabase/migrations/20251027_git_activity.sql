-- Git Activity Import System
-- Stores imported git commits and contribution data

CREATE TABLE IF NOT EXISTS git_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Repository info
  repo_name text NOT NULL,
  repo_url text NOT NULL,
  repo_owner text NOT NULL,
  
  -- Commit details
  commit_sha text NOT NULL,
  commit_message text NOT NULL,
  commit_date timestamptz NOT NULL,
  
  -- Contribution stats
  additions int DEFAULT 0,
  deletions int DEFAULT 0,
  files_changed text[] DEFAULT '{}',
  
  -- Metadata
  imported_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  
  -- Prevent duplicate imports
  UNIQUE(profile_id, commit_sha)
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_git_activity_profile ON git_activity(profile_id);
CREATE INDEX IF NOT EXISTS idx_git_activity_date ON git_activity(commit_date DESC);
CREATE INDEX IF NOT EXISTS idx_git_activity_repo ON git_activity(profile_id, repo_name);

-- RLS Policies
ALTER TABLE git_activity ENABLE ROW LEVEL SECURITY;

-- Anyone can view git activity
CREATE POLICY "Anyone can view git activity"
  ON git_activity FOR SELECT
  USING (true);

-- Users can view their own git activity
CREATE POLICY "Users can view own git activity"
  ON git_activity FOR SELECT
  USING (profile_id IN (SELECT id FROM profiles WHERE auth_uid = auth.uid()::text));

-- Users can insert their own git activity
CREATE POLICY "Users can insert own git activity"
  ON git_activity FOR INSERT
  WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE auth_uid = auth.uid()::text));

-- Users can delete their own git activity
CREATE POLICY "Users can delete own git activity"
  ON git_activity FOR DELETE
  USING (profile_id IN (SELECT id FROM profiles WHERE auth_uid = auth.uid()::text));

-- Function to get activity summary
CREATE OR REPLACE FUNCTION get_git_activity_summary(p_profile_id uuid)
RETURNS TABLE (
  total_commits bigint,
  total_additions bigint,
  total_deletions bigint,
  repos_count bigint,
  last_commit_date timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_commits,
    COALESCE(SUM(additions), 0)::bigint as total_additions,
    COALESCE(SUM(deletions), 0)::bigint as total_deletions,
    COUNT(DISTINCT repo_name)::bigint as repos_count,
    MAX(commit_date) as last_commit_date
  FROM git_activity
  WHERE profile_id = p_profile_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
