-- SKILL VERIFICATION TEST SYSTEM
-- Adds optional skill testing during professional onboarding
-- 4-tier system: Expert (85%+), Professional (70-84%), Entry (50-69%), Entrepreneur (<50%)
-- Tests verify skills before assigning tier level

-- DROP EXISTING TABLES IF ANY
DROP TABLE IF EXISTS test_answers CASCADE;
DROP TABLE IF EXISTS test_attempts CASCADE;
DROP TABLE IF EXISTS skill_test_questions CASCADE;

-- DROP EXISTING FUNCTIONS IF ANY
DROP FUNCTION IF EXISTS calculate_test_tier(UUID);
DROP FUNCTION IF EXISTS apply_test_verification(UUID);
DROP FUNCTION IF EXISTS auto_grade_multiple_choice(UUID);

-- ADD VERIFICATION COLUMNS TO PROFILES

-- Add verification tier and status columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS verification_tier VARCHAR(20) DEFAULT 'entrepreneur',
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS test_taken_at TIMESTAMPTZ;

-- Add check constraint for valid tiers
ALTER TABLE profiles
ADD CONSTRAINT valid_verification_tier 
CHECK (verification_tier IN ('level_3', 'level_2', 'level_1', 'entrepreneur'));

-- Add check constraint for valid statuses
ALTER TABLE profiles
ADD CONSTRAINT valid_verification_status 
CHECK (verification_status IN ('unverified', 'pending', 'verified', 'failed'));

-- Add index for querying by tier
CREATE INDEX IF NOT EXISTS idx_profiles_verification_tier ON profiles(verification_tier);

-- Add index for querying by status
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON profiles(verification_status);

-- CREATE SKILL TEST QUESTIONS TABLE

CREATE TABLE skill_test_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(50) NOT NULL CHECK (category IN ('code', 'writing', 'technical_knowledge', 'problem_solving')),
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('entry', 'professional', 'expert')),
  question_type VARCHAR(30) NOT NULL CHECK (question_type IN ('multiple_choice', 'code_challenge', 'writing_sample')),
  question_text TEXT NOT NULL,
  options JSONB, -- For multiple choice: {"A": "option1", "B": "option2", ...}
  correct_answer TEXT, -- For multiple choice: "A", for code: expected output
  code_template TEXT, -- For code challenges: starter code
  evaluation_criteria JSONB, -- For grading: {"keywords": [], "min_length": 100, ...}
  points INTEGER NOT NULL DEFAULT 10,
  time_limit_seconds INTEGER DEFAULT 300, -- 5 minutes default
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_questions_category ON skill_test_questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON skill_test_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_active ON skill_test_questions(is_active);

-- CREATE TEST ATTEMPTS TABLE

CREATE TABLE test_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  total_points_possible INTEGER DEFAULT 0,
  total_points_earned INTEGER DEFAULT 0,
  percentage_score DECIMAL(5,2) DEFAULT 0.00,
  tier_awarded VARCHAR(20), -- Calculated: 'level_3', 'level_2', 'level_1', 'entrepreneur'
  questions_answered INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  time_taken_seconds INTEGER,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_attempts_professional ON test_attempts(professional_id);
CREATE INDEX IF NOT EXISTS idx_attempts_status ON test_attempts(status);
CREATE INDEX IF NOT EXISTS idx_attempts_completed ON test_attempts(completed_at);

-- CREATE TEST ANSWERS TABLE

CREATE TABLE test_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES skill_test_questions(id) ON DELETE CASCADE,
  answer_text TEXT, -- User's answer
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  time_taken_seconds INTEGER,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  grading_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_answers_attempt ON test_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON test_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_correct ON test_answers(is_correct);

-- CREATE TIER CALCULATION FUNCTION

CREATE OR REPLACE FUNCTION calculate_test_tier(p_attempt_id UUID)
RETURNS VARCHAR(20)
LANGUAGE plpgsql
AS $$
DECLARE
  v_percentage DECIMAL(5,2);
  v_tier VARCHAR(20);
BEGIN
  -- Get percentage score
  SELECT percentage_score INTO v_percentage
  FROM test_attempts
  WHERE id = p_attempt_id;
  
  -- Assign tier based on percentage
  IF v_percentage >= 85.00 THEN
    v_tier := 'level_3'; -- Expert
  ELSIF v_percentage >= 70.00 THEN
    v_tier := 'level_2'; -- Professional
  ELSIF v_percentage >= 50.00 THEN
    v_tier := 'level_1'; -- Entry
  ELSE
    v_tier := 'entrepreneur'; -- Unverified/Failed
  END IF;
  
  RETURN v_tier;
