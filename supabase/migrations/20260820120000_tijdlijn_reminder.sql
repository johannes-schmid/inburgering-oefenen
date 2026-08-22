-- The tijdlijn tool's e-mail loop.
--
-- Two things, both small on purpose.
--
-- 1. A new `campaign_type`, `tijdlijn_reminder`. The reminder rides on the existing
--    `email_campaign_queue` and the existing daily cron rather than getting a queue of its own:
--    one scheduler, one retry story, one unsubscribe path. The CHECK constraint has to be widened
--    or the INSERT is rejected at runtime — exactly the failure
--    `20260731200000_align_production_schema.sql` had to repair for `abandon`, which is why this
--    drops and recreates the constraint by name rather than assuming its contents.
--
-- 2. `tijdlijn_plans`, which holds **the e-mail address and the encoded state string, and nothing
--    else**. No dates, no route, no status as columns. The state string is opaque and
--    self-contained, so the row cannot become a profile of somebody's integration process, and the
--    reminder job decodes it at send time against the *current* rules file rather than against a
--    plan frozen at capture time. That is the difference between a reminder that is still correct in
--    eight months and one that quotes a waiting time DUO has since changed.
--
-- `reminders` is a separate column from the fact of the row existing, because "send me this
-- timeline" and "mail me before my deadline" are two different consents and the second one must be
-- revocable without deleting the first.

BEGIN;

ALTER TABLE public.email_campaign_queue
  DROP CONSTRAINT IF EXISTS email_campaign_queue_campaign_type_check;
ALTER TABLE public.email_campaign_queue
  ADD CONSTRAINT email_campaign_queue_campaign_type_check
  CHECK (campaign_type IN ('day2', 'day7', 'abandon', 'tijdlijn_reminder'));

CREATE TABLE IF NOT EXISTS public.tijdlijn_plans (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL,
  -- The `?t=` value. Versioned, non-identifying, and the only representation of the plan we keep.
  encoded_state text NOT NULL,
  locale        text NOT NULL DEFAULT 'nl' CHECK (locale IN ('nl', 'en', 'ar')),
  -- Consent for the follow-up, separate from having asked for a copy.
  reminders     boolean NOT NULL DEFAULT false,
  -- Set when the reminder has been queued, so a returning visitor who re-sends their plan does not
  -- accumulate one reminder per send.
  reminder_queued_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tijdlijn_plans_email_idx ON public.tijdlijn_plans (email);

-- Written only by the API route on the service key, and read only by the cron. There is deliberately
-- **no policy at all**: an anon or authenticated session must not be able to read a list of e-mail
-- addresses, and the service key bypasses RLS. Enabling RLS with no policy is the deny-all default,
-- which is what a table nobody should query from a browser wants.
ALTER TABLE public.tijdlijn_plans ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.tijdlijn_plans IS
  'One row per "send me my tijdlijn". Holds the e-mail and the opaque encoded plan state only; the reminder job decodes it against the current rules file at send time.';

COMMIT;
