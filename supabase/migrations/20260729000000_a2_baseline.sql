-- ═══════════════════════════════════════════════════════════════════════════════
-- A2 BASELINE — the whole schema for Inburgering Oefenen, in one migration.
--
-- Squashes the 27 inherited KNM migrations. They are kept for reference in
-- `supabase/legacy-knm-migrations/` but are NOT applied: the chain could not be
-- replayed on a fresh database at all, because 20260506000003 migrates *from* a
-- table (`exam_results`) that no migration ever created — it was made by hand in
-- the KNM production database. `supabase db reset` failed with SQLSTATE 42P01.
--
-- This file is therefore the single source of truth for the database. It targets an
-- EMPTY Supabase project.
--
-- Layout:
--   1. helpers
--   2. access + payments          admin_users, payments
--   3. funnel                    exam_submissions, email_campaign_queue
--   4. A2 taxonomy               sections (= the sub-skills), exams
--   5. A2 closed items           questions            (Lezen + Luisteren)
--   6. A2 open items             open_tasks, rubrics, open_submissions,
--                                grading_examples     (Schrijven + Spreken)
--   7. progress + gamification   exam_results, user_question_results,
--                                user_xp_events, user_xp_totals
--   8. deferred surfaces         word_cards, user_word_card_progress,
--                                leren_content, user_leren_progress
--   9. storage buckets
--
-- Access model: `lib/supabase/server.ts` and `lib/supabase/admin.ts` BOTH use the
-- service-role key, which bypasses RLS. Only `lib/supabase/client.ts` (the browser)
-- is subject to it. So every policy here exists for the browser's benefit; the
-- server routes are already unrestricted.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. helpers ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ── 2. access + payments ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_users (
  email text PRIMARY KEY
);
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Is the caller on the admin allowlist? Used by every admin write policy.
-- Defined after admin_users: a LANGUAGE sql body is parsed and its dependencies resolved
-- at CREATE time, so declaring this first fails with 42P01 on an empty database.
-- SECURITY DEFINER so the check itself is not subject to admin_users' own RLS.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users a
    WHERE a.email = (auth.jwt() ->> 'email')
  );
$$;

-- An admin may see only their own row, so the allowlist is not enumerable.
DROP POLICY IF EXISTS "Admins read own row" ON public.admin_users;
CREATE POLICY "Admins read own row"
  ON public.admin_users FOR SELECT
  USING ((auth.jwt() ->> 'email') = email);

CREATE TABLE IF NOT EXISTS public.payments (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mollie_payment_id      text NOT NULL UNIQUE,
  user_id                uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email                  text,
  amount_cents           integer NOT NULL DEFAULT 1000,
  status                 text NOT NULL DEFAULT 'open',
  product                text,
  locale                 text NOT NULL DEFAULT 'nl' CHECK (locale IN ('nl', 'en', 'ar')),
  activation_email_sent  boolean NOT NULL DEFAULT false,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);
COMMENT ON COLUMN public.payments.product IS
  'Product slug. Today: premium | premium_plus | upgrade_to_plus (one-off). The pricing '
  'page now offers per-module subscriptions (lib/pricing.ts) — migrating this to module '
  'slugs plus Mollie recurring is outstanding work.';

CREATE INDEX IF NOT EXISTS payments_user_id_idx ON public.payments (user_id);
CREATE INDEX IF NOT EXISTS payments_email_idx   ON public.payments (email);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own payments" ON public.payments;
CREATE POLICY "Users read own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

-- ── 3. funnel ───────────────────────────────────────────────────────────────
-- Anonymous captures from the free-taster email gate. One row per taster finished.
--
-- NOTE: the KNM table had UNIQUE (email, exam_number). Deliberately absent: with four
-- skills, the same person doing the Lezen taster and then the Luisteren taster collided
-- on it and the second submission was silently dropped.
CREATE TABLE IF NOT EXISTS public.exam_submissions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text NOT NULL,
  -- Set by /api/claim-submissions when an anonymous submitter later registers.
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  skill        text CHECK (skill IN ('lezen', 'luisteren', 'schrijven', 'spreken')),
  exam_number  integer NOT NULL DEFAULT 1,
  score        integer NOT NULL,
  total        integer NOT NULL,
  pct          integer NOT NULL,
  passed       boolean NOT NULL,
  cat_scores   jsonb NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.exam_submissions IS
  'Anonymous funnel captures from the taster email gate. Logged-in attempts go to '
  'exam_results — the two are separate on purpose.';

