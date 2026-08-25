-- ═══════════════════════════════════════════════════════════════════════════════
-- KNM becomes the fifth onderdeel.
--
-- `20260803000000_open_skill_axis.sql` shipped the *capability* for this without adding
-- it: the eight CHECK constraints became foreign keys to `skills`, `questions.stimulus_id`
-- became nullable behind `skills.requires_stimulus`, and `exams.level` became nullable
-- behind `skills.is_levelled`. This migration is that INSERT, plus the four things the
-- capability note said would be needed beside it — the format row, the sections, the exam
-- slots, and the columns KNM's lessons and woordkaarten carry that the A2 shapes do not.
--
-- **KNM is deliberately not levelled.** DUO does not examine KNM at A2 versus B1; filing
-- it under A2 would hide it from B1 candidates and put it inside the per-level bundle,
-- which is priced as "the four taalonderdelen of one level". `exams.level IS NULL` for
-- every KNM exam and `exams_level_matches_skill()` enforces that in both directions.
--
-- **KNM questions stand alone.** Lezen and Luisteren share one stimulus across 2–3
-- questions; a KNM question is a single prompt with three options and nothing above it.
-- `requires_stimulus = false` is what lets `questions.stimulus_id` be NULL for this
-- onderdeel only — a stimulus-less Lezen question is still a hard error.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── The onderdeel ─────────────────────────────────────────────────────────────
INSERT INTO skills (slug, name_nl, sort_order, scoring, requires_stimulus, is_levelled)
VALUES ('knm', 'KNM', 50, 'mcq', false, false)
ON CONFLICT (slug) DO UPDATE
  SET name_nl = EXCLUDED.name_nl,
      sort_order = EXCLUDED.sort_order,
      scoring = EXCLUDED.scoring,
      requires_stimulus = EXCLUDED.requires_stimulus,
      is_levelled = EXCLUDED.is_levelled;

-- ── Its format ────────────────────────────────────────────────────────────────
-- 40 items is a fact about *our* exams, not about DUO's: the 419-question bank divides
-- into ten sittings of forty with nineteen left over in the backlog. 45 minutes is DUO's
-- published duration for the KNM examen. Three options, always — the whole bank is A/B/C.
-- `stimulus_count` stays NULL because a KNM question has no fragment above it; the
-- validator skips what it does not know rather than reading NULL as zero.
INSERT INTO exam_formats (level, skill, item_count, duration_seconds, options_min, options_max, verified_note)
VALUES (NULL, 'knm', 40, 2700, 3, 3,
        'Item count is ours: the 419-question bank divides into ten sittings of forty. '
        'Duration is DUO''s published 45 minuten for het examen Kennis van de Nederlandse '
        'Maatschappij. Not a DUO item-count norm — never state it as one.')
ON CONFLICT (level, skill) DO UPDATE
  SET item_count = EXCLUDED.item_count,
      duration_seconds = EXCLUDED.duration_seconds,
      options_min = EXCLUDED.options_min,
      options_max = EXCLUDED.options_max,
      verified_note = EXCLUDED.verified_note;

-- ── The eleven exam slots ─────────────────────────────────────────────────────
-- Number 0 is the backlog, exactly as it is for the four taalonderdelen: `exams_backlog_
-- never_published` refuses to publish or free it, and every count that lists "the ten
-- oefenexamens" filters `number > 0`. Nineteen questions in the bank carry no exam
-- number and land there.
--
-- Exam 1 is free, matching A2's free tier: one full sitting behind an account.
INSERT INTO exams (level, skill, number, title, is_free, duration_seconds, published, pass_threshold_pct)
SELECT NULL, 'knm', n,
       CASE WHEN n = 0 THEN 'KNM — backlog' ELSE 'KNM oefenexamen ' || n END,
       n = 1,
       2700,
       n > 0,
       60
FROM generate_series(0, 10) AS n
ON CONFLICT (level, skill, number) DO UPDATE
  SET title = EXCLUDED.title,
      duration_seconds = EXCLUDED.duration_seconds,
      pass_threshold_pct = EXCLUDED.pass_threshold_pct;

-- ── The sub-topic axis ────────────────────────────────────────────────────────
-- KNM's 43 sections are its tekstsoort equivalent — "De Gouden Eeuw en handel",
-- "Huren", "Zorgverzekering". They group under the seven official thema's, which is also
-- how the lessons and the woordkaarten are keyed, so `sections` gains a nullable
-- `theme_id`. It is nullable and unused by the four taalonderdelen: a tekstsoort there
-- has no parent, and inventing one would be a second axis saying nothing.
ALTER TABLE sections ADD COLUMN IF NOT EXISTS theme_id smallint;

COMMENT ON COLUMN sections.theme_id IS
  'KNM only: which of the seven official thema''s this sub-topic belongs to. NULL for the '
  'taalonderdelen, whose tekstsoorten have no parent. Matches leren_content.theme_id and '
  'word_cards.theme_id, so a thema resolves to its lessons, its words and its questions.';

-- ── A standalone question carries its own sub-topic ───────────────────────────
-- For Lezen and Luisteren the tekstsoort lives on the **stimulus**, because a text shared
-- by three questions has one genre. A KNM question has no stimulus, so it had nowhere to
-- record which of the 43 sub-topics it belongs to — and the per-onderdeel score breakdown
-- reads exactly that. The column is nullable and stays NULL for the taalonderdelen:
-- `stimuli.section_id` is still the authority wherever a stimulus exists, and two places
-- claiming the same fact for one question is how they come to disagree.
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS section_id smallint REFERENCES sections(id) ON DELETE SET NULL;

COMMENT ON COLUMN questions.section_id IS
  'Sub-topic of a *standalone* question (an onderdeel with requires_stimulus = false, i.e. '
  'KNM). NULL wherever the question hangs off a stimulus — read stimuli.section_id there.';

-- ── The lesson columns KNM's modules carry ────────────────────────────────────
-- `leren_content` here was reshaped for a lesson with a slug and a title. KNM's modules
-- are a thema of numbered sections, each with an anchor, a Material-symbol icon, a
-- heading and a subtitle. Adding the three columns is cheaper and more honest than
-- overloading `title` to mean two things.
ALTER TABLE leren_content
  ADD COLUMN IF NOT EXISTS icon     text,
  ADD COLUMN IF NOT EXISTS heading  text,
  ADD COLUMN IF NOT EXISTS subtitle text;

-- ── The woordkaart columns KNM's cards carry ──────────────────────────────────
-- `data/woordkaarten.ts` in this repo already holds all 366 cards *with* these fields;
-- the table was created without them, so seeding would have silently dropped the article,
-- the plural and the Dutch definition — which is most of what a woordkaart teaches.
ALTER TABLE word_cards
  ADD COLUMN IF NOT EXISTS theme_name        text,
  ADD COLUMN IF NOT EXISTS article           text,
  ADD COLUMN IF NOT EXISTS plural            text,
  ADD COLUMN IF NOT EXISTS dutch_description text,
  ADD COLUMN IF NOT EXISTS description_en    text,
  ADD COLUMN IF NOT EXISTS description_ar    text,
  ADD COLUMN IF NOT EXISTS description_tr    text;

-- ── The woordkaart picture bucket ─────────────────────────────────────────────
-- `wordcard-audio` came across with the fork; `wordcard-images` did not, so every card's
-- picture had nowhere local to live. Public, like the other two content buckets — a
-- woordkaart image is shown to anonymous visitors on the free surfaces.
INSERT INTO storage.buckets (id, name, public)
VALUES ('wordcard-images', 'wordcard-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;
