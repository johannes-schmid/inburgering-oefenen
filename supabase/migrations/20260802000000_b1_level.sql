-- ════════════════════════════════════════════════════════════════════════════
-- Add a second CEFR level (B1) alongside A2.
--
-- The baseline modelled the product as A2-only: nothing carried a level, and every
-- key was `(skill, number)`. That is not a missing column so much as five unique
-- constraints that make a second level *impossible* rather than merely absent —
-- B1 Lezen 1 collides with A2 Lezen 1 on `exams`, on `exam_attempts`, and in the
-- `exam_results` view; `sections.slug` is globally unique; and only one rubric per
-- (skill, task_type) may be active at a time, which is the most damaging of the five
-- because rubric anchors are inherently level-specific.
--
-- Two of the gaps failed *silently* rather than erroring, which is why this migration
-- exists rather than a column-add:
--   • `grading_examples` had no level, so A2 few-shot exemplars would have been fed
--     into B1 grading prompts. No error — just systematically wrong marks.
--   • `exam_publish_issues()` hardcoded the A2 item counts (25/25/4/16) in a CASE,
--     so any B1 exam with a different shape would be permanently unpublishable.
--
-- Everything defaults to 'a2', so every existing row keeps its current meaning and
-- no application read changes behaviour until it opts into passing a level.
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. the level domain ─────────────────────────────────────────────────────
-- A domain rather than a repeated CHECK: the level list is one fact, and B2 is a
-- plausible third (DUO examines A2, B1 and B2). Adding it later is one ALTER here
-- instead of six CHECK rewrites that can silently drift apart.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cefr_level') THEN
    CREATE DOMAIN public.cefr_level AS text
      CHECK (VALUE IN ('a2', 'b1'));
  END IF;
END $$;

COMMENT ON DOMAIN public.cefr_level IS
  'CEFR level of a piece of content. Lowercase to match the URL segment. Extend the '
  'CHECK to add B2 — do not add a parallel column.';


-- ── 2. exams ────────────────────────────────────────────────────────────────
ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS level public.cefr_level NOT NULL DEFAULT 'a2';

-- The old key made (skill, number) globally unique, which is exactly the collision.
ALTER TABLE public.exams DROP CONSTRAINT IF EXISTS exams_skill_number_key;
ALTER TABLE public.exams
  ADD CONSTRAINT exams_level_skill_number_key UNIQUE (level, skill, number);

DROP INDEX IF EXISTS public.exams_skill_published_idx;
CREATE INDEX IF NOT EXISTS exams_level_skill_published_idx
  ON public.exams (level, skill, number) WHERE published;

COMMENT ON COLUMN public.exams.level IS
  'CEFR level. Ten exams per (level, skill) — the number restarts at 1 for each level.';


-- ── 3. sections (the sub-skills) ────────────────────────────────────────────
-- B1 examines the same four skills through different sub-skills, and even where a
-- slug repeats ('gesprek') the rationale and the name differ by level. A globally
-- unique slug forced the two levels to share one row.
ALTER TABLE public.sections
  ADD COLUMN IF NOT EXISTS level public.cefr_level NOT NULL DEFAULT 'a2';

ALTER TABLE public.sections DROP CONSTRAINT IF EXISTS sections_slug_key;
ALTER TABLE public.sections
  ADD CONSTRAINT sections_level_slug_key UNIQUE (level, slug);

COMMENT ON TABLE public.sections IS
  'The sub-skills of one (level, skill), grouped by skill in `topic`. Drives the '
  'per-question-type score breakdown. Column names are inherited from KNM on purpose.';


-- ── 4. rubrics ──────────────────────────────────────────────────────────────
-- The single most blocking constraint in the baseline: `rubrics_one_active_idx` is
-- UNIQUE (skill, task_type) WHERE active, so an active A2 'email' rubric and an
-- active B1 'email' rubric could not coexist. Rubric anchors describe what a mark
-- *means* at a level, so sharing them across levels is not a simplification — it
-- would grade B1 candidates against A2 expectations.
ALTER TABLE public.rubrics
  ADD COLUMN IF NOT EXISTS level public.cefr_level NOT NULL DEFAULT 'a2';

ALTER TABLE public.rubrics DROP CONSTRAINT IF EXISTS rubrics_skill_type_version_key;
ALTER TABLE public.rubrics
  ADD CONSTRAINT rubrics_level_skill_type_version_key
  UNIQUE (level, skill, task_type, version);

