-- ProofScore V2: 30/30/40 Split with AI Text Analysis
-- Component 1: Communication Quality (30pts) - Profile + Response + Speed
-- Component 2: Historical Performance (30pts) - Track record
-- Component 3: Work Quality (40pts) - Current project results

-- Add new columns for AI-analyzed quality scores
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_quality_score decimal(4,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS profile_quality_analysis jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS profile_quality_analyzed_at timestamptz;

ALTER TABLE professional_ratings
ADD COLUMN IF NOT EXISTS initial_message_quality_score decimal(4,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS initial_message_quality_analysis jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS completion_rate decimal(5,2) DEFAULT 100;

-- Add new work quality columns to employer_reviews
ALTER TABLE employer_reviews
ADD COLUMN IF NOT EXISTS task_correctness_rating decimal(3,2),
ADD COLUMN IF NOT EXISTS revisions_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS would_hire_again boolean DEFAULT true;

COMMENT ON COLUMN profiles.profile_quality_score IS 'AI-analyzed score (0-10) for profile text quality: grammar, spelling, professionalism';
COMMENT ON COLUMN profiles.profile_quality_analysis IS 'Detailed AI analysis of profile quality';
COMMENT ON COLUMN professional_ratings.initial_message_quality_score IS 'AI-analyzed score (0-10) for first employer contact message';
COMMENT ON COLUMN professional_ratings.completion_rate IS 'Percentage of accepted projects that were completed (0-100)';
COMMENT ON COLUMN employer_reviews.task_correctness_rating IS 'Employer rating of deliverable correctness (1-5 scale)';
COMMENT ON COLUMN employer_reviews.revisions_count IS 'Number of revision rounds required';
COMMENT ON COLUMN employer_reviews.would_hire_again IS 'Would the employer hire this professional again?';

-- Updated ProofScore calculation function (30/30/40 split)
CREATE OR REPLACE FUNCTION calculate_proof_score_v2(p_professional_id uuid)
RETURNS jsonb AS $$
DECLARE
  profile_data RECORD;
  ratings_data RECORD;
  
  -- Component 1: Communication Quality (30 points)
  profile_quality decimal := 0;      -- Max 10 points (AI-analyzed)
  message_quality decimal := 0;       -- Max 10 points (AI-analyzed)
  response_speed decimal := 0;        -- Max 10 points
  
  -- Component 2: Historical Performance (30 points)
  historical_rating decimal := 0;     -- Max 15 points
  delivery_rate decimal := 0;         -- Max 10 points
  completion_rate decimal := 0;       -- Max 5 points
  
  -- Component 3: Work Quality (40 points)
  task_correctness decimal := 0;      -- Max 20 points
  employer_satisfaction decimal := 0; -- Max 10 points
  revisions_penalty decimal := 0;     -- Max 5 points
  hire_again_bonus decimal := 0;      -- Max 5 points
  
  total_score decimal := 0;
  score_breakdown jsonb;
BEGIN
  -- Get profile data
  SELECT 
    profile_quality_score,
    profile_quality_analysis
  INTO profile_data
  FROM profiles
  WHERE id = p_professional_id;

  -- Get ratings data
  SELECT 
    average_response_time_hours,
    on_time_delivery_rate,
    communication_rating,
    quality_rating,
    professionalism_rating,
    total_projects_completed,
    average_rating,
    initial_message_quality_score,
    completion_rate
  INTO ratings_data
  FROM professional_ratings
  WHERE professional_id = p_professional_id;

  -- If no data, return base score from profile quality only
  IF NOT FOUND THEN
    profile_quality := COALESCE(profile_data.profile_quality_score, 0);
    
    RETURN jsonb_build_object(
      'proof_score', profile_quality * 3, -- Profile quality × 3 = max 30 points for new users
      'breakdown', jsonb_build_object(
        'communication_quality', profile_quality * 3,
        'profile_quality', profile_quality,
        'message_quality', 0,
        'response_speed', 0,
        'historical_performance', 0,
        'work_quality', 0,
        'total_projects', 0,
        'note', 'New professional - score based on profile quality only'
      )
    );
  END IF;

  -- ============================================
  -- COMPONENT 1: COMMUNICATION QUALITY (30 pts)
  -- ============================================
  
  -- Profile Quality (10 points) - AI analyzed
  profile_quality := COALESCE(profile_data.profile_quality_score, 0);
  
  -- Initial Message Quality (10 points) - AI analyzed
  message_quality := COALESCE(ratings_data.initial_message_quality_score, 0);
  
  -- Response Speed (10 points)
  IF ratings_data.average_response_time_hours IS NOT NULL THEN
    IF ratings_data.average_response_time_hours < 1 THEN
      response_speed := 10;
    ELSIF ratings_data.average_response_time_hours < 4 THEN
      response_speed := 9;
    ELSIF ratings_data.average_response_time_hours < 12 THEN
      response_speed := 7;
    ELSIF ratings_data.average_response_time_hours < 24 THEN
      response_speed := 5;
    ELSIF ratings_data.average_response_time_hours < 48 THEN
      response_speed := 3;
    ELSE
      response_speed := 1;
    END IF;
  END IF;

  -- ============================================
  -- COMPONENT 2: HISTORICAL PERFORMANCE (30 pts)
  -- ============================================
  
  -- Historical Rating (15 points) - Average of all past reviews
  IF ratings_data.average_rating IS NOT NULL THEN
    historical_rating := (ratings_data.average_rating / 5.0) * 15;
  END IF;
  
  -- On-Time Delivery Rate (10 points)
  IF ratings_data.on_time_delivery_rate IS NOT NULL THEN
    delivery_rate := (ratings_data.on_time_delivery_rate / 100.0) * 10;
  END IF;
  
  -- Completion Rate (5 points)
  IF ratings_data.completion_rate IS NOT NULL THEN
    completion_rate := (ratings_data.completion_rate / 100.0) * 5;
  END IF;

  -- ============================================
  -- COMPONENT 3: WORK QUALITY (40 pts)
  -- ============================================
  
  -- Get average work quality metrics from reviews
  SELECT 
    AVG(COALESCE(task_correctness_rating, quality_rating)) as avg_correctness,
    AVG(COALESCE(quality_rating, 0)) as avg_satisfaction,
    AVG(COALESCE(revisions_count, 0)) as avg_revisions,
    AVG(CASE WHEN would_hire_again THEN 1.0 ELSE 0.0 END) as hire_again_rate
  INTO 
    task_correctness,
    employer_satisfaction,
    revisions_penalty,
    hire_again_bonus
  FROM employer_reviews
  WHERE professional_id = p_professional_id
    AND rating IS NOT NULL;
  
  -- Task Correctness (20 points) - Primary quality metric
  IF task_correctness IS NOT NULL THEN
    task_correctness := (task_correctness / 5.0) * 20;
  ELSE
    task_correctness := 0;
  END IF;
  
  -- Employer Satisfaction (10 points)
  IF employer_satisfaction IS NOT NULL THEN
    employer_satisfaction := (employer_satisfaction / 5.0) * 10;
  ELSE
    employer_satisfaction := 0;
  END IF;
  
  -- Revisions Penalty (5 points) - Fewer revisions = higher score
  IF revisions_penalty IS NOT NULL THEN
    IF revisions_penalty = 0 THEN
      revisions_penalty := 5;
    ELSIF revisions_penalty <= 1 THEN
      revisions_penalty := 4;
    ELSIF revisions_penalty <= 2 THEN
      revisions_penalty := 3;
    ELSIF revisions_penalty <= 3 THEN
      revisions_penalty := 2;
    ELSE
      revisions_penalty := 1;
    END IF;
  ELSE
    revisions_penalty := 5; -- Assume good if no data
  END IF;
  
  -- Would Hire Again Bonus (5 points)
  IF hire_again_bonus IS NOT NULL THEN
    hire_again_bonus := hire_again_bonus * 5;
  ELSE
    hire_again_bonus := 0;
  END IF;

  -- ============================================
  -- CALCULATE TOTAL SCORE
  -- ============================================
  
  total_score := 
    profile_quality + message_quality + response_speed +  -- Communication (30)
    historical_rating + delivery_rate + completion_rate + -- Historical (30)
    task_correctness + employer_satisfaction + revisions_penalty + hire_again_bonus; -- Work (40)

  -- Build detailed breakdown
  score_breakdown := jsonb_build_object(
    'communication_quality', jsonb_build_object(
      'total', ROUND(profile_quality + message_quality + response_speed, 2),
      'profile_quality', ROUND(profile_quality, 2),
      'message_quality', ROUND(message_quality, 2),
      'response_speed', ROUND(response_speed, 2)
    ),
    'historical_performance', jsonb_build_object(
      'total', ROUND(historical_rating + delivery_rate + completion_rate, 2),
      'average_rating', ROUND(historical_rating, 2),
      'delivery_rate', ROUND(delivery_rate, 2),
      'completion_rate', ROUND(completion_rate, 2)
    ),
    'work_quality', jsonb_build_object(
      'total', ROUND(task_correctness + employer_satisfaction + revisions_penalty + hire_again_bonus, 2),
      'task_correctness', ROUND(task_correctness, 2),
      'employer_satisfaction', ROUND(employer_satisfaction, 2),
      'revisions_score', ROUND(revisions_penalty, 2),
      'hire_again_score', ROUND(hire_again_bonus, 2)
    ),
    'total_projects', COALESCE(ratings_data.total_projects_completed, 0)
  );

  RETURN jsonb_build_object(
    'proof_score', ROUND(total_score, 2),
    'breakdown', score_breakdown
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update ProofScore V2
CREATE OR REPLACE FUNCTION update_professional_proof_score_v2(p_professional_id uuid)
RETURNS void AS $$
DECLARE
  score_data jsonb;
BEGIN
  score_data := calculate_proof_score_v2(p_professional_id);

  UPDATE professional_ratings
  SET 
    proof_score = (score_data->>'proof_score')::decimal,
    proof_score_breakdown = score_data->'breakdown',
    last_score_calculated_at = now()
  WHERE professional_id = p_professional_id;

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

-- Trigger to auto-update ProofScore V2
DROP TRIGGER IF EXISTS trigger_auto_update_proof_score_v2 ON professional_ratings;
CREATE TRIGGER trigger_auto_update_proof_score_v2
  AFTER INSERT OR UPDATE ON professional_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_professional_proof_score_v2(NEW.professional_id);

-- Trigger to recalculate when profile quality is updated
CREATE OR REPLACE FUNCTION trigger_profile_quality_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_professional_proof_score_v2(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profile_quality_score_update ON profiles;
CREATE TRIGGER trigger_profile_quality_score_update
  AFTER UPDATE OF profile_quality_score ON profiles
  FOR EACH ROW
  WHEN (OLD.profile_quality_score IS DISTINCT FROM NEW.profile_quality_score)
  EXECUTE FUNCTION trigger_profile_quality_update();

-- Grant permissions
GRANT EXECUTE ON FUNCTION calculate_proof_score_v2(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_professional_proof_score_v2(uuid) TO authenticated;

COMMENT ON FUNCTION calculate_proof_score_v2 IS 'ProofScore V2: 30% Communication, 30% Historical, 40% Work Quality';
