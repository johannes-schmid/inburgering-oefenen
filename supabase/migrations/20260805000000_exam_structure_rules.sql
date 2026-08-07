-- ============================================================================
-- Exam structure: the format rules, and the category breakdown per exam
-- ============================================================================
-- Until now an exam was a bag of items: `exam_formats.item_count` said "25 vragen"
-- and nothing else. A real A2 Luisteren exam is more specific than that — 10
-- fragments, 2–3 questions on each, 3 or 4 answer options, ~40–50 seconds of audio
-- per fragment, spread over the four text types DUO uses. The docent could see how
-- many items were missing, never *what kind*.
--
-- Three parts:
--   1. `exam_formats` gains the numeric rules. Every column is NULLABLE and NULL
--      means "unverified for this (level, skill)" — the validator then skips that
--      check rather than blocking on a guess. Only A2 Luisteren is filled in here;
--      nobody has counted the other three off DUO's exams (SEO/facts.md §1) and an
--      invented number in this table is an unsourced claim that decides whether the
--      docent's work can go live.
--   2. `stimuli.audio_seconds`, because the duration rule cannot be checked from a
--      URL and is not recoverable server-side after the fact.
--   3. `exam_structure_summary(exam_id)`, the per-category breakdown the admin
--      renders. The category axis is `sections` — it already exists, is level-keyed,
--      and `stimuli.section_id` already points at it. Nothing new was needed there.
--
-- Deliberate: every new branch in `exam_publish_issues()` is a **warning**. The
-- owner's decision (2026-08-07) is that structure informs the docent, it does not
-- gate her. A 24-of-25 exam that she wants live must be able to go live. The one
-- exception is the option-count branch, which was already an error and stays one —
-- it now reads its 3/4 from the format instead of hardcoding it.
--
-- Deliberate: there is no per-category quota. "This exam needs three telefoongesprek
-- fragments" is not a fact anyone has verified about DUO's exams, so the summary
-- reports the distribution and the docent judges it.
-- ============================================================================

-- ── 1. The format rules ─────────────────────────────────────────────────────

ALTER TABLE public.exam_formats
  ADD COLUMN IF NOT EXISTS stimulus_count             smallint
    CHECK (stimulus_count IS NULL OR stimulus_count > 0),
  ADD COLUMN IF NOT EXISTS questions_per_stimulus_min smallint
    CHECK (questions_per_stimulus_min IS NULL OR questions_per_stimulus_min > 0),
  ADD COLUMN IF NOT EXISTS questions_per_stimulus_max smallint
    CHECK (questions_per_stimulus_max IS NULL OR questions_per_stimulus_max > 0),
  ADD COLUMN IF NOT EXISTS options_min                smallint
    CHECK (options_min IS NULL OR options_min BETWEEN 2 AND 4),
  ADD COLUMN IF NOT EXISTS options_max                smallint
    CHECK (options_max IS NULL OR options_max BETWEEN 2 AND 4),
  ADD COLUMN IF NOT EXISTS audio_seconds_min          smallint
    CHECK (audio_seconds_min IS NULL OR audio_seconds_min > 0),
  ADD COLUMN IF NOT EXISTS audio_seconds_max          smallint
    CHECK (audio_seconds_max IS NULL OR audio_seconds_max > 0);

-- A min above its max would silently make every item fail its own rule.
ALTER TABLE public.exam_formats
  DROP CONSTRAINT IF EXISTS exam_formats_ranges_ordered;
ALTER TABLE public.exam_formats
  ADD CONSTRAINT exam_formats_ranges_ordered CHECK (
        (questions_per_stimulus_min IS NULL OR questions_per_stimulus_max IS NULL
         OR questions_per_stimulus_min <= questions_per_stimulus_max)
    AND (options_min IS NULL OR options_max IS NULL OR options_min <= options_max)
    AND (audio_seconds_min IS NULL OR audio_seconds_max IS NULL
         OR audio_seconds_min <= audio_seconds_max)
  );