END;
$$;

-- CREATE VERIFICATION APPLICATION FUNCTION

CREATE OR REPLACE FUNCTION apply_test_verification(p_attempt_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_professional_id UUID;
  v_tier VARCHAR(20);
  v_percentage DECIMAL(5,2);
BEGIN
  -- Get attempt details
  SELECT professional_id, percentage_score 
  INTO v_professional_id, v_percentage
  FROM test_attempts
  WHERE id = p_attempt_id AND status = 'completed';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attempt not found or not completed';
  END IF;
  
  -- Calculate tier
  v_tier := calculate_test_tier(p_attempt_id);
  
  -- Update test attempt with tier
  UPDATE test_attempts
  SET tier_awarded = v_tier
  WHERE id = p_attempt_id;
  
  -- Update profile with verification results
  UPDATE profiles
  SET 
    verification_tier = v_tier,
    verification_status = CASE 
      WHEN v_percentage >= 50.00 THEN 'verified'
      ELSE 'failed'
    END,
    test_taken_at = NOW()
  WHERE id = v_professional_id;
  
END;
$$;

-- CREATE AUTO-GRADING FUNCTION FOR MULTIPLE CHOICE

CREATE OR REPLACE FUNCTION auto_grade_multiple_choice(
  p_answer_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_answer TEXT;
  v_correct_answer TEXT;
  v_points INTEGER;
  v_is_correct BOOLEAN;
  v_attempt_id UUID;
BEGIN
  -- Get answer and question details
  SELECT 
    ta.answer_text,
    ta.attempt_id,
    stq.correct_answer,
    stq.points
  INTO 
    v_user_answer,
    v_attempt_id,
    v_correct_answer,
    v_points
  FROM test_answers ta
  JOIN skill_test_questions stq ON ta.question_id = stq.id
  WHERE ta.id = p_answer_id;
  
  -- Check if correct (case-insensitive)
  v_is_correct := UPPER(TRIM(v_user_answer)) = UPPER(TRIM(v_correct_answer));
  
  -- Update answer with grading
  UPDATE test_answers
  SET 
    is_correct = v_is_correct,
    points_earned = CASE WHEN v_is_correct THEN v_points ELSE 0 END,
    grading_notes = CASE 
      WHEN v_is_correct THEN 'Correct answer'
      ELSE 'Incorrect. Expected: ' || v_correct_answer
    END
  WHERE id = p_answer_id;
  
  -- Update attempt totals
  UPDATE test_attempts
  SET 
    questions_answered = questions_answered + 1,
    questions_correct = questions_correct + CASE WHEN v_is_correct THEN 1 ELSE 0 END,
    total_points_earned = total_points_earned + CASE WHEN v_is_correct THEN v_points ELSE 0 END,
    percentage_score = CASE 
      WHEN total_points_possible > 0 THEN 
        ((total_points_earned + CASE WHEN v_is_correct THEN v_points ELSE 0 END)::DECIMAL / total_points_possible::DECIMAL) * 100
      ELSE 0
    END
  WHERE id = v_attempt_id;
  
  RETURN v_is_correct;
END;
$$;

-- CREATE RLS POLICIES

-- Enable RLS on new tables
ALTER TABLE skill_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_answers ENABLE ROW LEVEL SECURITY;

-- Questions: Anyone authenticated can view active questions
CREATE POLICY "Anyone can view active questions"
ON skill_test_questions
FOR SELECT
TO authenticated
USING (is_active = true);

-- Questions: Only admins can modify
CREATE POLICY "Only admins can modify questions"
ON skill_test_questions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Attempts: Users can view their own attempts
CREATE POLICY "Users can view own attempts"
ON test_attempts
FOR SELECT
TO authenticated
USING (professional_id = auth.uid());

-- Attempts: Users can insert their own attempts
CREATE POLICY "Users can create own attempts"
ON test_attempts
FOR INSERT
TO authenticated
WITH CHECK (professional_id = auth.uid());

-- Attempts: Users can update their own in-progress attempts
CREATE POLICY "Users can update own attempts"
ON test_attempts
FOR UPDATE
TO authenticated
USING (professional_id = auth.uid() AND status = 'in_progress');

-- Answers: Users can view their own answers
CREATE POLICY "Users can view own answers"
ON test_answers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM test_attempts
    WHERE test_attempts.id = test_answers.attempt_id
    AND test_attempts.professional_id = auth.uid()
  )
);

