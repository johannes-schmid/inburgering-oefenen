-- ═══════════════════════════════════════════════════════════════════════════════
-- A2 BASELINE — the whole schema for Inburgering Oefenen, in one migration.
--
-- Squashes the 26 inherited KNM migrations. They are kept for reference in
-- `supabase/legacy-knm-migrations/` but are NOT applied: the chain could not be
-- replayed on a fresh database at all, because 20260506000003 migrates *from* a
-- table (`exam_results`) that no migration ever created — it was made by hand in
-- the KNM production database. `supabase db reset` failed with SQLSTATE 42P01.
--
-- This file is therefore the single source of truth for the database. It targets an
-- EMPTY Supabase project.
--
-- ── The content model, and why it looks like this ───────────────────────────────
-- Shaped against the official DUO practice exams in `resources/exam-references/A2/`,
-- not against the build brief. Four things in that material drive the design:
--
--   * ONE STIMULUS IS SHARED BY 1..N QUESTIONS. Lezen items 10 and 11 carry a
--     byte-identical e-mail; 18 and 20 share one EHBO folder. So the stimulus is its
--     own table (`stimuli`) and questions hang off it. Putting the text on the
--     question would duplicate it — and for Luisteren would mean two ElevenLabs runs
--     of one fragment, which come back audibly different because v3 is
--     non-deterministic.
--   * OPTIONS ARE 3 OR 4, AND SOMETIMES PICTURES. Lezen 6/8/11 and Luisteren 7 run
--     A–D; item 11 has four options of three thumbnails each. So options are rows
--     (`question_options`), not `option_a/b/c` columns.
--   * THE LISTENING QUESTION IS ITSELF SPOKEN, by a second player independent of the
--     fragment's — hence `questions.prompt_audio_url` alongside `stimuli.audio_url`.
--   * SPREKEN IS 4 ONDERDELEN OF 4 TASKS, each with its own instruction screen and
--     picture rule — hence `exam_parts` and `open_tasks.image_usage`.
--
-- Deliberately absent: any per-exam audio play limit. The DUO player is unlimited and
-- seekable (rewind-10 / play / forward-10, no counter, no disabled state). Do not add
-- `max_plays` without evidence that the real exam restricts replay.
--
-- Also absent: video. DUO uses video for Luisteren item 1 and for all of Spreken
-- onderdeel 1 ("vragen met een video"); we use audio over a still image instead. This
-- is an accepted product decision (2026-07-29), not an oversight — `stimuli.kind` has
-- no 'video' value on purpose.
--
-- ── Progress over time is a product feature ────────────────────────────────────
-- Every answer is retained. `exam_attempts` is append-only (one row per sitting) and
-- is the source of truth; `exam_results` is a VIEW of the latest attempt so the
-- dashboard's existing reads keep working. `user_question_results` logs every MCQ
-- answer, `open_submissions` every written/spoken answer, and
-- `open_criterion_scores` every rubric criterion — the last one is what makes
-- Schrijven and Spreken progress chartable instead of buried in a jsonb blob.
--
-- Layout:
--   1. helpers
--   2. access + payments          admin_users, is_admin(), payments
--   3. funnel                    exam_submissions, email_campaign_queue
--   4. A2 taxonomy               sections (= the sub-skills), exams, exam_is_public()
--   5. A2 closed items           exam_parts, stimuli, questions, question_options
--   6. A2 open items             rubrics, open_tasks, open_task_images,
--                                open_submissions, open_criterion_scores,
--                                grading_examples
--   7. progress                  exam_attempts, exam_results (view),
--                                user_question_results, user_xp_events/_totals
--   8. deferred surfaces         word_cards, leren_content + progress tables
--   9. compatibility + validator questions_flat, exam_publish_issues()
--  10. storage buckets
--
-- Access model: `lib/supabase/server.ts` and `lib/supabase/admin.ts` BOTH use the
-- service-role key, which bypasses RLS. Only `lib/supabase/client.ts` (the browser)
-- is subject to it. So every policy here exists for the browser's benefit; the
-- server routes are already unrestricted.
--
-- KNOWN AND ACCEPTED: `question_options.is_correct` and `questions.explanation` are
-- readable by the browser, so a determined candidate can read the answer key out of
-- the network tab. This was already true of the KNM schema. Fixing it properly means
-- column-level grants plus a SECURITY DEFINER scoring function; recorded here as a
-- decision rather than left as an oversight.
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
  -- Was PASS_THRESHOLD_PCT, hardcoded twice and in two different units: 0.7 in
  -- ProefexamenEngine.tsx and 60 in lib/api-constants.ts. One home, integer percent.
  -- This is OUR practice threshold: per SEO/facts.md §9 DUO publishes no cut-off (the
  -- zak-slaaggrens is "een cesuur, vastgesteld door de Minister"), so it must never be
  -- presented to a candidate as DUO's official norm.
  pass_threshold_pct smallint NOT NULL DEFAULT 60
                       CHECK (pass_threshold_pct BETWEEN 1 AND 100),
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

