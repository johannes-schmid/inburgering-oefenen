# The database, and every rule that is enforced in it

One exam, its stimuli, its questions and its open tasks — plus the level axis, the structure
rules, the rubric categories and what it takes to add a fifth onderdeel.

> Moved out of `CLAUDE.md` on 2026-09-02, unchanged. It is the reasoning behind decisions
> that are already made — read it when a task touches this area, not every session.
> The rules that must hold at all times live in `CLAUDE.md`; this file is why they hold.


### The content model in one paragraph
An **exam** has **stimuli** (the left pane: a text, an image, or an audio fragment), and each
stimulus carries **1..N questions** — DUO shares one text across 2–3 questions, so the stimulus
cannot live on the question. Each question has 3 or 4 **question_options** rows, which may hold
text or images. Schrijven/Spreken use **open_tasks** (+ **open_task_images** for captioned
pictures) grouped into **exam_parts** (Spreken's four onderdelen). Answers are append-only:
**exam_attempts** is one row per sitting, **user_question_results** every MCQ answer,
**open_submissions** every written/spoken answer, and **open_criterion_scores** one row per
rubric criterion — which is what makes Schrijven/Spreken progress chartable. `exam_results` is
a **view** of the latest attempt; never write to it. Read `questions_flat` for the old flat
option_a/b/c shape; write `question_options`.

**Schema lives in four files:** `supabase/migrations/20260729000000_a2_baseline.sql`,
`20260802000000_b1_level.sql` (the second CEFR level), `20260803000000_open_skill_axis.sql`
(makes a fifth onderdeel addable without a migration) and `20260804000000_question_backlog.sql`
(exam number 0 as a holding area, plus the stimulus→questions exam_id cascade). See the two sections below.
The 26 inherited KNM migrations are archived in `supabase/legacy-knm-migrations/` and are
**not** applied — that chain could not be replayed on an empty database at all, because one
migration backfills from an `exam_results` table no migration ever created. See the README
there. Add real migrations *after* the baseline; never edit it once it has run on production.

### Two levels: A2 and B1

`20260802000000_b1_level.sql` added B1 beside A2. The level is on `exams`, `sections`, `rubrics`,
`grading_examples` and `exam_attempts`, and it is part of the **key** in every one of them —
exam numbers restart at 1 per level, so `(skill, number)` is no longer unique on its own.

- **`data/skills.ts` splits identity from format.** `SKILLS` is the four onderdelen and never
  carries a count; `getSkillAtLevel(level, slug)` / `skillsAtLevel(level)` add `itemCount`,
  `durationMinutes` and `examCount`. There is deliberately **no default level** in that lookup —
  a silent A2 fallback is the bug the split exists to prevent.
- **B1's item counts and durations are `null`, on purpose.** Nobody has counted them off DUO's B1
  practice exams the way A2's were counted (`SEO/facts.md` §1), and `SEO/facts.md` forbids
  publishing an unsourced number. `null` renders as an em dash, and `exam_formats.item_count` is
  NULL so `exam_publish_issues()` **skips** the count check rather than blocking the docent on a
  guess. Fill both in together — the table and `data/skills.ts` must not drift.
- ~~**B1's 40 slots are unpublished and none is free.**~~ Thirty are published and three are free
  as of 2026-09-02 (Lezen/Schrijven/Spreken exam 1); B1 Luisteren's ten are still unpublished. When
  written, the free tier was A2 exam 1 of each
  onderdeel; giving away a B1 exam is a pricing decision nobody has made. Their
  `duration_seconds` is a placeholder copied from A2 — confirm it before publishing.
- **A module is `level:skill`.** `a2:lezen`, `b1:spreken`. A bare slug in existing metadata means
  A2 and `normaliseModule()` reads it that way on the fly; there is no backfill, because the
  webhook, the cron and the cancel route all write that field. The **bundle discount is per
  level** — four modules spread across two levels get no discount.
- **URLs carry the level at both levels**, including A2. `next.config.ts` 308s the old
  A2-implicit paths; the `(?!a2$|b1$)` guard in those rules is what stops them looping.
- **Nothing about B1 is advertised until it has content.** The dashboard section, the module
  picker entry, the sitemap and `robots` all gate on published exams, so an empty B1 is invisible
  rather than a wall of "Binnenkort".
- **`lib/ai/level-register.ts` is the only place a level's register is described.** The grader,
  the authoring helper and the rubric prefill all read it. Cross-level contamination here is the
  quietest failure in the system: an A2 few-shot example shown while grading B1 returns a
  confident, plausible, wrong mark and no error anywhere. `fetchFewShot` and `resolveRubric` are
  both level-scoped for that reason.

### What an exam has to look like inside — `exam_formats` and `sections`

`20260805000000_exam_structure_rules.sql` gave the shape of an exam a home. `exam_formats` already
held the item count and the duration; it now also holds `stimulus_count`,
`questions_per_stimulus_min/_max`, `options_min/_max` and `audio_seconds_min/_max`, and `sections`
is the tekstsoort axis (`stimuli.section_id` already pointed at it). **A2 Luisteren is the only
worked-out pair: 25 questions over 10 fragments, 2–3 questions each, 3 or 4 options, 40–50 seconds
of audio.** A2 Lezen carries the option range only.

- **Every rule column is nullable and NULL means unverified.** The validator skips the check rather
  than blocking the docent on a guess — the same convention `item_count` established, and the same
  reason: a number invented in this table silently becomes the standard her work is measured
  against. Fill one in only by working the shape out against DUO's material, and change
  `RULES` in `data/skills.ts` in the same commit.
- **There is deliberately no per-tekstsoort quota.** How many gesprekken versus mededelingen a DUO
  exam holds is not something anyone has verified, so `exam_structure_summary(exam_id)` reports the
  distribution and the docent judges it. The "Opbouw" card in the exam builder renders that, with a
  second column showing what is waiting in the backlog per tekstsoort.
- **Every structure rule is a warning, never an error** (owner's decision, 2026-08-07). A 24-of-25
  exam she wants live must be able to go live. The one exception is the option count, which was
  already a hard error and now merely reads its 3/4 from the format instead of hardcoding it.
- **The validator's output scales with the content, so identical issues are grouped in the UI.**
  Ten fragments with no recorded duration produced ten identical lines that pushed the real
  blocking errors off the panel. `groupIssues()` in `ExamBuilder` collapses them into one line
  naming the ids.
- **`stimuli.audio_seconds` exists because the length is not recoverable from a URL.**
  `/api/generate-stimulus-audio` writes it in the same UPDATE as `audio_url` (via
  `lib/mp3-duration.ts`, which counts MPEG frame headers — there is no ffmpeg in a serverless
  function), and for a pasted URL the editor reads it off the `<audio>` element's metadata.
- **The backlog is exempt from every exam-level count**, including the pre-existing item-count
  error, via `e.number > 0`. It is a holding area, not an exam; its publish panel is hidden too,
  because `exams_backlog_never_published` rejects the UPDATE anyway.

### The open onderdelen have their own axis — `exam_task_rules`

`20260806000000_open_skill_structure.sql` filled in the other three onderdelen off DUO's material
(`SEO/facts.md` §1, "The shape inside an exam"). Lezen is now 1–3 vragen per tekst; Schrijven and
Spreken got a table of their own, because their rules are **per soort opgave** and `exam_formats`
is one flat row per (level, skill).

- **The category axis is `rubricCategory()`, deliberately reused rather than invented.** Schrijven's
  `task_type` and Spreken's `image_usage` already collapse onto one string, and rubric authoring
  and grading key on it — so structure validation keys the same way, and a fifth soort opgave is
  one row in three places instead of a new concept. `exam_task_rules.category` **must** equal what
  `rubricCategory()` returns; `exam_task_summary()` derives it in SQL with the same CASE.
- **`image_usage` gained `react`** — DUO's Spreken onderdeel 1. At DUO it is a video; here it is one
  still image (owner's decision, 2026-08-08), because a video pipeline for 4 of 16 items buys
  nothing the still does not. It carries one plaatje exactly like `describe`, so **`image_usage` is
  the only thing separating the two**, and they grade against different criteria — which is why the
  value exists at all instead of reusing `describe`. Seven files declare that union inline; all
  seven were updated, including `lib/ai/grade.ts` (no entry = no instruction line to the grader)
  and `components/exam/SpeakingTask.tsx` (no entry = no instruction to the candidate).
- **Schrijven's composition is a quota, not a blueprint.** All three DUO oefenexamens hold exactly
  one formulier and one korte tekst; they order the four opgaven differently. So `min_per_exam` /
  `max_per_exam` are checked and the order is not.
- **A missing soort is rendered, not omitted.** `exam_task_summary()` FULL OUTER JOINs the rules,
  so a category with no opgaven comes back at 0 — "er zit geen formulier in dit examen" is the most
  useful thing the panel can say, and a row that is not there cannot say it. `ExamBuilder` renders
  the shortfall in `text-secondary` (`#a24000`), **not** `text-warning`, which is `yellow-500`.
- **`sections` is retired for the open skills.** The genre *is* `task_type` and the shape *is*
  `image_usage`; a second axis saying the same thing is a second place to disagree. The six rows
  are deleted at both levels, and the "Geen tekstsoort gekozen" branch self-disables because it is
  guarded by an `EXISTS` over sections for the skill. A2 Lezen gained `regels` ("Regels of
  instructie"), which DUO uses and we had no row for.
- **A2 Lezen's `stimulus_count` stays NULL.** Only 13 of the 25 items were captured; 13 items is
  not a count of texts. Same rule as B1's item counts.
- **`data/skills.ts` mirrors both tables** (`RULES` and `TASK_RULES`) and must change in the same
  commit. `tests-unit/skills.test.ts` pins the invariants that matter: the minimums must fit inside
  `itemCount` and the maximums must reach it, or the docent is shown a target she can never hit.

### Rubrics are bound to the categories — `task_categories`

`20260807000000_rubric_categories.sql` made the category convention a table. `rubrics.task_type`
had always *held* the `rubricCategory()` string and nothing enforced it, which left two silent
failures: a typo'd category saved cleanly and then matched nothing (`resolveRubric` returns null,
grading 409s pointing at nothing), and a task could be linked to a rubric for a **different**
category — graded against anchors written for another task, returning a confident wrong mark.

- **`task_categories` is level-independent, deliberately.** A category is a *kind of opgave*; it
  exists whether or not anyone has worked out its rules at a given level. The rules stay
  level-keyed in `exam_task_rules`, and B1 having no rule rows must not also mean B1 has no
  categories — a B1 rubric could then not be authored at all.
- **Both `rubrics.task_type` and `exam_task_rules.category` are FKs into it.** `label_nl` moved
  there too; it used to be per (level, skill, category) and could disagree with itself across
  levels for no reason.
- **The rubrics FK is added `NOT VALID` and validated in a `DO` block that downgrades failure to a
  NOTICE.** A pre-existing mis-typed row must not turn this into a failed deploy; the constraint
  governs every future write either way. It validated cleanly locally.
- **A rubric from the wrong category is now an error**, beside the existing wrong-level error.
  Both are errors rather than warnings for the same reason: they produce a mark that looks
  entirely legitimate.
- **`exam_task_summary()` is `SECURITY DEFINER`** solely to read the active rubric's id and version
  past the admin-only policy on `rubrics`. It returns **no rubric content** — `criteria` and
  `system_prompt` are a scoring key and must never reach a client component.
- **`/admin/rubrics` already had the coverage grid** (`categoriesForSkill()` per level, uncovered
  categories called out). It picked up `speaking_react` for free. Don't build a second one.

### The onderdeel's setup is editable from the exam builder

The "Opzet" button in the Opbouw card opens `ExamSetupSheet`, which edits `exam_formats`,
`sections` and `exam_task_rules` for the (level, skill) — **not for the exam it was opened from**.
All three tables are keyed by (level, skill), so one save changes what all ten oefenexamens are
measured against. The sheet says so in an orange banner and every button reads "Opslaan voor alle
examens"; keep that if you add another entry point.

- **A blank field writes NULL, which means unverified**, and the validator then skips that check.
  Clearing is a real action, not a mistake — the placeholder reads "onbepaald", never `0`. The
  owner declined a bronvermelding requirement (2026-08-08); `verified_note` is an optional field.
  This is the one place `SEO/facts.md`'s discipline is not machine-enforced.
- **Section edits apply to the current level only** (owner's decision) — B1's tekstsoorten may
  genuinely differ, so they are edited from a B1 exam rather than mirrored.
- **`sections` had no write policy at all** before this; it could only be changed by a migration.
  `exam_task_rules` and `task_categories` got admin-write policies in the same migration.
- **An RLS-denied UPDATE through PostgREST returns 200 with zero rows**, so a missing policy looks
  exactly like a successful save. Every write path here was therefore tested end-to-end through a
  real browser session, not by reading the policy — `exam_formats` UPDATE, `sections` INSERT and
  `exam_task_rules` UPSERT.
- **`lib/admin/exam-setup.ts` is client-safe (types + `slugify`); the queries are in
  `exam-setup-server.ts`.** Same split as `backlog.ts` / `backlog-server.ts`, and for the same
  reason: the sheet is a client component, and one module would drag `lib/supabase/server` into
  the browser bundle and fail the build.

**Two bugs were fixed on the way through, both from a re-`CREATE OR REPLACE` losing an earlier
fix.** `20260803000000_open_skill_axis.sql` rewrote `exam_publish_issues()` from the wrong ancestor
and dropped the `AND t.skill = 'spreken'` filter that `20260731100000_picture_note_images.sql` had
added to the image-count branch; `20260805` copied it forward. A Schrijven `picture_note` with
pictures necessarily has `image_usage = 'none'` (forced by `open_tasks_image_usage_is_speaking`), so
its images were counted against an expectation of zero and reported as a **hard publish error**.
Separately, `ContentSheet.tsx` had `cover_all: 4` in a map whose own comment said it mirrored
`REQUIRED_IMAGES`, where it is 3. **A big function re-created in a later migration is a rewrite —
diff it against the version actually in the database, not against the file you copied.**

**Luisteren replays the fragment for every question; Lezen does not.** `ExamShell` keys
`StimulusPane` on `stimulus:question` for Luisteren, so the audio remounts and starts at 0:00 on
each question the way DUO presents it, and on the stimulus id for Lezen, so a text holds its scroll
position across its 2–3 questions. This reverses the earlier behaviour (playback continued across a
fragment's questions) on the owner's decision, 2026-08-07 — the doc comments in both files say so,
because the previous ones asserted the opposite rule. Replay stays unlimited either way, and
back-navigation with editable answers was already the case.

### A fifth onderdeel is addable without a migration

`20260803000000_open_skill_axis.sql` shipped the *capability* for a fifth exam component (KNM
is the likely one) without adding it. Nothing about the four skills changed.

- **`skills` is a reference table and the eight CHECK constraints are now foreign keys to it.**
  They had already drifted — `stimuli` listed two skills, the others four — and nothing would
  have caught a fifth being added to seven of the eight. Adding an onderdeel is one INSERT:
  ```sql
  INSERT INTO skills (slug, name_nl, sort_order, scoring, requires_stimulus, is_levelled)
  VALUES ('knm', 'KNM', 50, 'mcq', false, false);
  ```
- **`questions.stimulus_id` is nullable, behind a trigger.** Lezen/Luisteren share one stimulus
  across 2–3 questions; a KNM-style question stands alone. `skills.requires_stimulus` decides,
  and `questions_require_stimulus()` still makes a stimulus-less Lezen question a hard error —
  the guarantee moved from NOT NULL to per-onderdeel, it was not weakened. It resolves the skill
  through `exam_id`, not through the stimulus, which is the point.
- **`questions_sync_exam_id()` had to change too.** It derived `exam_id` from the stimulus and
  raised when the lookup found nothing, which for a NULL stimulus is always — so nullable alone
  would still have rejected every standalone question. With a stimulus it is unchanged; without
  one the supplied `exam_id` stands.
- **`exams.level` is nullable, behind a trigger.** KNM is not examined at A2 versus B1; forcing
  `level = 'a2'` would file it under the A2 dashboard and bundle while B1 candidates need it too.
  `skills.is_levelled` decides, and `exams_level_matches_skill()` enforces both directions. The
  `DEFAULT 'a2'` is gone deliberately — a default would silently mis-file rather than fail.
- **The unique keys use `NULLS NOT DISTINCT`.** This is the trap: in a plain UNIQUE constraint
  NULLs are *distinct*, so a nullable level would let two rows for the same non-levelled exam
  number both exist — the duplicate the constraint exists to prevent, reappearing precisely for
  the new case. `NULLS NOT DISTINCT` keeps the column list intact so existing
  `ON CONFLICT (level, skill, number)` clauses still work; an expression index over `COALESCE`
  would have broken them.
- **Two inner joins had to become left joins**, or a standalone question would exist in the
  database and appear on no screen: `questions_flat` (which now takes `skill` from `exams`, not
  from the stimulus) and the `questions` select in `lib/admin/content-rows.ts`. A `null` level in
  the admin list shows under *every* level tab, not none — see `atLevel()` in `ContentTable`.
- **`exam_publish_issues()` matches the format NULL-safely** (`IS NOT DISTINCT FROM`). `f.level =
  e.level` is never true for two NULLs, so the item-count check would have failed *open* on a new
  onderdeel — silently skipping validation exactly where it is needed most.
- **The code side is still four-onderdeel, deliberately.** That is cheap and safe to change (no
  data to migrate), so it waits for a real decision. `data/skills.ts` has the exact list of what
  it takes, including the `Level | null` plumbing a non-levelled onderdeel needs and the fact
  that `fetchExamsForSkill`'s `.eq('level', …)` never matches NULL.
- **Verified by actually adding KNM and rolling it back**: standalone question accepted, visible
  in `questions_flat`, publish validator running on it; and all six guarantees still rejecting
  bad data (stimulus-less Lezen, levelled skill with no level, non-levelled skill with a level,
  unknown slug, duplicate NULL-level exam, stimulus on a stimulus-less onderdeel).

`supabase/seed.sql` seeds only structural data — the admin allowlist and the 40 exam slots,
exam 1 of each skill published and free. **No exam items**: placeholder questions would be
indistinguishable from the docent's real content in admin.

### De woordkaarten van de leerlaag — `lesson_words` en zijn voortgang (02-09-2026)

Er zijn **twee** woordkaartentabellen, en dat is geen erfenis die opgeruimd moet worden:

| | `word_cards` | `lesson_words` |
|---|---|---|
| Waarvan | de 366 KNM-kaarten uit de fork | de leerlaag, per (level, onderdeel, theme) |
| Sleutel | `id`, met `theme_id` / `skill` | `(level, onderdeel, dutch)` unique |
| Bijzonder | plaatje, audio, en/ar/tr | `usage` (receptief/productief), `frame` |
| Voortgang | `user_word_card_progress.known` (boolean) | `user_lesson_word_progress.status` (vier waarden) |

`usage` en `frame` zijn waarom de tweede tabel bestaat. *Moet je het woord herkennen als je het
leest, of moet je het zelf kunnen gebruiken?* is het leerdoel van een woordenles, en een lijst
zonder dat onderscheid is een lijst zonder leerdoel. `frame` is de vaste constructie — *zich melden
(bij)*, *wachten (op)* — en zonder die staat een productieve opgave grammaticaal fout.

**De voortgang kon niet in `user_word_card_progress`.** `word_card_id` heeft een FK naar
`word_cards`; een `lesson_words`-id daarin zetten breekt hem. Eén polymorfe kolom die naar twee
tabellen kan wijzen kan de database niet afdwingen, en dat is precies het soort verwijzing dat
stil naar niets gaat wijzen. Dus twee tabellen, elk met hun eigen FK.

De statussen zijn `unseen → seen → learning | known`, vier en geen boolean: "gezien" en "gekend"
zijn niet hetzelfde, en zonder `learning` kan de kandidaat niet zeggen waar hij nog aan moet
werken — wat de hele oefenvolgorde (`practiceOrder`) aandrijft. Het KNM-deel van dit repo heeft
nog de oudere boolean; die twee lopen bewust uiteen.

**`translation_en` / `translation_ar` zijn machinaal en `translations_reviewed` staat op false.**
Zelfde regel als de gidsvertalingen: de kaart zegt in de taal van de lezer dat er niemand naar
heeft gekeken, en die clausule mag niet weg om een layout op te ruimen. De Nederlandse kant —
`dutch`, `article`, `plural`, `meaning_nl`, `example` — is van de docent, en dat is de kant waar de
claim van het product over gaat. Turks staat er niet bij: het portaal heeft geen tr-locale, en een
kolom vullen voor een taal die geen pagina kan tonen is content die niemand ooit nakijkt.
