-- Fix missing professional_ratings table
-- Run this in Supabase SQL Editor if professional_ratings is missing

-- Professional aggregate ratings (materialized for performance)
CREATE TABLE IF NOT EXISTS professional_ratings (
  professional_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  average_rating decimal(3,2),
  total_reviews integer DEFAULT 0,
  five_star_count integer DEFAULT 0,
  four_star_count integer DEFAULT 0,
  three_star_count integer DEFAULT 0,
  two_star_count integer DEFAULT 0,
  one_star_count integer DEFAULT 0,
  would_hire_again_percentage decimal(5,2),
  last_review_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE professional_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can read ratings
CREATE POLICY "Anyone can read professional ratings"
  ON professional_ratings FOR SELECT
  USING (true);

-- Function to update professional ratings
CREATE OR REPLACE FUNCTION update_professional_ratings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO professional_ratings (
    professional_id,
    average_rating,
    total_reviews,
    five_star_count,
    four_star_count,
    three_star_count,
    two_star_count,
    one_star_count,
    would_hire_again_percentage,
    last_review_at,
    updated_at
  )
  SELECT
    professional_id,
    AVG(rating)::decimal(3,2),
    COUNT(*)::integer,
    COUNT(*) FILTER (WHERE rating = 5)::integer,
    COUNT(*) FILTER (WHERE rating = 4)::integer,
    COUNT(*) FILTER (WHERE rating = 3)::integer,
    COUNT(*) FILTER (WHERE rating = 2)::integer,
    COUNT(*) FILTER (WHERE rating = 1)::integer,
    (COUNT(*) FILTER (WHERE would_hire_again = true) * 100.0 / COUNT(*))::decimal(5,2),
    MAX(created_at),
    now()
  FROM employer_reviews
  WHERE professional_id = COALESCE(NEW.professional_id, OLD.professional_id)
    AND is_public = true
  GROUP BY professional_id
  ON CONFLICT (professional_id) DO UPDATE SET
    average_rating = EXCLUDED.average_rating,
    total_reviews = EXCLUDED.total_reviews,
    five_star_count = EXCLUDED.five_star_count,
    four_star_count = EXCLUDED.four_star_count,
    three_star_count = EXCLUDED.three_star_count,
    two_star_count = EXCLUDED.two_star_count,
    one_star_count = EXCLUDED.one_star_count,
    would_hire_again_percentage = EXCLUDED.would_hire_again_percentage,
    last_review_at = EXCLUDED.last_review_at,
    updated_at = now();
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update ratings
DROP TRIGGER IF EXISTS trigger_update_professional_ratings ON employer_reviews;
CREATE TRIGGER trigger_update_professional_ratings
  AFTER INSERT OR UPDATE OR DELETE ON employer_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_professional_ratings();
