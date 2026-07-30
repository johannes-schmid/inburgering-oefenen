-- ============================================================================
-- Align production with the baseline it never fully received.
--
-- The hosted project ran an **earlier version** of 20260729000000_a2_baseline.sql. That file was
-- then rewritten in place (Part A of the schema rework) and, because the version number did not
-- change, the rewritten version was recorded as applied without ever running. `supabase migration
-- list` therefore showed the baseline as applied on both sides while the schemas differed.
--
-- Symptom that exposed it: every exam 404'd on production. `fetchExamContent()` selects
-- `pass_threshold_pct`, PostgREST answered `42703 column exams.pass_threshold_pct does not exist`,
-- the query returned an error, and the player treated that as "no such exam".
--
-- Found by diffing the two schemas, not by reading the migration history — which lied. `supabase db
-- diff --linked` generates the correction in the wrong direction (it wants to drop these from local
-- to match production), so this is written forward by hand.
--
-- Everything here is additive and idempotent: a no-op locally, the missing pieces on production.
-- `pg_net` also differs but is a local-stack default rather than app schema, so it is left alone.
-- ============================================================================

BEGIN;

-- 1. The column that broke the player. Default 60 so the 40 existing exam rows get our practice
--    threshold rather than NULL. Never presented as DUO's cut-off — see SEO/facts.md §9.
ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS pass_threshold_pct smallint NOT NULL DEFAULT 60;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exams_pass_threshold_pct_check') THEN
    ALTER TABLE public.exams
      ADD CONSTRAINT exams_pass_threshold_pct_check
      CHECK (pass_threshold_pct BETWEEN 1 AND 100);
  END IF;
END $$;

-- 2. The anonymous funnel table. `exam_number` has a NOT NULL DEFAULT so existing rows stay valid;
--    `skill` is nullable because rows written before it existed genuinely have no skill.
ALTER TABLE public.exam_submissions
  ADD COLUMN IF NOT EXISTS skill       text,
  ADD COLUMN IF NOT EXISTS exam_number integer NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exam_submissions_skill_check') THEN
    ALTER TABLE public.exam_submissions
      ADD CONSTRAINT exam_submissions_skill_check
      CHECK (skill IN ('lezen', 'luisteren', 'schrijven', 'spreken'));
  END IF;
END $$;

-- 3. Production's campaign_type CHECK allows only day2/day7, so an 'abandon' insert would be
--    rejected at runtime. Widen it to the baseline's set.
ALTER TABLE public.email_campaign_queue
  DROP CONSTRAINT IF EXISTS email_campaign_queue_campaign_type_check;
ALTER TABLE public.email_campaign_queue
  ADD CONSTRAINT email_campaign_queue_campaign_type_check
  CHECK (campaign_type IN ('day2', 'day7', 'abandon'));

ALTER TABLE public.email_campaign_queue
  ALTER COLUMN created_at SET DEFAULT now();
UPDATE public.email_campaign_queue SET created_at = now() WHERE created_at IS NULL;
ALTER TABLE public.email_campaign_queue
  ALTER COLUMN created_at SET NOT NULL;

COMMIT;

-- 4. The compatibility view nine read sites depend on. Recreated outside the transaction so a
--    column-order change cannot leave it half-dropped. `security_invoker = true` is required or the
--    view bypasses the RLS on `questions`.
CREATE OR REPLACE VIEW public.questions_flat
WITH (security_invoker = true) AS
  SELECT
    q.id,
    q.exam_id,
    q.stimulus_id,
    s.skill,
    s.section_id,
    s.sort_order        AS stimulus_order,
    q.sort_order,
    q.prompt            AS question,
    q.explanation,
    q.image_url,
    q.option_layout,
    q.prompt_audio_url  AS audio_question,
    q.review_status,
    q.reviewed_at,
    q.created_at,
    q.updated_at,
    -- Three more aliases so this view is a true drop-in for the old `questions` shape.
    -- `category` now resolves to the sub-skill's display name, which is what the
    -- per-question-type score breakdown was always meant to be keyed by.
    sec.name_nl         AS category,
    e.number            AS exam,
    -- The A2 free taster is static (data/free-practice.ts), so nothing is flagged into a
    -- DB-driven practice pool any more. Constant false keeps admin/exams working.
    false               AS oefenen,
    max(o.body)      FILTER (WHERE o.label = 'A') AS option_a,
    max(o.body)      FILTER (WHERE o.label = 'B') AS option_b,
    max(o.body)      FILTER (WHERE o.label = 'C') AS option_c,
    max(o.body)      FILTER (WHERE o.label = 'D') AS option_d,
    max(o.audio_url) FILTER (WHERE o.label = 'A') AS audio_a,
    max(o.audio_url) FILTER (WHERE o.label = 'B') AS audio_b,
    max(o.audio_url) FILTER (WHERE o.label = 'C') AS audio_c,
    max(o.audio_url) FILTER (WHERE o.label = 'D') AS audio_d,
    max(o.label)     FILTER (WHERE o.is_correct)  AS correct,
    count(o.id)                                   AS option_count
  FROM public.questions q
  JOIN public.stimuli s ON s.id = q.stimulus_id
  LEFT JOIN public.sections sec ON sec.id = s.section_id
  LEFT JOIN public.exams e ON e.id = q.exam_id
  LEFT JOIN public.question_options o ON o.question_id = q.id
  GROUP BY q.id, s.skill, s.section_id, s.sort_order, sec.name_nl, e.number;

NOTIFY pgrst, 'reload schema';
