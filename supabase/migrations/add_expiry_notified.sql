-- Add expiry_notified column to track whether we've sent the 7-day expiry warning email
ALTER TABLE professional_promotions 
ADD COLUMN IF NOT EXISTS expiry_notified BOOLEAN DEFAULT false;

-- Add index for efficient cron job queries
CREATE INDEX IF NOT EXISTS idx_professional_promotions_expiring 
ON professional_promotions(expires_at, is_active, expiry_notified) 
WHERE is_active = true;
