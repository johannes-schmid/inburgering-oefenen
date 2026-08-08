-- ============================================================================
-- The category axis gets a table, and rubrics are bound to it
-- ============================================================================
-- `rubricCategory()` has been the single definition of a convention that lived in
-- three places at once: `rubrics.task_type` (free `text`, no constraint),
-- `exam_task_rules.category` (a string column added yesterday) and a `CASE` in two
-- SQL functions. Nothing tied them together, which left two silent failures:
--
--   1. **A typo'd rubric category never matches.** `rubrics.task_type` accepts any
--      string, so `speaking_choise` saves cleanly, `resolveRubric()` finds nothing,
--      and grading 409s with "geen actieve rubriek" pointing at nothing in
--      particular. The docent authored a rubric that can never be used.
--   2. **A task can be linked to a rubric for a different category.**
--      `open_tasks.rubric_id` is hand-picked. `exam_publish_issues()` checked the
--      rubric's *level* — because grading against the other level's anchors returns a
--      confident, plausible, wrong mark — and never checked its *category*, which
--      fails in exactly the same way. A `choose` opgave graded against the
--      `cover_all` rubric is marked on whether it covered three plaatjes it was never
--      shown.
--
-- So: `task_categories` is now the reference table, and both `rubrics.task_type` and
-- `exam_task_rules.category` are foreign keys into it. A category that does not exist
-- can no longer be written, and the mismatch above is a publish error.
--
-- **The table is level-independent, deliberately.** A category is a *kind of opgave*
-- ("kies een van de plaatjes"); it exists whether or not anyone has worked out the
-- rules for it at a given level. The rules stay level-keyed in `exam_task_rules`, and
-- B1 having no rule rows is what "unverified" means — it must not also mean "B1 has no
-- categories", or a B1 rubric could not be authored at all.
--
-- `label_nl` moves here from `exam_task_rules`, where it was per (level, skill,
-- category) and could disagree with itself across levels for no reason.
-- ============================================================================

-- ── 1. The categories ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.task_categories (
  skill      text NOT NULL REFERENCES public.skills(slug) ON UPDATE CASCADE,
  -- Must equal what rubricCategory() returns for a task of this kind.
  category   text NOT NULL,
  label_nl   text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (skill, category)
);

COMMENT ON TABLE public.task_categories IS
  'The kinds of open opgave, and the axis rubrics are keyed on. Level-independent: a '
  'category exists at every level, while its *rules* (exam_task_rules) are per level and '
  'may be unverified. Mirrors RubricCategory in lib/rubrics.ts.';

INSERT INTO public.task_categories (skill, category, label_nl, sort_order) VALUES
  ('schrijven', 'email',              'E-mail',                    10),
  ('schrijven', 'short_text',         'Korte tekst (wijkkrant)',   20),
  ('schrijven', 'form',               'Formulier invullen',        30),
  ('schrijven', 'picture_note',       'Briefje bij plaatjes',      40),
  -- speaking_none is unused at A2 and kept for an onderdeel that needs no plaatje.
  ('spreken',   'speaking_none',      'Geen plaatje',              10),
  ('spreken',   'speaking_react',     'Reageren op een situatie',  20),
  ('spreken',   'speaking_describe',  'Gebruik het plaatje',       30),
  ('spreken',   'speaking_choose',    'Kies een van de plaatjes',  40),
  ('spreken',   'speaking_cover_all', 'Gebruik alle plaatjes',     50)
ON CONFLICT (skill, category) DO NOTHING;

ALTER TABLE public.task_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read task categories" ON public.task_categories;
CREATE POLICY "Public read task categories"
  ON public.task_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins write task categories" ON public.task_categories;
CREATE POLICY "Admins write task categories"
  ON public.task_categories FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── 2. Bind exam_task_rules to it ───────────────────────────────────────────
-- label_nl lives in task_categories now; keeping a copy per (level, skill) meant the
-- same category could be labelled two different things at A2 and B1.

ALTER TABLE public.exam_task_rules DROP CONSTRAINT IF EXISTS exam_task_rules_category_fkey;
ALTER TABLE public.exam_task_rules
  ADD CONSTRAINT exam_task_rules_category_fkey
  FOREIGN KEY (skill, category) REFERENCES public.task_categories(skill, category)
  ON UPDATE CASCADE;

ALTER TABLE public.exam_task_rules DROP COLUMN IF EXISTS label_nl;

DROP POLICY IF EXISTS "Admins write task rules" ON public.exam_task_rules;
CREATE POLICY "Admins write task rules"
  ON public.exam_task_rules FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── 3. Bind rubrics to it ───────────────────────────────────────────────────
