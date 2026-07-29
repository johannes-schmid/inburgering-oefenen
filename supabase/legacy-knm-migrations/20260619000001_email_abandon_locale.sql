-- Allow 'abandon' as a campaign_type in the email queue
ALTER TABLE email_campaign_queue
  DROP CONSTRAINT IF EXISTS email_campaign_queue_campaign_type_check;

ALTER TABLE email_campaign_queue
  ADD CONSTRAINT email_campaign_queue_campaign_type_check
  CHECK (campaign_type IN ('day2', 'day7', 'abandon'));

-- Add locale column to payments (captures language preference at checkout)
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'nl'
  CHECK (locale IN ('nl', 'en', 'ar'));
