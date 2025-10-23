-- Remove fake encryption field from work_samples
-- This field claimed encryption but stored plaintext
-- Run this migration in Supabase SQL Editor

-- Step 1: Remove the encrypted_content column
ALTER TABLE work_samples 
DROP COLUMN IF EXISTS encrypted_content CASCADE;

-- Step 2: Remove 'encrypted' from confidentiality_level enum if it exists
-- First check if anyone is using it
DO $$ 
BEGIN
  -- Check if any samples use 'encrypted' confidentiality level
  IF EXISTS (
    SELECT 1 FROM work_samples 
    WHERE confidentiality_level = 'encrypted'
  ) THEN
    -- Update them to 'confidential' instead
    UPDATE work_samples 
    SET confidentiality_level = 'confidential'
    WHERE confidentiality_level = 'encrypted';
    
    RAISE NOTICE 'Updated % samples from encrypted to confidential', 
      (SELECT COUNT(*) FROM work_samples WHERE confidentiality_level = 'confidential');
  END IF;
END $$;

-- Step 3: Remove 'encrypted' option from enum
-- Note: This requires recreating the enum type
DO $$
BEGIN
  -- Create new enum without 'encrypted'
  CREATE TYPE confidentiality_level_new AS ENUM ('public', 'internal', 'confidential', 'restricted');
  
  -- Update column to use new enum
  ALTER TABLE work_samples 
    ALTER COLUMN confidentiality_level TYPE confidentiality_level_new 
    USING confidentiality_level::text::confidentiality_level_new;
  
  -- Drop old enum
  DROP TYPE IF EXISTS confidentiality_level CASCADE;
  
  -- Rename new enum to original name
  ALTER TYPE confidentiality_level_new RENAME TO confidentiality_level;
  
EXCEPTION
  WHEN duplicate_object THEN
    -- Enum already updated
    NULL;
END $$;

-- Add comment explaining why encryption was removed
COMMENT ON TABLE work_samples IS 
  'Work samples table. Encryption feature removed as it was not properly implemented. ' ||
  'For true encryption, use Supabase Vault or application-level encryption with proper key management.';

-- Log the migration
INSERT INTO migration_log (name, description, applied_at)
VALUES (
  'remove_fake_encryption',
  'Removed encrypted_content field and encrypted confidentiality level as encryption was not actually implemented',
  NOW()
)
ON CONFLICT DO NOTHING;
