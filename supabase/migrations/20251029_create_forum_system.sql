-- ProofStack Community Forum Tables
-- Migration: 20251029_create_forum_system.sql
-- Purpose: Complete forum infrastructure with RLS policies

-- ============================================================================
-- 1. FORUM CATEGORIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS forum_categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  display_order INT DEFAULT 0,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sample data
INSERT INTO forum_categories (name, slug, description, icon, color, display_order) VALUES
  ('Portfolio Feedback', 'portfolio-feedback', 'Get feedback on your work samples and portfolio', '📋', 'blue', 1),
  ('Hiring Questions', 'hiring-questions', 'Employers discuss recruiting challenges and strategies', '💼', 'green', 2),
  ('Career Advice', 'career-advice', 'Discuss roles, salaries, career moves, and professional development', '🎓', 'purple', 3),
  ('Resources & Learning', 'resources-learning', 'Share tutorials, bootcamps, certifications, and learning materials', '📚', 'orange', 4),
  ('Announcements', 'announcements', 'ProofStack team updates and platform announcements', '📢', 'red', 5)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 2. FORUM THREADS
-- ============================================================================

CREATE TABLE IF NOT EXISTS forum_threads (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  content_markdown TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  view_count INT DEFAULT 0,
  reply_count INT DEFAULT 0,
  upvote_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_reply_at TIMESTAMPTZ,
  
  CONSTRAINT title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
  CONSTRAINT content_not_empty CHECK (LENGTH(TRIM(content)) > 10)
);

CREATE INDEX idx_forum_threads_category_id ON forum_threads(category_id);
CREATE INDEX idx_forum_threads_user_id ON forum_threads(user_id);
CREATE INDEX idx_forum_threads_is_pinned ON forum_threads(is_pinned DESC) WHERE NOT is_archived;
CREATE INDEX idx_forum_threads_last_reply_at ON forum_threads(last_reply_at DESC) WHERE NOT is_archived;
CREATE INDEX idx_forum_threads_created_at ON forum_threads(created_at DESC) WHERE NOT is_archived;

