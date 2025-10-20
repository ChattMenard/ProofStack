-- Add ProofScore (0-100 rating) to professional profiles
-- Calculated from review metrics: response time, delivery, communication, quality, professionalism

-- Add ProofScore column to professional_ratings table
ALTER TABLE professional_ratings 
ADD COLUMN IF NOT EXISTS proof_score decimal(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS proof_score_breakdown jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_score_calculated_at timestamptz;

CREATE INDEX idx_professional_ratings_proof_score ON professional_ratings(proof_score DESC);

COMMENT ON COLUMN professional_ratings.proof_score IS 'Composite 0-100 score calculated from all review metrics';
COMMENT ON COLUMN professional_ratings.proof_score_breakdown IS 'Detailed breakdown showing how score was calculated';
COMMENT ON COLUMN professional_ratings.last_score_calculated_at IS 'When ProofScore was last calculated';

-- Function to calculate ProofScore (0-100) from review metrics
CREATE OR REPLACE FUNCTION calculate_proof_score(p_professional_id uuid)
RETURNS jsonb AS $$
DECLARE
  metrics RECORD;
  
  -- Score components (each worth max points)
  response_score decimal := 0;      -- Max 20 points
  delivery_score decimal := 0;      -- Max 20 points
  communication_score decimal := 0; -- Max 20 points
  quality_score decimal := 0;       -- Max 20 points
  professionalism_score decimal := 0; -- Max 20 points
  
  total_score decimal := 0;
  score_breakdown jsonb;
BEGIN
  -- Get aggregate metrics from professional_ratings
  SELECT 
    average_response_time_hours,
    on_time_delivery_rate,
    communication_rating,
    quality_rating,
    professionalism_rating,
    total_projects_completed
  INTO metrics
  FROM professional_ratings
  WHERE professional_id = p_professional_id;

  -- If no ratings yet, return 0 score
  IF NOT FOUND OR metrics.total_projects_completed = 0 THEN
    RETURN jsonb_build_object(
      'proof_score', 0,
      'breakdown', jsonb_build_object(
        'response_score', 0,
        'delivery_score', 0,
        'communication_score', 0,
        'quality_score', 0,
        'professionalism_score', 0,
        'total_projects', 0,
        'note', 'No completed projects yet'
      )
    );
  END IF;

  -- 1. RESPONSE TIME SCORE (20 points max)
  -- Ultra-fast (<1hr): 20 pts, Fast (<4hrs): 18 pts, Good (<12hrs): 15 pts
  -- Average (<24hrs): 10 pts, Slow (<48hrs): 5 pts, Very slow: 2 pts
  IF metrics.average_response_time_hours IS NOT NULL THEN
    IF metrics.average_response_time_hours < 1 THEN
      response_score := 20;
    ELSIF metrics.average_response_time_hours < 4 THEN
      response_score := 18;
    ELSIF metrics.average_response_time_hours < 12 THEN
      response_score := 15;
    ELSIF metrics.average_response_time_hours < 24 THEN
      response_score := 10;
    ELSIF metrics.average_response_time_hours < 48 THEN
      response_score := 5;
    ELSE
      response_score := 2;
    END IF;
  END IF;

  -- 2. ON-TIME DELIVERY SCORE (20 points max)
  -- Perfect (100%): 20 pts, Excellent (95%+): 18 pts, Good (85%+): 15 pts
  -- Average (70%+): 10 pts, Poor (50%+): 5 pts, Bad: 2 pts
  IF metrics.on_time_delivery_rate IS NOT NULL THEN
    IF metrics.on_time_delivery_rate >= 100 THEN
      delivery_score := 20;
    ELSIF metrics.on_time_delivery_rate >= 95 THEN
      delivery_score := 18;
    ELSIF metrics.on_time_delivery_rate >= 85 THEN
      delivery_score := 15;
    ELSIF metrics.on_time_delivery_rate >= 70 THEN
      delivery_score := 10;
    ELSIF metrics.on_time_delivery_rate >= 50 THEN
      delivery_score := 5;
    ELSE
      delivery_score := 2;
    END IF;
  END IF;

  -- 3. COMMUNICATION RATING SCORE (20 points max)
  -- Scale: 5.0 = 20 pts, 4.5 = 18 pts, 4.0 = 16 pts, 3.5 = 12 pts, 3.0 = 8 pts, <3.0 = 4 pts
  IF metrics.communication_rating IS NOT NULL THEN
    communication_score := (metrics.communication_rating / 5.0) * 20;
  END IF;

  -- 4. QUALITY RATING SCORE (20 points max)
  -- Same scale as communication
  IF metrics.quality_rating IS NOT NULL THEN
    quality_score := (metrics.quality_rating / 5.0) * 20;
  END IF;

  -- 5. PROFESSIONALISM RATING SCORE (20 points max)
  -- Same scale as communication
  IF metrics.professionalism_rating IS NOT NULL THEN
    professionalism_score := (metrics.professionalism_rating / 5.0) * 20;
  END IF;

  -- Calculate total (max 100)
  total_score := response_score + delivery_score + communication_score + quality_score + professionalism_score;

  -- Build breakdown JSON
  score_breakdown := jsonb_build_object(
    'response_score', ROUND(response_score, 2),
    'response_hours', ROUND(metrics.average_response_time_hours, 2),
    'delivery_score', ROUND(delivery_score, 2),
    'delivery_rate', ROUND(metrics.on_time_delivery_rate, 2),
    'communication_score', ROUND(communication_score, 2),
    'communication_rating', ROUND(metrics.communication_rating, 2),
    'quality_score', ROUND(quality_score, 2),
    'quality_rating', ROUND(metrics.quality_rating, 2),
    'professionalism_score', ROUND(professionalism_score, 2),
    'professionalism_rating', ROUND(metrics.professionalism_rating, 2),
    'total_projects', metrics.total_projects_completed
  );

  RETURN jsonb_build_object(
    'proof_score', ROUND(total_score, 2),
    'breakdown', score_breakdown
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update ProofScore for a professional
CREATE OR REPLACE FUNCTION update_professional_proof_score(p_professional_id uuid)
RETURNS void AS $$
DECLARE
  score_data jsonb;
BEGIN
  -- Calculate the score
  score_data := calculate_proof_score(p_professional_id);

  -- Update professional_ratings table
  UPDATE professional_ratings
  SET 
    proof_score = (score_data->>'proof_score')::decimal,
    proof_score_breakdown = score_data->'breakdown',
    last_score_calculated_at = now()
  WHERE professional_id = p_professional_id;

  -- If no row exists, insert one
  IF NOT FOUND THEN
    INSERT INTO professional_ratings (
      professional_id,
      proof_score,
      proof_score_breakdown,
      last_score_calculated_at
    ) VALUES (
      p_professional_id,
      (score_data->>'proof_score')::decimal,
      score_data->'breakdown',
      now()
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update ProofScore when aggregate ratings change
CREATE OR REPLACE FUNCTION trigger_update_proof_score()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_professional_proof_score(NEW.professional_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_update_proof_score ON professional_ratings;
CREATE TRIGGER trigger_auto_update_proof_score
  AFTER INSERT OR UPDATE ON professional_ratings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_proof_score();

-- View to rank all professionals by ProofScore
CREATE OR REPLACE VIEW professional_leaderboard AS
SELECT 
  pr.professional_id,
  p.full_name,
  p.headline,
  pr.proof_score,
  pr.total_projects_completed,
  pr.average_response_time_hours,
  pr.on_time_delivery_rate,
  pr.communication_rating,
  pr.quality_rating,
  pr.professionalism_rating,
  pr.proof_score_breakdown,
  RANK() OVER (ORDER BY pr.proof_score DESC) as rank,
  CASE 
    WHEN pr.proof_score >= 90 THEN 'Elite'
    WHEN pr.proof_score >= 80 THEN 'Excellent'
    WHEN pr.proof_score >= 70 THEN 'Good'
    WHEN pr.proof_score >= 60 THEN 'Average'
    WHEN pr.proof_score >= 50 THEN 'Fair'
    ELSE 'Needs Improvement'
  END as tier
FROM professional_ratings pr
LEFT JOIN profiles p ON p.id = pr.professional_id
WHERE pr.total_projects_completed > 0
ORDER BY pr.proof_score DESC;

COMMENT ON VIEW professional_leaderboard IS 'Ranked list of all professionals by ProofScore with tier classification';

-- Function to get professional percentile (top X%)
CREATE OR REPLACE FUNCTION get_professional_percentile(p_professional_id uuid)
RETURNS decimal AS $$
DECLARE
  total_professionals integer;
  better_than_count integer;
  percentile decimal;
BEGIN
  -- Count total professionals with completed projects
  SELECT COUNT(*) INTO total_professionals
  FROM professional_ratings
  WHERE total_projects_completed > 0;

  -- Count how many have lower scores
  SELECT COUNT(*) INTO better_than_count
  FROM professional_ratings pr1
  WHERE pr1.total_projects_completed > 0
    AND pr1.proof_score < (
      SELECT proof_score FROM professional_ratings WHERE professional_id = p_professional_id
    );

  -- Calculate percentile (0-100, higher is better)
  IF total_professionals > 0 THEN
    percentile := (better_than_count::decimal / total_professionals::decimal) * 100;
  ELSE
    percentile := 0;
  END IF;

  RETURN ROUND(percentile, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON professional_leaderboard TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_proof_score(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_professional_proof_score(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_professional_percentile(uuid) TO authenticated;