-- Is this exam visible to the browser? Every content read policy calls this, so the
-- gate lives in one place. SECURITY DEFINER so the check is not itself subject to
-- `exams`' own RLS, which would make it recursive on the `published` predicate.
-- Must be created AFTER `exams`: a LANGUAGE sql body resolves its dependencies at
-- CREATE time (this is the same trap that made is_admin() fail above).
CREATE OR REPLACE FUNCTION public.exam_is_public(p_exam_id bigint)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.exams e WHERE e.id = p_exam_id AND e.published
  );
$$;

-- ── 4b. attempts — the append-only record of every sitting ──────────────────
-- Declared here, early, because BOTH answer tables reference it
-- (`user_question_results.attempt_id` and `open_submissions.attempt_id`).
--
-- Progress over time is a product feature, so nothing here is ever updated in place:
-- retaking an exam appends a row rather than replacing one. The KNM schema upserted a
-- single `exam_results` row per user+exam, which answers "what did I score" but never
-- "am I improving" — the whole point of ten practice exams per skill. `exam_results`
-- is now a VIEW over this table (section 7).
CREATE TABLE IF NOT EXISTS public.exam_attempts (
  id            bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id       bigint REFERENCES public.exams(id) ON DELETE SET NULL,
  skill         text NOT NULL CHECK (skill IN ('lezen','luisteren','schrijven','spreken')),
  exam_number   integer NOT NULL,
  attempt_no    integer NOT NULL DEFAULT 1,
  score         integer,
  total         integer,
  pct           integer,
  passed        boolean,
  -- Keyed by sub-skill (sections.slug) for the per-question-type breakdown.
  cat_scores    jsonb NOT NULL DEFAULT '{}',
  -- Frozen at submit, so later raising exams.pass_threshold_pct cannot retroactively
  -- flip a candidate from passed to failed. Same discipline as rubrics.rubric_version.
  pass_threshold_pct smallint,
  started_at    timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz,
  CONSTRAINT exam_attempts_no_key UNIQUE (user_id, skill, exam_number, attempt_no)
);

