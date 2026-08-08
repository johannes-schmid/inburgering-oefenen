-- ============================================================================
-- Exam structure, part two: Lezen, Schrijven and Spreken
-- ============================================================================
-- `20260805000000_exam_structure_rules.sql` gave the shape of an exam a home but
-- worked out one pair only — A2 Luisteren. Lezen carried the option range and
-- nothing else; Schrijven and Spreken carried nothing at all, and the admin's
-- "Opbouw" panel was hidden for them outright. A docent authoring a Schrijven
-- oefenexamen got no structural guidance of any kind.
--
-- DUO's own A2 material (resources/exam-references/A2/, format only — the content
-- is copyright) has now been worked through: 13 of 25 Lezen items, one full Spreken
-- oefenexamen, three full Schrijven oefenexamens. This migration records what that
-- actually evidences and nothing beyond it.
--
--   1. `image_usage` gains 'react' — DUO's Spreken onderdeel 1. There it is a video;
--      here it is one still image (owner's decision, 2026-08-08), because a video
--      pipeline for 4 of 16 items buys nothing the still does not.
--   2. `exam_task_rules`, the per-category rules the flat `exam_formats` row cannot
--      express. The category axis is the one that already exists: `rubricCategory()`
--      in lib/rubrics.ts, which collapses Schrijven's `task_type` and Spreken's
--      `image_usage` onto one string. Rubric authoring, grading and structure
--      validation therefore key the same way.
--   3. `exam_formats.items_per_part`, and A2 Lezen's questions-per-fragment range.
--   4. `sections` is **retired for the open skills**. `task_type` *is* the genre for
--      Schrijven and `image_usage` *is* the shape for Spreken; two axes that can
--      disagree about the same fact are worse than one. A2 Lezen gains the
--      'Regels of instructie' tekstsoort, which DUO uses and we had no row for.
--   5. `exam_task_summary(exam_id)`, the open-skill twin of `exam_structure_summary()`.
--   6. The validator, extended.
--
-- Deliberate, and the same rule the previous migration set: every column here is
-- NULLABLE and NULL means "unverified for this (level, skill)" — the validator skips
-- the check rather than blocking the docent on a guess. Only A2 rows are seeded.
-- Nobody has counted B1 off DUO's B1 material, so B1 stays absent rather than copied.
--
-- Deliberate: every new branch is a **warning**, per the owner's 2026-08-07 decision
-- that structure informs the docent and does not gate her.
--
-- Deliberate: the Schrijven composition rule is a quota (min/max per exam), not a
-- per-slot blueprint. All three DUO exams hold exactly one formulier and exactly one
-- korte tekst, but they order the four opgaven differently — so the mix is evidenced
-- and the order is not.
--
-- **Bug fix carried in here**: `20260803000000_open_skill_axis.sql` re-created
-- `exam_publish_issues()` and silently dropped the `AND t.skill = 'spreken'` filter
-- that `20260731100000_picture_note_images.sql` had added to the image-count branch;
-- `20260805` copied the regression forward. The effect is live: a Schrijven
-- picture_note carrying pictures necessarily has `image_usage = 'none'` (forced by
-- `open_tasks_image_usage_is_speaking`), so its images were counted against an
-- expectation of zero and reported as a hard publish error. The filter is restored
-- below. Lesson: a re-CREATE OR REPLACE of a big function is a rewrite, and a rewrite
-- from the wrong ancestor loses every fix made in between.
-- ============================================================================

-- ── 1. Spreken onderdeel 1: react ───────────────────────────────────────────
-- DUO's four onderdelen map one-for-one onto image_usage, which is exactly why the
-- rubric already keys on it: 1 → react (situatie, 1 plaatje), 2 → describe (gebruik
-- het plaatje), 3 → choose (kies er een), 4 → cover_all (gebruik alle plaatjes).

ALTER TABLE public.open_tasks
  DROP CONSTRAINT IF EXISTS open_tasks_image_usage_check;
ALTER TABLE public.open_tasks
  ADD CONSTRAINT open_tasks_image_usage_check
    CHECK (image_usage IN ('none', 'react', 'describe', 'choose', 'cover_all'));

COMMENT ON COLUMN public.open_tasks.image_usage IS
  'Spreken only (open_tasks_image_usage_is_speaking). The onderdeel''s picture rule, and '
  'the axis rubricCategory() keys Spreken rubrics on: react=1 plaatje, reageer op de '
  'situatie · describe=1 plaatje, beschrijf · choose=2 plaatjes, kies er een · '
  'cover_all=3 plaatjes, gebruik ze alle. ''none'' is unused at A2.';

-- ── 2. Per-category rules ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.exam_task_rules (
  level          public.cefr_level,
  skill          text NOT NULL REFERENCES public.skills(slug) ON UPDATE CASCADE,
  -- The rubricCategory() string: a Schrijven task_type, or 'speaking_' || image_usage.
  category       text NOT NULL,
  label_nl       text NOT NULL,
  sort_order     integer NOT NULL DEFAULT 0,
  min_per_exam   smallint CHECK (min_per_exam   IS NULL OR min_per_exam   >= 0),
  max_per_exam   smallint CHECK (max_per_exam   IS NULL OR max_per_exam   >= 0),
  image_count    smallint CHECK (image_count    IS NULL OR image_count    >= 0),
  min_sentences  smallint CHECK (min_sentences  IS NULL OR min_sentences  > 0),
  bullets_min    smallint CHECK (bullets_min    IS NULL OR bullets_min    > 0),
  bullets_max    smallint CHECK (bullets_max    IS NULL OR bullets_max    > 0),
  record_seconds smallint CHECK (record_seconds IS NULL OR record_seconds > 0),
  verified_note  text,
  CONSTRAINT exam_task_rules_key UNIQUE NULLS NOT DISTINCT (level, skill, category),
  CONSTRAINT exam_task_rules_ranges_ordered CHECK (
        (min_per_exam IS NULL OR max_per_exam IS NULL OR min_per_exam <= max_per_exam)
    AND (bullets_min  IS NULL OR bullets_max  IS NULL OR bullets_min  <= bullets_max)
  )
);

COMMENT ON TABLE public.exam_task_rules IS
  'What one kind of open opgave looks like, per (level, skill, rubricCategory). The '
  'per-category axis exam_formats cannot hold. Every rule column is nullable and NULL '
  'means unverified — exam_publish_issues() skips that check rather than blocking on a '
  'guess. Mirrored in data/skills.ts (TASK_RULES); change both in one commit.';
COMMENT ON COLUMN public.exam_task_rules.category IS
  'Must equal rubricCategory(task) from lib/rubrics.ts: a Schrijven task_type, or '
  '''speaking_'' || image_usage for Spreken.';
COMMENT ON COLUMN public.exam_task_rules.label_nl IS
  'Dutch label used in validator messages. The admin UI labels from CATEGORY_LABELS in '
  'lib/rubrics.ts, which also covers categories with no rule row.';

ALTER TABLE public.exam_task_rules ENABLE ROW LEVEL SECURITY;

-- Reference data, like sections: readable by any signed-in docent or candidate, written
-- only by a migration or the service key.
DROP POLICY IF EXISTS exam_task_rules_read ON public.exam_task_rules;
CREATE POLICY exam_task_rules_read ON public.exam_task_rules
  FOR SELECT TO authenticated USING (true);

-- A2 Schrijven: four opgaven. Verified across all three DUO oefenexamens — always
-- exactly one formulier and exactly one korte tekst voor de wijkkrant; the other two
-- slots are e-mails, or one e-mail and one briefje. image_count stays NULL: DUO's forms
-- and briefjes carry 0, 2, 3 or 4 pictures depending on the task, and that variation is
-- real rather than an omission.
INSERT INTO public.exam_task_rules
  (level, skill, category, label_nl, sort_order,
   min_per_exam, max_per_exam, image_count, min_sentences, bullets_min, bullets_max,
   record_seconds, verified_note)
VALUES
  ('a2', 'schrijven', 'email',        'E-mail',                     10,
   1, 2, NULL, NULL, 2,    4,    NULL,
   'DUO A2 oefenexamens schrijven 1-3: 2, 2 en 1 e-mail; 2-4 bullets per opdracht.'),
  ('a2', 'schrijven', 'short_text',   'Korte tekst (wijkkrant)',    20,
   1, 1, NULL, 3,    NULL, NULL, NULL,
   'Precies een per examen in alle drie; "Schrijf minimaal drie zinnen op."'),
  ('a2', 'schrijven', 'form',         'Formulier invullen',         30,
   1, 1, NULL, NULL, NULL, NULL, NULL,
   'Precies een per examen in alle drie.'),
  ('a2', 'schrijven', 'picture_note', 'Briefje bij plaatjes',       40,
   0, 1, NULL, 3,    NULL, NULL, NULL,
   'Alleen in oefenexamen 3; "Schrijf drie dingen op."'),

-- A2 Spreken: 16 opgaven over vier onderdelen, vier per onderdeel, 60 seconden opname
-- per opgave. Verified off the DUO oefenexamen player (16 vragen / 35 minuten, teller
-- 1..16, recorder capped at 01:00).
  ('a2', 'spreken', 'speaking_react',     'Reageren op een situatie',   10,
   4, 4, 1, NULL, NULL, NULL, 60,
   'Onderdeel 1. Bij DUO een video; hier een plaatje (besluit eigenaar 2026-08-08).'),
  ('a2', 'spreken', 'speaking_describe',  'Gebruik het plaatje',        20,
   4, 4, 1, NULL, NULL, NULL, 60,
   'Onderdeel 2: "U ziet vier vragen met een plaatje."'),
  ('a2', 'spreken', 'speaking_choose',    'Kies een van de plaatjes',   30,
   4, 4, 2, NULL, NULL, NULL, 60,
   'Onderdeel 3: "U kiest steeds een plaatje."'),
  ('a2', 'spreken', 'speaking_cover_all', 'Gebruik alle plaatjes',      40,
   4, 4, 3, NULL, NULL, NULL, 60,
   'Onderdeel 4: "Gebruik steeds alle plaatjes. Vertel iets bij elk plaatje."')
ON CONFLICT DO NOTHING;

-- ── 3. exam_formats: items per onderdeel, and A2 Lezen ──────────────────────

ALTER TABLE public.exam_formats
  ADD COLUMN IF NOT EXISTS items_per_part smallint
    CHECK (items_per_part IS NULL OR items_per_part > 0);

COMMENT ON COLUMN public.exam_formats.items_per_part IS
  'Opgaven per exam_parts row. NULL = unverified, check skipped. A2 Spreken: 4.';

UPDATE public.exam_formats SET items_per_part = 4
WHERE level = 'a2' AND skill = 'spreken';

-- A2 Lezen shares one text across 1 to 3 questions. Evidenced: Q10+Q11 on one e-mail,
-- Q18+Q20 on one folder (so a set spans three numbers), Q24+Q25 on one regelblad, and
-- single-question short texts elsewhere.
--
-- stimulus_count stays NULL on purpose. Only 13 of the 25 items were captured, and 13
-- items is not a count of fragments. An invented number here becomes the standard the
-- docent's work is measured against — the same reason B1's item counts are still NULL.
UPDATE public.exam_formats SET
  questions_per_stimulus_min = 1,
  questions_per_stimulus_max = 3
WHERE level = 'a2' AND skill = 'lezen';

-- ── 4. Tekstsoorten ─────────────────────────────────────────────────────────

-- DUO's A2 Lezen uses a rules/procedure text (huisregels, ziekmeldingsprocedure) that
-- is none of advertentie / brief / formulier / folder / artikel. Two of the 13 sampled
-- items sat on one.
INSERT INTO public.sections (level, topic, slug, name_nl, sort_order, rationale)
VALUES ('a2', 'lezen', 'regels', 'Regels of instructie', 45,
        'Huisregels, procedures, gebruiksaanwijzingen. Vraagt om zoekend lezen naar een '
        'voorwaarde of een verplichting.')
ON CONFLICT (level, slug) DO NOTHING;

INSERT INTO public.sections (level, topic, slug, name_nl, sort_order, rationale)
SELECT 'b1', topic, slug, name_nl, sort_order, rationale
FROM public.sections WHERE level = 'a2' AND slug = 'regels'
ON CONFLICT (level, slug) DO NOTHING;

-- Retire the tekstsoort axis for the open skills. For Schrijven the genre *is*
-- `task_type` and for Spreken the shape *is* `image_usage`; keeping a second axis that
-- says the same thing means two places to disagree, and `exam_task_rules` is now the
-- one that rubrics and grading already key on. Both `stimuli.section_id` and
-- `open_tasks.section_id` are ON DELETE SET NULL, and there is no open-skill content
-- yet, so nothing is orphaned. Branch 17 of the validator ("Geen tekstsoort gekozen")
-- is guarded by an EXISTS over sections for the skill, so it self-disables here.
DELETE FROM public.sections WHERE topic IN ('schrijven', 'spreken');

-- ── 5. The open-skill breakdown ─────────────────────────────────────────────
-- The twin of exam_structure_summary(), for exams whose items are open_tasks. A FULL
-- OUTER JOIN, not a left join from the tasks: a category the exam is *missing entirely*
-- must come back with task_count 0, or "there is no formulier in this exam" — the single
-- most useful thing the panel can say — is invisible.

CREATE OR REPLACE FUNCTION public.exam_task_summary(p_exam_id bigint)
RETURNS TABLE (
  category     text,
  label_nl     text,
  sort_order   integer,
  task_count   integer,
  image_count  integer,
  expected_min smallint,
  expected_max smallint
)
LANGUAGE sql STABLE AS $$
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
    SELECT r.category, r.label_nl, r.sort_order, r.min_per_exam, r.max_per_exam
    FROM public.exam_task_rules r
    JOIN ex ON r.level IS NOT DISTINCT FROM ex.level AND r.skill = ex.skill
  )
  SELECT coalesce(e.category, a.category),
         coalesce(e.label_nl, a.category),
         coalesce(e.sort_order, 9999),
         coalesce(a.task_count, 0),
         coalesce(a.image_count, 0),
         e.min_per_exam,
         e.max_per_exam
  FROM expected e
  FULL OUTER JOIN actual a ON a.category = e.category
  ORDER BY 3, 1;
$$;

COMMENT ON FUNCTION public.exam_task_summary IS
  'Per-soort breakdown of one Schrijven/Spreken exam, for the admin ‘Opbouw’ panel. '
  'Categories the exam is missing come back with task_count 0 — that is the point. '
  'Reports, never blocks.';

REVOKE ALL ON FUNCTION public.exam_task_summary(bigint) FROM public;
GRANT EXECUTE ON FUNCTION public.exam_task_summary(bigint) TO authenticated, service_role;

-- ── 6. The validator ────────────────────────────────────────────────────────
-- Unchanged from 20260805000000_exam_structure_rules.sql except:
--   · the image-count branch regains `AND t.skill = 'spreken'` (see the header) and
--     maps the new 'react' to one image;
--   · four new warning branches at the end for the open skills.

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
  -- against the rule ("Vertel iets bij elk plaatje").
  SELECT 'error', 'open_task', t.id,
         format('image_usage=%s verwacht %s afbeelding(en), gevonden %s',
                t.image_usage,
                CASE t.image_usage WHEN 'react' THEN 1 WHEN 'describe' THEN 1
                                   WHEN 'choose' THEN 2 WHEN 'cover_all' THEN 3
                                   ELSE 0 END,
                count(i.id))
  FROM public.open_tasks t
  LEFT JOIN public.open_task_images i ON i.task_id = t.id
  -- Spreken only: `image_usage` is a speaking instruction, and a Schrijven picture_note
  -- carries pictures while necessarily having image_usage='none'. Restored here after
  -- 20260803 dropped it — see the header.
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
  -- has 25 items.
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
  -- Questions per fragment. DUO shares one text across 2–3 questions in Luisteren and
  -- 1–3 in Lezen; a Luisteren fragment with one question is one the candidate barely
  -- gets to use.
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
  -- actually has categories seeded — which, since this migration, excludes the open
  -- skills entirely.
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
                r.label_nl, cnt.n,
                CASE WHEN r.min_per_exam IS NULL THEN format('maximaal %s', r.max_per_exam)
                     WHEN r.max_per_exam IS NULL THEN format('minimaal %s', r.min_per_exam)
                     WHEN r.min_per_exam = r.max_per_exam THEN r.min_per_exam::text
                     ELSE format('%s tot %s', r.min_per_exam, r.max_per_exam) END)
  FROM public.exams e
  JOIN public.exam_task_rules r
    ON r.level IS NOT DISTINCT FROM e.level AND r.skill = e.skill
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
  -- the opdracht, and the recording cap. One row per rule broken, so the docent sees
  -- which of the three it is.
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
  -- An opgave in an exam that has onderdelen but sits in none of them renders outside
  -- every onderdeel in the player, after the last one.
  SELECT 'warning', 'open_task', t.id, 'Niet aan een onderdeel gekoppeld'
  FROM public.open_tasks t
  JOIN public.exams e ON e.id = t.exam_id
  WHERE t.exam_id = p_exam_id
    AND t.part_id IS NULL
    AND EXISTS (SELECT 1 FROM public.exam_parts p WHERE p.exam_id = e.id);
$$;

COMMENT ON FUNCTION public.exam_publish_issues IS
  'Pre-publish validator. Empty result = safe to publish; only ''error'' rows block, and '
  'every structure rule (fragment count, questions per fragment, audio length, '
  'tekstsoort, samenstelling van de opgaven, opgaven per onderdeel) is a warning by '
  'design. Counts come from exam_formats and exam_task_rules; an unverified (NULL) '
  'column skips its check rather than blocking on a guess. Called by the admin, never as '
  'a trigger — work in progress must stay savable.';