DROP INDEX IF EXISTS public.rubrics_one_active_idx;
-- Still at most one active rubric per key — the key just gained a level.
-- Activating v2 must still deactivate v1 FIRST; that discipline is unchanged.
CREATE UNIQUE INDEX IF NOT EXISTS rubrics_one_active_idx
  ON public.rubrics (level, skill, task_type) WHERE active;


-- ── 5. grading_examples ─────────────────────────────────────────────────────
-- Without this the train/test split leaks across levels: fetchFewShot would hand the
-- grader A2 exemplars while marking a B1 answer, and nothing would report an error.
ALTER TABLE public.grading_examples
  ADD COLUMN IF NOT EXISTS level public.cefr_level NOT NULL DEFAULT 'a2';

DROP INDEX IF EXISTS public.grading_examples_fewshot_idx;
CREATE INDEX IF NOT EXISTS grading_examples_fewshot_idx
  ON public.grading_examples (level, skill, task_type) WHERE use_as_fewshot;

COMMENT ON COLUMN public.grading_examples.level IS
  'Never mix levels in one few-shot set. An A2 exemplar shown while grading B1 is a '
  'silent scoring bug, not a near-miss.';


-- ── 6. exam_attempts ────────────────────────────────────────────────────────
-- The candidate-progress collision. `exam_id` is ON DELETE SET NULL, so the FK cannot
-- be relied on to recover the level after an exam row is removed — the level has to be
-- denormalised onto the attempt, exactly as `skill` and `exam_number` already are.
ALTER TABLE public.exam_attempts
  ADD COLUMN IF NOT EXISTS level public.cefr_level NOT NULL DEFAULT 'a2';

ALTER TABLE public.exam_attempts DROP CONSTRAINT IF EXISTS exam_attempts_no_key;
ALTER TABLE public.exam_attempts
  ADD CONSTRAINT exam_attempts_no_key
  UNIQUE (user_id, level, skill, exam_number, attempt_no);

DROP INDEX IF EXISTS public.exam_attempts_user_skill_idx;
CREATE INDEX IF NOT EXISTS exam_attempts_user_level_skill_idx
  ON public.exam_attempts (user_id, level, skill, exam_number);

-- The attempt-number generator counted attempts across levels, so a candidate's first
-- B1 Lezen 1 sitting would have been numbered 4 because they had sat A2 Lezen 1 three
-- times — and `attempt_no` is what orders the progress series.
CREATE OR REPLACE FUNCTION public.exam_attempts_set_attempt_no()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.attempt_no IS NULL OR NEW.attempt_no = 1 THEN
    SELECT COALESCE(MAX(a.attempt_no), 0) + 1 INTO NEW.attempt_no
    FROM public.exam_attempts a
    WHERE a.user_id = NEW.user_id
      AND a.level = NEW.level
      AND a.skill = NEW.skill
      AND a.exam_number = NEW.exam_number;
  END IF;
  RETURN NEW;
END;
$$;


-- ── 7. exam_results view ────────────────────────────────────────────────────
-- DISTINCT ON (user_id, skill, exam_number) would have collapsed a candidate's A2 and
-- B1 attempt at the same exam number into one "latest" row, picking whichever had the
-- higher attempt_no. Dropped rather than replaced: CREATE OR REPLACE VIEW can only
-- append columns, and `level` belongs beside `skill`.
DROP VIEW IF EXISTS public.exam_results;
CREATE VIEW public.exam_results
WITH (security_invoker = true) AS
  SELECT DISTINCT ON (a.user_id, a.level, a.skill, a.exam_number)
    a.id,
    a.user_id,
    a.exam_id,
    a.level,
    a.skill,
    a.exam_number,
    a.attempt_no,
    a.score,
    a.total,
    a.pct,
    a.passed,
    a.cat_scores,
    a.pass_threshold_pct,
    a.completed_at
  FROM public.exam_attempts a
  WHERE a.completed_at IS NOT NULL
  ORDER BY a.user_id, a.level, a.skill, a.exam_number, a.attempt_no DESC;

COMMENT ON VIEW public.exam_results IS
  'Latest completed attempt per user/level/skill/exam. Read-only — write to exam_attempts.';


