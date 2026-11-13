-- Reviewverzoeken: wie is er vanuit /admin/reviews gevraagd om een Trustpilot-review, en wanneer.
--
-- Eén rij per verstuurde mail, append-only. Dat staat bewust niet in `user_metadata`: die blob
-- draagt de modules en de incasso, en een beheerknop hoort daar niet in te schrijven.
--
-- RLS staat aan en er is geen policy: alleen de service-rol leest en schrijft, via
-- /api/admin/request-review (achter `requireAdmin()`) en de adminpagina.

BEGIN;

CREATE TABLE public.review_requests (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text NOT NULL,
  locale     text NOT NULL DEFAULT 'nl' CHECK (locale IN ('nl', 'en', 'ar')),
  sent_by    text NOT NULL,
  sent_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX review_requests_user_id_idx ON public.review_requests (user_id, sent_at DESC);

ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;

COMMIT;