-- `rubrics.task_type` has always *held* the category string; nothing enforced it.
--
-- Added NOT VALID and validated separately, inside a DO block that downgrades failure to
-- a NOTICE. A pre-existing row with a mis-typed category must not turn this migration
-- into a failed deploy — the constraint governs every future write either way, and the
-- offenders are named so they can be fixed by hand. (This repo has already had one
-- production outage caused by a migration whose recorded state and real state differed;
-- a migration that cannot fail is worth the weaker guarantee on old rows.)

ALTER TABLE public.rubrics DROP CONSTRAINT IF EXISTS rubrics_category_fkey;
ALTER TABLE public.rubrics
  ADD CONSTRAINT rubrics_category_fkey
  FOREIGN KEY (skill, task_type) REFERENCES public.task_categories(skill, category)
  ON UPDATE CASCADE NOT VALID;

DO $$
DECLARE bad text;
BEGIN
  SELECT string_agg(format('#%s (%s/%s)', r.id, r.skill, r.task_type), ', ')
    INTO bad
  FROM public.rubrics r
  WHERE NOT EXISTS (
    SELECT 1 FROM public.task_categories c
    WHERE c.skill = r.skill AND c.category = r.task_type
  );

  IF bad IS NULL THEN
    ALTER TABLE public.rubrics VALIDATE CONSTRAINT rubrics_category_fkey;
    RAISE NOTICE 'rubrics_category_fkey validated: every rubric names a real category.';
  ELSE
    RAISE NOTICE 'rubrics_category_fkey left NOT VALID — these rubrics name no category: %', bad;
  END IF;
END $$;

COMMENT ON COLUMN public.rubrics.task_type IS
  'The rubricCategory() string, FK to task_categories. Named task_type for history: for '
  'Schrijven it *is* open_tasks.task_type, for Spreken it is ''speaking_'' || image_usage.';

-- ── 4. The tekstsoorten become editable from admin ──────────────────────────
-- `sections` had a public read policy and no write policy at all, so it could only ever
-- be changed by a migration. The exam builder now edits it.

DROP POLICY IF EXISTS "Admins write sections" ON public.sections;
CREATE POLICY "Admins write sections"
  ON public.sections FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── 5. The breakdown, labelled from task_categories ─────────────────────────
-- Now also reports which rubric would grade each soort, which is what makes the panel
-- answer "kan dit examen überhaupt beoordeeld worden?". Only the id and version are
-- exposed — never `criteria` or `system_prompt`, which are a scoring key.

