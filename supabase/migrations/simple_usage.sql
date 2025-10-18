-- SIMPLE Usage Tracking
-- Just the table, no complex functions

CREATE TABLE IF NOT EXISTS usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  month text NOT NULL,
  uploads_count integer DEFAULT 0,
  analysis_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month)
);

CREATE INDEX IF NOT EXISTS idx_usage_user_month ON usage_tracking(user_id, month);

SELECT 'Usage tracking table created!' as status;
