-- Add user_id to exam_submissions so anonymous proefexamen submissions can be
-- claimed (linked) to a user account after they register.
-- The prior unify migration (20260506000003) was never applied to prod; the live
-- exam_submissions table still has the old shape (email + created_at, no user_id).

ALTER TABLE public.exam_submissions
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Backfill ownership for existing anonymous submissions by matching email
UPDATE public.exam_submissions es
  SET user_id = u.id
  FROM auth.users u
  WHERE lower(u.email) = lower(es.email)
    AND es.user_id IS NULL;

CREATE INDEX IF NOT EXISTS exam_submissions_user_id_idx
  ON public.exam_submissions(user_id);

-- Refresh PostgREST schema cache so the API sees the new column immediately
NOTIFY pgrst, 'reload schema';