DROP FUNCTION IF EXISTS public.exam_task_summary(bigint);
CREATE FUNCTION public.exam_task_summary(p_exam_id bigint)
RETURNS TABLE (
  category       text,
  label_nl       text,
  sort_order     integer,
  task_count     integer,
  image_count    integer,
  expected_min   smallint,
  expected_max   smallint,
  rubric_id      bigint,
  rubric_version integer
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH ex AS (
    SELECT id, level, skill FROM public.exams WHERE id = p_exam_id
  ),
  actual AS (
    SELECT CASE WHEN t.task_type <> 'speaking' THEN t.task_type
                ELSE 'speaking_' || t.image_usage END AS category,
           count(DISTINCT t.id)::int AS task_count,
           count(i.id)::int          AS image_count
    FROM public.open_tasks t
    LEFT JOIN public.open_task_images i ON i.task_id = t.id
    WHERE t.exam_id = p_exam_id
    GROUP BY 1
  ),
  expected AS (
    SELECT r.category, r.min_per_exam, r.max_per_exam
    FROM public.exam_task_rules r
    JOIN ex ON r.level IS NOT DISTINCT FROM ex.level AND r.skill = ex.skill
  )
  SELECT k.category,
         coalesce(c.label_nl, k.category),
         coalesce(c.sort_order, 9999),
         coalesce(a.task_count, 0),
         coalesce(a.image_count, 0),
         e.min_per_exam,
         e.max_per_exam,
         rb.id,
         rb.version
  -- Every category the rules expect, plus every category actually present. A soort the
  -- exam is missing must still appear, at 0 — that is the row worth seeing.
  FROM ex
  CROSS JOIN LATERAL (
    SELECT category FROM expected
    UNION
    SELECT category FROM actual
  ) k
  LEFT JOIN public.task_categories c ON c.skill = ex.skill AND c.category = k.category
  LEFT JOIN expected e ON e.category = k.category
  LEFT JOIN actual   a ON a.category = k.category
  LEFT JOIN public.rubrics rb
    ON rb.level IS NOT DISTINCT FROM ex.level
   AND rb.skill = ex.skill
   AND rb.task_type = k.category
   AND rb.active
  ORDER BY 3, 1;
$$;

COMMENT ON FUNCTION public.exam_task_summary IS
  'Per-soort breakdown of one Schrijven/Spreken exam for the admin ‘Opbouw’ panel, including '
  'which active rubric would grade each soort. SECURITY DEFINER only to read that rubric id '
  'and version past the admin-only policy on rubrics — no rubric *content* is returned. '
  'Categories the exam is missing come back at 0. Reports, never blocks.';

REVOKE ALL ON FUNCTION public.exam_task_summary(bigint) FROM public;
GRANT EXECUTE ON FUNCTION public.exam_task_summary(bigint) TO authenticated, service_role;

-- ── 6. The validator ────────────────────────────────────────────────────────
-- Unchanged from 20260806000000_open_skill_structure.sql except: the quota warning takes
-- its label from task_categories, and one new error branch for a rubric whose category
-- does not match the opgave it is attached to.

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
  -- The image-usage rule and the actual image count must agree, since the rubric grades
  -- against the rule ("Vertel iets bij elk plaatje"). Spreken only: a Schrijven
  -- picture_note carries pictures while necessarily having image_usage='none'.
  SELECT 'error', 'open_task', t.id,
         format('image_usage=%s verwacht %s afbeelding(en), gevonden %s',
                t.image_usage,
                CASE t.image_usage WHEN 'react' THEN 1 WHEN 'describe' THEN 1
                                   WHEN 'choose' THEN 2 WHEN 'cover_all' THEN 3
                                   ELSE 0 END,
                count(i.id))
  FROM public.open_tasks t
  LEFT JOIN public.open_task_images i ON i.task_id = t.id
  WHERE t.exam_id = p_exam_id AND t.skill = 'spreken'
  GROUP BY t.id, t.image_usage
  HAVING count(i.id) <> CASE t.image_usage
           WHEN 'react' THEN 1 WHEN 'describe' THEN 1 WHEN 'choose' THEN 2
           WHEN 'cover_all' THEN 3 ELSE 0 END

  UNION ALL
  SELECT 'error', 'open_task', t.id, 'Geen rubric gekoppeld'
  FROM public.open_tasks t
  WHERE t.exam_id = p_exam_id AND t.rubric_id IS NULL

  UNION ALL
  -- A rubric authored for the other level is worse than no rubric: it grades, and the
  -- mark looks legitimate. Cheap to check here, impossible to spot in the inbox.
  SELECT 'error', 'open_task', t.id,
         format('Rubriek is %s, examen is %s', upper(r.level::text), upper(e.level::text))
  FROM public.open_tasks t
  JOIN public.exams e   ON e.id = t.exam_id
  JOIN public.rubrics r ON r.id = t.rubric_id
  WHERE t.exam_id = p_exam_id AND r.level IS DISTINCT FROM e.level

  UNION ALL
  -- ...and a rubric for the wrong *category* fails identically. A 'kies een van de
  -- plaatjes' opgave graded against the 'gebruik alle plaatjes' rubriek is marked on
  -- whether it covered three plaatjes the candidate was never shown.
  SELECT 'error', 'open_task', t.id,
         format('Rubriek hoort bij “%s”, opgave is “%s”',
                coalesce(rc.label_nl, r.task_type), coalesce(tc.label_nl, k.category))
  FROM public.open_tasks t
  JOIN public.rubrics r ON r.id = t.rubric_id
  CROSS JOIN LATERAL (
    SELECT CASE WHEN t.task_type <> 'speaking' THEN t.task_type
                ELSE 'speaking_' || t.image_usage END AS category
  ) k
  LEFT JOIN public.task_categories tc ON tc.skill = t.skill AND tc.category = k.category
  LEFT JOIN public.task_categories rc ON rc.skill = r.skill AND rc.category = r.task_type
  WHERE t.exam_id = p_exam_id AND r.task_type IS DISTINCT FROM k.category

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
  SELECT 'warning', 'stimulus', s.id, 'Geen tekstsoort gekozen'
  FROM public.stimuli s
  JOIN public.exams e ON e.id = s.exam_id
  WHERE s.exam_id = p_exam_id
    AND s.section_id IS NULL
    AND EXISTS (SELECT 1 FROM public.sections sec
                WHERE sec.topic = e.skill
                  AND sec.level IS NOT DISTINCT FROM e.level)

  -- ── open-skill structure warnings ─────────────────────────────────────────

  UNION ALL
  -- The composition of the exam: how many of each soort opgave. A quota, not a
  -- blueprint — DUO's three Schrijven oefenexamens agree on the mix and disagree on the
  -- order, so only the mix is checked.
  SELECT 'warning', 'exam', e.id,
         format('%s: %s opgaven; verwacht %s',
                coalesce(c.label_nl, r.category), cnt.n,
                CASE WHEN r.min_per_exam IS NULL THEN format('maximaal %s', r.max_per_exam)
                     WHEN r.max_per_exam IS NULL THEN format('minimaal %s', r.min_per_exam)
                     WHEN r.min_per_exam = r.max_per_exam THEN r.min_per_exam::text
                     ELSE format('%s tot %s', r.min_per_exam, r.max_per_exam) END)
  FROM public.exams e
  JOIN public.exam_task_rules r
    ON r.level IS NOT DISTINCT FROM e.level AND r.skill = e.skill
  LEFT JOIN public.task_categories c ON c.skill = r.skill AND c.category = r.category
  CROSS JOIN LATERAL (
    SELECT count(*)::int AS n FROM public.open_tasks t
    WHERE t.exam_id = e.id
      AND (CASE WHEN t.task_type <> 'speaking' THEN t.task_type
                ELSE 'speaking_' || t.image_usage END) = r.category
  ) cnt
  WHERE e.id = p_exam_id
    AND e.number > 0
    AND (r.min_per_exam IS NOT NULL OR r.max_per_exam IS NOT NULL)
    AND (cnt.n < coalesce(r.min_per_exam, 0)
      OR cnt.n > coalesce(r.max_per_exam, 32767))

  UNION ALL
  -- Per-opgave rules: the stated minimum ("minimaal drie zinnen"), the bullet count of
  -- the opdracht, and the recording cap.
  SELECT 'warning', 'open_task', t.id, v.issue
  FROM public.open_tasks t
  JOIN public.exams e ON e.id = t.exam_id
  JOIN public.exam_task_rules r
    ON r.level IS NOT DISTINCT FROM e.level AND r.skill = e.skill
   AND r.category = CASE WHEN t.task_type <> 'speaking' THEN t.task_type
                         ELSE 'speaking_' || t.image_usage END
  CROSS JOIN LATERAL (VALUES
    (r.min_sentences IS NOT NULL AND t.min_sentences IS DISTINCT FROM r.min_sentences,
     format('Minimum aantal zinnen is %s; verwacht %s',
            coalesce(t.min_sentences::text, 'niet ingevuld'), r.min_sentences)),
    (r.bullets_min IS NOT NULL AND r.bullets_max IS NOT NULL
       AND (jsonb_array_length(t.bullet_points) < r.bullets_min
         OR jsonb_array_length(t.bullet_points) > r.bullets_max),
     format('%s punten in de opdracht; verwacht %s tot %s',
            jsonb_array_length(t.bullet_points), r.bullets_min, r.bullets_max)),
    (r.record_seconds IS NOT NULL AND t.max_record_seconds IS DISTINCT FROM r.record_seconds,
     format('Opnametijd is %s sec; verwacht %s sec',
            t.max_record_seconds, r.record_seconds))
  ) AS v(broken, issue)
  WHERE t.exam_id = p_exam_id AND v.broken

  UNION ALL
  -- Opgaven per onderdeel. Spreken's four onderdelen hold four vragen each; an
  -- onderdeel with three is a 15-item exam that still counts 16 overall.
  SELECT 'warning', 'exam_part', p.id,
         format('%s opgaven in dit onderdeel; verwacht %s',
                (SELECT count(*) FROM public.open_tasks t WHERE t.part_id = p.id),
                f.items_per_part)
  FROM public.exam_parts p
  JOIN public.exams e ON e.id = p.exam_id
  JOIN public.exam_formats f
    ON f.level IS NOT DISTINCT FROM e.level AND f.skill = e.skill
  WHERE p.exam_id = p_exam_id
    AND e.number > 0
    AND f.items_per_part IS NOT NULL
    AND (SELECT count(*) FROM public.open_tasks t WHERE t.part_id = p.id) <> f.items_per_part

  UNION ALL
  SELECT 'warning', 'open_task', t.id, 'Niet aan een onderdeel gekoppeld'
  FROM public.open_tasks t
  JOIN public.exams e ON e.id = t.exam_id
  WHERE t.exam_id = p_exam_id
    AND t.part_id IS NULL
    AND EXISTS (SELECT 1 FROM public.exam_parts p WHERE p.exam_id = e.id);
$$;

COMMENT ON FUNCTION public.exam_publish_issues IS
  'Pre-publish validator. Empty result = safe to publish; only ''error'' rows block, and '
  'every structure rule is a warning by design. The two rubric checks are errors: a rubric '
  'from the wrong level or the wrong category grades against anchors written for a different '
  'task and returns a mark that looks entirely legitimate. Counts come from exam_formats and '
  'exam_task_rules; an unverified (NULL) column skips its check rather than blocking on a guess.';
