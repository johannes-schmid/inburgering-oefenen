-- De Black Friday-mail 2026 (scripts/black-friday/queue.mjs) als campagnetype in
-- `email_campaign_queue`, naast `knm_migration`. De verzending zit in
-- app/api/send-campaign-emails/route.ts en stopt vanzelf na maandag 30-11 24:00.
--
-- Zoals 20261026120000_knm_migration_campaign.sql: de CHECK op naam verwijderen en opnieuw maken,
-- met de waarden die op 27-11 op productie én lokaal stonden, plus `black_friday`.

BEGIN;

ALTER TABLE public.email_campaign_queue
  DROP CONSTRAINT IF EXISTS email_campaign_queue_campaign_type_check;
ALTER TABLE public.email_campaign_queue
  ADD CONSTRAINT email_campaign_queue_campaign_type_check
  CHECK (campaign_type IN ('day2', 'day7', 'abandon', 'tijdlijn_reminder', 'knm_migration', 'black_friday'));

COMMIT;