-- ── 8. questions_flat view ──────────────────────────────────────────────────
-- Every consumer reads `exam` as a bare number; without `level` beside it that number
-- is now ambiguous two ways (it was already ambiguous across skills).
DROP VIEW IF EXISTS public.questions_flat;
CREATE VIEW public.questions_flat
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
    sec.name_nl         AS category,
    e.level,
    e.number            AS exam,
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
  GROUP BY q.id, s.skill, s.section_id, s.sort_order, sec.name_nl, e.level, e.number;

COMMENT ON VIEW public.questions_flat IS
  'Back-compat for read sites still expecting option_a/b/c. Read-only; write to '
  'question_options. Remove once all callers have migrated.';


-- ── 9. the exam format lookup ───────────────────────────────────────────────
-- `exam_publish_issues()` hardcoded the A2 item counts in a CASE over skill. That is a
-- fact about DUO's format per level, not a property of the code, so it becomes data.
--
-- `item_count` is NULLABLE and that is load-bearing: a NULL means "we have not verified
-- DUO's count for this (level, skill)", and the validator then SKIPS the count check
-- rather than blocking the publish. The A2 counts were read off the start screens of
-- DUO's ten public A2 practice exams (SEO/facts.md §1). No equivalent verification has
-- been done for B1, and inventing the numbers would put an unsourced claim into the
-- thing that decides whether the docent's work is publishable.
CREATE TABLE IF NOT EXISTS public.exam_formats (
  level            public.cefr_level NOT NULL,
  skill            text NOT NULL CHECK (skill IN ('lezen','luisteren','schrijven','spreken')),
  -- NULL = unverified, validator skips the check. Never guess a value in here.
  item_count       smallint CHECK (item_count IS NULL OR item_count > 0),
  duration_seconds integer  CHECK (duration_seconds IS NULL OR duration_seconds > 0),
  -- Spreken runs as four onderdelen at A2. NULL = do not check.
  part_count       smallint CHECK (part_count IS NULL OR part_count > 0),
  verified_note    text,
  PRIMARY KEY (level, skill)
);

COMMENT ON TABLE public.exam_formats IS
  'DUO''s exam shape per (level, skill). A NULL item_count means unverified — '
  'exam_publish_issues() skips the count check rather than blocking on a guess. '
  'Mirror any change into data/skills.ts; the two must not drift.';

INSERT INTO public.exam_formats (level, skill, item_count, duration_seconds, part_count, verified_note) VALUES
  ('a2', 'lezen',      25, 65*60, NULL, 'Counted off the start screens of DUO''s 10 public A2 practice exams, 2026-07-28. See SEO/facts.md §1.'),
  ('a2', 'luisteren',  25, 45*60, NULL, 'Counted off the start screens of DUO''s 10 public A2 practice exams, 2026-07-28. See SEO/facts.md §1.'),
  ('a2', 'schrijven',   4, 40*60, NULL, 'Counted off the start screens of DUO''s 10 public A2 practice exams, 2026-07-28. See SEO/facts.md §1.'),
  ('a2', 'spreken',    16, 35*60,    4, 'Counted off the start screens of DUO''s 10 public A2 practice exams, 2026-07-28. See SEO/facts.md §1.'),
  -- B1: UNVERIFIED. Durations are published by DUO on the same page as A2's
  -- (inburgeren.nl/examen-doen/inhoud-taalexamens-a2-b1-b2.jsp) but have not been
  -- re-read for this table, and DUO publishes no item counts at all. Leave NULL until
  -- someone counts them off the B1 practice exams the way A2's were counted.
  ('b1', 'lezen',     NULL, NULL, NULL, 'UNVERIFIED — count off DUO''s B1 practice exams before filling in.'),
  ('b1', 'luisteren', NULL, NULL, NULL, 'UNVERIFIED — count off DUO''s B1 practice exams before filling in.'),
  ('b1', 'schrijven', NULL, NULL, NULL, 'UNVERIFIED — count off DUO''s B1 practice exams before filling in.'),
  ('b1', 'spreken',   NULL, NULL, NULL, 'UNVERIFIED — count off DUO''s B1 practice exams before filling in.')
ON CONFLICT (level, skill) DO NOTHING;

ALTER TABLE public.exam_formats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read exam formats" ON public.exam_formats;
CREATE POLICY "Public read exam formats" ON public.exam_formats FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins write exam formats" ON public.exam_formats;
CREATE POLICY "Admins write exam formats"
  ON public.exam_formats FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ── 10. exam_publish_issues(), level-aware ──────────────────────────────────