CREATE INDEX IF NOT EXISTS exam_attempts_user_idx
  ON public.exam_attempts (user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS exam_attempts_user_skill_idx
  ON public.exam_attempts (user_id, skill, exam_number);

-- Assign the next attempt number server-side when the client does not supply one, so the
-- app never has to read-then-write (which would race with itself on a double submit) and
-- cannot silently collide with exam_attempts_no_key.
CREATE OR REPLACE FUNCTION public.exam_attempts_set_attempt_no()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.attempt_no IS NULL OR NEW.attempt_no = 1 THEN
    SELECT COALESCE(MAX(a.attempt_no), 0) + 1 INTO NEW.attempt_no
    FROM public.exam_attempts a
    WHERE a.user_id = NEW.user_id
      AND a.skill = NEW.skill
      AND a.exam_number = NEW.exam_number;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS exam_attempts_set_attempt_no ON public.exam_attempts;
CREATE TRIGGER exam_attempts_set_attempt_no
  BEFORE INSERT ON public.exam_attempts
  FOR EACH ROW EXECUTE FUNCTION public.exam_attempts_set_attempt_no();

ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own attempts" ON public.exam_attempts;
CREATE POLICY "Users manage own attempts"
  ON public.exam_attempts FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins read attempts" ON public.exam_attempts;
CREATE POLICY "Admins read attempts"
  ON public.exam_attempts FOR SELECT USING (public.is_admin());

-- ── 4c. exam parts — Spreken "onderdelen" ───────────────────────────────────
-- A Spreken exam is 4 onderdelen of 4 tasks, each opening with its own instruction
-- screen ("Onderdeel 3 - vragen met 2 plaatjes. U kiest steeds één plaatje.").
--
-- NOT modelled on `sections`: that is a global sub-skill taxonomy with a UNIQUE slug
-- shared across all exams and read by four dashboard surfaces. An onderdeel is
-- per-exam, positional, and carries its own instruction text — overloading `sections`
-- would mean 40 near-duplicate rows or one shared row whose text cannot differ.
-- Open to all four skills: a Lezen or Schrijven exam may want an intro screen too, and
-- there is no reason for that to become a second table later.
CREATE TABLE IF NOT EXISTS public.exam_parts (
  id               bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  exam_id          bigint NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  sort_order       integer NOT NULL,
  title            text NOT NULL,
  instruction_html text,
  -- Skip the screen for parts that exist only to group items.
  show_instruction boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  -- DEFERRABLE so the admin can reorder two parts inside one transaction without
  -- tripping the constraint mid-statement.
  CONSTRAINT exam_parts_sort_key UNIQUE (exam_id, sort_order) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS exam_parts_exam_idx ON public.exam_parts (exam_id, sort_order);

ALTER TABLE public.exam_parts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Published exam parts are public" ON public.exam_parts;
CREATE POLICY "Published exam parts are public"
  ON public.exam_parts FOR SELECT USING (public.exam_is_public(exam_id));
DROP POLICY IF EXISTS "Admins write exam parts" ON public.exam_parts;
CREATE POLICY "Admins write exam parts"
  ON public.exam_parts FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS exam_parts_touch_updated_at ON public.exam_parts;
CREATE TRIGGER exam_parts_touch_updated_at
  BEFORE UPDATE ON public.exam_parts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ── 5. A2 closed items — Lezen + Luisteren ──────────────────────────────────
-- The DUO player is two panes: a stimulus on the left (a text to read, or an audio
-- fragment over a still photo) and the question with its options on the right. KNM had
-- no stimulus at all — the question stood alone — which is the substantive difference.
--
-- One stimulus carries 1..N consecutive questions. Ordering runs through the stimulus:
-- `stimuli.sort_order` is the position in the exam, `questions.sort_order` the position
-- within the stimulus. There is therefore no representable state in which two questions
-- sharing one text are non-adjacent.
CREATE TABLE IF NOT EXISTS public.stimuli (
  id            bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  exam_id       bigint NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  part_id       bigint REFERENCES public.exam_parts(id) ON DELETE SET NULL,
  skill         text NOT NULL CHECK (skill IN ('lezen', 'luisteren')),
  sort_order    integer NOT NULL,
  section_id    smallint REFERENCES public.sections(id) ON DELETE SET NULL,

  -- Which renderer the player picks, so it is a closed set rather than free text.
  --   text   Lezen: body_html
  --   image  Lezen: a scanned-looking artefact (a form, a ticket) as an image
  --   audio  Luisteren: audio_url, optionally over image_url (the classroom photo)
  -- No 'video': see the header. DUO uses video, we deliberately do not.
  kind          text NOT NULL CHECK (kind IN ('text', 'audio', 'image')),

  intro         text,   -- "Lees eerst de vraag, dan de tekst." / "Luister naar de tekst."
  title         text,   -- docent-facing label; also shown above the pane when set
  body_html     text,   -- kind='text', authored in the admin editor
  image_url     text,   -- kind='image', or the still photo paired with kind='audio'
  image_alt     text,
  audio_url     text,   -- kind='audio': question-audio/<stimulus_id>/stimulus.mp3
  script        text,   -- the dialogue the audio was generated from

  -- Per-speaker voice assignment, e.g. {"A":"woman_older","B":"man_young"}. Keys are
  -- the speaker tags used in `script`; values are keys into data/tts-voices.json.
  --
  -- This is authored judgement, not a derived value: the script establishes gender
  -- through names and address forms ("mevrouw De Wit" → female) and a mismatch is an
  -- audible content bug. It is NOT recoverable from the mp3, so regenerating audio
  -- without it silently recasts an exam's speakers. Today this lives only as a CASTING
  -- literal in scripts/generate-free-practice-audio.mjs; it belongs with the content.
  voice_cast    jsonb,

  review_status text NOT NULL DEFAULT 'pending'
                  CHECK (review_status IN ('pending', 'validated')),
  reviewed_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT stimuli_exam_sort_key UNIQUE (exam_id, sort_order) DEFERRABLE INITIALLY DEFERRED,

  -- Each kind must carry its own payload, so a half-authored stimulus cannot render an
  -- empty pane to a paying candidate.
  CONSTRAINT stimuli_payload_matches_kind CHECK (
    CASE kind
      WHEN 'text'  THEN body_html IS NOT NULL
      WHEN 'image' THEN image_url IS NOT NULL
      WHEN 'audio' THEN audio_url IS NOT NULL
    END
  ),
  -- Audio belongs to Luisteren. Drop this line if a Lezen exam should ever carry audio.
  CONSTRAINT stimuli_media_matches_skill CHECK (
    skill = 'luisteren' OR kind IN ('text', 'image')
  )
);
COMMENT ON TABLE public.stimuli IS
  'The left pane; 1..N questions hang off each row. Written from scratch — DUO''s own '
  'exam texts are copyright and must never be reproduced (see CLAUDE.md).';

CREATE INDEX IF NOT EXISTS stimuli_exam_sort_idx ON public.stimuli (exam_id, sort_order);
CREATE INDEX IF NOT EXISTS stimuli_section_idx   ON public.stimuli (section_id);
CREATE INDEX IF NOT EXISTS stimuli_part_idx      ON public.stimuli (part_id);

ALTER TABLE public.stimuli ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Published stimuli are public" ON public.stimuli;
CREATE POLICY "Published stimuli are public"
  ON public.stimuli FOR SELECT USING (public.exam_is_public(exam_id));
DROP POLICY IF EXISTS "Admins write stimuli" ON public.stimuli;
CREATE POLICY "Admins write stimuli"
  ON public.stimuli FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS stimuli_touch_updated_at ON public.stimuli;
CREATE TRIGGER stimuli_touch_updated_at
  BEFORE UPDATE ON public.stimuli
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.questions (
  id             bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  stimulus_id    bigint NOT NULL REFERENCES public.stimuli(id) ON DELETE CASCADE,
  -- Cached from stimuli.exam_id so the player can fetch one exam in a single query and
  -- analytics never needs a two-hop join. Maintained by the trigger below; never
  -- written by the app. A generated column cannot hold a subquery, hence the trigger.
  exam_id        bigint NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  sort_order     integer NOT NULL,   -- position WITHIN the stimulus, 1..N

  prompt         text NOT NULL,
  -- Luisteren: the question is itself spoken, by a player independent of the stimulus'.
  prompt_audio_url text,
  image_url      text,
  explanation    text NOT NULL,

  -- How the options render. Set explicitly; the player does not guess from the data.
  option_layout  text NOT NULL DEFAULT 'text'
                   CHECK (option_layout IN ('text', 'image', 'image_grid')),

  -- docent review gate: audio may only be generated once validated
  review_status  text NOT NULL DEFAULT 'pending'
                   CHECK (review_status IN ('pending', 'validated')),
  reviewed_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT questions_stimulus_sort_key
    UNIQUE (stimulus_id, sort_order) DEFERRABLE INITIALLY DEFERRED
);
COMMENT ON COLUMN public.questions.exam_id IS
  'Cache of stimuli.exam_id, maintained by questions_sync_exam_id(). Do not write.';

CREATE INDEX IF NOT EXISTS questions_exam_idx     ON public.questions (exam_id);
CREATE INDEX IF NOT EXISTS questions_stimulus_idx ON public.questions (stimulus_id, sort_order);

CREATE OR REPLACE FUNCTION public.questions_sync_exam_id()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  SELECT s.exam_id INTO NEW.exam_id FROM public.stimuli s WHERE s.id = NEW.stimulus_id;
  IF NEW.exam_id IS NULL THEN
    RAISE EXCEPTION 'stimulus % does not exist', NEW.stimulus_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS questions_sync_exam_id ON public.questions;
CREATE TRIGGER questions_sync_exam_id
  BEFORE INSERT OR UPDATE OF stimulus_id ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.questions_sync_exam_id();

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Published questions are public" ON public.questions;
CREATE POLICY "Published questions are public"
  ON public.questions FOR SELECT USING (public.exam_is_public(exam_id));
DROP POLICY IF EXISTS "Admins write questions" ON public.questions;
CREATE POLICY "Admins write questions"
  ON public.questions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS questions_touch_updated_at ON public.questions;
CREATE TRIGGER questions_touch_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Options as rows, because DUO uses 3 OR 4 of them (Lezen 6/8/11 and Luisteren 7 run
-- A–D) and because an option can be pictures rather than text (Lezen item 11 has four
-- options, each composed of three thumbnails).
--
-- Rows rather than a jsonb array for two practical reasons: per-option audio is
-- generated asynchronously, and `UPDATE … WHERE id = …` has no lost-update race where a
-- read-modify-write of an array would; and each option gets a stable id to name its
-- storage path after, which an array index cannot (reorder it and the paths lie).
CREATE TABLE IF NOT EXISTS public.question_options (
  id           bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  question_id  bigint NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  -- The letter the candidate sees. Stored rather than derived from position, because
  -- the explanation and the docent's notes refer to "antwoord C" by name.
  label        char(1) NOT NULL CHECK (label IN ('A', 'B', 'C', 'D')),
  sort_order   integer NOT NULL,
  body         text,                             -- option_layout='text'
  image_urls   text[] NOT NULL DEFAULT '{}',     -- 1 for 'image', N for 'image_grid'
  image_alt    text,
  audio_url    text,                             -- read-aloud of this option
  is_correct   boolean NOT NULL DEFAULT false,

  CONSTRAINT question_options_label_key UNIQUE (question_id, label),
  CONSTRAINT question_options_sort_key
    UNIQUE (question_id, sort_order) DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT question_options_has_content CHECK (
    body IS NOT NULL OR cardinality(image_urls) > 0
  )
);

CREATE INDEX IF NOT EXISTS question_options_question_idx
  ON public.question_options (question_id, sort_order);

-- At most one correct option per question, declaratively. "At least one" is checked by
-- exam_publish_issues() instead of a constraint, because a half-authored question must
-- stay savable — otherwise the docent fights the tool for months.
CREATE UNIQUE INDEX IF NOT EXISTS question_options_one_correct_idx
  ON public.question_options (question_id) WHERE is_correct;

ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Published options are public" ON public.question_options;
CREATE POLICY "Published options are public"
  ON public.question_options FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.questions q WHERE q.id = question_id));
