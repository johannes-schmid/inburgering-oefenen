-- ============================================================================
-- B1's exam structure, worked out against DUO's own B1 material.
--
-- Until now every B1 rule column was NULL, which by this schema's convention means
-- "unverified" — `exam_publish_issues()` skips what it does not know, and `data/skills.ts`
-- renders an em dash rather than a guess. That was correct: nobody had counted B1.
--
-- It has now been counted, off the CvTE/DUO *Openbaar examen* booklets for Lezen I,
-- Schrijven I and Spreken I (2022 and 2023 editions, plus the 2024/2025 Spreken booklets
-- and the "Opbouw examen …" summaries that came with them). Those booklets are copyright
-- and are not reproduced anywhere in this repo — only the *shape* is recorded here, which
-- is the same rule `SEO/facts.md` §1 set for the A2 item counts.
--
--   Lezen      6 teksten, 35 vragen, 4–7 vragen per tekst, 3 of 4 opties, 110 minuten
--   Schrijven  12 opdrachten, 100 minuten
--   Spreken    2 delen × 8 opgaven = 16, ± 30 minuten
--
-- **Luisteren stays NULL, deliberately.** There is no B1 Luisteren reference material, so
-- its shape is still genuinely unknown. Filling it in "for symmetry" would invent the
-- standard the docent's work is measured against — the exact failure the NULL convention
-- exists to prevent.
--
-- ## Schrijven B1 is a different animal from A2, and needs four new categories
--
-- A2 Schrijven is four opgaven of four kinds. B1 is twelve, and eight of them are one
-- kind that does not exist at A2 at all: a part-written e-mail or bericht with the
-- sentence left open, which the candidate finishes in two or three lines. The remaining
-- four are long texts, drawn from a pool wider than A2's:
--
--   sentence_completion  opdracht 1–8   maak de zin af (e-mail of bericht)
--   form                 exactly one    een vragenlijst van ± 5 open vragen
--   email                a long e-mail with an opdracht of 4–6 punten
--   letter               a brief or briefje — sollicitatie, buurtbriefje, klacht
--   picture_report       a verslag that must use every plaatje
--   data_text            an advies of verslag built on a tabel or grafiek
--
-- These are added to `task_categories`, which `20260807000000` made the reference table,
-- and `open_tasks.task_type`'s CHECK is widened to match. **The category axis is the
-- rubric axis** (`rubricCategory()` in lib/rubrics.ts) — so each new category needs its own
-- B1 rubric before an exam using it can be published, which `scripts/seed-b1-content.mjs`
-- mints as a marked draft rather than failing the onderdeel.
--
-- Why not fold these onto A2's four? Because the category is what selects the rubric. A
-- two-line sentence completion and a full sollicitatiebrief graded against one set of
-- anchors would return a confident, plausible, wrong mark — this repo's quietest failure
-- mode, and the reason `resolveRubric` is level-scoped in the first place.
--
-- Spreken B1 reuses the five existing `speaking_*` categories: DUO's B1 opgaven differ from
-- A2's in *length* (20 s in deel 1, 30 s in deel 2) and register, not in what the plaatjes
-- ask of the candidate. A sixth value saying the same thing is a second place to disagree.
-- The one real difference is the shape of the exam: two delen of eight, not four of four.
-- ============================================================================

-- ── 1. Lezen's tekstsoorten ─────────────────────────────────────────────────
-- B1's sections were mirrored from A2 when 20260802 added the level. Two of DUO's B1
-- text sources have no A2 equivalent and were landing as "geen tekstsoort": a page from
-- an onderwijsinstelling's website, and an extract from a studieboek. The other four
-- (folder, artikel, regels, brief) already exist at b1 and are reused.
--
-- Ids are not hardcoded: `sections.id` is a serial and the A2/B1 rows were inserted in an
-- order this migration must not assume.
INSERT INTO public.sections (slug, topic, level, name_nl, sort_order)
SELECT v.slug, 'lezen', 'b1', v.name_nl, v.sort_order
FROM (VALUES
  ('website',    'Website of webpagina', 60),
  ('studieboek', 'Studieboek of cursus', 70)
) AS v(slug, name_nl, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.sections s
  WHERE s.slug = v.slug AND s.topic = 'lezen' AND s.level = 'b1'
);

-- B1's teksten run 400–600 woorden across numbered alinea's; "Kort artikel" is A2's label
-- and reads as a promise this level does not keep.
UPDATE public.sections SET name_nl = 'Artikel'
WHERE topic = 'lezen' AND level = 'b1' AND slug = 'artikel';

-- ── 2. The four new Schrijven categories ────────────────────────────────────
INSERT INTO public.task_categories (skill, category, label_nl, sort_order) VALUES
  ('schrijven', 'sentence_completion', 'Zin afmaken',                  5),
  ('schrijven', 'letter',             'Brief of briefje',              50),
  ('schrijven', 'picture_report',     'Verslag bij plaatjes',          60),
  ('schrijven', 'data_text',          'Tekst bij een tabel of grafiek', 70)