-- Identical to the baseline except for the last two branches, which now read
-- exam_formats instead of a hardcoded CASE and skip when the format is unverified.
CREATE OR REPLACE FUNCTION public.exam_publish_issues(p_exam_id bigint)
RETURNS TABLE (severity text, entity text, entity_id bigint, issue text)
LANGUAGE sql STABLE AS $$
  SELECT 'error', 'question', q.id, 'Geen juist antwoord aangevinkt'
  FROM public.questions q
  WHERE q.exam_id = p_exam_id
    AND NOT EXISTS (SELECT 1 FROM public.question_options o
                    WHERE o.question_id = q.id AND o.is_correct)

  UNION ALL
  SELECT 'error', 'question', q.id,
         format('%s antwoordopties; DUO gebruikt 3 of 4', count(o.id))
  FROM public.questions q
  LEFT JOIN public.question_options o ON o.question_id = q.id
  WHERE q.exam_id = p_exam_id
  GROUP BY q.id
  HAVING count(o.id) NOT IN (3, 4)

  UNION ALL
  SELECT 'error', 'option', o.id,
         CASE WHEN q.option_layout = 'text'
              THEN 'Tekstoptie zonder tekst'
              ELSE 'Afbeeldingsoptie zonder afbeelding' END
  FROM public.question_options o
  JOIN public.questions q ON q.id = o.question_id
  WHERE q.exam_id = p_exam_id
    AND ((q.option_layout = 'text'  AND o.body IS NULL)
      OR (q.option_layout <> 'text' AND cardinality(o.image_urls) = 0))

  UNION ALL
  SELECT 'error', 'question', q.id, 'Geen uitleg'
  FROM public.questions q
  WHERE q.exam_id = p_exam_id AND coalesce(btrim(q.explanation), '') = ''

  UNION ALL
  SELECT 'error', 'stimulus', s.id, 'Stimulus zonder vragen'
  FROM public.stimuli s
  WHERE s.exam_id = p_exam_id
    AND NOT EXISTS (SELECT 1 FROM public.questions q WHERE q.stimulus_id = s.id)

  UNION ALL
  SELECT 'warning', 'stimulus', s.id,
         'Dialoog met meerdere sprekers zonder voice_cast'
  FROM public.stimuli s
  WHERE s.exam_id = p_exam_id
    AND s.script IS NOT NULL
    AND s.script LIKE '%B:%'
    AND (s.voice_cast IS NULL OR s.voice_cast = '{}'::jsonb)

  UNION ALL
  SELECT 'error', 'stimulus', s.id, 'Nog niet gevalideerd door de docent'
  FROM public.stimuli s
  WHERE s.exam_id = p_exam_id AND s.review_status <> 'validated'

  UNION ALL
  SELECT 'error', 'open_task', t.id,
         format('image_usage=%s verwacht %s afbeelding(en), gevonden %s',
                t.image_usage,
                CASE t.image_usage WHEN 'describe' THEN 1 WHEN 'choose' THEN 2
                                   WHEN 'cover_all' THEN 3 ELSE 0 END,
                count(i.id))
  FROM public.open_tasks t
  LEFT JOIN public.open_task_images i ON i.task_id = t.id
  WHERE t.exam_id = p_exam_id
  GROUP BY t.id, t.image_usage
  HAVING count(i.id) <> CASE t.image_usage
           WHEN 'describe' THEN 1 WHEN 'choose' THEN 2 WHEN 'cover_all' THEN 3 ELSE 0 END

  UNION ALL
  SELECT 'error', 'open_task', t.id, 'Geen rubric gekoppeld'
  FROM public.open_tasks t
  WHERE t.exam_id = p_exam_id AND t.rubric_id IS NULL

  UNION ALL
  -- A rubric authored for the other level is worse than no rubric: it grades, and the
  -- mark looks legitimate. Cheap to check here, impossible to spot in the inbox.
  SELECT 'error', 'open_task', t.id,
         format('Rubric is %s, examen is %s', upper(r.level::text), upper(e.level::text))
  FROM public.open_tasks t
  JOIN public.exams e   ON e.id = t.exam_id
  JOIN public.rubrics r ON r.id = t.rubric_id
  WHERE t.exam_id = p_exam_id AND r.level <> e.level

  UNION ALL
  SELECT 'warning', 'open_task', t.id, 'Geen voorbeeldantwoord'
  FROM public.open_tasks t
  WHERE t.exam_id = p_exam_id AND coalesce(btrim(t.model_answer), '') = ''

  UNION ALL
  -- Item count must match exam_formats for this (level, skill). A NULL item_count
  -- means the format is unverified and the join drops the row — no check, no block.
  SELECT 'error', 'exam', e.id,
         format('%s opgaven; %s %s heeft er %s bij DUO',
                cnt.n, upper(e.level::text), e.skill, f.item_count)
  FROM public.exams e
  JOIN public.exam_formats f ON f.level = e.level AND f.skill = e.skill
  CROSS JOIN LATERAL (
    SELECT CASE WHEN e.skill IN ('lezen','luisteren')
                THEN (SELECT count(*) FROM public.questions q WHERE q.exam_id = e.id)
                ELSE (SELECT count(*) FROM public.open_tasks t WHERE t.exam_id = e.id)
           END AS n
  ) cnt
  WHERE e.id = p_exam_id AND f.item_count IS NOT NULL AND cnt.n <> f.item_count

  UNION ALL
  -- Same treatment for Spreken's onderdelen: driven by exam_formats.part_count,
  -- skipped where that is NULL.
  SELECT 'error', 'exam', e.id,
         format('%s %s heeft %s onderdelen nodig, gevonden %s',
                upper(e.level::text), e.skill, f.part_count,
                (SELECT count(*) FROM public.exam_parts p WHERE p.exam_id = e.id))
  FROM public.exams e
  JOIN public.exam_formats f ON f.level = e.level AND f.skill = e.skill
  WHERE e.id = p_exam_id
    AND f.part_count IS NOT NULL
    AND (SELECT count(*) FROM public.exam_parts p WHERE p.exam_id = e.id) <> f.part_count;