-- Backs the 10-minute duplicate check in /api/submit-results.
CREATE INDEX IF NOT EXISTS exam_submissions_email_created_idx
  ON public.exam_submissions (email, created_at DESC);
CREATE INDEX IF NOT EXISTS exam_submissions_user_id_idx
  ON public.exam_submissions (user_id);

ALTER TABLE public.exam_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own submissions" ON public.exam_submissions;
CREATE POLICY "Users read own submissions"
  ON public.exam_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.email_campaign_queue (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL,
  campaign_type text NOT NULL CHECK (campaign_type IN ('day2', 'day7', 'abandon')),
  scheduled_for timestamptz NOT NULL,
  payload       jsonb NOT NULL DEFAULT '{}',
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at       timestamptz,
  error_message text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_campaign_queue_due_idx
  ON public.email_campaign_queue (scheduled_for, status) WHERE status = 'pending';

-- One campaign of each type per address. /api/submit-results already tolerates the
-- resulting 23505 unique violation, so re-submitting does not error.
CREATE UNIQUE INDEX IF NOT EXISTS email_campaign_queue_email_type_idx
  ON public.email_campaign_queue (email, campaign_type) WHERE status IN ('pending', 'sent');

ALTER TABLE public.email_campaign_queue ENABLE ROW LEVEL SECURITY;

-- ── 4. A2 taxonomy ──────────────────────────────────────────────────────────
-- `sections` carries the A2 **sub-skills** — the item types inside one exam
-- (advertentie, gesprek, e-mail …). It replaces the KNM seven-topic table and keeps its
-- column names, because the dashboard selects `id, slug, name_nl, sort_order, topic`
-- in four places. `topic` now holds the skill slug.
CREATE TABLE IF NOT EXISTS public.sections (
  id          smallint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  topic       text NOT NULL CHECK (topic IN ('lezen', 'luisteren', 'schrijven', 'spreken')),
  slug        text NOT NULL UNIQUE,
  name_nl     text NOT NULL,
  rationale   text,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.sections IS
  'The A2 sub-skills, grouped by skill in `topic`. Drives the per-question-type score '
  'breakdown. Column names are inherited from the KNM sections table on purpose.';

INSERT INTO public.sections (topic, slug, name_nl, sort_order) VALUES
  ('lezen',     'advertentie',      'Advertentie',            10),
  ('lezen',     'brief',            'Brief of e-mail',        20),
  ('lezen',     'formulier-lezen',  'Formulier',              30),
  ('lezen',     'folder',           'Folder of brochure',     40),
  ('lezen',     'artikel',          'Kort artikel',           50),
  ('luisteren', 'gesprek',          'Gesprek',                60),
  ('luisteren', 'mededeling',       'Mededeling of omroep',   70),
  ('luisteren', 'telefoongesprek',  'Telefoongesprek',        80),
  ('luisteren', 'instructie',       'Instructie',             90),
  ('schrijven', 'email',            'E-mail',                100),
  ('schrijven', 'korte-tekst',      'Korte tekst',           110),
  ('schrijven', 'formulier',        'Formulier invullen',    120),
  ('spreken',   'beschrijven',      'Beschrijven',           130),
  ('spreken',   'kiezen',           'Kiezen en uitleggen',   140),
  ('spreken',   'reageren',         'Reageren op een vraag', 150)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read sections" ON public.sections;
CREATE POLICY "Public read sections" ON public.sections FOR SELECT USING (true);

-- The 10 practice exams per skill.
CREATE TABLE IF NOT EXISTS public.exams (
  id               bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  skill            text NOT NULL CHECK (skill IN ('lezen', 'luisteren', 'schrijven', 'spreken')),
  number           smallint NOT NULL CHECK (number BETWEEN 1 AND 10),
  title            text,
  -- Exam 1 of every skill is the free one; see isFreeExam() in data/skills.ts.
  is_free          boolean NOT NULL DEFAULT false,
  duration_seconds integer NOT NULL,
  -- lib/exams.ts only returns published rows, so an exam stays "Binnenkort" on the
  -- overview page until the docent has reviewed it and flips this.
  published        boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT exams_skill_number_key UNIQUE (skill, number)
);

CREATE INDEX IF NOT EXISTS exams_skill_published_idx
  ON public.exams (skill, number) WHERE published;

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Published exams are public" ON public.exams;
CREATE POLICY "Published exams are public"
  ON public.exams FOR SELECT USING (published);
DROP POLICY IF EXISTS "Admins write exams" ON public.exams;
CREATE POLICY "Admins write exams"
  ON public.exams FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS exams_touch_updated_at ON public.exams;
CREATE TRIGGER exams_touch_updated_at
  BEFORE UPDATE ON public.exams
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ── 5. A2 closed items — Lezen + Luisteren ──────────────────────────────────
-- A2 shape: the DUO player puts a *stimulus* in the left pane (a text to read or an
-- audio fragment to hear) and the question with A/B/C in the right pane. KNM had no
-- stimulus at all — the question stood alone — which is the substantive difference.
CREATE TABLE IF NOT EXISTS public.questions (
  id             bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  skill          text NOT NULL CHECK (skill IN ('lezen', 'luisteren')),
  exam_id        bigint REFERENCES public.exams(id) ON DELETE CASCADE,
  sort_order     integer NOT NULL DEFAULT 0,
  section_id     smallint REFERENCES public.sections(id) ON DELETE SET NULL,

  -- stimulus (left pane)
  stimulus_intro     text,   -- "Lees eerst de vraag, dan de tekst."
  stimulus_html      text,   -- Lezen: the passage, authored in the admin TipTap editor
  stimulus_script    text,   -- Luisteren: the dialogue the audio is generated from
  stimulus_audio_url text,   -- Luisteren: question-audio/<id>/stimulus.mp3

  -- question (right pane)
  question       text NOT NULL,
  option_a       text NOT NULL,
  option_b       text NOT NULL,
  option_c       text NOT NULL,
  correct        char(1) NOT NULL CHECK (correct IN ('A', 'B', 'C')),
  explanation    text NOT NULL,
  image_url      text,

  -- read-aloud audio, generated per question from the admin
  audio_question text,
  audio_a        text,
  audio_b        text,
  audio_c        text,

  -- docent review gate: audio may only be generated once validated
  review_status  text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'validated')),
  reviewed_at    timestamptz,

  -- DEPRECATED, kept only so the inherited admin screens keep working until Phase 4.
  -- `admin/exams` and `admin/page.tsx` still select category / exam / oefenen. Supabase
  -- queries are untyped strings, so dropping these would break those pages at runtime with
  -- nothing failing at build time. Superseded by section_id / exam_id.
  category       text,
  exam           integer,
  oefenen        boolean NOT NULL DEFAULT false,

  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
COMMENT ON COLUMN public.questions.category IS 'DEPRECATED — use section_id. Remove in Phase 4.';
COMMENT ON COLUMN public.questions.exam     IS 'DEPRECATED — use exam_id. Remove in Phase 4.';
COMMENT ON COLUMN public.questions.stimulus_html IS
  'Lezen only. The reading passage shown in the left pane. Written from scratch — DUO''s '
  'own exam texts are copyright and must never be reproduced (see CLAUDE.md).';

CREATE INDEX IF NOT EXISTS questions_exam_sort_idx ON public.questions (exam_id, sort_order);
CREATE INDEX IF NOT EXISTS questions_skill_idx     ON public.questions (skill);
CREATE INDEX IF NOT EXISTS questions_section_idx   ON public.questions (section_id);
-- Backs the free-practice flag on the deprecated `oefenen` column, still read by admin.
CREATE INDEX IF NOT EXISTS questions_oefenen_idx   ON public.questions (oefenen) WHERE oefenen;

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read questions" ON public.questions;
CREATE POLICY "Public read questions" ON public.questions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins write questions" ON public.questions;
CREATE POLICY "Admins write questions"
  ON public.questions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS questions_touch_updated_at ON public.questions;
CREATE TRIGGER questions_touch_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ── 6. A2 open items — Schrijven + Spreken ──────────────────────────────────
-- Rubrics are versioned and frozen once used for a grading, never edited in place, so a
-- past grading stays explainable.
CREATE TABLE IF NOT EXISTS public.rubrics (
  id            bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  skill         text NOT NULL CHECK (skill IN ('schrijven', 'spreken')),
  task_type     text NOT NULL,
  version       integer NOT NULL DEFAULT 1,
  -- [{ key, criterion, description, anchors: { "0": …, "1": …, "2": …, "3": … } }]
  criteria      jsonb NOT NULL DEFAULT '[]',
  system_prompt text,
  active        boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rubrics_skill_type_version_key UNIQUE (skill, task_type, version)
);
COMMENT ON TABLE public.rubrics IS
  'Authored by the NT2 docent, never generated. The grader applies the docent''s rubric — '
  'it is not the authority on the mark (see the USP constraint in CLAUDE.md).';

-- At most one active rubric per skill + task type.
CREATE UNIQUE INDEX IF NOT EXISTS rubrics_one_active_idx
  ON public.rubrics (skill, task_type) WHERE active;

ALTER TABLE public.rubrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage rubrics" ON public.rubrics;
CREATE POLICY "Admins manage rubrics"
  ON public.rubrics FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.open_tasks (
  id                 bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  exam_id            bigint REFERENCES public.exams(id) ON DELETE CASCADE,
  skill              text NOT NULL CHECK (skill IN ('schrijven', 'spreken')),
  sort_order         integer NOT NULL DEFAULT 0,
  section_id         smallint REFERENCES public.sections(id) ON DELETE SET NULL,
  -- schrijven: email | korte-tekst | formulier · spreken: beschrijven | kiezen | reageren
  task_type          text NOT NULL,
  title              text,
  prompt_html        text,
  bullet_points      jsonb NOT NULL DEFAULT '[]',

  -- schrijven, e-mail variant: the composer chrome from the DUO PDFs
  email_to           text,
  email_subject      text,
  greeting           text,
  closing            text,
  -- schrijven, form variant
  form_schema        jsonb,
  min_sentences      integer,

  -- spreken
  image_urls         text[] NOT NULL DEFAULT '{}',
  prompt_audio_url   text,
  prompt_script      text,
  max_record_seconds integer NOT NULL DEFAULT 60,

  model_answer       text,
  rubric_id          bigint REFERENCES public.rubrics(id) ON DELETE SET NULL,
  review_status      text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'validated')),
  reviewed_at        timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS open_tasks_exam_sort_idx ON public.open_tasks (exam_id, sort_order);