ON CONFLICT (skill, category) DO NOTHING;

-- `open_tasks.task_type` is a CHECK rather than an FK to task_categories, because Spreken's
-- task_type is the literal 'speaking' while its *categories* are 'speaking_' || image_usage
-- — an FK would reject every Spreken row. Widened, not replaced: the five A2 values stay.
ALTER TABLE public.open_tasks DROP CONSTRAINT IF EXISTS open_tasks_task_type_check;
ALTER TABLE public.open_tasks
  ADD CONSTRAINT open_tasks_task_type_check CHECK (task_type IN (
    -- A2 and B1
    'email', 'short_text', 'form', 'picture_note', 'speaking',
    -- B1 only
    'sentence_completion', 'letter', 'picture_report', 'data_text'
  ));

COMMENT ON COLUMN public.open_tasks.task_type IS
  'The shape of the opgave, and (for Schrijven) the rubric category. A2 uses email, '
  'short_text, form, picture_note; B1 adds sentence_completion (maak de zin af — the '
  'greeting/closing columns carry the given text around the gap), letter, picture_report '
  'and data_text. Spreken is always ''speaking''; its shape comes from image_usage.';

-- ── 3. exam_formats for B1 ──────────────────────────────────────────────────
-- Every number below is off the Openbaar examen booklets. Luisteren is untouched.
UPDATE public.exam_formats SET
  item_count                 = 35,
  duration_seconds           = 6600,   -- 110 minuten
  stimulus_count             = 6,
  questions_per_stimulus_min = 4,      -- 2022: 4,6,6,5,7,7 · 2023: 6,5,6,6,7,5
  questions_per_stimulus_max = 7,
  options_min                = 3,      -- a/b/c, with an occasional four-option vraag
  options_max                = 4
WHERE level = 'b1' AND skill = 'lezen';

UPDATE public.exam_formats SET
  item_count       = 12,
  duration_seconds = 6000              -- 100 minuten
WHERE level = 'b1' AND skill = 'schrijven';

UPDATE public.exam_formats SET
  item_count       = 16,
  duration_seconds = 1800,             -- "totale tijdsduur ± 30 minuten"
  part_count       = 2,                -- deel 1 (opgave 1-8), deel 2 (opgave 9-16)
  items_per_part   = 8
WHERE level = 'b1' AND skill = 'spreken';

-- ── 4. exam_task_rules for B1 ───────────────────────────────────────────────
-- Quotas, not a blueprint: DUO orders the four long opdrachten differently every year and
-- draws them from a wider pool than it uses in any one exam, so the mix is checked and the
-- order is not — the same call `20260806` made for A2 Schrijven.
--
-- 8 × sentence_completion + 1 × form + 3 drawn from {email, letter, picture_report,
-- data_text} = 12. The maxima therefore overlap; what pins the total is item_count.
INSERT INTO public.exam_task_rules
  (level, skill, category, min_per_exam, max_per_exam, image_count, min_sentences, bullets_min, bullets_max, record_seconds)
VALUES
  ('b1', 'schrijven', 'sentence_completion', 8, 8, NULL, NULL, NULL, NULL, NULL),
  ('b1', 'schrijven', 'form',                1, 1, NULL, NULL, NULL, NULL, NULL),
  ('b1', 'schrijven', 'email',               0, 2, NULL, NULL, 4,    6,    NULL),
  ('b1', 'schrijven', 'letter',              0, 2, NULL, NULL, 4,    6,    NULL),
  ('b1', 'schrijven', 'picture_report',      0, 1, 3,    NULL, 4,    6,    NULL),
  ('b1', 'schrijven', 'data_text',           0, 1, NULL, NULL, 3,    5,    NULL),
  -- Spreken: deel 1 is eight korte opgaven (20 s), deel 2 eight langere (30 s). The
  -- recording cap stays 60 s — DUO's spreektijd is the *target*, and cutting a B1
  -- candidate off at 20 s would fail them on the tool's stopwatch rather than their Dutch.
  ('b1', 'spreken',   'speaking_none',       4, 7, 0,    NULL, NULL, NULL, 60),
  ('b1', 'spreken',   'speaking_react',      2, 4, 1,    NULL, NULL, NULL, 60),
  ('b1', 'spreken',   'speaking_describe',   1, 3, 1,    NULL, NULL, NULL, 60),
  ('b1', 'spreken',   'speaking_choose',     1, 3, 2,    NULL, NULL, NULL, 60),
  ('b1', 'spreken',   'speaking_cover_all',  2, 4, 3,    NULL, NULL, NULL, 60)
ON CONFLICT (level, skill, category) DO UPDATE SET
  min_per_exam   = EXCLUDED.min_per_exam,
  max_per_exam   = EXCLUDED.max_per_exam,
  image_count    = EXCLUDED.image_count,
  min_sentences  = EXCLUDED.min_sentences,
  bullets_min    = EXCLUDED.bullets_min,
  bullets_max    = EXCLUDED.bullets_max,
  record_seconds = EXCLUDED.record_seconds;