$$;

COMMENT ON FUNCTION public.exam_publish_issues IS
  'Pre-publish validator. Empty result = safe to publish. Item/part counts come from '
  'exam_formats; an unverified (NULL) format skips those checks rather than blocking. '
  'Called by the admin, never as a trigger — work in progress must stay savable.';


-- ── 11. B1 structural data ──────────────────────────────────────────────────
-- This lives in the migration, not in seed.sql, because seed.sql only runs on a local
-- `db reset`. The 40 A2 slots reached production by some other route and that is exactly
-- the local/production drift CLAUDE.md records as having caused an outage — B1's slots
-- go through the migration so both sides get them from the same statement.

-- The sub-skills, copied from A2. B1 examines the same four skills through the same
-- item types; what differs is the difficulty of the material, not the taxonomy. The
-- names and rationale are a starting point for the docent to edit per level — which is
-- the whole reason `sections` is now keyed (level, slug) rather than slug alone.
INSERT INTO public.sections (level, topic, slug, name_nl, sort_order)
SELECT 'b1', s.topic, s.slug, s.name_nl, s.sort_order
FROM public.sections s
WHERE s.level = 'a2'
ON CONFLICT (level, slug) DO NOTHING;

-- The 40 B1 slots: ten per skill, all unpublished, none free.
--
-- Deliberately different from A2 on both counts. Exam 1 is NOT free here — the free
-- tier is A2 exam 1 of each skill (see isFreeExam in data/skills.ts), and giving away a
-- B1 exam as well is a pricing decision nobody has made. And nothing is published,
-- because there is no B1 content yet; a published empty exam is a 404 with extra steps.
--
-- `duration_seconds` is NOT NULL, so these carry the A2 durations as a placeholder.
-- They are NOT verified DUO B1 durations — exam_formats.duration_seconds is NULL for
-- B1 for precisely that reason. Confirm each against DUO before publishing the exam.
INSERT INTO public.exams (level, skill, number, title, is_free, duration_seconds, published)
SELECT
  'b1',
  s.skill,
  n.number,
  format('%s B1 — oefenexamen %s', initcap(s.skill), n.number),
  false,
  s.placeholder_duration,
  false
FROM (VALUES
  ('lezen',     65 * 60),
  ('luisteren', 45 * 60),
  ('schrijven', 40 * 60),
  ('spreken',   35 * 60)
) AS s(skill, placeholder_duration)
CROSS JOIN generate_series(1, 10) AS n(number)
ON CONFLICT (level, skill, number) DO NOTHING;

COMMIT;
