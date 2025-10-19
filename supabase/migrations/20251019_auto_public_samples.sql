-- Auto-set samples to public when analysis completes
-- This makes new samples immediately visible in portfolios

-- Create function to set sample visibility to public when analysis completes
CREATE OR REPLACE FUNCTION set_sample_public_on_analysis()
RETURNS TRIGGER AS $$
BEGIN
  -- If analysis status changed to 'done', set sample to public
  IF NEW.status = 'done' AND (OLD.status IS NULL OR OLD.status != 'done') THEN
    UPDATE samples
    SET visibility = 'public'
    WHERE id = NEW.sample_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run after analysis updates
DROP TRIGGER IF EXISTS auto_public_sample_trigger ON analyses;
CREATE TRIGGER auto_public_sample_trigger
  AFTER INSERT OR UPDATE ON analyses
  FOR EACH ROW
  EXECUTE FUNCTION set_sample_public_on_analysis();

-- Optionally, set existing analyzed samples to public
-- Uncomment if you want to make all existing analyzed samples public:
-- UPDATE samples
-- SET visibility = 'public'
-- WHERE id IN (
--   SELECT DISTINCT sample_id 
--   FROM analyses 
--   WHERE status = 'done'
-- ) AND visibility = 'private';
