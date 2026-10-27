-- The one-off announcement to the knmoefenen.nl list: "KNM Oefenen is now Inburgering Oefenen",
-- with the KNM10 code.
--
-- It rides on `email_campaign_queue` and the existing daily cron, like `tijdlijn_reminder`: one
-- scheduler, one unsubscribe path. Pacing is done by `scheduled_for` at import time
-- (scripts/knm-migration/import.mjs), so the cron needs no notion of a daily cap — the free Resend
-- tier allows 100 sends a day, shared with the transactional mail.
--
-- Drops and recreates the CHECK by name rather than assuming its contents — see
-- 20260731200000_align_production_schema.sql for what happens when it is assumed.

BEGIN;

ALTER TABLE public.email_campaign_queue
  DROP CONSTRAINT IF EXISTS email_campaign_queue_campaign_type_check;
ALTER TABLE public.email_campaign_queue
  ADD CONSTRAINT email_campaign_queue_campaign_type_check
  CHECK (campaign_type IN ('day2', 'day7', 'abandon', 'tijdlijn_reminder', 'knm_migration'));

COMMIT;