COMMENT ON COLUMN public.exam_formats.stimulus_count IS
  'Fragments (teksten/audio) per exam. NULL = unverified, check skipped.';
COMMENT ON COLUMN public.exam_formats.audio_seconds_min IS
  'Lower bound on one audio fragment. Checked against stimuli.audio_seconds.';

-- A2 Luisteren, the only (level, skill) whose shape has been worked out: 25 questions
-- over 10 fragments, 2–3 questions each, 3 or 4 options, 40–50 seconds of audio.
UPDATE public.exam_formats SET
  stimulus_count             = 10,
  questions_per_stimulus_min = 2,
  questions_per_stimulus_max = 3,
  options_min                = 3,
  options_max                = 4,
  audio_seconds_min          = 40,
  audio_seconds_max          = 50
WHERE level = 'a2' AND skill = 'luisteren';

-- The option count is the one rule that holds across all four A2 onderdelen with an
-- answer key, and it was already hardcoded as an error in the validator. Filling it in
-- here is a move, not a new claim.
UPDATE public.exam_formats SET options_min = 3, options_max = 4
WHERE level = 'a2' AND skill = 'lezen';

-- ── 2. Audio duration on the stimulus ───────────────────────────────────────

ALTER TABLE public.stimuli
  ADD COLUMN IF NOT EXISTS audio_seconds numeric(6,2)
    CHECK (audio_seconds IS NULL OR audio_seconds > 0);

COMMENT ON COLUMN public.stimuli.audio_seconds IS
  'Length of audio_url in seconds. Written by /api/generate-stimulus-audio, or read '
  'off the <audio> element in admin for a pasted URL. NULL on a text/image stimulus.';

-- ── 3. The category breakdown ───────────────────────────────────────────────
-- One row per text type present in the exam, plus a trailing row for stimuli with no
-- category chosen. Left join on sections so an uncategorised fragment is *visible*
-- rather than dropped — a missing category is exactly what this screen is for.

CREATE OR REPLACE FUNCTION public.exam_structure_summary(p_exam_id bigint)
RETURNS TABLE (
  section_id      smallint,
  name_nl         text,
  sort_order      integer,
  stimulus_count  integer,
  question_count  integer
)
LANGUAGE sql STABLE AS $$
  SELECT s.section_id,
         coalesce(sec.name_nl, 'Geen tekstsoort'),
         coalesce(sec.sort_order, 9999),
         count(DISTINCT s.id)::int,
         count(q.id)::int
  FROM public.stimuli s
  LEFT JOIN public.sections  sec ON sec.id = s.section_id
  LEFT JOIN public.questions q   ON q.stimulus_id = s.id
  WHERE s.exam_id = p_exam_id
  GROUP BY s.section_id, sec.name_nl, sec.sort_order
  ORDER BY 3, 2;
$$;

COMMENT ON FUNCTION public.exam_structure_summary IS
  'Per-tekstsoort breakdown of one exam, for the admin ‘Opbouw’ panel. Stimuli with no '
  'section_id come back as ‘Geen tekstsoort’ and sort last. Reports, never blocks.';

REVOKE ALL ON FUNCTION public.exam_structure_summary(bigint) FROM public;
GRANT EXECUTE ON FUNCTION public.exam_structure_summary(bigint) TO authenticated, service_role;

-- ── 4. The validator, with the structure rules ──────────────────────────────
-- Unchanged from 20260803000000_open_skill_axis.sql except: the option-count branch
-- now reads its bounds from exam_formats (COALESCE to the old 3/4, so nothing changes
-- where the format is unfilled), and four new warning branches at the end.