CREATE INDEX IF NOT EXISTS open_tasks_skill_idx     ON public.open_tasks (skill);

ALTER TABLE public.open_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read open_tasks" ON public.open_tasks;
CREATE POLICY "Public read open_tasks" ON public.open_tasks FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins write open_tasks" ON public.open_tasks;
CREATE POLICY "Admins write open_tasks"
  ON public.open_tasks FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS open_tasks_touch_updated_at ON public.open_tasks;
CREATE TRIGGER open_tasks_touch_updated_at
  BEFORE UPDATE ON public.open_tasks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.open_submissions (
  id             bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id        bigint REFERENCES public.exams(id) ON DELETE SET NULL,
  task_id        bigint NOT NULL REFERENCES public.open_tasks(id) ON DELETE CASCADE,

  answer_text    text,             -- schrijven
  audio_url      text,             -- spreken, in the private speaking-submissions bucket
  transcript     text,             -- spreken, from /api/transcribe

  -- { criteria: [{ key, score, feedback }], overall, passed, tips[] }
  ai_result      jsonb,
  rubric_version integer,
  teacher_result jsonb,
  teacher_notes  text,
  status         text NOT NULL DEFAULT 'submitted'
                   CHECK (status IN ('submitted', 'ai_graded', 'teacher_reviewed')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS open_submissions_user_idx   ON public.open_submissions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS open_submissions_task_idx   ON public.open_submissions (task_id);
-- The admin grading inbox: everything the docent has not reviewed yet.
CREATE INDEX IF NOT EXISTS open_submissions_status_idx ON public.open_submissions (status, created_at)
  WHERE status <> 'teacher_reviewed';

ALTER TABLE public.open_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own open submissions" ON public.open_submissions;
CREATE POLICY "Users manage own open submissions"
  ON public.open_submissions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins read open submissions" ON public.open_submissions;
CREATE POLICY "Admins read open submissions"
  ON public.open_submissions FOR SELECT USING (public.is_admin());

DROP TRIGGER IF EXISTS open_submissions_touch_updated_at ON public.open_submissions;
CREATE TRIGGER open_submissions_touch_updated_at
  BEFORE UPDATE ON public.open_submissions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- The docent-curated dataset. A corrected grading is promoted here and injected into the
-- grader as a few-shot — rubric + example iteration, never model fine-tuning.
CREATE TABLE IF NOT EXISTS public.grading_examples (
  id                   bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  skill                text NOT NULL CHECK (skill IN ('schrijven', 'spreken')),
  task_type            text NOT NULL,
  task_id              bigint REFERENCES public.open_tasks(id) ON DELETE SET NULL,
  answer_text          text,
  transcript           text,
  teacher_result       jsonb NOT NULL,
  notes                text,
  use_as_fewshot       boolean NOT NULL DEFAULT true,
  source_submission_id bigint REFERENCES public.open_submissions(id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS grading_examples_fewshot_idx
  ON public.grading_examples (skill, task_type) WHERE use_as_fewshot;

ALTER TABLE public.grading_examples ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage grading examples" ON public.grading_examples;
CREATE POLICY "Admins manage grading examples"
  ON public.grading_examples FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── 7. progress + gamification ──────────────────────────────────────────────
-- Logged-in exam attempts. Separate from exam_submissions (anonymous funnel captures).
-- The KNM chain DROPped this table while four dashboard surfaces still read and upsert
-- it, so on KNM production those reads have been failing.
CREATE TABLE IF NOT EXISTS public.exam_results (
  id           bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill        text CHECK (skill IN ('lezen', 'luisteren', 'schrijven', 'spreken')),
  exam_number  integer NOT NULL,
  score        integer NOT NULL,
  total        integer NOT NULL,
  pct          integer NOT NULL,
  passed       boolean NOT NULL,
  cat_scores   jsonb NOT NULL DEFAULT '{}',
  completed_at timestamptz NOT NULL DEFAULT now(),
  -- The dashboard upserts by (user, skill, exam) — retaking an exam replaces the result.
  CONSTRAINT exam_results_user_skill_exam_key UNIQUE (user_id, skill, exam_number)
);

CREATE INDEX IF NOT EXISTS exam_results_user_idx ON public.exam_results (user_id, completed_at DESC);

ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own results" ON public.exam_results;
CREATE POLICY "Users manage own results"
  ON public.exam_results FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Column names match what the app already inserts (`was_correct`, `exam`) — the engine and
-- the admin analytics both write this table today, so renaming would break them silently:
-- Supabase queries are untyped strings and `tsc` cannot catch a wrong column.
CREATE TABLE IF NOT EXISTS public.user_question_results (
  id          bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id bigint REFERENCES public.questions(id) ON DELETE CASCADE,
  exam        integer,
  was_correct boolean NOT NULL,
  answered_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_question_results_user_idx
  ON public.user_question_results (user_id, answered_at);

ALTER TABLE public.user_question_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own question results" ON public.user_question_results;
CREATE POLICY "Users manage own question results"
  ON public.user_question_results FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.user_xp_events (
  id         bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source     text NOT NULL,
  ref_id     text,
  xp         integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_xp_events_user_idx ON public.user_xp_events (user_id);
-- Award once per source+ref, except for per-answer XP which may repeat.
CREATE UNIQUE INDEX IF NOT EXISTS user_xp_events_once_idx
  ON public.user_xp_events (user_id, source, ref_id) WHERE source <> 'correct_answer';

ALTER TABLE public.user_xp_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own xp events" ON public.user_xp_events;
CREATE POLICY "Users manage own xp events"
  ON public.user_xp_events FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- `lib/xp.ts` reads user_xp_totals.total_xp. No KNM migration ever created it, so that
-- read has always failed; it is a view over the events, which is what it was meant to be.
CREATE OR REPLACE VIEW public.user_xp_totals
WITH (security_invoker = true) AS
  SELECT user_id, COALESCE(SUM(xp), 0)::integer AS total_xp
  FROM public.user_xp_events
  GROUP BY user_id;

-- ── 8. deferred surfaces (kept, flagged off in lib/features.ts) ─────────────
CREATE TABLE IF NOT EXISTS public.word_cards (
  id          bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  theme_id    integer,
  -- Which skill's word list this card belongs to, once the module bundles it.
  skill       text CHECK (skill IN ('lezen', 'luisteren', 'schrijven', 'spreken')),
  term        text NOT NULL,
  definition  text,
  translation_en text,
  translation_ar text,
  translation_tr text,
  audio_url   text,
  image_url   text,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS word_cards_theme_idx ON public.word_cards (theme_id);
CREATE INDEX IF NOT EXISTS word_cards_skill_idx ON public.word_cards (skill);

ALTER TABLE public.word_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read word_cards" ON public.word_cards;
CREATE POLICY "Public read word_cards" ON public.word_cards FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins write word_cards" ON public.word_cards;
CREATE POLICY "Admins write word_cards"
  ON public.word_cards FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.user_word_card_progress (
  id           bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word_card_id bigint NOT NULL REFERENCES public.word_cards(id) ON DELETE CASCADE,
  known        boolean NOT NULL DEFAULT false,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_word_card_progress_key UNIQUE (user_id, word_card_id)
);
CREATE INDEX IF NOT EXISTS user_word_card_progress_user_idx ON public.user_word_card_progress (user_id);
CREATE INDEX IF NOT EXISTS user_word_card_progress_card_idx ON public.user_word_card_progress (word_card_id);

ALTER TABLE public.user_word_card_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own word card progress" ON public.user_word_card_progress;
CREATE POLICY "Users manage own word card progress"
  ON public.user_word_card_progress FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.leren_content (
  id         bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  theme_id   integer NOT NULL,
  -- Lessons now hang off a skill, because a module bundles the lessons for its skill.
  skill      text CHECK (skill IN ('lezen', 'luisteren', 'schrijven', 'spreken')),
  slug       text UNIQUE,
  title      text,
  body_html  text,
  audio_url  text,
  audio_url_en text,
  audio_url_ar text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS leren_content_theme_sort_idx ON public.leren_content (theme_id, sort_order);
CREATE INDEX IF NOT EXISTS leren_content_skill_idx      ON public.leren_content (skill);

ALTER TABLE public.leren_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read leren_content" ON public.leren_content;
CREATE POLICY "Public read leren_content" ON public.leren_content FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins write leren_content" ON public.leren_content;
CREATE POLICY "Admins write leren_content"
  ON public.leren_content FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.user_leren_progress (
  id         bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thema_id   integer NOT NULL,
  completed  boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_leren_progress_key UNIQUE (user_id, thema_id)
);
CREATE INDEX IF NOT EXISTS user_leren_progress_user_idx ON public.user_leren_progress (user_id);

ALTER TABLE public.user_leren_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own leren progress" ON public.user_leren_progress;
CREATE POLICY "Users manage own leren progress"
  ON public.user_leren_progress FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

COMMIT;

-- ── 9. storage buckets ──────────────────────────────────────────────────────
-- Outside the transaction: on a hosted project storage.buckets is owned by the storage
-- role, and a failure here must not roll the schema back.
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('question-audio',       'question-audio',       true),
  ('question-images',      'question-images',      true),
  -- Spreken recordings are personal data: private, reached through signed URLs only.
  ('speaking-submissions', 'speaking-submissions', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read exam media" ON storage.objects;
CREATE POLICY "Public read exam media"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('question-audio', 'question-images'));

DROP POLICY IF EXISTS "Users read own recordings" ON storage.objects;
CREATE POLICY "Users read own recordings"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'speaking-submissions' AND owner = auth.uid());

DROP POLICY IF EXISTS "Users upload own recordings" ON storage.objects;
CREATE POLICY "Users upload own recordings"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'speaking-submissions' AND owner = auth.uid());

NOTIFY pgrst, 'reload schema';