DROP POLICY IF EXISTS "Admins write options" ON public.question_options;
CREATE POLICY "Admins write options"
  ON public.question_options FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

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

-- The four Schrijven shapes seen across the three reference exams, plus Spreken. Typed
-- columns rather than one jsonb payload because these shapes come from DUO's published
-- format, not from our product — they will still be four shapes in three years — and a
-- CHECK per shape catches a half-filled task on save.
CREATE TABLE IF NOT EXISTS public.open_tasks (
  id                 bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  exam_id            bigint NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  part_id            bigint REFERENCES public.exam_parts(id) ON DELETE SET NULL,
  skill              text NOT NULL CHECK (skill IN ('schrijven', 'spreken')),
  sort_order         integer NOT NULL,
  section_id         smallint REFERENCES public.sections(id) ON DELETE SET NULL,

  --   email        pre-filled Aan/CC/Onderwerp + a seeded greeting and closing; the
  --                candidate writes between them
  --   short_text   free short text (the wijkkrant pieces), "minimaal drie zinnen"
  --   form         a rendered table: persoonsgegevens rows, radio lists, free cells
  --   picture_note a note driven by a before/after picture sequence
  --   speaking     any Spreken task; its shape comes from image_usage + the images
  task_type          text NOT NULL CHECK (task_type IN
                       ('email', 'short_text', 'form', 'picture_note', 'speaking')),
  title              text,
  prompt_html        text,
  bullet_points      jsonb NOT NULL DEFAULT '[]',   -- the required content points

  -- shape: email
  email_to           text,
  email_cc           text,
  email_subject      text,
  greeting           text,   -- pre-seeded above the input, e.g. "Beste meneer Jansen,"
  closing            text,   -- pre-seeded below, e.g. "Met vriendelijke groet,"

  -- shape: short_text | picture_note
  min_sentences      integer CHECK (min_sentences IS NULL OR min_sentences > 0),

  -- shape: form. The only jsonb payload here, because a form genuinely is a variable
  -- table of rows — that is data, not schema.
  form_schema        jsonb,

  -- spreken: how the images must be used. Drives the on-screen hint AND the rubric
  -- prompt — "Vertel iets bij elk plaatje" is a gradable requirement, not a layout note.
  -- Lives on the task, not the part, so a mixed part stays representable and the grader
  -- does not have to join two levels up.
  --   none      no images
  --   describe  1 image,  "Gebruik steeds het plaatje"
  --   choose    2 images, "U kiest steeds één plaatje"
  --   cover_all 3 images, "Gebruik alle plaatjes. Vertel iets bij elk plaatje"
  image_usage        text NOT NULL DEFAULT 'none'
                       CHECK (image_usage IN ('none', 'describe', 'choose', 'cover_all')),
  prompt_audio_url   text,   -- the spoken prompt
  prompt_script      text,
  max_record_seconds integer NOT NULL DEFAULT 60,   -- DUO gives 60s per Spreken task

  model_answer       text,
  rubric_id          bigint REFERENCES public.rubrics(id) ON DELETE SET NULL,
  review_status      text NOT NULL DEFAULT 'pending'
                       CHECK (review_status IN ('pending', 'validated')),
  reviewed_at        timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT open_tasks_sort_key UNIQUE (exam_id, sort_order) DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT open_tasks_type_matches_skill CHECK (
    (skill = 'spreken'   AND task_type = 'speaking') OR
    (skill = 'schrijven' AND task_type <> 'speaking')
  ),
  CONSTRAINT open_tasks_form_has_schema CHECK (
    task_type <> 'form' OR form_schema IS NOT NULL
  ),
  CONSTRAINT open_tasks_image_usage_is_speaking CHECK (
    skill = 'spreken' OR image_usage = 'none'
  )
);
COMMENT ON COLUMN public.open_tasks.form_schema IS
  '{ sections: [{ heading, rows: [ '
  '{ kind: "text", label, placeholder, prefill } | '
  '{ kind: "choice", label, options: [string], multiple: bool } | '
  '{ kind: "static", label, value } ] }] }';