CREATE OR REPLACE FUNCTION public.exam_publish_issues(p_exam_id bigint)
RETURNS TABLE (severity text, entity text, entity_id bigint, issue text)
LANGUAGE sql STABLE AS $$
  SELECT 'error', 'question', q.id, 'Geen juist antwoord aangevinkt'
  FROM public.questions q
  WHERE q.exam_id = p_exam_id
    AND NOT EXISTS (SELECT 1 FROM public.question_options o
                    WHERE o.question_id = q.id AND o.is_correct)

  UNION ALL
  -- Bounds come from exam_formats; an unfilled format falls back to DUO's 3-or-4.
  SELECT 'error', 'question', q.id,
         format('%s antwoordopties; verwacht %s of %s',
                count(o.id), coalesce(f.options_min, 3), coalesce(f.options_max, 4))
  FROM public.questions q
  JOIN public.exams e ON e.id = q.exam_id
  LEFT JOIN public.exam_formats f
    ON f.level IS NOT DISTINCT FROM e.level AND f.skill = e.skill
  LEFT JOIN public.question_options o ON o.question_id = q.id
  WHERE q.exam_id = p_exam_id
  GROUP BY q.id, f.options_min, f.options_max
  HAVING count(o.id) < coalesce(f.options_min, 3)
      OR count(o.id) > coalesce(f.options_max, 4)

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
  -- A stimulus nobody asks a question about is dead weight in the player.
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
  WHERE t.exam_id = p_exam_id AND r.level IS DISTINCT FROM e.level

  UNION ALL
  SELECT 'warning', 'open_task', t.id, 'Geen voorbeeldantwoord'
  FROM public.open_tasks t
  WHERE t.exam_id = p_exam_id AND coalesce(btrim(t.model_answer), '') = ''

  UNION ALL
  -- Item count must match exam_formats for this (level, skill). A NULL item_count
  -- means the format is unverified and the join drops the row — no check, no block.
  SELECT 'error', 'exam', e.id,
         format('%s opgaven; %s%s heeft er %s bij DUO',
                cnt.n,
                CASE WHEN e.level IS NULL THEN '' ELSE upper(e.level::text) || ' ' END,
                e.skill, f.item_count)
  FROM public.exams e
  JOIN public.exam_formats f
    ON f.level IS NOT DISTINCT FROM e.level AND f.skill = e.skill
  CROSS JOIN LATERAL (
    SELECT CASE WHEN sk.scoring = 'mcq'
                THEN (SELECT count(*) FROM public.questions q WHERE q.exam_id = e.id)
                ELSE (SELECT count(*) FROM public.open_tasks t WHERE t.exam_id = e.id)
           END AS n
    FROM public.skills sk WHERE sk.slug = e.skill
  ) cnt
  -- `e.number > 0` skips the backlog, which is a holding area and by definition never
  -- has 25 items. Before this migration it reported "0 opgaven; A2 luisteren heeft er
  -- 25 bij DUO" as a hard error on every visit to the backlog screen.
  WHERE e.id = p_exam_id AND e.number > 0
    AND f.item_count IS NOT NULL AND cnt.n <> f.item_count

  UNION ALL
  -- Onderdeel-count rule (Spreken's four onderdelen), driven by exam_formats.
  SELECT 'error', 'exam', e.id,
         format('%s%s heeft %s onderdelen nodig, gevonden %s',
                CASE WHEN e.level IS NULL THEN '' ELSE upper(e.level::text) || ' ' END,
                e.skill, f.part_count,
                (SELECT count(*) FROM public.exam_parts p WHERE p.exam_id = e.id))
  FROM public.exams e
  JOIN public.exam_formats f
    ON f.level IS NOT DISTINCT FROM e.level AND f.skill = e.skill
  WHERE e.id = p_exam_id
    AND e.number > 0
    AND f.part_count IS NOT NULL
    AND (SELECT count(*) FROM public.exam_parts p WHERE p.exam_id = e.id) <> f.part_count

  -- ── structure warnings, all skipped where the format is unverified ────────

  UNION ALL
  -- Fragment count. Skipped on the backlog (number 0): it is a holding area, not an
  -- exam, and "10 fragmenten verwacht" there is noise on every single visit.
  SELECT 'warning', 'exam', e.id,
         format('%s fragmenten; verwacht %s',
                (SELECT count(*) FROM public.stimuli s WHERE s.exam_id = e.id),
                f.stimulus_count)
  FROM public.exams e
  JOIN public.exam_formats f
    ON f.level IS NOT DISTINCT FROM e.level AND f.skill = e.skill
  WHERE e.id = p_exam_id
    AND e.number > 0
    AND f.stimulus_count IS NOT NULL
    AND (SELECT count(*) FROM public.stimuli s WHERE s.exam_id = e.id) <> f.stimulus_count

  UNION ALL
  -- Questions per fragment. DUO shares one text across 2–3 questions; a fragment with
  -- one question is a fragment the candidate barely gets to use.
  SELECT 'warning', 'stimulus', s.id,
         format('%s vragen bij dit fragment; verwacht %s tot %s',
                count(q.id), f.questions_per_stimulus_min, f.questions_per_stimulus_max)
  FROM public.stimuli s
  JOIN public.exams e ON e.id = s.exam_id
  JOIN public.exam_formats f
    ON f.level IS NOT DISTINCT FROM e.level AND f.skill = e.skill
  LEFT JOIN public.questions q ON q.stimulus_id = s.id
  WHERE s.exam_id = p_exam_id
    AND f.questions_per_stimulus_min IS NOT NULL
    AND f.questions_per_stimulus_max IS NOT NULL
  GROUP BY s.id, f.questions_per_stimulus_min, f.questions_per_stimulus_max
  HAVING count(q.id) > 0
     AND (count(q.id) < f.questions_per_stimulus_min
       OR count(q.id) > f.questions_per_stimulus_max)

  UNION ALL
  -- Audio length. An unmeasured fragment reports separately from one that is measured
  -- and wrong — the first is a missing number, the second is a content decision.
  SELECT 'warning', 'stimulus', s.id,
         CASE WHEN s.audio_seconds IS NULL
              THEN 'Lengte van de audio niet vastgelegd'
              ELSE format('Audio duurt %s sec; verwacht %s tot %s sec',
                          round(s.audio_seconds), f.audio_seconds_min, f.audio_seconds_max)
         END
  FROM public.stimuli s
  JOIN public.exams e ON e.id = s.exam_id
  JOIN public.exam_formats f
    ON f.level IS NOT DISTINCT FROM e.level AND f.skill = e.skill
  WHERE s.exam_id = p_exam_id
    AND s.kind = 'audio'
    AND f.audio_seconds_min IS NOT NULL
    AND f.audio_seconds_max IS NOT NULL
    AND (s.audio_seconds IS NULL
      OR s.audio_seconds < f.audio_seconds_min
      OR s.audio_seconds > f.audio_seconds_max)

  UNION ALL
  -- No tekstsoort means the fragment is invisible in the Opbouw panel and in the
  -- candidate's per-tekstsoort score breakdown. Only worth saying where the skill
  -- actually has categories seeded.
  SELECT 'warning', 'stimulus', s.id, 'Geen tekstsoort gekozen'
  FROM public.stimuli s
  JOIN public.exams e ON e.id = s.exam_id
  WHERE s.exam_id = p_exam_id
    AND s.section_id IS NULL
    AND EXISTS (SELECT 1 FROM public.sections sec
                WHERE sec.topic = e.skill
                  AND sec.level IS NOT DISTINCT FROM e.level);
$$;

COMMENT ON FUNCTION public.exam_publish_issues IS
  'Pre-publish validator. Empty result = safe to publish; only ''error'' rows block, and '
  'every structure rule (fragment count, questions per fragment, audio length, '
  'tekstsoort) is a warning by design. All counts come from exam_formats; an unverified '
  '(NULL) column skips its check rather than blocking on a guess. Called by the admin, '
  'never as a trigger — work in progress must stay savable.';
