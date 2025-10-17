-- GitHub API Cache Table
-- Stores ETag-based cache entries for GitHub API responses

CREATE TABLE IF NOT EXISTS github_api_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  etag TEXT NOT NULL,
  response_data JSONB NOT NULL,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Composite unique constraint for user + URL
  CONSTRAINT github_api_cache_user_url_key UNIQUE (user_id, url)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_github_cache_user_id ON github_api_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_github_cache_expires_at ON github_api_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_github_cache_url ON github_api_cache(url);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_github_cache_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp on row update
CREATE TRIGGER github_cache_update_timestamp
  BEFORE UPDATE ON github_api_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_github_cache_timestamp();

-- Function to clean up expired cache entries (run periodically via cron or webhook)
CREATE OR REPLACE FUNCTION cleanup_expired_github_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM github_api_cache
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) policies
ALTER TABLE github_api_cache ENABLE ROW LEVEL SECURITY;

-- Users can only read their own cache entries
CREATE POLICY "Users can read own cache"
  ON github_api_cache
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own cache entries
CREATE POLICY "Users can insert own cache"
  ON github_api_cache
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own cache entries
CREATE POLICY "Users can update own cache"
  ON github_api_cache
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own cache entries
CREATE POLICY "Users can delete own cache"
  ON github_api_cache
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can manage all cache entries (for cleanup)
CREATE POLICY "Service role full access"
  ON github_api_cache
  FOR ALL
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Comments for documentation
COMMENT ON TABLE github_api_cache IS 'Stores cached GitHub API responses with ETags for conditional requests';
COMMENT ON COLUMN github_api_cache.url IS 'Full GitHub API URL that was cached';
COMMENT ON COLUMN github_api_cache.etag IS 'ETag header from GitHub API response for conditional requests';
COMMENT ON COLUMN github_api_cache.response_data IS 'Cached JSON response data from GitHub API';
COMMENT ON COLUMN github_api_cache.cached_at IS 'When this entry was first cached';
COMMENT ON COLUMN github_api_cache.expires_at IS 'When this cache entry should be considered stale';