CREATE INDEX IF NOT EXISTS open_tasks_exam_sort_idx ON public.open_tasks (exam_id, sort_order);
CREATE INDEX IF NOT EXISTS open_tasks_skill_idx     ON public.open_tasks (skill);
CREATE INDEX IF NOT EXISTS open_tasks_part_idx      ON public.open_tasks (part_id);

ALTER TABLE public.open_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Published open tasks are public" ON public.open_tasks;
CREATE POLICY "Published open tasks are public"
  ON public.open_tasks FOR SELECT USING (public.exam_is_public(exam_id));
DROP POLICY IF EXISTS "Admins write open_tasks" ON public.open_tasks;
CREATE POLICY "Admins write open_tasks"
  ON public.open_tasks FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS open_tasks_touch_updated_at ON public.open_tasks;
CREATE TRIGGER open_tasks_touch_updated_at
  BEFORE UPDATE ON public.open_tasks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Images belonging to an open task, in order, each with the caption printed under it.
-- A text[] of URLs could not carry these: in the reference material the captions are
-- content the candidate must use ("gestolen", "kapot"), not alt text, and the
-- picture_note shape needs a before/after grouping.
CREATE TABLE IF NOT EXISTS public.open_task_images (
  id          bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  task_id     bigint NOT NULL REFERENCES public.open_tasks(id) ON DELETE CASCADE,
  sort_order  integer NOT NULL,
  image_url   text NOT NULL,
  caption     text,   -- content: the word the candidate is meant to use
  alt_text    text,   -- accessibility
  group_label text,   -- picture_note: "voor" / "na"
  CONSTRAINT open_task_images_sort_key
    UNIQUE (task_id, sort_order) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS open_task_images_task_idx
  ON public.open_task_images (task_id, sort_order);

ALTER TABLE public.open_task_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Published task images are public" ON public.open_task_images;
CREATE POLICY "Published task images are public"
  ON public.open_task_images FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.open_tasks t WHERE t.id = task_id));
