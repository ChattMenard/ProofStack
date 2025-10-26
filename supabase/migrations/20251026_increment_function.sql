-- Helper function for incrementing numeric columns
-- Used for view counts, application counts, etc.
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION increment(
  table_name text,
  row_id uuid,
  column_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format(
    'UPDATE %I SET %I = COALESCE(%I, 0) + 1 WHERE id = $1',
    table_name,
    column_name,
    column_name
  ) USING row_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION increment(text, uuid, text) TO authenticated;

-- Grant execute to anonymous users (for view counting)
GRANT EXECUTE ON FUNCTION increment(text, uuid, text) TO anon;

COMMENT ON FUNCTION increment IS 'Safely increment a numeric column by 1';
