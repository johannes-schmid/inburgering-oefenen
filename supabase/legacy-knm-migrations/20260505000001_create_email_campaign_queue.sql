CREATE TABLE email_campaign_queue (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL,
  campaign_type text NOT NULL CHECK (campaign_type IN ('day2', 'day7')),
  scheduled_for timestamptz NOT NULL,
  payload       jsonb NOT NULL DEFAULT '{}',
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at       timestamptz,
  error_message text,
  created_at    timestamptz DEFAULT now()
);

-- Fast lookup of due emails
CREATE INDEX idx_ecq_due ON email_campaign_queue (scheduled_for, status)
  WHERE status = 'pending';

-- Prevent re-queuing the same campaign for the same email
CREATE UNIQUE INDEX idx_ecq_email_type ON email_campaign_queue (email, campaign_type)
  WHERE status IN ('pending', 'sent');

-- Service role only
ALTER TABLE email_campaign_queue ENABLE ROW LEVEL SECURITY;