-- ============================================================================
-- 3. FORUM REPLIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS forum_replies (
  id BIGSERIAL PRIMARY KEY,
  thread_id BIGINT NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_reply_id BIGINT REFERENCES forum_replies(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  content_markdown TEXT,
  is_accepted_answer BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  upvote_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT content_not_empty CHECK (LENGTH(TRIM(content)) > 5)
);

CREATE INDEX idx_forum_replies_thread_id ON forum_replies(thread_id);
CREATE INDEX idx_forum_replies_user_id ON forum_replies(user_id);
CREATE INDEX idx_forum_replies_parent_reply_id ON forum_replies(parent_reply_id) WHERE parent_reply_id IS NOT NULL;
CREATE INDEX idx_forum_replies_is_accepted_answer ON forum_replies(is_accepted_answer) WHERE is_accepted_answer = TRUE;
CREATE INDEX idx_forum_replies_created_at ON forum_replies(created_at DESC) WHERE NOT is_deleted;

-- ============================================================================
-- 4. FORUM REPLY UPVOTES
-- ============================================================================

CREATE TABLE IF NOT EXISTS forum_reply_upvotes (
  id BIGSERIAL PRIMARY KEY,
  reply_id BIGINT NOT NULL REFERENCES forum_replies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(reply_id, user_id)
);

CREATE INDEX idx_forum_reply_upvotes_reply_id ON forum_reply_upvotes(reply_id);
CREATE INDEX idx_forum_reply_upvotes_user_id ON forum_reply_upvotes(user_id);

-- ============================================================================
-- 5. FORUM USER STATISTICS & REPUTATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS forum_user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  threads_created INT DEFAULT 0,
  replies_posted INT DEFAULT 0,
  replies_accepted INT DEFAULT 0,
  total_upvotes INT DEFAULT 0,
  forum_reputation INT DEFAULT 0,
  reputation_tier VARCHAR(50) DEFAULT 'newcomer', -- newcomer, active, expert, leader
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_forum_user_stats_reputation_tier ON forum_user_stats(reputation_tier);
CREATE INDEX idx_forum_user_stats_forum_reputation ON forum_user_stats(forum_reputation DESC);

-- ============================================================================
-- 6. FORUM MODERATION LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS forum_moderation_log (
  id BIGSERIAL PRIMARY KEY,
  thread_id BIGINT REFERENCES forum_threads(id) ON DELETE SET NULL,
  reply_id BIGINT REFERENCES forum_replies(id) ON DELETE SET NULL,
  moderator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- 'pinned', 'unpinned', 'locked', 'unlocked', 'deleted', 'flagged'
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_forum_moderation_log_thread_id ON forum_moderation_log(thread_id);
CREATE INDEX idx_forum_moderation_log_reply_id ON forum_moderation_log(reply_id);
CREATE INDEX idx_forum_moderation_log_moderator_id ON forum_moderation_log(moderator_id);
CREATE INDEX idx_forum_moderation_log_created_at ON forum_moderation_log(created_at DESC);

-- ============================================================================
-- 7. FORUM REPORTS (SPAM, HARASSMENT, ETC)
-- ============================================================================

CREATE TABLE IF NOT EXISTS forum_reports (
  id BIGSERIAL PRIMARY KEY,
  thread_id BIGINT REFERENCES forum_threads(id) ON DELETE SET NULL,
  reply_id BIGINT REFERENCES forum_replies(id) ON DELETE SET NULL,
  reported_by_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason VARCHAR(50) NOT NULL, -- 'spam', 'harassment', 'off-topic', 'scam', 'other'
  description TEXT,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_action VARCHAR(50), -- 'deleted', 'warned', 'ignored'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_forum_reports_thread_id ON forum_reports(thread_id);
CREATE INDEX idx_forum_reports_reply_id ON forum_reports(reply_id);
CREATE INDEX idx_forum_reports_is_resolved ON forum_reports(is_resolved);
CREATE INDEX idx_forum_reports_created_at ON forum_reports(created_at DESC);

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Forum Categories: Everyone can read, only admins can create/edit
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are publicly readable"
  ON forum_categories FOR SELECT
  USING (NOT is_archived);

CREATE POLICY "Only admins can create categories"
  ON forum_categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_admin = TRUE
    )
  );

-- Forum Threads: Everyone can read, users can create, users can edit own, admins can edit any
ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Threads are publicly readable"
  ON forum_threads FOR SELECT
  USING (NOT is_archived);

CREATE POLICY "Authenticated users can create threads"
  ON forum_threads FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (SELECT user_type FROM profiles WHERE id = auth.uid()) IN ('professional', 'employer', 'organization')
  );

CREATE POLICY "Users can update own threads"
  ON forum_threads FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update any thread"
  ON forum_threads FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_admin = TRUE
    )
  );

-- Forum Replies: Everyone can read, users can create, users can edit own, admins can edit any
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Replies are publicly readable"
  ON forum_replies FOR SELECT
  USING (NOT is_deleted OR user_id = auth.uid());

CREATE POLICY "Authenticated users can create replies"
  ON forum_replies FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (SELECT user_type FROM profiles WHERE id = auth.uid()) IN ('professional', 'employer', 'organization')
  );

CREATE POLICY "Users can update own replies"
  ON forum_replies FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update any reply"
  ON forum_replies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_admin = TRUE
    )
  );

-- Forum Reply Upvotes: Users can manage own upvotes
ALTER TABLE forum_reply_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see upvotes"
  ON forum_reply_upvotes FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can create own upvotes"
  ON forum_reply_upvotes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own upvotes"
  ON forum_reply_upvotes FOR DELETE
  USING (user_id = auth.uid());

-- Forum User Stats: Publicly readable
ALTER TABLE forum_user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User stats are publicly readable"
  ON forum_user_stats FOR SELECT
  USING (TRUE);

-- Forum Moderation Log: Only visible to admins
ALTER TABLE forum_moderation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can see moderation log"
  ON forum_moderation_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_admin = TRUE
    )
  );

