-- Add review metric columns to professional_ratings table
-- These columns are prerequisites for the ProofScore system

-- Add aggregate metric columns to professional_ratings
ALTER TABLE professional_ratings 
  ADD COLUMN IF NOT EXISTS average_response_time_hours decimal(8,2),
  ADD COLUMN IF NOT EXISTS on_time_delivery_rate decimal(5,2),
  ADD COLUMN IF NOT EXISTS communication_rating decimal(3,2),
  ADD COLUMN IF NOT EXISTS quality_rating decimal(3,2),
  ADD COLUMN IF NOT EXISTS professionalism_rating decimal(3,2),
  ADD COLUMN IF NOT EXISTS total_projects_completed integer DEFAULT 0;

-- Add comment explaining these columns
COMMENT ON COLUMN professional_ratings.average_response_time_hours IS 
  'Average response time across all projects in hours. Lower is better.';

COMMENT ON COLUMN professional_ratings.on_time_delivery_rate IS 
  'Percentage of projects delivered on time (0-100). Higher is better.';

COMMENT ON COLUMN professional_ratings.communication_rating IS 
  'Average communication rating across all reviews (1-5 scale). Higher is better.';

COMMENT ON COLUMN professional_ratings.quality_rating IS 
  'Average work quality rating across all reviews (1-5 scale). Higher is better.';

COMMENT ON COLUMN professional_ratings.professionalism_rating IS 
  'Average professionalism rating across all reviews (1-5 scale). Higher is better.';

COMMENT ON COLUMN professional_ratings.total_projects_completed IS 
  'Total number of completed projects for this professional.';
