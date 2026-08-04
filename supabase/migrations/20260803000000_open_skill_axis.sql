-- ════════════════════════════════════════════════════════════════════════════
-- Open the onderdeel axis, so a fifth exam component can be added without a
-- schema rewrite.
--
-- This adds **no new onderdeel**. It removes the three things that would force a
-- migration-against-live-data later:
--
--   1. The four skills are hardcoded in eight CHECK constraints that can silently
--      drift apart. They become foreign keys to a `skills` reference table, so
--      adding KNM later is one INSERT rather than eight ALTERs.
--
--   2. `questions.stimulus_id` is NOT NULL. Lezen and Luisteren questions hang off
--      a shared stimulus (DUO reuses one text across 2–3 questions), but a
--      KNM-style question stands alone — the inherited KNM corpus has no stimulus
--      at all. The column becomes nullable, and a trigger keeps today's guarantee
--      per skill: a Lezen question without a stimulus is still impossible.
--
--   3. `exams.level` is NOT NULL. KNM is not examined at A2 versus B1 — it is one
--      exam. Forcing `level = 'a2'` on it would put it under the A2 dashboard and
--      the A2 bundle while B1 candidates need it too. Level becomes nullable for
--      onderdelen that are not CEFR-graded, and a trigger enforces which is which.
--
-- Nothing about the four existing skills changes: all four are levelled, all four
-- require a stimulus where they use one, and every current row keeps its values.
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. the skills reference table ───────────────────────────────────────────
-- The taxonomy as data. `data/skills.ts` still holds the display taxonomy for the
-- app (it must render without a DB round trip), but the *database's* notion of
-- which onderdelen exist now lives here, and the flags below are what let the
-- constraints be generic instead of naming skills one by one.
CREATE TABLE IF NOT EXISTS public.skills (
  slug        text PRIMARY KEY,
  name_nl     text NOT NULL,
  sort_order  integer NOT NULL DEFAULT 0,
  scoring     text NOT NULL CHECK (scoring IN ('mcq', 'open')),
  -- Do this onderdeel's questions hang off a shared stimulus?
  -- true  → Lezen/Luisteren: a text or audio fragment carries 1..N questions.
  -- false → a standalone question, which is the KNM shape.
  -- Read by questions_require_stimulus() below; this is the only place the rule lives.
  requires_stimulus boolean NOT NULL DEFAULT true,
  -- Is it examined per CEFR level? false ⇒ `exams.level` must be NULL for it.
  is_levelled boolean NOT NULL DEFAULT true,
  -- Offered to candidates. Lets a future onderdeel's rows and content exist,
  -- authored and reviewed, before anything links to it.
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.skills IS
  'The exam onderdelen. Adding one is an INSERT here plus its content — no migration. '
  'Mirror the display side into data/skills.ts (SkillSlug + FORMATS) in the same commit.';
COMMENT ON COLUMN public.skills.requires_stimulus IS
  'false ⇒ questions may have a NULL stimulus_id (the KNM shape). Enforced by trigger.';
COMMENT ON COLUMN public.skills.is_levelled IS
  'false ⇒ exams.level must be NULL: the onderdeel is one exam, not one per CEFR level.';

INSERT INTO public.skills (slug, name_nl, sort_order, scoring, requires_stimulus, is_levelled) VALUES
  ('lezen',     'Lezen',     10, 'mcq',  true,  true),
  ('luisteren', 'Luisteren', 20, 'mcq',  true,  true),
  -- The open skills use `open_tasks`, not `questions`, so requires_stimulus never
  -- applies to them. Left true so it can never be the reason a question is allowed
  -- to lose its stimulus.
  ('schrijven', 'Schrijven', 30, 'open', true,  true),
  ('spreken',   'Spreken',   40, 'open', true,  true)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read skills" ON public.skills;
CREATE POLICY "Public read skills" ON public.skills FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins write skills" ON public.skills;
CREATE POLICY "Admins write skills"
  ON public.skills FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ── 2. CHECK constraints → foreign keys ─────────────────────────────────────
-- Eight enumerated lists become eight references to one row set. The FK is what
-- makes them incapable of drifting apart, which the CHECKs were not: they were
-- already inconsistent (stimuli listed two skills, the rest listed four) and
-- nothing would have caught a fifth being added to seven of the eight.
ALTER TABLE public.exams            DROP CONSTRAINT IF EXISTS exams_skill_check;
ALTER TABLE public.exam_attempts    DROP CONSTRAINT IF EXISTS exam_attempts_skill_check;
ALTER TABLE public.sections         DROP CONSTRAINT IF EXISTS sections_topic_check;
ALTER TABLE public.exam_submissions DROP CONSTRAINT IF EXISTS exam_submissions_skill_check;
ALTER TABLE public.exam_formats     DROP CONSTRAINT IF EXISTS exam_formats_skill_check;
ALTER TABLE public.word_cards       DROP CONSTRAINT IF EXISTS word_cards_skill_check;
ALTER TABLE public.leren_content    DROP CONSTRAINT IF EXISTS leren_content_skill_check;
ALTER TABLE public.stimuli          DROP CONSTRAINT IF EXISTS stimuli_skill_check;

-- ON UPDATE CASCADE so renaming a slug is possible; no ON DELETE, because deleting
-- an onderdeel that has content should fail loudly rather than cascade.
ALTER TABLE public.exams
  ADD CONSTRAINT exams_skill_fkey FOREIGN KEY (skill)
  REFERENCES public.skills(slug) ON UPDATE CASCADE;
ALTER TABLE public.exam_attempts
  ADD CONSTRAINT exam_attempts_skill_fkey FOREIGN KEY (skill)
  REFERENCES public.skills(slug) ON UPDATE CASCADE;
ALTER TABLE public.sections
  ADD CONSTRAINT sections_topic_fkey FOREIGN KEY (topic)
  REFERENCES public.skills(slug) ON UPDATE CASCADE;
ALTER TABLE public.exam_formats
  ADD CONSTRAINT exam_formats_skill_fkey FOREIGN KEY (skill)
  REFERENCES public.skills(slug) ON UPDATE CASCADE;
ALTER TABLE public.stimuli
  ADD CONSTRAINT stimuli_skill_fkey FOREIGN KEY (skill)
  REFERENCES public.skills(slug) ON UPDATE CASCADE;

-- `exam_submissions.skill`, `word_cards.skill` and `leren_content.skill` are all
-- nullable and hold anonymous-funnel or feature-flagged-off data. FK'd too, so the
-- vocabulary is one set everywhere, but a NULL stays allowed.
ALTER TABLE public.exam_submissions
  ADD CONSTRAINT exam_submissions_skill_fkey FOREIGN KEY (skill)
  REFERENCES public.skills(slug) ON UPDATE CASCADE;
ALTER TABLE public.word_cards
  ADD CONSTRAINT word_cards_skill_fkey FOREIGN KEY (skill)
  REFERENCES public.skills(slug) ON UPDATE CASCADE;
ALTER TABLE public.leren_content
  ADD CONSTRAINT leren_content_skill_fkey FOREIGN KEY (skill)
  REFERENCES public.skills(slug) ON UPDATE CASCADE;

-- `stimuli` previously allowed only ('lezen','luisteren'). That rule is now
-- derived: a stimulus only makes sense for an onderdeel whose questions use one.
CREATE OR REPLACE FUNCTION public.stimuli_skill_supports_stimulus()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE ok boolean;
BEGIN
  SELECT s.requires_stimulus AND s.scoring = 'mcq' INTO ok
  FROM public.skills s WHERE s.slug = NEW.skill;
  IF ok IS NOT TRUE THEN
    RAISE EXCEPTION 'Onderdeel % gebruikt geen stimuli', NEW.skill
      USING HINT = 'Alleen een MCQ-onderdeel met requires_stimulus mag stimuli hebben.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stimuli_check_skill ON public.stimuli;
CREATE TRIGGER stimuli_check_skill
  BEFORE INSERT OR UPDATE OF skill ON public.stimuli
  FOR EACH ROW EXECUTE FUNCTION public.stimuli_skill_supports_stimulus();


-- ── 3. questions may stand alone ────────────────────────────────────────────
ALTER TABLE public.questions ALTER COLUMN stimulus_id DROP NOT NULL;

-- The guarantee that was previously NOT NULL, now expressed per onderdeel. Kept as
-- a hard error rather than a publish-time warning: `exam_publish_issues()` is the
-- right home for "this content is incomplete", but "a Lezen question with no text
-- to read" is not incomplete work, it is a broken row the player cannot render.
--
-- The skill is resolved through `exam_id` (NOT NULL) rather than through the
-- stimulus — which is the whole point, since there may not be one.
CREATE OR REPLACE FUNCTION public.questions_require_stimulus()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE needs boolean; sk text;
BEGIN
  IF NEW.stimulus_id IS NOT NULL THEN RETURN NEW; END IF;

  SELECT e.skill, s.requires_stimulus INTO sk, needs
  FROM public.exams e
  JOIN public.skills s ON s.slug = e.skill
  WHERE e.id = NEW.exam_id;

  IF needs IS NOT FALSE THEN
    RAISE EXCEPTION 'Onderdeel % vereist een stimulus bij elke vraag', coalesce(sk, '?')
      USING HINT = 'Zet skills.requires_stimulus op false voor een onderdeel met losse vragen.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS questions_check_stimulus ON public.questions;
CREATE TRIGGER questions_check_stimulus
  BEFORE INSERT OR UPDATE OF stimulus_id, exam_id ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.questions_require_stimulus();

-- The baseline's `questions_sync_exam_id()` derives exam_id *from the stimulus* and
-- raises if the lookup yields nothing — which for a NULL stimulus_id is always. It
-- would therefore reject every standalone question no matter what the flags say, so
-- making the column nullable is not enough on its own.
--
-- Now: with a stimulus, unchanged (the stimulus remains the authority, so a question
-- can never drift to a different exam than its stimulus). Without one, the supplied
-- exam_id stands — it is NOT NULL, so there is always a value, and it is the only
-- thing that can tell us which exam a standalone question belongs to.
--
-- Trigger order matters and happens to be right: for one event PostgreSQL fires
-- triggers in name order, so `questions_check_stimulus` runs before
-- `questions_sync_exam_id`. The check reads the supplied exam_id, which is exactly
-- what a standalone question has; for a stimulus-backed one the check returns early
-- and never reads it.
CREATE OR REPLACE FUNCTION public.questions_sync_exam_id()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.stimulus_id IS NULL THEN
    IF NEW.exam_id IS NULL THEN
      RAISE EXCEPTION 'Een losse vraag heeft een exam_id nodig';
    END IF;
    RETURN NEW;
  END IF;

  SELECT s.exam_id INTO NEW.exam_id FROM public.stimuli s WHERE s.id = NEW.stimulus_id;
  IF NEW.exam_id IS NULL THEN
    RAISE EXCEPTION 'stimulus % does not exist', NEW.stimulus_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Ordering for standalone questions. `questions_stimulus_sort_key` is
-- UNIQUE (stimulus_id, sort_order) and NULLs are distinct, so it stops constraining
-- anything the moment stimulus_id is NULL — every standalone question could claim
-- sort_order 1. This is the equivalent guarantee, scoped to the exam.
CREATE UNIQUE INDEX IF NOT EXISTS questions_exam_sort_key
  ON public.questions (exam_id, sort_order) WHERE stimulus_id IS NULL;


-- ── 4. exams.level may be absent ────────────────────────────────────────────
-- Dropping the default as well as the NOT NULL: a default of 'a2' on a
-- non-levelled onderdeel would silently file it under A2 rather than fail. No
-- application code inserts into `exams` (the slots are seeded), so nothing relies
-- on the default.
ALTER TABLE public.exams ALTER COLUMN level DROP NOT NULL;
ALTER TABLE public.exams ALTER COLUMN level DROP DEFAULT;
ALTER TABLE public.sections ALTER COLUMN level DROP NOT NULL;
ALTER TABLE public.sections ALTER COLUMN level DROP DEFAULT;
ALTER TABLE public.exam_attempts ALTER COLUMN level DROP NOT NULL;
-- `exam_formats` had PRIMARY KEY (level, skill), and a PK column cannot be made
-- nullable — so the key has to go first. It is replaced in section 5 by a
-- NULLS NOT DISTINCT unique constraint, which is what a nullable level needs anyway.
ALTER TABLE public.exam_formats DROP CONSTRAINT IF EXISTS exam_formats_pkey;
ALTER TABLE public.exam_formats ALTER COLUMN level DROP NOT NULL;

-- `rubrics.level` and `grading_examples.level` stay NOT NULL. Both belong to the
-- two rubric-graded skills, which are CEFR-levelled by definition — a rubric's
-- anchors describe what a mark means *at a level*, so a level-less rubric has no
-- meaning. A non-levelled onderdeel that needed rubric grading would have to
-- revisit this deliberately.

CREATE OR REPLACE FUNCTION public.exams_level_matches_skill()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE levelled boolean;
BEGIN
  SELECT s.is_levelled INTO levelled FROM public.skills s WHERE s.slug = NEW.skill;

  IF levelled AND NEW.level IS NULL THEN
    RAISE EXCEPTION 'Onderdeel % wordt per niveau geëxamineerd; level mag niet leeg zijn', NEW.skill;
  END IF;
  IF NOT levelled AND NEW.level IS NOT NULL THEN
    RAISE EXCEPTION 'Onderdeel % kent geen niveaus; level moet leeg zijn', NEW.skill
      USING HINT = 'Zet skills.is_levelled op true als dit onderdeel wél per niveau bestaat.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS exams_check_level ON public.exams;
CREATE TRIGGER exams_check_level
  BEFORE INSERT OR UPDATE OF level, skill ON public.exams
  FOR EACH ROW EXECUTE FUNCTION public.exams_level_matches_skill();


-- ── 5. uniqueness that survives a NULL level ────────────────────────────────
-- The trap this closes: in a plain UNIQUE constraint NULLs are *distinct*, so with
-- a nullable level `UNIQUE (level, skill, number)` would let two rows for the same
-- non-levelled exam number both exist — the duplicate the constraint is there to
-- prevent, reappearing precisely for the new case.
--
-- `NULLS NOT DISTINCT` (PostgreSQL 15+; local and hosted are both 17) fixes it
-- while keeping the column list intact, so existing `ON CONFLICT (level, skill,
-- number)` clauses in seed.sql and the B1 migration keep working. An expression
-- index over COALESCE would not — ON CONFLICT would have to name the expression.
ALTER TABLE public.exams DROP CONSTRAINT IF EXISTS exams_level_skill_number_key;
ALTER TABLE public.exams
  ADD CONSTRAINT exams_level_skill_number_key
  UNIQUE NULLS NOT DISTINCT (level, skill, number);

ALTER TABLE public.sections DROP CONSTRAINT IF EXISTS sections_level_slug_key;
ALTER TABLE public.sections
  ADD CONSTRAINT sections_level_slug_key
  UNIQUE NULLS NOT DISTINCT (level, slug);

ALTER TABLE public.exam_attempts DROP CONSTRAINT IF EXISTS exam_attempts_no_key;
ALTER TABLE public.exam_attempts
  ADD CONSTRAINT exam_attempts_no_key
  UNIQUE NULLS NOT DISTINCT (user_id, level, skill, exam_number, attempt_no);

-- The PK was already dropped in section 4 (a PK column cannot be nullable).
ALTER TABLE public.exam_formats
  ADD CONSTRAINT exam_formats_level_skill_key
  UNIQUE NULLS NOT DISTINCT (level, skill);

-- The attempt-number generator compares levels, and `=` is never true for two
-- NULLs — so on a non-levelled onderdeel every sitting would have been numbered 1
-- and collided on the key above.
CREATE OR REPLACE FUNCTION public.exam_attempts_set_attempt_no()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.attempt_no IS NULL OR NEW.attempt_no = 1 THEN
    SELECT COALESCE(MAX(a.attempt_no), 0) + 1 INTO NEW.attempt_no
    FROM public.exam_attempts a
    WHERE a.user_id = NEW.user_id
      AND a.level IS NOT DISTINCT FROM NEW.level
      AND a.skill = NEW.skill
      AND a.exam_number = NEW.exam_number;
  END IF;
  RETURN NEW;
END;
$$;


-- ── 6. questions_flat survives a missing stimulus ───────────────────────────
-- Two changes, both required by nullable stimulus_id:
--   • LEFT JOIN stimuli. It was an inner join, so every standalone question would
--     have silently vanished from the admin content list — present in the database,
--     absent from the only screen that lists it.
--   • `skill` now comes from `exams`, not `stimuli`. The exam is the reliable
--     source (exam_id is NOT NULL); the stimulus may not be there at all.
DROP VIEW IF EXISTS public.questions_flat;
CREATE VIEW public.questions_flat
WITH (security_invoker = true) AS
  SELECT
    q.id,
    q.exam_id,
    q.stimulus_id,
    e.skill,
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
  JOIN public.exams e ON e.id = q.exam_id
  LEFT JOIN public.stimuli s ON s.id = q.stimulus_id
  LEFT JOIN public.sections sec ON sec.id = s.section_id
  LEFT JOIN public.question_options o ON o.question_id = q.id
  GROUP BY q.id, e.skill, s.section_id, s.sort_order, sec.name_nl, e.level, e.number;

COMMENT ON VIEW public.questions_flat IS
  'Back-compat for read sites still expecting option_a/b/c. Read-only; write to '
  'question_options. `skill` comes from the exam, not the stimulus, so a standalone '
  'question still appears. Remove once all callers have migrated.';


-- ── 7. exam_publish_issues(): NULL-safe level join ──────────────────────────
-- `f.level = e.level` is never true when both are NULL, so on a non-levelled
-- onderdeel the format join would drop the row and skip the item-count check
-- entirely — failing open, quietly, exactly where a new onderdeel needs checking
-- most. `IS NOT DISTINCT FROM` treats two NULLs as equal.
--
-- Also adds the standalone-question case to the stimulus rule below.
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
  WHERE e.id = p_exam_id AND f.item_count IS NOT NULL AND cnt.n <> f.item_count

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
    AND f.part_count IS NOT NULL
    AND (SELECT count(*) FROM public.exam_parts p WHERE p.exam_id = e.id) <> f.part_count;
$$;

COMMENT ON FUNCTION public.exam_publish_issues IS
  'Pre-publish validator. Empty result = safe to publish. Item/part counts come from '
  'exam_formats, matched NULL-safely on level so a non-levelled onderdeel is still '
  'checked. An unverified (NULL) format skips those checks rather than blocking. '
  'Called by the admin, never as a trigger — work in progress must stay savable.';

COMMIT;
