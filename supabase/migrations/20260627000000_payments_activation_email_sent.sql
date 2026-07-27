ALTER TABLE payments ADD COLUMN IF NOT EXISTS activation_email_sent boolean NOT NULL DEFAULT false;
