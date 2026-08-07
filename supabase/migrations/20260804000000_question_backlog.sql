-- ═══════════════════════════════════════════════════════════════════════════
-- A backlog to author items into, before they belong to an oefenexamen.
--
-- The problem this solves: a question belongs to a stimulus and a stimulus belongs to an exam,
-- both NOT NULL. So there was nowhere for an unassigned item to exist, and every authoring path
-- started *inside* an exam — which made writing an item and filling a slot the same action. The
-- docent could not build a pool of Lezen texts and then decide which exam each one went into.
--
-- ## Why exam number 0 rather than a nullable exam_id
-- A question with no exam has no skill and no level either: both are resolved through
-- `exams`. Making `exam_id` nullable therefore means a new `level` column on `stimuli`, rewriting
-- `questions_sync_exam_id()` and `questions_require_stimulus()`, teaching `questions_flat`, the
-- `exam_is_public(exam_id)` RLS policy and `exam_publish_issues()` about NULL — a lot of surface
-- for a holding area.
--
-- A backlog *is* an exam that is never published: number 0, one per (level, skill). Every trigger,
-- view, policy and count keeps working unchanged, RLS already hides it (`exam_is_public` requires
-- `published`), and assigning an item is one UPDATE of `stimuli.exam_id` — the existing
-- `stimuli.exam_id` — with a trigger (section 6) carrying its questions along.
--
-- The cost, stated: a row in `exams` that is not an exam. Everything that counts or lists exams has
-- to skip `number = 0`. `BACKLOG_EXAM_NUMBER` in `lib/admin/backlog.ts` is the only place that
-- constant lives on the code side, and `exams_real` below is the view to read when you want the ten
-- actual oefenexamens.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Allow number 0. Kept as a CHECK rather than dropped: the upper bound is what stops a typo
--    creating exam 47, and `data/skills.ts` promises exactly ten per (level, skill).
ALTER TABLE public.exams DROP CONSTRAINT exams_number_check;
ALTER TABLE public.exams ADD CONSTRAINT exams_number_check
  CHECK (number >= 0 AND number <= 10);

-- 2. A backlog can never be published, free, or sat by a candidate. Enforced rather than trusted:
--    a published exam 0 would appear in the funnel as an eleventh oefenexamen with no items in it,
--    and `is_free` on it would hand out whatever is being drafted.
ALTER TABLE public.exams ADD CONSTRAINT exams_backlog_never_published
  CHECK (number > 0 OR (published = false AND is_free = false));

COMMENT ON COLUMN public.exams.number IS
  '1..10 is an oefenexamen. 0 is the (level, skill) backlog: a holding area for authored items that '
  'have not been assigned to an exam yet. Never published — see exams_backlog_never_published.';

-- 3. One backlog per (level, skill) that exists today, mirroring the shape of that skill''s exams.
--    `duration_seconds` and `pass_threshold_pct` are NOT NULL and meaningless here, so they are
--    copied from exam 1 of the same pair rather than invented.
INSERT INTO public.exams (level, skill, number, title, duration_seconds, pass_threshold_pct, published, is_free)
SELECT e.level, e.skill, 0, 'Backlog', e.duration_seconds, e.pass_threshold_pct, false, false
FROM public.exams e
WHERE e.number = 1
ON CONFLICT (level, skill, number) DO NOTHING;

-- 4. The ten real oefenexamens, for anything that lists or counts them. Reading `exams` directly is
--    still correct where an id is being resolved — the backlog is a real exam row and its items are
--    real items; it is only *listings* that must not show an eleventh card.
CREATE OR REPLACE VIEW public.exams_real AS
  SELECT * FROM public.exams WHERE number > 0;

GRANT SELECT ON public.exams_real TO anon, authenticated;

-- 5. `exam_publish_issues()` is called per exam id and the backlog is never published, so it is
--    never asked about one. Left alone deliberately: adding a special case there would be a second
--    definition of what a backlog is.

NOTIFY pgrst, 'reload schema';

-- ── 6. Moving a stimulus has to move its questions ───────────────────────────
--
-- Found while testing the assignment flow, and it is a data-integrity hole that predates the
-- backlog: `questions_sync_exam_id` is a trigger on **questions**, firing on
-- `UPDATE OF stimulus_id`. Nothing watches `stimuli.exam_id`. So `UPDATE stimuli SET exam_id = …`
-- left every question of that stimulus pointing at the *old* exam, while its stimulus pointed at
-- the new one — questions listed under an exam whose stimulus is somewhere else, and
-- `exam_is_public(exam_id)` on `questions` then evaluating against the wrong exam's `published`.
--
-- Enforced here rather than by having the admin UI write both tables: a stimulus is only ever moved
-- as a unit with its questions, so the database is where that has to be true. Any script, SQL
-- console or future screen gets it for free.
CREATE OR REPLACE FUNCTION public.stimuli_sync_questions_exam_id()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.questions
     SET exam_id = NEW.exam_id
   WHERE stimulus_id = NEW.id
     AND exam_id IS DISTINCT FROM NEW.exam_id;
  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.stimuli_sync_questions_exam_id() IS
  'Keeps questions.exam_id equal to their stimulus''s exam_id. A stimulus and its questions are one '
  'unit — a Lezen text shared by three questions cannot be split across two exams.';

DROP TRIGGER IF EXISTS stimuli_sync_questions ON public.stimuli;
CREATE TRIGGER stimuli_sync_questions
  AFTER UPDATE OF exam_id ON public.stimuli
  FOR EACH ROW EXECUTE FUNCTION public.stimuli_sync_questions_exam_id();

-- Repair anything already skewed by a hand-written UPDATE before this trigger existed.
UPDATE public.questions q
   SET exam_id = s.exam_id
  FROM public.stimuli s
 WHERE s.id = q.stimulus_id
   AND q.exam_id IS DISTINCT FROM s.exam_id;

NOTIFY pgrst, 'reload schema';