DROP POLICY IF EXISTS "Admins write task images" ON public.open_task_images;
CREATE POLICY "Admins write task images"
  ON public.open_task_images FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Every written and spoken answer a user produces, kept forever. APPEND-ONLY: a
-- resubmission is a new row, never an overwrite, because progress over time is the
-- point. There is deliberately no UNIQUE (user_id, task_id).
CREATE TABLE IF NOT EXISTS public.open_submissions (
  id             bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id        bigint REFERENCES public.exams(id) ON DELETE SET NULL,
  task_id        bigint NOT NULL REFERENCES public.open_tasks(id) ON DELETE CASCADE,
  -- Which sitting this belongs to. Nullable so an anonymous taster can still submit.
  attempt_id     bigint REFERENCES public.exam_attempts(id) ON DELETE CASCADE,

  answer_text    text,             -- schrijven: email | short_text | picture_note
  -- schrijven, form shape: a filled form is not one string, and flattening it into
  -- answer_text would make the rubric prompt unparseable.
  answer_json    jsonb,
  audio_url      text,             -- spreken, in the private speaking-submissions bucket
  transcript     text,             -- spreken, from /api/transcribe

  -- The model's grade as returned: { criteria: [{key, score, feedback}], overall, tips }.
  -- Per-criterion rows also land in open_criterion_scores, which is what makes progress
  -- chartable; this column keeps the raw response for audit.
  ai_result      jsonb,
  rubric_version integer,
  -- The docent's correction, kept BESIDE the model's rather than replacing it — the
  -- disagreement is the training signal that feeds grading_examples.
  teacher_result jsonb,
  teacher_notes  text,
  status         text NOT NULL DEFAULT 'submitted'
                   CHECK (status IN ('submitted', 'ai_graded', 'teacher_reviewed')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS open_submissions_user_idx   ON public.open_submissions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS open_submissions_task_idx   ON public.open_submissions (task_id);
CREATE INDEX IF NOT EXISTS open_submissions_attempt_idx ON public.open_submissions (attempt_id);
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

-- One row per rubric criterion per submission. THIS is what makes Schrijven and Spreken
-- progress chartable: without it the scores sit inside open_submissions.ai_result jsonb,
-- and "my grammar improved across six writing exams" would mean parsing JSON in the
-- browser. With it, the rubric series is a plain GROUP BY, the same shape as the MCQ
-- mastery series in lib/progression.ts.
--
-- Both the model's and the docent's scores are kept, discriminated by `source`, so a
-- correction never destroys what the model said — that disagreement is the signal.
CREATE TABLE IF NOT EXISTS public.open_criterion_scores (
  id             bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  submission_id  bigint NOT NULL REFERENCES public.open_submissions(id) ON DELETE CASCADE,
  rubric_id      bigint REFERENCES public.rubrics(id) ON DELETE SET NULL,
  -- Frozen alongside the score: the rubric this was judged against may be superseded,
  -- and a past grade must stay explainable.
  rubric_version integer,
  -- Matches a `key` in rubrics.criteria, e.g. 'inhoud' | 'woordgebruik' | 'grammatica'.
  criterion_key  text NOT NULL,
  score          smallint NOT NULL CHECK (score BETWEEN 0 AND 3),
  feedback       text,
  source         text NOT NULL CHECK (source IN ('ai', 'teacher')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  -- One score per criterion per source per submission. The docent's row and the model's
  -- row coexist; a re-grade from the same source replaces its own row.
  CONSTRAINT open_criterion_scores_key UNIQUE (submission_id, criterion_key, source)
);

CREATE INDEX IF NOT EXISTS open_criterion_scores_submission_idx
  ON public.open_criterion_scores (submission_id);
-- Backs the progress-over-time query: one criterion's scores for one user, in order.
CREATE INDEX IF NOT EXISTS open_criterion_scores_series_idx
  ON public.open_criterion_scores (criterion_key, source, created_at);

ALTER TABLE public.open_criterion_scores ENABLE ROW LEVEL SECURITY;
-- Own-rows via the parent submission; there is no user_id on this table by design.
DROP POLICY IF EXISTS "Users read own criterion scores" ON public.open_criterion_scores;
CREATE POLICY "Users read own criterion scores"
  ON public.open_criterion_scores FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.open_submissions s
    WHERE s.id = submission_id AND s.user_id = auth.uid()
  ));
DROP POLICY IF EXISTS "Admins manage criterion scores" ON public.open_criterion_scores;
CREATE POLICY "Admins manage criterion scores"
  ON public.open_criterion_scores FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

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
-- `exam_results` is a VIEW over exam_attempts — the latest attempt per user, skill and
-- exam. It is NOT a table any more.
--
-- Why: KNM upserted one row here per (user, exam), overwriting on every retake, so
-- history was destroyed as it was made. Making it a view leaves one source of truth and
-- keeps the four dashboard surfaces that SELECT from it working unchanged.
--
-- It also removes a live bug: ProefexamenEngine.tsx and InlineQuiz.tsx both upserted
-- with `onConflict: 'user_id,exam_number'` against a three-column key and omitted
-- `skill`, which raises 42P10 — every logged-in exam result was silently failing to
-- save. Those two call sites now INSERT an exam_attempts row instead; a view is not
-- writable, so the compiler of last resort (a runtime error) will catch any that were
-- missed.
--
-- security_invoker = true so the view is subject to exam_attempts' RLS rather than the
-- view owner's rights.
CREATE OR REPLACE VIEW public.exam_results
WITH (security_invoker = true) AS
  SELECT DISTINCT ON (a.user_id, a.skill, a.exam_number)
    a.id,
    a.user_id,
    a.exam_id,
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
  ORDER BY a.user_id, a.skill, a.exam_number, a.attempt_no DESC;

COMMENT ON VIEW public.exam_results IS
  'Latest completed attempt per user/skill/exam. Read-only — write to exam_attempts.';

-- Every MCQ answer ever given, append-only. This already feeds KNM's mastery chart
-- (lib/progression.ts buildProgressionSeries, ordered by answered_at), which is why the
-- MCQ half of progress-over-time works today.
--
-- Column names `was_correct` and `exam` match what the app already inserts — the engine
-- and the admin analytics both write this table, and Supabase queries are untyped
-- strings, so renaming would break them with nothing failing at build time.
CREATE TABLE IF NOT EXISTS public.user_question_results (
  id          bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id bigint REFERENCES public.questions(id) ON DELETE CASCADE,
  exam        integer,
  -- Which sitting. Nullable: the anonymous free taster answers questions without one.
  attempt_id  bigint REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  -- Which distractor they picked. Impossible to backfill, so it is captured from the
  -- start even though the analyse page that will use it is not built yet.
  chosen_option_id bigint REFERENCES public.question_options(id) ON DELETE SET NULL,
  was_correct boolean NOT NULL,
  answered_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_question_results_user_idx
  ON public.user_question_results (user_id, answered_at);
CREATE INDEX IF NOT EXISTS user_question_results_attempt_idx
  ON public.user_question_results (attempt_id);

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
-- Column names follow /api/generate-wordcard-audio, which selects `dutch, dutch_example`
-- and writes `audio_dutch_word, audio_dutch_sentence`. The first draft of this baseline
-- renamed them to term/definition/audio_url for tidiness and broke that route: here the
-- CODE is the source of truth, because it has a consumer and the table has no rows.
CREATE TABLE IF NOT EXISTS public.word_cards (
  id            bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  theme_id      integer,
  -- Which skill's word list this card belongs to, since a module bundles the word list
  -- for its own skill (see lib/pricing.ts).
  skill         text CHECK (skill IN ('lezen', 'luisteren', 'schrijven', 'spreken')),
  dutch         text NOT NULL,
  dutch_example text,
  translation_en text,
  translation_ar text,
  translation_tr text,
  audio_dutch_word     text,
  audio_dutch_sentence text,
  image_url     text,
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
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

-- `anchor`, `audio_script` and `audio_cues` are required by
-- /api/admin/generate-lesson-audio, which filters on (theme_id, anchor) and writes the
-- other two. The first draft dropped all three and broke that route.
CREATE TABLE IF NOT EXISTS public.leren_content (
  id         bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  theme_id   integer NOT NULL,
  -- Lessons hang off a skill, because a module bundles the lessons for its own skill.
  skill      text CHECK (skill IN ('lezen', 'luisteren', 'schrijven', 'spreken')),
  -- Section anchor within a theme; the audio route's lookup key alongside theme_id.
  anchor     text,
  slug       text UNIQUE,
  title      text,
  body_html  text,
  audio_url  text,
  audio_url_en text,
  audio_url_ar text,
  -- The script the narration was generated from, and word-level timing cues from
  -- ElevenLabs' with-timestamps endpoint (used to highlight text as it is read).
  audio_script text,
  audio_cues jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leren_content_theme_anchor_key UNIQUE (theme_id, anchor)
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

-- ── 9. compatibility view + publish validator ───────────────────────────────
-- Nine sites select option_a/b/c/correct as untyped strings (lib/questions.ts,
-- dashboard/fouten, admin/questions, QuestionsTable, QuestionForm, ExamsGrid,
-- api/generate-question-audio, ExamsView, LerenThemaView). This view pivots the option
-- rows back into that flat shape so those reads become a mechanical
-- from('questions') → from('questions_flat') change.
--
-- READ-ONLY by design: the flattening is not invertible, so anything that WRITES must
-- move to question_options. Delete this view once every read site has migrated.
-- security_invoker = true is required, or the view would bypass the RLS above.
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

COMMENT ON VIEW public.questions_flat IS
  'Back-compat for read sites still expecting option_a/b/c. Read-only; write to '
  'question_options. Remove once all callers have migrated.';

-- Returns one row per problem; an empty result means the exam is safe to publish.
--
-- Deliberately NOT a trigger or a set of constraints: a half-authored exam must always
-- be savable, or the docent fights the tool for the months it takes to write 40 exams.
-- The admin calls this from the publish button. It also replaces ExamsGrid's hardcoded
-- "40 questions / 7 KNM categories" warnings, which are wrong for every A2 skill.
CREATE OR REPLACE FUNCTION public.exam_publish_issues(p_exam_id bigint)
RETURNS TABLE (severity text, entity text, entity_id bigint, issue text)
LANGUAGE sql STABLE AS $$
  -- Questions with no correct option marked. (Two correct is impossible: see
  -- question_options_one_correct_idx.)
  SELECT 'error', 'question', q.id, 'Geen juist antwoord aangevinkt'
  FROM public.questions q
  WHERE q.exam_id = p_exam_id
    AND NOT EXISTS (SELECT 1 FROM public.question_options o
                    WHERE o.question_id = q.id AND o.is_correct)

  UNION ALL
  -- DUO uses 3 or 4 options. Anything else is a mis-authored item.
  SELECT 'error', 'question', q.id,
         format('%s antwoordopties; DUO gebruikt 3 of 4', count(o.id))
  FROM public.questions q
  LEFT JOIN public.question_options o ON o.question_id = q.id
  WHERE q.exam_id = p_exam_id
  GROUP BY q.id
  HAVING count(o.id) NOT IN (3, 4)

  UNION ALL
  -- Text options must have text; image options must have images.
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
  -- A multi-speaker dialogue with no casting will be recast at random on regeneration.
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
  SELECT 'warning', 'open_task', t.id, 'Geen voorbeeldantwoord'
  FROM public.open_tasks t
  WHERE t.exam_id = p_exam_id AND coalesce(btrim(t.model_answer), '') = ''

  UNION ALL
  -- Item count must match the DUO format in data/skills.ts: 25/25/4/16.
  SELECT 'error', 'exam', e.id,
         format('%s opgaven; %s heeft er %s bij DUO', cnt.n, e.skill, expected.n)
  FROM public.exams e
  CROSS JOIN LATERAL (
    SELECT CASE e.skill WHEN 'lezen' THEN 25 WHEN 'luisteren' THEN 25
                        WHEN 'schrijven' THEN 4 ELSE 16 END AS n
  ) expected
  CROSS JOIN LATERAL (
    SELECT CASE WHEN e.skill IN ('lezen','luisteren')
                THEN (SELECT count(*) FROM public.questions q WHERE q.exam_id = e.id)
                ELSE (SELECT count(*) FROM public.open_tasks t WHERE t.exam_id = e.id)
           END AS n
  ) cnt
  WHERE e.id = p_exam_id AND cnt.n <> expected.n

  UNION ALL
  -- Spreken runs as 4 onderdelen of 4 tasks.
  SELECT 'error', 'exam', e.id,
         format('Spreken heeft 4 onderdelen nodig, gevonden %s',
                (SELECT count(*) FROM public.exam_parts p WHERE p.exam_id = e.id))
  FROM public.exams e
  WHERE e.id = p_exam_id AND e.skill = 'spreken'
    AND (SELECT count(*) FROM public.exam_parts p WHERE p.exam_id = e.id) <> 4;
$$;

COMMENT ON FUNCTION public.exam_publish_issues IS
  'Pre-publish validator. Empty result = safe to publish. Called by the admin, never as '
  'a trigger — work in progress must stay savable.';

COMMIT;

-- ── 10. storage buckets ─────────────────────────────────────────────────────
-- Outside the transaction: on a hosted project storage.buckets is owned by the storage
-- role, and a failure here must not roll the schema back.
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('question-audio',       'question-audio',       true),
  ('question-images',      'question-images',      true),
  -- Used by /api/generate-wordcard-audio and /api/admin/generate-lesson-audio, which
  -- have been uploading to buckets no migration ever created.
  ('wordcard-audio',       'wordcard-audio',       true),
  ('leren-audio',          'leren-audio',          true),
  -- Spreken recordings are personal data: private, reached through signed URLs only.
  ('speaking-submissions', 'speaking-submissions', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read exam media" ON storage.objects;
CREATE POLICY "Public read exam media"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('question-audio', 'question-images', 'wordcard-audio', 'leren-audio'));

DROP POLICY IF EXISTS "Users read own recordings" ON storage.objects;
CREATE POLICY "Users read own recordings"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'speaking-submissions' AND owner = auth.uid());

DROP POLICY IF EXISTS "Users upload own recordings" ON storage.objects;
CREATE POLICY "Users upload own recordings"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'speaking-submissions' AND owner = auth.uid());

NOTIFY pgrst, 'reload schema';