-- Forum Reports: Visible to admins and reporter
ALTER TABLE forum_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and reporters can see reports"
  ON forum_reports FOR SELECT
  USING (
    reported_by_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_admin = TRUE
    )
  );

CREATE POLICY "Authenticated users can create reports"
  ON forum_reports FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND reported_by_id = auth.uid()
  );

-- ============================================================================
-- 9. HELPER FUNCTIONS
-- ============================================================================

-- Function to increment thread view count
CREATE OR REPLACE FUNCTION increment_thread_views(thread_id BIGINT)
RETURNS void AS $$
BEGIN
  UPDATE forum_threads
  SET view_count = view_count + 1
  WHERE id = thread_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user stats after posting reply
CREATE OR REPLACE FUNCTION update_user_stats_on_reply()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user stats
  INSERT INTO forum_user_stats (user_id, replies_posted)
  VALUES (NEW.user_id, 1)
  ON CONFLICT (user_id) DO UPDATE
  SET replies_posted = forum_user_stats.replies_posted + 1,
      last_active_at = NOW(),
      updated_at = NOW();
  
  -- Update thread reply count
  UPDATE forum_threads
  SET reply_count = reply_count + 1,
      last_reply_at = NOW()
  WHERE id = NEW.thread_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update stats on new reply
CREATE TRIGGER forum_reply_insert_trigger
AFTER INSERT ON forum_replies
FOR EACH ROW
EXECUTE FUNCTION update_user_stats_on_reply();

-- Function to update reputation tier
CREATE OR REPLACE FUNCTION update_reputation_tier(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE forum_user_stats
  SET reputation_tier = CASE
    WHEN forum_reputation >= 500 THEN 'leader'
    WHEN forum_reputation >= 200 THEN 'expert'
    WHEN forum_reputation >= 50 THEN 'active'
    ELSE 'newcomer'
  END,
  updated_at = NOW()
  WHERE forum_user_stats.user_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate forum reputation from upvotes and accepted answers
CREATE OR REPLACE FUNCTION recalculate_user_reputation(user_id UUID)
RETURNS void AS $$
DECLARE
  upvote_score INT;
  accepted_score INT;
  total_reputation INT;
BEGIN
  -- Calculate upvote score (1 reputation per upvote on replies)
  SELECT COALESCE(SUM(upvote_count), 0) INTO upvote_score
  FROM forum_replies
  WHERE user_id = recalculate_user_reputation.user_id
  AND NOT is_deleted;
  
  -- Calculate accepted answer score (10 reputation per accepted answer)
  SELECT COALESCE(COUNT(*) * 10, 0) INTO accepted_score
  FROM forum_replies
  WHERE user_id = recalculate_user_reputation.user_id
  AND is_accepted_answer = TRUE
  AND NOT is_deleted;
  
  total_reputation := upvote_score + accepted_score;
  
  UPDATE forum_user_stats
  SET forum_reputation = total_reputation,
      total_upvotes = upvote_score,
      updated_at = NOW()
  WHERE forum_user_stats.user_id = recalculate_user_reputation.user_id;
  
  PERFORM update_reputation_tier(user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 10. FULL TEXT SEARCH
-- ============================================================================

-- Add tsvector column for full text search
ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Trigger to update search vector
CREATE OR REPLACE FUNCTION forum_threads_search_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', NEW.title || ' ' || NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER forum_threads_search_trigger
BEFORE INSERT OR UPDATE ON forum_threads
FOR EACH ROW
EXECUTE FUNCTION forum_threads_search_update();

-- GIN index for full text search
CREATE INDEX IF NOT EXISTS idx_forum_threads_search_vector 
  ON forum_threads USING gin(search_vector)
  WHERE NOT is_archived;

-- ============================================================================
-- 11. MIGRATION METADATA
-- ============================================================================

-- Record this migration
INSERT INTO migrations (name, executed_at) VALUES (
  '20251029_create_forum_system',
  NOW()
) ON CONFLICT DO NOTHING;