-- Answers: Users can insert their own answers
CREATE POLICY "Users can insert own answers"
ON test_answers
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM test_attempts
    WHERE test_attempts.id = test_answers.attempt_id
    AND test_attempts.professional_id = auth.uid()
    AND test_attempts.status = 'in_progress'
  )
);

-- SEED SAMPLE QUESTIONS

-- Insert 6 sample questions covering different difficulties and types

-- Question 1: Entry-level multiple choice (Code)
INSERT INTO skill_test_questions (
  category, difficulty, question_type, question_text, options, correct_answer, points, time_limit_seconds
) VALUES (
  'code',
  'entry',
  'multiple_choice',
  'What does the following JavaScript code output? console.log(typeof null)',
  '{"A": "null", "B": "undefined", "C": "object", "D": "number"}',
  'C',
  10,
  60
) ON CONFLICT DO NOTHING;

-- Question 2: Entry-level multiple choice (Technical Knowledge)
INSERT INTO skill_test_questions (
  category, difficulty, question_type, question_text, options, correct_answer, points, time_limit_seconds
) VALUES (
  'technical_knowledge',
  'entry',
  'multiple_choice',
  'Which HTTP status code indicates a successful response?',
  '{"A": "404", "B": "500", "C": "200", "D": "301"}',
  'C',
  10,
  60
) ON CONFLICT DO NOTHING;

-- Question 3: Professional-level multiple choice (Code)
INSERT INTO skill_test_questions (
  category, difficulty, question_type, question_text, options, correct_answer, points, time_limit_seconds
) VALUES (
  'code',
  'professional',
  'multiple_choice',
  'In React, what hook would you use to perform side effects?',
  '{"A": "useState", "B": "useEffect", "C": "useContext", "D": "useMemo"}',
  'B',
  15,
  90
) ON CONFLICT DO NOTHING;

-- Question 4: Professional-level multiple choice (Problem Solving)
INSERT INTO skill_test_questions (
  category, difficulty, question_type, question_text, options, correct_answer, points, time_limit_seconds
) VALUES (
  'problem_solving',
  'professional',
  'multiple_choice',
  'What is the time complexity of binary search?',
  '{"A": "O(n)", "B": "O(log n)", "C": "O(n²)", "D": "O(1)"}',
  'B',
  15,
  90
) ON CONFLICT DO NOTHING;

-- Question 5: Expert-level multiple choice (Code)
INSERT INTO skill_test_questions (
  category, difficulty, question_type, question_text, options, correct_answer, points, time_limit_seconds
) VALUES (
  'code',
  'expert',
  'multiple_choice',
  'Which design pattern is used to provide a way to access elements of a collection sequentially without exposing its underlying representation?',
  '{"A": "Singleton", "B": "Factory", "C": "Iterator", "D": "Observer"}',
  'C',
  20,
  120
) ON CONFLICT DO NOTHING;

-- Question 6: Expert-level writing sample
INSERT INTO skill_test_questions (
  category, difficulty, question_type, question_text, evaluation_criteria, points, time_limit_seconds
) VALUES (
  'writing',
  'expert',
  'writing_sample',
  'Explain the difference between SQL and NoSQL databases, and provide a scenario where you would choose one over the other. (Minimum 200 words)',
  '{"min_length": 200, "keywords": ["SQL", "NoSQL", "relational", "schema", "scalability", "consistency"], "requires_example": true}',
  25,
  600
) ON CONFLICT DO NOTHING;

-- MIGRATION COMPLETE

-- Add comment to track migration
COMMENT ON TABLE skill_test_questions IS 'Stores skill verification test questions for professional onboarding';
COMMENT ON TABLE test_attempts IS 'Tracks individual test sessions and scores';
COMMENT ON TABLE test_answers IS 'Stores answers to individual test questions with grading';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Skill verification test system migration completed successfully';
  RAISE NOTICE 'Tables created: skill_test_questions, test_attempts, test_answers';
  RAISE NOTICE 'Functions created: calculate_test_tier(), apply_test_verification(), auto_grade_multiple_choice()';
  RAISE NOTICE 'Sample questions inserted: 6 questions across difficulty levels';
END $$;
