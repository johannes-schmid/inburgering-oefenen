# CLAUDE.md — Inburgering Oefenen (A2)

## Dev server (always use this)
```bash
supabase start                                 # local Postgres + Auth + Storage (Docker)
PATH="/opt/homebrew/bin:$PATH" npm run dev     # next dev -p 3001, hot reload
```
Always **port 3001**. If it's already running, don't start a second instance.
All `check-ui.mjs` calls target `http://localhost:3001`.

### Local database — ports 544xx, NOT the default 543xx
The app runs against the **local Supabase stack**, not a cloud project. `.env.development.local`
already points at it (`http://127.0.0.1:54421` + the standard local CLI keys) and takes
precedence over `.env.local` in dev — so `npm run dev` never touches production data.

**This project deliberately uses the 544xx port block** so its stack can run at the same time
as the `knm-website` stack, which keeps the default 543xx block. Don't "fix" the ports back to
the defaults — the two would fight over 54321/54322 and only one could run.

| | This project | knm-website |
|---|---|---|
| API | http://127.0.0.1:54421 | http://127.0.0.1:54321 |
| Studio (browse tables) | http://127.0.0.1:54423 | http://127.0.0.1:54323 |
| Mailpit (catches all mail) | http://127.0.0.1:54424 | http://127.0.0.1:54324 |
| Postgres | `…@127.0.0.1:54422/postgres` | `…@127.0.0.1:54322/postgres` |
| Next dev | 3001 | 3002 (`npx next dev -p 3002`) |

```bash
supabase db reset     # re-apply the baseline + seed.sql — the way to test a schema change
supabase status       # URLs and keys
supabase stop         # free the ports — WITHOUT --no-backup
```

### Hosted project
`bbgrsfcevbavgsmnqjrd` · **Inburgering Oefenen** · Central EU (Frankfurt) · linked.

**The baseline's migration history lied, and cost a production outage.** The hosted project ran an
*earlier* version of `20260729000000_a2_baseline.sql`; the file was later rewritten in place during
the schema rework, and because the version number did not change, the rewritten file was recorded as
applied without ever running. `supabase migration list` showed the baseline applied on both sides
while the schemas differed by three columns, three CHECK constraints and the `questions_flat` view.
Every exam 404'd on production because `fetchExamContent()` selects `exams.pass_threshold_pct`, which
did not exist there. `20260731200000_align_production_schema.sql` closes the gap.

**So: never edit a migration that has run anywhere, including "recorded as applied".** And when
production misbehaves in a way local does not, diff the two schemas — the migration history is a
record of intent, not of fact. `supabase db diff --linked` finds the drift but writes the correction
**backwards** (it drops from local to match production), so read it and invert it by hand.

### Deploys go through GitHub only
The Vercel project `inburgering-oefenen` builds from a push to `main`; it serves
www.inburgeringoefenen.nl and already has the three Supabase vars from the Supabase↔Vercel
integration. **There is deliberately no `.vercel/` CLI link in this repo** — don't run
`vercel link`, `vercel deploy` or `vercel env pull` here. Push to `main` and let the Git
integration build. `vercel.json` (the two crons) is committed project config and stays.

`.env.local` targets the hosted project; **`.env.development.local` targets the local stack and
takes precedence in dev**, so `npm run dev` cannot write to production. Keep it that way.

Two live mismatches worth knowing:
- **Local Postgres and hosted are both 17.** This used to be a 15/17 mismatch; it is aligned now.
  Worth knowing because `20260803000000_open_skill_axis.sql` relies on `UNIQUE NULLS NOT
  DISTINCT`, which is PostgreSQL 15+. Do not drop the local major version below 15.
- **Never copy `MOLLIE_API_KEY` from `.env.local` to Vercel** — the local one is a `test_` key,
  and `MOLLIE_WEBHOOK_URL` is an ngrok tunnel. Production needs the live key and the real URL.

**Never pass `--no-backup` to `supabase stop`.** It deletes the project's Docker volumes
rather than dumping them. Used on `--project-id knm-website`, it destroyed that project's
local database; it was only recoverable because its repo still had `seed.sql` and
`seed_woordkaarten.sql`. To free a port held by another project, stop it plainly.

`psql` is not installed on the host; query the DB through the container:
```bash
docker exec -i supabase_db_inburgering-oefenen psql -U postgres -d postgres -c '<sql>'
docker exec -i supabase_db_knm-website        psql -U postgres -d postgres -c '<sql>'
```

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
- **B1's 40 slots are unpublished and none is free.** The free tier is A2 exam 1 of each
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

### The A2 dataset lives in `scripts/a2-content/`, not in seed.sql

All forty A2 oefenexamens — 700 items — are authored as data in git and written to a project by
`scripts/seed-a2-content.mjs`. They are in git rather than only in Postgres so the content is
reviewable in a diff and a run is repeatable.

```bash
node scripts/seed-a2-content.mjs all --dry-run        # validate the dataset, touch nothing
node scripts/seed-a2-content.mjs lezen --exam 3       # local stack, one exam
node scripts/seed-a2-content.mjs all                  # local stack, all forty
node scripts/seed-a2-content.mjs lezen --production   # the hosted project
```

- **This content is machine-authored and was published before the docent reviewed it** (owner's
  decision, 2026-08-08). Every stimulus and task is written `review_status = 'validated'` because
  that is the only state in which `exam_publish_issues()` lets an exam go live — that field is the
  one thing here that lies, and the provenance lives in the seed script's header and in the draft
  rubrics' `system_prompt`. The USP is unchanged: she validates and corrects in `/admin`.
- **`index.mjs` validates the whole dataset before any network call**, against the same numbers
  `exam_formats` and `exam_task_rules` hold. Every rule it checks is one `exam_publish_issues()`
  would otherwise catch *after* the content was written and the audio paid for. `--partial` drops
  only the "must be ten exams" rule for authoring, and is refused with `--production`.
- **Sections are looked up by `slug`, never by `name_nl`.** The older `seed-test-exams.mjs` matched
  on the display name with values that matched nothing, so every stimulus it ever wrote landed with
  `section_id = NULL` and the tekstsoort chips in `/admin/exams` were empty for all forty exams.
- **`images.lock.json` holds the Pexels *pick*, not a URL of ours.** Local and hosted are different
  buckets on different hosts; a lock recording `127.0.0.1:54421/...` would make a production run
  write items pointing at a dead host. The lock fixes *which photo* (id + source + attribution) and
  each project keeps its own copy at `question-images/a2/<slot>.webp`, derived from the slot. A
  re-run is therefore a HEAD, and the docent never sees a picture silently swap under a checked
  item. Images are WebP at 1200px/q72 — tighter than the admin route's 1600/82, because a
  `cover_all` task shows three at once on mobile data during a timed exam.
- **`alt_text` is the authored caption, never Pexels' `alt`** — that is English, and an English
  description read aloud mid-exam is worse than a plain label.
- **A2 Luisteren audio is 25–45 s, corrected from 40–50 on 2026-08-08.** Ninety generated fragments
  all landed at 29–37 s, and the DUO reference puts the real fragments at roughly 25–40 s / 70–110
  woorden — so 40–50 was a number set too high, not a standard the content failed. eleven_v3 runs
  at about **200 wpm**, not the 150 previously assumed. The figure has three mirrors —
  `exam_formats`, `RULES` in `data/skills.ts`, `FORMAT` in `scripts/a2-content/index.mjs` — plus
  `tests-unit/length-targets.test.ts`, which is what stops them drifting.
- **Spreken onderdeel 1 is `react`, and it needs its audio.** At DUO somebody addresses the
  candidate and asks something; here it is one still plus the spoken remark, so each onderdeel-1
  opgave carries `prompt_spoken` and a `voice` that must match the person in the picture.
  Onderdelen 2–4 are read on screen — DUO speaks those too, which is ~450 more clips and a later
  pass.
- **`speaking_react` had no rubric at all** until this ran; the runner mints a draft one (marked in
  `system_prompt`) rather than failing the onderdeel, because `rubric_id IS NULL` is a blocking
  publish error. It is a draft: rewrite it in `/admin/rubrics` before a grade counts.
- **`scripts/a2-content/lib.mjs` is shared with `seed-test-exams.mjs`** — env resolution, PostgREST,
  Storage, ElevenLabs, loudnorm and an mp3-duration counter that mirrors `lib/mp3-duration.ts`.


### B1 is three onderdelen, and its shape is not A2's — `scripts/b1-content/`

**Thirty B1 oefenexamens (Lezen, Schrijven, Spreken) were authored and published on 2026-08-21.**
B1 Luisteren is deliberately still empty. The pipeline mirrors A2's but is split in two, because
authoring costs model tokens and seeding costs storage and TTS, and a re-run of one must never
re-pay for the other:

```bash
node scripts/generate-b1-content.mjs plan          # what would be written, no calls
node scripts/generate-b1-content.mjs all           # author into scripts/b1-content/generated/
node scripts/generate-b1-content.mjs all --check   # validate what is on disk
node scripts/seed-b1-content.mjs all --dry-run     # validate, touch nothing
node scripts/seed-b1-content.mjs all               # local stack
node scripts/seed-b1-content.mjs all --production  # the hosted project
```

- **B1's shape was counted off DUO's Openbaar examen booklets** (Lezen I / Schrijven I 2022 +
  2023, Spreken I 2022–2025) and lives in `20260821090000_b1_exam_structure.sql`: Lezen 6 teksten
  / 35 vragen / 4–7 per tekst / 110 min; Schrijven 12 opdrachten / 100 min; Spreken **2** delen of
  **8** / 30 min. Attribute these to DUO's *practice exams*, never to an official DUO norm — the
  same rule `SEO/facts.md` §1 set for A2. Four mirrors must move together: that migration,
  `RULES`/`TASK_RULES` in `data/skills.ts`, `rules.mjs` in `scripts/b1-content/`, and
  `tests-unit/skills.test.ts`.
- **B1 Luisteren stays all-NULL and unpublished, and that is not an oversight.** There is no B1
  Luisteren reference material. `tests-unit/skills.test.ts` pins the gap explicitly, so "fill in
  B1 for symmetry" cannot quietly invent the standard the docent is measured against.
- **Schrijven B1 needed four new `task_categories`**: `sentence_completion` (opdracht 1–8 — a
  part-written e-mail or bericht whose sentence is left open), `letter`, `picture_report` and
  `data_text`. They are separate categories because **the category selects the rubric**: grading a
  two-line completion against a sollicitatiebrief's anchors returns a confident, plausible, wrong
  mark. `open_tasks.task_type`'s CHECK was widened, not replaced.
- **`sentence_completion` needed no new renderer.** The given text either side of the gap goes in
  `greeting` and `closing`, which `WritingTask` already draws around the textarea. What did change
  is that the mail header now renders on `isMail` (are the header fields present?) rather than on
  `task_type === 'email'` — at B1 a completion is a mail about half the time and a `letter` never
  is, and a task_type allowlist would need extending for every shape DUO adds.
- **All eleven B1 rubrics are DRAFTS** (`scripts/b1-content/rubrics.mjs`, marked in
  `system_prompt`). None existed, and `rubric_id IS NULL` is a blocking publish error, so the
  seeder mints them rather than failing the level. **Rewrite them in `/admin/rubrics` before a
  grade counts.** Their anchors describe B1 behaviour and are deliberately *not* A2's with the
  numbers moved: a rubric's anchors define what a 2 *means*.
- **`scripts/b1-content/plan.mjs` is the reason thirty exams are not one exam thirty times.** The
  tekstsoort, subject and communicative purpose of all 630 items are fixed there, in git. Ask a
  model for "a B1 tekst with vragen" sixty times and you get sixty texts about a fictional
  company's coffee policy — each fine on its own, the *set* worthless. Read its header before
  touching the generator.
- **The dataset is JSON, one file per (onderdeel, examen), under `generated/`.** Unlike A2's `.mjs`
  literals: it is produced by a long, resumable, paid-for run, and a per-exam file is the review
  unit. Individual units are cached in `.unit-cache/` (gitignored) so an interruption resumes
  instead of re-paying; a *committed* exam is only written once all its units validate.
- **Authoring runs through the Vercel AI Gateway when `AI_GATEWAY_API_KEY` is set**, on
  `anthropic/claude-opus-5` — the gateway speaks Anthropic's native `/v1/messages` including
  `output_config.format`, so this is a base-URL change and not a rewrite. It exists because the
  direct Anthropic key ran out of credit one exam into a thirty-exam run; switching route kept the
  **same model**, so one dataset is not half-authored by a different one. `--direct` forces the
  Anthropic API.
- **One call per unit, and the unit has to be small enough to retry.** Lezen is one call per tekst
  (six per exam); Schrijven's four long opdrachten are **one call each**. Asking for all four
  together never converged — each category has its own shape rule and a retry that fixed one
  reliably broke another. A retry is handed the *rule that was broken*, not "try again".
- **Two authoring bugs worth remembering.** (1) The run-together-lines detector stripped tags to
  *nothing*, which made a correct `x<br>Y` look identical to a glued `xY` — so the check fired on
  the very fix it was demanding and no retry could pass. Strip tags to a **space**. (2) The
  generator was right and the rule was wrong: DUO's B1 opgaven regularly speak to the candidate on
  a `cover_all` or `choose` opgave ("U hoort eerst uw buurvrouw"), so `prompt_spoken` is not
  `react`-only. The seeder now generates a clip for **any** opgave carrying a spoken line.
- **Structured outputs reject `minItems > 1`, `maximum` and `minimum`.** Counts and bounds are
  enforced in each unit's `validate()`, not in the JSON schema.
- **B1 stays `noindex`, and the reason changed.** It is no longer "B1 has no content" but "this
  content has not been through the docent yet" — a review gate. When she signs it off, the places
  to change are `oefenexamen/[level]/[skill]/page.tsx` (robots *and* the `Course` node) and
  `app/sitemap.ts`, which lists `DEFAULT_LEVEL` only.
- **Pictures live under `b1/` in the same bucket, with their own lock file.**
  `createImages({ level })` parameterises the object prefix, the lock path and the credits
  heading; A2's defaults are unchanged and its 399-entry lock is untouched.

---

## Project Overview

**The product is the all-in-one platform for the whole Dutch inburgering** — the four
taalonderdelen at **A2 and B1**, **KNM** and **ONA**. That is the brand, the positioning and
the promise every public page now makes (owner's instruction, 2026-08-22, extending the
2026-08-19 decision from a target to the shipped identity). Forked from the KNM platform
(`knm-website`) in July 2026; the whole machine — exam engine, admin CRUD, ElevenLabs TTS,
Mollie, Resend, Supabase auth/entitlements, dashboard — is reused. See "Strategy 2026" below
and `docs/MILESTONES.html` for the milestone plan.

**The brand is the whole traject; the *catalogue* is what is built, and the two are stated
separately on every surface.** This is the one rule the rebrand must not break, because the
site's only claim is that a docent stands behind what is on it — advertising a level or an
onderdeel that has no reviewed content spends exactly that credibility.

| Track | Status | What a page may say |
|---|---|---|
| **Taal A2** | live — 40 exams published | available, by name |
| **Taal B1** | 30 exams authored, `noindex` behind the docent's review gate | *binnenkort*, never as available |
| **KNM** | the documented fifth onderdeel; kennisgidsen live, oefenexamens not built | gidsen by name; exams *binnenkort* |
| **ONA** | announced only; covered by the tijdlijn tool and the gidsen | *binnenkort* |

`TRACKS` in `app/[locale]/(main)/page.tsx` is that table as code (`live: false` renders the
"binnenkort" chip) and is the single place the roadmap is stated on the homepage. **When a
track goes live, `TRACKS`, `data/skills.ts` and the copy below move in one commit** — and B1
additionally needs the `robots`/sitemap change recorded under "B1 stays `noindex`".

**A1 and B2 are deliberately not part of this.** `Level` is `'a2' | 'b1'` and stays that way
(owner's decision, 2026-08-22). DUO examines the taalonderdelen at A2, B1 and B2, so the
temptation to "complete the ladder" recurs; widening the union means a migration, 40 empty exam
slots per level, new routes, dashboard sections and pricing modules, for a level nobody has
authored a single item at. Do not add one speculatively.

| Skill | Items/exam | Duration | Item shape | Scoring |
|---|---|---|---|---|
| **Lezen** (reading) | 25 | 65 min | text stimulus + MCQ A/B/C | auto |
| **Luisteren** (listening) | 25 | 45 min | audio stimulus + MCQ A/B/C | auto |
| **Schrijven** (writing) | 4 | 40 min | open task: e-mail / short text / form | rubric |
| **Spreken** (speaking) | 16 | 35 min | audio prompt + image(s) → 60s recording | rubric |

The table above is **A2**; B1's shape differs and lives in `data/skills.ts` (see "B1 is three
onderdelen" above). **10 practice exams per (level, skill) = 40 exams per level.** All four
taalonderdelen must stay visible on the landing page, alongside KNM and ONA. The taxonomy lives
in `data/skills.ts` — the single source of truth for counts and durations.

### The USP, and what it constrains
**"Echt door een docent gevalideerd, geen AI."** Competitors generate exercises with AI;
at least one disclaims accuracy in its own terms. That is the wedge.

This is a **hard constraint on the code, not just the copy**:
- No AI-generated exam content. Every item is written or reviewed by a certified NT2 docent.
- **Scope of the claim (clarified 2026-08-19, restated for the whole traject 2026-08-22): it
  covers exam content and grading framing, at every level and in every onderdeel.** The claim
  widened with the brand — it did not weaken. B1's thirty machine-authored exams and the eleven
  draft rubrics are `noindex` precisely because this claim would otherwise be false of them.
  Informational *guides* (Inburgering/KNM kennisgidsen, blog) may be machine-drafted, but
  publish only after the docent has reviewed them — same model as the A2 dataset. Never
  extend the "geen AI" copy to claim guides were hand-written if they were not.
- Schrijven/Spreken feedback is **rubric-driven**: the docent authors the rubric and the
  model answers, a model applies them, and the docent reviews the gradings. Never frame or
  build it as "the AI grades your answer".
- Never ship invented social proof. Three fabricated testimonials and an `AggregateRating`
  of 4.8 came across in the fork and were removed — the product has no customers yet.
  Reviews go back only when they are real.

### Revenue model — one subscription per onderdeel

**`lib/pricing.ts` is the single source of truth; the numbers below are a summary and must not be
read as authoritative.** The old two-tier one-off model (Professioneel €9,95 / Compleet €19,95,
lifetime) is **gone** — nothing sells it. `PRODUCTS` in `lib/api-constants.ts` survives only to
describe historic one-off payments, and `plan: 'premium' | 'premium_plus'` in metadata is a legacy
grant that still opens everything those customers bought.

- **Free:** exam 1 of every A2 onderdeel (needs an account), plus a 10-question taster per skill
  (no account).
- **€9,95 per month per module**, where a module is `level:skill` — its 10 practice exams, lessons
  and vocabulary cards.
- **€29,95 per month for all four**, ten cents above three modules, so the copy says *bijna* four
  for the price of three. `BUNDLE_SAVING_PCT` is derived, never typed by hand.
- Payments via **Mollie**, iDEAL-first for the first payment, then SEPA Direct Debit for renewals.
  Cancellable in `/dashboard/profiel`; access then runs to `modules_until`.

**Entitlement is `ownsModule(meta, level, skill)` — never a bare plan check.** Both the player and
the per-skill dashboard used to gate on "has any paid plan", so a customer who had bought the Lezen
module was bounced to `/premium` from every Lezen exam while the dashboard overview — which already
read `ownsModule` — showed the module as owned. Pinned by `tests/portal.spec.js`.

---

## Strategy 2026 — van A2-oefensite naar inburgeringsplatform

Based on an external SEO advice deck ("Strategisch Contentadvies & Sitestructuur", Aug 2026)
and owner decisions of 2026-08-19. **The full milestone plan is `docs/MILESTONES.html`** (M0–M6:
technisch fundament → architectuur → TOFU-gidsen → KNM-consolidatie → taalgidsen & B1 → CRO →
video & kanalen). Key facts any session touching public pages should know:

- **The funnel shift:** ~80% of the ±284k/mo "inburgering" search volume is informational
  (oriëntatiefase). The site today is BOFU-only; the strategy adds TOFU/MOFU authority content
  (pillar-cluster) that converts via gids → gratis proefexamen → module.
- **Target menu structure:** Inburgering (TOFU gidsen: stappenplan, Wi2021, A2 vs B1, kosten &
  DUO, boete/termijn, vrijstelling, MAP & PVT) · KNM Kennisgidsen (8 officiële thema's, MOFU) ·
  Taalexamens A2/B1 (per-skill gidsen, MOFU) · Oefenexamens (BOFU). Guides get first-class
  routes (`/inburgering/[slug]`, `/knm/[thema]`), not blog posts; the blog stays for explainers.
- **Domain decision:** inburgeringoefenen.nl is the one brand. KNM becomes the fifth onderdeel
  here (the migration-free path documented in `data/skills.ts`; content migrates from
  `knm-website`). **knmoefenen.nl 301s only after KNM rankings hold here** — until then it is
  a ranking asset, not tech debt.
- **Who pays:** the self-study buyer is primarily gezinsmigranten (±10–12k/yr, self-funded or
  DUO-loan, often EN/AR/TR-speaking); statushouders are the free-content/B2B audience
  (municipality-paid courses). Price anchor for copy: DUO exams cost €50 per onderdeel —
  "één maand oefenen kost minder dan één herkansing".
- **Content ops:** guides are AI-drafted, docent-reviewed before publish (owner decision
  2026-08-19). Exam items keep the unchanged USP. Every number in a guide still comes from
  `SEO/facts.md` with a source.
- The empty, flagged-off `oefenvragen` quiz pages are earmarked as free KNM topic quizzes in M3;
  don't repurpose or delete them for something else.

### M0 — technisch fundament — DONE (2026-08-19)

Structured data, sitemap, KNM cleanup and the nulmeting. What a later session needs to know:

- **One JSON-LD `@id`, one owning page.** `components/JsonLd.tsx` renders the block (it escapes
  `<`, which `JSON.stringify` does not — a `</script>` inside any string value truncates the graph);
  `lib/schema.ts` holds `absUrl`, `breadcrumbs`, `courseId` and `omitEmpty`; `lib/site.ts` holds the
  three site-wide anchors. **The homepage owns `#organization` and `#website`, `/docent` owns
  `#teacher`, and `/oefenexamen/[level]/[skill]` owns its `#course`.** Everything else references
  by `@id` and never restates the node. Two pages used to define both the organisation and the
  docent in full and disagreed — the org was called "KNM Oefenvragen" on one and "Inburgering
  Oefenen" on the other. No validator reports that; a crawler picks one body and the facts that win
  are luck. `node scripts/check-schema.mjs [origin]` fails if it recurs, and also if a block stops
  parsing, an `@id` reference resolves to nothing, or **any page grows an `aggregateRating` or
  `review`** — the product still has no customers.
- **`/premium` is the only page with `Offer` nodes, and every figure is read from `lib/pricing.ts`.**
  Never retype a price into a schema object: a stale `Offer` is a false price claim that keeps
  showing in the SERP after the page itself is corrected. `priceValidUntil` is deliberately absent
  (open-ended subscriptions; an invented expiry makes Google drop the offer).
- **B1 carries no structured data at all**, deliberately. Those pages are `robots: index:false`
  until the docent publishes, and rich data on a noindex page contradicts the page's own meta tag.
  `omitEmpty()` exists for the same discipline as `formatCount`: B1's counts are `null`, and in
  JSON-LD an absent property means "not stated" while `0` is a claim.
- **`/proefexamen` is gone** — route and `ProefexamenEngine.tsx` deleted, 301 to `/oefenen` in
  `next.config.ts`, entry removed from `i18n/routing.ts`, `proefexamen` namespace dropped from all
  three locale files. `components/proefexamen/ExamIntro.tsx` and `ExamQuestionCard.tsx` **stay** —
  the dashboard's `InlineQuiz` and `ExamsView` import them. This also removed the second
  `PASS_THRESHOLD_PCT` and the namespace whose own strings disagreed about 40 versus 45 vragen.
- **`/contact` now has an Arabic slug in `i18n/routing.ts`, and it had to.** `next.config.ts` 301s
  `/ar/contact` → `/ar/تواصل-معنا`; without a per-locale mapping that target matched no route, so
  the Arabic contact page 404'd from every footer link and the sitemap advertised the dead URL.
  **A sitemap is only complete once every URL in it has been fetched** — see the loop in
  `docs/BASELINE.md` §6, which is how this was found.
- **`.prose ul li` is `display: flex`**, so every element child of an `<li>` becomes its own column
  and the text between them becomes anonymous ones. One leading `<strong>` per `<li>`; a second one
  renders the sentence out of order. Both legal pages are written to that rule.
- **The docent page's "108 KNM-oefenvragen" stat was dropped, not replaced with another number.**
  `KNM_QUESTIONS` is an empty array and nothing substantiates 108 or a successor, so the tile shows
  a figure read from `data/skills.ts` instead. The KNM quotation was turned into prose rather than
  reworded: rewriting words inside quotation marks puts a claim in a real person's mouth.
- **Both legal pages were rewritten** (owner instruction, overriding the milestone card). The
  privacy policy's §2 had described only an e-mail address and a score; it now covers accounts,
  payments, written answers and **Spreken voice recordings**, and §10 no longer claims the site
  sets no analytical cookies while loading GA4, Clarity and the Meta pixel. §6 lists the real
  processors. **Retention periods and the legal basis are the owner's commitments** — the draft
  states what the code does and nothing more.
- **The nulmeting is `docs/BASELINE.md`**, and §5 (GSC + GA4) is empty because the numbers have not
  been read out yet — every blank reads `— niet gemeten —`, never `0`, so an unmeasured row can
  never be mistaken for a measured zero. **Search Console ownership was already verified on
  2026-07-29** via a **Domain property** (DNS TXT), which the absence of a meta tag in this repo
  made look like the opposite. So `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` is **not needed and should
  stay unset**; the `verification` block in `app/[locale]/layout.tsx` renders nothing without it and
  exists only as a fallback for a future URL-prefix property. **Copy the file to
  `docs/baseline/YYYY-MM.md` before refreshing it**, or M5 has a current reading and no trend.
- Still stale, needing owner wording: `(app)/betaling-gelukt` says "Professioneel Pakket" and "alle
  10 proefexamens", neither of which the per-module pricing sells. The `oefenvragen` namespace keeps
  its KNM copy on purpose — M3 repurposes that surface.

### M1 — architectuur & herpositionering — DONE (2026-08-19)

The IA, the guide pipeline and the repositioning, shipped **before** the guides themselves (M2/M3).

- **`data/guides/` is one file per guide**, unlike `data/blog-posts.ts` which holds all five posts
  in one 2,288-line module. A guide is about as long as a post and there will be ~15; a single
  module would pass 7,000 lines and every docent review would be a diff against everything.
  `types.ts` + `helpers.ts` + `index.ts` (the registry) + one file per guide.
- **`status: 'reviewed'` is the only state that publishes**, and it is the owner's 19-08 decision
  expressed as a constraint rather than a comment. A `draft` guide is `noindex`, absent from its
  hub, absent from the sitemap, absent from every `related` list and carries **no JSON-LD at all** —
  but is reachable by URL, which is what makes it reviewable. `tests-unit/guides.test.ts` refuses
  a `reviewed` guide with no `reviewedBy`/`reviewedOn`.
- **Guide slugs are identical across locales, and must stay that way.** See the switcher bug below.
- **`getGuideBySlug` is section-scoped**, so `/knm/<an-inburgering-slug>` 404s instead of serving
  one guide under two URLs — a duplicate of our own making.
- **The hubs are one component.** `_components/GuideHub.tsx` renders both `/inburgering` and
  `/knm`; `GuideArticle.tsx` renders both detail routes. Two hubs that drift apart is the
  `sections`-versus-`task_type` mistake again.
- **The zero-guide hub is content, not a placeholder.** The owner chose visible nav over
  content-gated nav (2026-08-19); the thin-content risk that creates is answered by giving each hub
  its own orientation — what the section is, five phase cards — plus the blog posts that already
  cover part of the ground and the four onderdelen. `tests/public.spec.js` asserts the phase cards
  are there, so a future edit cannot quietly turn the hub back into a stub.
- **The hub links `taalniveaus-a1-a2-b1-nederlands` rather than M2 writing a second page.** That
  post already owns the "A2 of B1 / taalniveaus" ground and GSC shows it at positions 56–90. One
  query, one owning page — applied before the duplicate exists.
- **All content sat under one "Inburgering" dropdown** (owner's decision, 2026-08-19).
  **SUPERSEDED 2026-08-20 — see "M2b" below.** The header is now six items implementing
  MILESTONES §3. The research below still stands and simply lost to a stronger argument; it is
  kept because the *reasons* still constrain the labels.
  - The comparable products all do this: theorie.nl has one **Examentips** dropdown,
    leernederlands.online one **DUO inburgeringsexamen** item, and IELTS puts "Preparation
    resources" as a *heading inside* a dropdown. **"Resources" is a footer convention in this
    category, not a nav one** — including in the Zutobi example that prompted the question, where it
    is a footer column.
  - The parent is named **"Inburgering", not "Kennisbank" or "Resources"**: a nav label is site-wide
    anchor text and `inburgering` is the head term (~284k/mo), while a generic label is a word
    nobody searches for and, at A2, may not be understood.
  - **It enforces the split that was previously muddled: tools under Oefenexamens, content under
    Inburgering.** When KNM becomes the fifth onderdeel (M3) its oefenexamens join the Oefenexamens
    dropdown while its kennisgidsen stay in this one — so "KNM" never names two different things in
    two places. `tests/public.spec.js` pins the four top-level entries, because a top-level item per
    section is what a later edit drifts back towards and it grows the header every milestone.
  - **`Nav` must not import the guide registry.** It is a client component, so enumerating published
    guides in the dropdown would ship every `articleHtml` string into the browser bundle. The
    dropdown links hubs; the hub lists the guides.
- **"Taalexamens A2/B1" is deliberately not a menu section.** The milestone card lists it, but its
  content is M4's per-skill guides and the existing **Oefenexamens** dropdown already covers the
  intent. Adding a third empty section is the same bet twice. When those guides exist they become a
  fourth group inside the Inburgering dropdown, not a fifth top-level item.
- **Nothing 301s.** Nothing was ever served at `/inburgering` or `/knm`, so M1's "oude URL's
  301'en" had no work in it. Saying so beats inventing redirects.
- **`alternatesFor(locale, path)` in `lib/schema.ts`** is the first shared alternates helper. The
  fourteen `(main)` pages that hand-roll the block were **not** refactored — that touches every
  canonical on the site and belongs in its own change. It only covers untranslated slugs;
  `/premium`, `/docent` and `/contact` keep their literal maps because their per-locale paths
  cannot be derived by interpolating a locale.
- Guides emit **`Article`, not `BlogPosting`** — a kennisgids is a maintained reference page, and
  the type is the honest one. `scripts/check-schema.mjs` grew rows for both hubs, for the draft
  guide (`forbid: ['Article']`) **and for `/nl/blog`, which the M0 guard never covered**.

**The language switcher was broken on every dynamic route, and had been for as long as those routes
existed.** `usePathname()` returns the *template* (`/blog/[slug]`), not the concrete path, and
`Nav.tsx` called `router.replace(pathname)` with no `params` — which resolves to nothing. Changing
the select did nothing at all on all five blog posts, both free tasters and every exam overview. The
comment in that function asserted the opposite and called the cast safe. It is fixed with
`useParams()`, and `tests/public.spec.js` now pins it across four route shapes, including a
translated slug. **This is why guide slugs are not localised**: with a per-locale slug, `params`
from the current locale would be substituted into another locale's route and 404.

**Still open, found while verifying and deliberately not fixed:** `notFound()` inside a
`[locale]/…/[slug]` route returns **HTTP 200** with the not-found body — a soft 404. It reproduces
on production for `/nl/blog/does-not-exist` and is not specific to guides (the `[...rest]` catch-all
does return a real 404). Project-wide and pre-existing; worth its own change.

### M2 — the pillar is live (2026-08-19); six spokes and the EN top-3 remain

`data/guides/inburgering-stappenplan.ts` is `status: 'reviewed'` — the owner's hand-written
manuscript, fact-checked line by line the same day. What a later session must know:

- **`SEO/facts.md` §10 is the traject fact sheet** (plicht, vrijstelling/ontheffing, brede intake,
  leerbaarheidstoets, PIP, termijn, leerroutes, KNM/PVT/MAP, examens, uitslag, diploma), verified
  2026-08-19 against wetten.overheid.nl, inburgeren.nl, duo.nl, rijksoverheid.nl. The **Besluit
  inburgering 2021 is BWBR0045555**. Every spoke starts from §10, not from a competitor's page.
- **The manuscript needed seven factual corrections**, all recorded in §10 and in the M2 card in
  `docs/MILESTONES.html` — chiefly: KNM has **8** thema's (not 7), "praktijkonderwijs" is on no
  official vrijstellingslijst, the PIP extension is not "12 weken", the Z-route's 800+800 holds
  for asielstatushouders only, and naturalisatie does **not** currently require B1 (that is a
  pending wetsvoorstel). A hand-written manuscript gets the same factcheck as an AI draft.
- **The "16 weken" uitslag claim is real but scoped and dated**: a DUO nieuwsbericht of 31-07-2026,
  Schrijven A2 en Spreken A2 only, with an automatic 6-month verlenging. It will go stale — DUO
  announces changes via nieuwsbericht, so re-check it whenever this guide is touched.
- **Guide visuals are CSS classes in `app/globals.css`** ("Kennisgids visual elements"):
  `.docent-note` (the docent's voice, with the hero's photo), `.guide-steps` (numbered timeline),
  `.guide-cards`, `.yesno-grid`, `.guide-cta-inline`. Icons are inline lucide SVG paths in the
  HTML string — no emoji, and no new React components for article bodies.
- **Two docent-notes are deliberately missing** (manuscript MARIEKE-BLOK 3 and 4: PIP-fouten and
  the B1-of-A2 conversation) — they were authoring questions to Marieke, not content. Add them as
  `.docent-note` blocks in stap 3 and stap 4 once she answers.
- **The draft-gate e2e tests flipped to their positive forms** in `tests/public.spec.js` when this
  slug published. The draft side of the gate is still pinned by `tests-unit/guides.test.ts`; give
  it back an e2e case with M2's first draft spoke.
- The pillar links the leerbaarheidstoets-oefenomgeving at
  `minerva.optimumassessment.com` — that URL comes from duo.nl (zakelijk) and may move; it is in
  facts.md §10 with its provenance.


### The header is four plain links, and `/platform` + `/gidsen` carry the rest (2026-08-22)

**Platform · Gidsen · Prijzen · Over ons.** No dropdowns. This supersedes, in one day, the
two-mega-panel bar, the 2026-08-21 five-item mockup and M2b below.

- **A dropdown is a landing page you refused to build.** The panels held ~20 destinations and
  duplicated, in a hover state on every page, work that two real pages do better — with room for
  copy, benefits and the roadmap that a dropdown row cannot carry.
- **The cost is real and is paid on those two pages.** A header dropdown is a *site-wide internal
  link* to everything inside it; four links are not. So **`/platform` must list the four
  onderdelen, the taster, the tools and the money page, and `/gidsen` must list every published
  guide plus the three hubs.** Anything added to the platform that appears in neither has no route
  in from the chrome at all. The footer carries both pages as the second site-wide route.
- **`/gidsen` is an index, not a fourth hub.** `/inburgering`, `/taalexamens` and `/knm` keep their
  own orientation (the three-fase route, the four onderdelen, the eight thema's) and are linked
  from it. Hubs that drift apart is a mistake this repo has already made once.
- **A section with nothing reviewed still points somewhere real.** `SECTION_POSTS` surfaces the
  blog posts that already own that ground (Taalexamens has two), and a genuinely empty section
  renders its hub as a card — with the trailing hub link suppressed, because the same destination
  twice reads as a rendering bug.
- **`/platform` states the catalogue and the roadmap in one list, and the unbuilt three are
  `<div>`s, not greyed links.** B1 is the one that matters: its pages exist, are `noindex` behind
  the docent's review gate, and a nav link would hand a crawler exactly the page we tell it to
  ignore. Keep it in step with `TRACKS` on the homepage.
- **No prices on either page.** `/premium` is the only page with `Offer` nodes;
  `scripts/check-schema.mjs` now `forbid`s `Offer`/`Product` on both.
- **`SkillCard` gained an `href` prop, and new callers must pass the locale-prefixed path.** Its
  default is locale-less and survives only because the i18n middleware redirects it — a redirect
  hop per card, and invisible to any test asserting on the rendered href.
- **Nina's deck (`Strategisch Contentadvies` §Nieuwe Menu-items) is implemented as page structure,
  not as the bar.** Her four items — Inburgering / KNM Kennisgidsen / Taalexamens / Oefenexamens —
  are the sections of `/gidsen` and `/platform`. As a bar they put the item that sells fourth and
  ask the visitor to know which funnel stage they are in.

### M2b — the menu implements §3, and the first tools appear (2026-08-20) — SUPERSEDED, see above

The header now carries **five top-level items** — `Inburgering ▾ · KNM ▾ · Taalexamens ▾ ·
Oefenexamens ▾ · Docent` — implementing `docs/MILESTONES.html` §3 and **reversing M1's
single-dropdown decision**. Each content section splits into **Gidsen** (read) and **Tools** or
**Gratis oefenen** (do).

**Modules is inside the Oefenexamens dropdown, not top-level** (owner's decision, 2026-08-20, when
six items read as crowded). That dropdown is now `PER ONDERDEEL` (the four skills) + `TOEGANG`
(Modules). Buying access and practising are one intent a step apart, so they belong together — but
note the consequence: **the money page's only header entry is now one level deep.** If premium
conversion from the nav matters, that is the thing to watch.

- **M1's reasoning expired rather than being wrong.** It refused a top-level item per section
  because KNM and Taalexamens were empty, and an empty section is thin content twice over. Now the
  M2 pillar is live, Taalexamens carries the two per-onderdeel blog posts that already exist, and
  each section has tools or free material. The category research (theorie.nl, IELTS) is still
  true; §3 is the site's own published architecture and outranks it. **The labels still follow that
  research**: sections are named for head terms ("Inburgering", ~284k/mo), never "Kennisbank".
- **The desktop nav has its own measured breakpoint, `menu:` (1152px), defined in `globals.css`.**
  Not cosmetic and not a round number. The bar used to appear at `md` (768px) where the links had
  ~344px — "Over de docent" was already squeezed from 99px to 46px with *four* items, unnoticed.
  With the logo at 234px and the right cluster at 362px the links get 508px at 1152px, and the five
  items need 486px. `lg` (1024px) overflows; `xl` (1280px) needlessly puts 1152–1279px laptops on
  the hamburger. Verified switching exactly at 1151/1152 and clean at 1200/1280/1440/1600.
  **Below `menu:` the drawer is the whole menu** — it already contained every item, which is what
  made raising the breakpoint safe. Also `gap-5` not `gap-7`, and `nav.docent` shortened to
  "Docent" (the footer keeps `footer.aboutTeacher`).
  **Re-measure before adding a sixth item or lengthening the CTA.**
- **The right-hand cluster was most of the crowding, not the links.** It was 386px of bordered
  select + text link + long filled button, three competing weights. Now: borderless select (it
  reads as a control on hover/focus, enough for a three-item choice) and Inloggen as an *outlined*
  button paired with the filled CTA — one visual pair. 362px, and it reads much quieter.
- **The language switcher lost its flag emoji, which closed a documented violation.** It was the
  one place in the UI breaking the no-emoji rule and carried a `test.fixme` in
  `tests/public.spec.js` awaiting a decision. Dropping the flags bought header width *and* fixed
  it, so `no emoji in the site chrome either` is now a **live test**. Flags-for-languages was its
  own bug anyway: a Union Jack is not "English" for most of this site's readers.
- **`CONTENT_SECTIONS` in `Nav.tsx` is one definition rendered by both the desktop panel and the
  mobile drawer.** With one dropdown the duplication was survivable; M1 still shipped the Blog link
  twice on mobile because it was removed on desktop only, caught by a screenshot. With three
  sections it is not survivable, so there is exactly one list.
- **The blog stays in the header**, under Inburgering → Gidsen. §3 does not mention it, but it is a
  live indexed surface and a header link is a site-wide internal link on every page — dropping it
  for a tidier menu is a self-inflicted ranking cost. `footer.blog` is a different key, so the
  footer is not a substitute.
- **`/taalexamens` extends `GuideSection` instead of being a third hub.** `GuideHub`'s own comment
  says hubs that drift apart is a mistake this repo already made (`sections` vs `task_type`); a
  bespoke hub would be that mistake. So one union gained a value and the hub, the article renderer,
  the sitemap and the copy convention are all reused — which also pre-builds M4's guide route.
  Per-section facts that cannot come from a message are two `Record<GuideSection, …>` maps
  (`SECTION_CARDS`, `HUB_POSTS`); Taalexamens renders **four** cards, one per onderdeel.
- **`guideHref()` / `hubHref()` in `data/guides/helpers.ts` are new, and they closed a live trap.**
  Four separate `section === 'inburgering' ? … : '/knm'` ternaries decided guide URLs — one in
  `GuideHub`, three in `GuideArticle`. Every one type-checks against a third section and routes it
  to `/knm/[thema]`: a wrong page, not a build error. `guideHref` is a `switch` with a `never`
  default, so a fourth section is now a compile error. It must stay a **discriminated** union —
  `next-intl`'s typed `Link` correlates `pathname` with `params`, and a lookup table that widens
  `pathname` is rejected (correctly: it would allow `/knm/[thema]` with a `slug` param).
- **`data/planned-surfaces.ts` + `_components/PlannedSurface.tsx` are the placeholder mechanism.**
  Four announced-but-unbuilt pages: `/inburgering/tools/tijdlijn`, `/knm/woordenlijst`,
  `/taalexamens/woordenlijst`, `/taalexamens/grammatica`. All `noindex, follow`, all **absent from
  `app/sitemap.ts` by never being added** rather than by being filtered — there is no condition to
  get inverted later. They emit **no JSON-LD at all**, and `related` is required and asserted
  non-empty, because a placeholder that is a dead end is the one thing it must not be.
  **No feature flag** — the registry is the gate, and a flag would be a second switch for the same
  thing.
- **A static child route shadows its dynamic sibling, so slugs are reserved by a test.**
  `/knm/woordenlijst` wins over `/knm/[thema]`. A guide authored at that slug would pass every
  other check, appear on its hub and in the sitemap, and serve the placeholder.
  `tests-unit/guides.test.ts` derives the reserved set from `planned-surfaces.ts`, so registering a
  placeholder reserves its slug automatically.
- **The KNM woordenlijst is `ontsluiten`, not authoring.** `data/woordkaarten.ts` already holds
  **366 words across 7 KNM themes** with article, plural, description, example and EN/AR/TR
  translations. It is 7 of the 8 official thema's — "Omgangsvormen, waarden en normen" is missing.
  The owner chose (2026-08-20) to ship the placeholder now and surface the data later, after
  docent review.
- **`/taalexamens` overlaps two existing blog posts on purpose.**
  `lezen-examen-inburgering-a2` and `luisteren-examen-inburgering-a2` are two of the four
  per-onderdeel guides M4 plans. `HUB_POSTS.taalexamens` links them; M4 must not write competing
  pages. One query, one owning page — the same call M1 made for `taalniveaus-a1-a2-b1-nederlands`.

### M2c — de Tijdlijn Builder is echt (2026-08-20)

`/inburgering/tools/tijdlijn` is geen placeholder meer. Het is een **volledig client-side
rekentool**: zes tot acht vragen in, een gedateerd persoonlijk plan uit. De vijf brondocumenten
(PRD, rekenregels, ontwerpbrief, technische spec, seed-rules) staan in `docs/tijdlijn/`; lees
`02-RULES-AND-DATA.md` §0 vóór je iets in de engine aanraakt.

- **Het inzicht dat de tool verkoopt: de deadline is de beperking niet, de wachtrij ervóór is dat.**
  Aanmelden duurt >6 weken, een uitslag 8 (16 voor Spreken/Schrijven A2 zolang de DUO-melding
  staat), ONA 6+6+8. De kop is daarom **niet** de deadline maar *"meld je uiterlijk aan op …"*, en
  die datum ligt vijf tot zes maanden eerder. `termijnEnd − uitslagwachttijd − 7 weken`.
- **`LegalDate` en `EstimatedDate` zijn verschillende types en niet aan elkaar toewijsbaar.** Een
  wettelijke datum draagt `sourceId` + `checkedOn` en mag het badge "volgens DUO"; een schatting is
  altijd een *reeks*, draagt "ongeveer" en mag dat badge nooit. Dat onderscheid is de hele
  betrouwbaarheid van de tool en het is op typeniveau afgedwongen, niet alleen visueel.
- **`data/tijdlijn/inburgering-rules.v1.json` is de wet, `lib/tijdlijn/rules.ts` parseert hem bij
  import.** Een tarief wijzigen is een data-edit. Alles onder `legal` heeft een bron en een
  controledatum; alles onder `planning` is van ons (urenbanden, diagnose-multipliers,
  `examSpacingWeeks`, `componentBaseWeeks`) en mag nooit als DUO-regel renderen. Een parsefout
  faalt de build, niet de request.
- **De engine is een pure functie**: `computeTimeline(input, rules, today)`. Geen I/O, geen React,
  geen `Date.now()` erin. `today` wordt geïnjecteerd. `PlainDate` (`{y,m,d}`) — **nooit** een JS
  `Date`; `addYears`/`addMonths` klemmen (29 feb + 3 jaar = 28 feb) en `diffWeeks` kapt naar nul.
- **Twee van de vier worked examples in het brondocument zijn fout en de engine wijkt bewust af.**
  Voorbeeld 2 vinkt de 2,5-jaarvoorwaarde af bij 26 maanden; voorbeeld 1 claimt "on track" terwijl
  de eigen urenbanden dat uitsluiten. `tests-unit/tijdlijn-engine.test.ts` pint de datums (die
  kloppen wél exact) en documenteert het verschil in de header. **Reken een voorbeeld na vóór je het
  tot golden test maakt.**
- **Een beoordeelde verlenging verlengt de termijn nooit.** Alleen `grantedExtensionMonths` — de
  gebruiker die meldt dat DUO al besloot — schuift `termijnEnd`. Een plan op een afgewezen
  verlenging is de enige faalwijze die iemand echt schaadt.
- **Asielstatushouders krijgen nooit een boete** (Raad van State) en kunnen onder Wi2021 **niet**
  lenen bij DUO. Dat laatste wordt op het hele Nederlandse internet fout verteld; het staat er
  daarom expliciet.
- **De gantt staat vanaf vraag één in beeld en beweegt mee** (beslissing eigenaar, 2026-08-20).
  `components/tijdlijn/TimelineChart.tsx` is er één van, gebruikt door de landing, de wizard *en*
  het resultaat. Eén gedeelde tijdas met een vaste labelgoot; muren zijn één laag over het
  plotgebied. Per rij schalen zet de muur op elke regel op een andere x — dan lijkt een balk die
  door de deadline schuift op een balk die past. `lib/tijdlijn/milestones.ts` leidt de mijlpalen af
  (aankomst, brief, PIP, termijn, PVT-jaar, boete-horizon, paspoort); een geschatte mijlpaal in het
  verleden wordt weggelaten — een voorspelling van iets dat al gebeurd is kost je het vertrouwen in
  elke andere datum.
- **Vraag 2 is "sinds wanneer woon je in Nederland?"**, aan iedereen. Het is de enige datum die
  bijna elke lezer zonder opzoeken weet, en hij vult de tijdas, de geschatte brief/PIP-mijlpalen en
  de naturalisatieklok. De ankerdatum (PIP of DUO-brief) komt daarna en vraagt éérst *welk papier*
  je in handen hebt: de drie papieren dragen drie verschillende datums en de termijn begint de dag
  **ná** de dagtekening van de eerste PIP.
- **"Ik weet het niet" staat op elke vraag, in normale opmaak.** `unknown` is een eersteklas waarde
  tot in de engine; de tool moet met alles onbekend nog een bruikbare pagina opleveren.
- **De URL is de state** (`?t=…`, versie-geprefixt) en er gaat geen antwoord over de lijn. De
  privacyregel op de landing ("geen DigiD, geen BSN") is een architectuurbelofte: voeg hier geen
  server-round-trip voor "personalisatie" toe. Een onbekende versie geeft `null` en opent de wizard
  — een stilzwijgend verkeerd geparseerde string zou een verkeerde deadline opleveren.
- **Alleen de mail vraagt een e-mailadres; het resultaat is nooit gated.** `/api/tijdlijn-email`
  herrekent de tijdlijn server-side uit de state (nooit de datums uit de body — een mail is het enige
  artefact dat je niet kunt corrigeren) en zet de herinnering acht weken vóór de laatste
  aanmelddatum in `email_campaign_queue` als `tijdlijn_reminder`. `tijdlijn_plans` bewaart alleen
  e-mail + state-string, RLS aan zonder policy (deny-all; de route gebruikt de service key).
  De cron slaat betalende klanten over voor de *campagne*mails, niet voor deze herinnering.
- **Nog open, uit `02-RULES-AND-DATA.md` §12:** de NT2 B1/B2-uitslagtermijn is nooit vastgelegd (de
  engine valt terug op 8 weken **met waarschuwing**), de 2-jaars verlengingsgrens en de
  basisexamen-buitenland-tarieven wachten op een primaire bron, en of DUO op examendatum of
  uitslagdatum toetst is niet bevestigd — tot dan rekenen we naar de uitslag en zeggen dat.
- **De drie datums waar een kandidaat op handelt staan op `ComponentPlan`:** `startStudyingBy`
  (achteruit gerekend vanaf `registerBy` min de studieweken — dít is de datum waar mensen naar
  handelen), `examWindow` en `resultWindow`, plus `studyWeeks` en `level`. `startStudyingBy` is
  bewust een **`EstimatedDate`**, ook al rekent hij terug vanaf een wettelijke datum: de aftrekking
  loopt door ons studiemodel. Let op de richting van de reeks — méér studieweken betekent *eerder*
  beginnen, dus `hi` levert `earliest`. Omgedraaid vertelt de tool mensen dat ze later kunnen
  beginnen dan veilig is, precies de fout waarvoor hij bestaat.
- **`lib/tijdlijn/agenda.ts` is het plan als instructies**: één gedateerde lijst, samengevoegd over
  alle onderdelen en chronologisch gesorteerd, want de onderdelen lopen door elkaar en niemand
  reconstrueert dat uit vier losse rijen. `actor` scheidt "dit doe jij" van "dit gebeurt dan" — een
  lijst die die twee mengt leest als twee keer zoveel werk. Een verstreken datum blijft staan
  (`overdue`) en wordt nooit verwijten; weghalen zou het plan haalbaar laten lijken door precies het
  deel te schrappen dat het niet is.
- **`AT_THE_GEMEENTE` (`pvt`, `map`, `z_eindgesprek`) is op identiteit gekeyed, niet op "heeft geen
  wachttijd".** PVT *heeft* een DUO-doorlooptijd van ~3 weken, en daarop testen gaf PVT een
  leren/aanmelden/examen/uitslag-keten: vier instructies voor één afspraak. Zowel de agenda, de
  gantt als de detailkaart importeren die lijst — niet opnieuw afleiden.
- **De gantt is chronologisch en de balken beginnen wanneer het *leren* begint**, niet vandaag
  (`readyBy.latest − studyWeeks.hi`, dus vandaag + de stagger). Dat levert de trap uit de mockup op
  en het is een echt feit over het plan. De paspoortrij (5 jaar wonen) is één gestreepte balk: het
  is wachttijd die je niet kunt versnellen, dezelfde betekenis als DUO's wachtrijen. Een mijlpaal
  buiten het venster wordt **niet** gepind — `x()` klemt op [0,100] en zou hem op de rand tekenen
  alsof hij daar plaatsvond; de lijst eronder houdt de echte datum.
- **De urenschuif staat bij de tekening**, niet in een instellingenpaneel: slepen en zien dat elke
  datum meebeweegt is de snelste uitleg van waarom lesuren uitmaken. Range + getalveld samen, want
  een slider alleen is vijandig op een kleine telefoon.
- De diagnose-quiz per onderdeel (`readinessFor` leest `diagnosticScore` al) en de `.ics`-export
  staan nog niet in de UI. De rest van het PRD is er.

### M2d — /inburgering is een route, en de gids houdt bij wat je las (2026-08-22)

De hub is geen grid van vier gelijke kaarten meer. Het is **één route in drie fasen** met de
stappenlijst van de open fase eronder, een hulpmiddel ernaast, en per gids een inhoudsopgave in de
zijbalk die bijhoudt wat je gelezen hebt. **Geen artikel is aangeraakt** — opdracht van de eigenaar:
elke gids blijft compleet, de secties komen aan de zijkant te staan.

- **De stappen zijn de `<h2 id>`'s van de gidsen zelf** (`lib/guides/sections.ts`), nooit een
  handgeschreven outline. Die ids bestonden al en zijn **identiek in nl/en/ar** — alleen de tekst is
  vertaald — dus een sectie-id is meteen een leesvoortgang-sleutel die over de talen heen werkt, en
  een docent die een kop herschrijft verzet de stap in dezelfde edit. Een `<h2>` **zonder** id wordt
  overgeslagen: een uit de kop afgeleide slug zou per taal verschillen en de voortgang van één
  sectie in drieën splitsen.
- **De extractie gebeurt op de server.** De steptitels komen uit `articleHtml` — ~90 kB proza dat de
  hub niet rendert. `GuideHub` stuurt alleen `{ id, title, minutes }` naar de client.
- **Een fase bevat één of meer gidsen** (`data/guides/phases.ts`). "Wat kost inburgeren?" zit in
  fase 1 naast "Moet ik inburgeren?" (beslissing eigenaar, 2026-08-22); een vierde kaart ervoor zou
  de vierde concurrerende navigatie van de site zijn geworden. Elke gepubliceerde
  `inburgering`-gids moet in **precies één** fase staan — in geen enkele fase is hij onvindbaar
  vanaf zijn eigen hub, in twee fasen dubbeltelt hij zijn secties en liegen de balkjes.
  `tests-unit/inburgering-route.test.ts` pint dat.
- **Alle drie de panelen worden gerenderd; de dichte krijgen `hidden`.** Met alleen het open paneel
  in de DOM hadden de gidsen van fase 2 en 3 **geen enkele interne link vanaf hun eigen hub** — op
  de belangrijkste TOFU-pagina, die juist bestaat om autoriteit naar zijn cluster door te geven.
  `tsc`, de build en elke screenshot waren schoon; twee e2e-asserties vonden het. Daarom staat er ook
  onder elke stappenlijst een **hash-vrije** "Lees de hele gids"-link: een URL met een fragment is
  voor een crawler dezelfde pagina, maar de hub moet de pagína benoemen.
- **Wisselen van fase verandert geen URL.** Het is een `tablist`. Drie routes zouden drie bijna
  identieke dunne pagina's op indexeerbare URL's zetten, vóór de gidsen waar ze naartoe linken.
  `?fase=` wordt alleen *gelezen*, voor een deeplink vanaf de strip op een gidspagina.
- **De "huidige" stap wordt over de hele fase berekend, niet per gids.** Een `findIndex` per
  stappenlijst gaf fase 1 twee oranje huidige stappen. Twee is erger dan geen: de markering bestaat
  om te zeggen waar je verdergaat, en er is één plek.
- **Voortgang is localStorage, geen cookie** (beslissing eigenaar). Functionele state die de browser
  nooit verlaat, dus geen consent-banner en niets extra op elk request — dezelfde belofte als de
  tijdlijn-tool. `lib/guides/progress.ts` hydrateert in een effect (lezen tijdens render kost een
  hydration error op elke gidspagina) en faalt overal stil: een leesvinkje mag de pagina die het
  versiert nooit kunnen breken.
- **Een sectie geldt als gelezen als je er *voorbij* scrolt, niet als hij in beeld komt.** Sectie *i*
  wordt gemarkeerd als *i+1* de sectie op het scherm wordt. Een balk die vollooopt omdat iemand snel
  naar beneden veegde is erger dan geen balk. **Het einde van het artikel markeert álle secties** —
  de laatste kan nooit "achtergelaten" worden, en bij een korte staart delen de laatste twee koppen
  het slotvenster, dus de observer kiest er één en de ander wordt nooit de sectie op het scherm. Zo
  bleven er van vier secties twee ongemarkeerd na het hele artikel te hebben doorgescrold.
- **`lib/guides/situation.ts` is de "Check jouw situatie"-tool, en elke regel erin is een herhaling
  van `moet-ik-inburgeren.ts` §wie-moet-inburgeren** — door de docent nagekeken, met bron in
  `SEO/facts.md` §10. Niets hier is een nieuwe claim en niets mag er een worden. De vrijstellingen
  worden **vóór** de plicht getoetst (nationaliteit en leeftijd eerst): een EU-burger met een
  gezinsvergunning is niet inburgeringsplichtig, en op reden-eerst toetsen gaf die lezer `likely`.
  De copy hedged in alle drie de talen — DUO beslist en stuurt een brief; een tool die "je hoeft niet
  in te burgeren" zegt doet een juridische uitspraak die hij niet kan doen, en zit fout in de richting
  die iemand een boete kost. "Ik weet het niet" staat op elke vraag in normale opmaak en is een
  eersteklas waarde tot in de tabel, waar hij `unclear` oplevert plus de sectie die het oplost.
- **De fase-illustraties zijn drie doelgetekende SVG's** (`PhaseIcon.tsx`), op één 32×32-grid en één
  streekdikte, met `currentColor` voor de structuur en `--color-secondary-container` voor één accent
  per tekening — daardoor werkt hetzelfde bestand op een navy en op een witte kaart. Geen emoji
  (harde regel) en geen lucide: een fase is een *begrip*, en drie willekeurige glyphs zouden
  decoratie zijn die zich voordoet als betekenis.
- **`.article-body h2` heeft nu `scroll-margin-top: calc(var(--nav-h) + 24px)`.** Zonder dat landt
  elke sprong naar een sectie *achter* de vaste header. Gelezen uit de token, niet getypt.
- **Elke voorwaartse pijl draagt `.rtl-flip`.** De layout spiegelde zich in het Arabisch en de pijlen
  niet, dus die wezen tegen de leesrichting in. Let bij `.step-row-arrow` op de functievolgorde:
  `translateX(-3px) scaleX(-1)` — omgekeerd geschreven beweegt de nudge achteruit.
- **Turbopack serveerde één CSS-edit lang een verouderde chunk**, dus een fix stond op schijf en niet
  op de pagina. `curl` de gecompileerde chunk en grep de regel vóór je concludeert dat de CSS fout is;
  een newline aan `globals.css` toevoegen forceert de hercompilatie.

De diagnostische quiz per onderdeel en de `.ics`-export van de tijdlijn staan nog open (zie M2c); de
vijf overige M2-spokes ook.

---

## The four surfaces — never mix their layouts

| Surface | Route group | Layout | Audience |
|---|---|---|---|
| **Homepage / marketing** | `app/[locale]/(main)/` | public `Nav` + `Footer` | anonymous, SEO |
| **Platform** | `app/[locale]/(app)/` | `PlatformSidebar` + mobile tabs, no public nav | paying users |
| **Auth** | `app/[locale]/(auth)/` | minimal shell | login/register/activate |
| **Admin** | `app/[locale]/(admin)/` | admin shell, `admin_users` allowlist guard | internal only |

**`/admin/questions` is the single content surface.** It lists `questions` *and* `open_tasks`
together — skill as tabs, the row's shape as a column — because the split between those two tables
is a database fact and the docent thinks in "de items van examen 3". `/admin/opgaven` and a
short-lived `/admin/content` were the same list twice and are gone; the per-item routes they owned
(`opgaven/[id]/edit`, `opgaven/new`) stay and are reached from the drawer's "Volledige editor".
`/admin/leren` is deleted too — `FEATURES.leren` is off, so it authored content nothing could
display. Woordkaarten stays.

**The level is in the admin navigation, not in a filter on the page.** `lib/admin/nav.ts` is the
single definition of the admin sidebar — the desktop shell and the mobile drawer had already drifted
apart, so both render `_components/AdminNav.tsx`. Sections marked `levelled` (Examens, Vragen &
opdrachten, Rubrieken) get an A2/B1 sub-menu and their pages read `?niveau=` through
`levelFromSearch()`, which falls back to A2 on anything unrecognised. That makes a level linkable
and reload-proof, which the old `useState` dropdown was not. **Beoordelen is deliberately not
levelled** — it is a queue of what is waiting, and splitting the inbox by level hides work.

**Items are written in `/admin/questions` and only assigned in `/admin/exams`** (owner's decision,
2026-08-07). Two screens able to create the same rows meant two places to break the same
constraints, and the exam builder's question is "is examen 3 complete?", not "what does this
fragment say?".

- **A fragment is edited on its own page: `/admin/fragmenten/[id]`, `…/nieuw?niveau=&onderdeel=`.**
  Two thirds authoring, one third live candidate preview. It replaced a right-hand drawer, which
  could show about a fifth of a fragment at a time and edited its questions on a different screen
  from the text they are about. Clicking a fragment row anywhere lands here — there is exactly one
  fragment editor, the same rule already applied to questions and options.
  - **One draft, one save.** The fragment *and every one of its questions* live in
    `FragmentEditor`'s state and are written by a single "Opslaan". That is what makes the preview
    honest: it renders the draft, not the database. Write order is load-bearing — fragment first
    (a new one has no id, and `questions.stimulus_id` is NOT NULL), then **park reordered questions
    at negative `sort_order`**, then the questions, then deletions.
  - **`questions_stimulus_sort_key` is `DEFERRABLE INITIALLY DEFERRED`, and that does not help
    here.** Deferral applies inside one transaction; PostgREST runs every request in its own, so
    swapping questions 1 and 2 fails on the first UPDATE. The parking pass compares against the
    **database's** order (`savedOrder`), never the draft's — the draft is renumbered the moment she
    clicks the arrow, so comparing to it parks nothing and the bug comes straight back.
  - **`lib/admin/question-write.ts` holds every rule about writing a question**: options reconciled
    by label (a delete cascades `user_question_results.chosen_option_id` to NULL), every row
    upserted `is_correct: false` first (the correct one flipped after, or the unique partial index
    trips), and `exam_id` never sent. `QuestionForm` and the fragment page both call it.
  - **`_components/StimulusEditor.tsx` is the fragment's own fields** — kind, tekstsoort, intro,
    body, script, voice casting, audio generation, length, review status. Pass `value`/`onChange`
    for controlled mode (the page); leave them off and it keeps its own state and save button.
  - **The tekstsoort's colour is on the page**, as a chip and a rail, from `categoryColors()` over
    the (level, skill)'s full section list in `sort_order` — the same list `ExamBuilder` passes.
    Colours are assigned *per list*, so a different list is a different colour and the two screens
    would disagree.
  - **Magic fill sits on each question, not on the page**, and sends `stimulusText` from the
    **draft** — the fragment may be unsaved, or saved with the old text, and reading the row would
    then write a question about a fragment that no longer says that. `/api/admin/suggest-item`
    prefers `stimulusText` over `stimulusId` for exactly that reason and caps it at 8k chars;
    `QuestionForm` sends only the id and still reads the saved row.
  - **The answer key is labelled.** A bare radio beside a text field reads as decoration, so the
    column has a "Juist" header, the chosen row is tinted green with a check, and the collapsed
    card says "juist: B" or "geen juist antwoord".
  - **The preview renders the player's own components** (`StimulusPaneLive`, `McqQuestion`), never
    lookalikes. `StimulusPaneLive` is the un-memoised export: the memoised one compares `stimulus.id`
    only, and a draft's id never changes while its text does, so the preview would paint once and
    freeze. It always shows feedback (Oefenmodus) and records nothing.
- **The tekstsoort is a column everywhere it matters.** `ContentRow.sectionName` carries it into
  the grid (a question inherits its fragment's; an open task has its own), and the exam list shows
  a chip row per card — "gesprek 3 · mededeling 3 · telefoongesprek 2" — so "is examen 3 the right
  shape?" is answerable without opening it. An uncategorised fragment is shown as **geen** in the
  brand orange rather than omitted; it is the gap most worth seeing. Note `text-warning` resolves
  to `yellow-500` and is unreadable on its own 10% tint — use `#a24000` on `#fcecdd`.
- **`/admin/questions` is the ReUI `DataGrid`** (same shape as `UsersTable`): sortable columns, a
  pencil per row, exam/status filter popovers, an "alleen onvolledig" toggle and pagination, with
  **the fragment as a parent row with its questions nested underneath** (built by hand — the ReUI
  grid's expand hook renders a custom panel, not tree rows) and the existing `ContentSheet` drawer
  on row click. A fragment stays listed even when the filters hide all of its questions: "which
  fragment has nothing on it yet" is exactly what the screen is for. Clicking a fragment row
  navigates to `/admin/fragmenten/[id]`; `?onderdeel=` opens a tab. The exam builder links to the
  same page rather than editing in place.
- **`ExamBuilder` is assignment-only**: Opbouw, the publish gate, the backlog pull-in, an ordered
  read-only fragment list with the ⇄ move control, and the per-exam "genereer ontbrekende audio"
  batch. No create, no inline editor, no delete.

**Items are authored in a backlog and then assigned to an exam.** `exams.number = 0` is the
per-(level, skill) **backlog**: a holding area for items that do not belong to an oefenexamen yet.
It exists because `questions.exam_id` and `stimuli.exam_id` are both NOT NULL, so there was nowhere
for an unassigned item to live and every authoring path started *inside* an exam — writing an item
and filling a slot were the same action.

- **`lib/admin/backlog.ts` is the only place the number 0 means anything** (client-safe: labels and
  the constant). The queries are in `backlog-server.ts`. Anything that *lists or counts* the ten real
  exams must skip it — `exams_real` is the view for that; resolving an exam by id can treat it as an
  exam, because it is one.
- **A backlog can never be published or free**, enforced by `exams_backlog_never_published`. A
  published exam 0 would show up in the funnel as an eleventh oefenexamen full of drafts.
- **Assignment is one UPDATE of `stimuli.exam_id`.** The exam builder's "Uit de backlog" panel pulls
  items in; the ⇄ control on each stimulus and open task moves them anywhere, including back.
- **`stimuli_sync_questions` cascades that UPDATE to the questions.** Without it — and it did not
  exist before 2026-08-04 — moving a stimulus left its questions pointing at the *old* exam:
  `questions_sync_exam_id` is a trigger on **questions** (`UPDATE OF stimulus_id`) and nothing
  watched `stimuli.exam_id`. A stimulus and its questions are one unit; a Lezen text shared by three
  questions cannot be split across two exams.
- **Moving out of a published exam warns rather than refuses** (owner's decision, 2026-08-04), naming
  how many recorded answers are attached. That count is read on the **service key**:
  `user_question_results` has one policy, `auth.uid() = user_id`, and no admin SELECT — so the
  docent's own session sees zero rows and the warning silently never fires. Same trap as `rubrics`.

**Images are edited in the drawer, and uploaded to our own bucket.** `/api/admin/upload-image`
takes a file off the docent's disk *or* a remote URL, re-encodes to WebP at ≤1600px and stores it in
`question-images`. Everything goes through it — uploads, pasted URLs and Pexels picks — because an
exam item pointing at a third-party CDN breaks silently months later with nobody having touched it.
`OptionImagePicker` is the one picker, shared by the drawer and the full editors.

The drawer may edit an option's `image_urls`, the image stimulus and `open_task_images`, because none
of that inserts or deletes an option row. Adding, removing or re-labelling options stays in the full
editor: deleting a `question_options` row cascades `user_question_results.chosen_option_id` to NULL
and erases what past candidates picked. `/api/upload-pexels-image` and `/api/upload-wordcard-image`
now require an admin too — both were reachable by anyone who knew the path, and both fetch an
arbitrary URL from our infrastructure into a public bucket.

**Rule:** needs the sidebar → `(app)`. Needs the public nav → `(main)`. Auth → `(auth)`.
Internal content management → `(admin)`.
`/admin-login` lives in `(auth)`, not `(admin)`, to avoid a redirect loop.
Admin routes are **not** in `i18n/routing.ts` and need no translations.

---

## Authentication — Google only, one component

`components/auth/AuthPanel.tsx` is the **only** place that calls Supabase Auth. Three pages are
thin shells around it: `/login`, `/register` and `/admin-login` (the last lives in `(auth)`, not
`(admin)`, or the admin layout's redirect would loop).

- **Google is the only method**, for users and admins alike. The Microsoft (`azure`) button that
  came across from KNM was never configured on this Supabase project — it rendered and failed on
  click — and is gone. There is deliberately **no e-mail + wachtwoord**, hence no password-reset
  flow to maintain. Adding one means editing one component.
- **`?next=` is honoured but validated.** `safeNext()` in `AuthPanel` and `safePath()` in
  `app/auth/callback/route.ts` both accept only same-site absolute paths. `/auth/callback` sets a
  session cookie, so an unvalidated `next` there is an open redirect that hands over a session.
- **Admin access is not a separate credential.** Anyone signs in with the same Google account;
  the `(admin)` layout then checks the `admin_users` allowlist and bounces with `?error=not_admin`.
  The login page therefore cannot distinguish "wrong account" from "not an admin", and shouldn't.
- **`?error=` is read on the server** and passed in as `initialError`. Reading it from
  `window.location` in an effect rendered the card once without the message.
- **`next.config.ts` has no `env:` block, deliberately.** It used to map
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` from the service key — the leak recorded below — and even the
  corrected version silently overrode a correctly-set `NEXT_PUBLIC_SUPABASE_URL` with `undefined`
  wherever only the non-public name was defined. Set the `NEXT_PUBLIC_*` names directly.

### Google OAuth setup (per environment)
Supabase → Authentication → Providers → Google needs a client ID/secret from Google Cloud, and
the Google client needs **`https://<project-ref>.supabase.co/auth/v1/callback`** as an authorised
redirect URI — the Supabase URL, not ours. Then in Supabase → Authentication → URL Configuration
set **Site URL** to the environment's origin and add `<origin>/auth/callback` to Redirect URLs.
Local dev uses `config.toml`'s `[auth.external.google]` block with the same credentials and
`http://127.0.0.1:3001` as the site URL.

---

## Funnel — how a visitor becomes a customer

```
/                          hero + four skill cards
  └─ CTA "Start gratis oefenexamen" → /oefenen
       /oefenen                    pick a skill (Lezen/Luisteren live; Schrijven/Spreken "Binnenkort")
         └─ /oefenen/[skill]       10-question taster, static content, no DB
              ├─ per-question explanation revealed inline
              ├─ EMAIL GATE — score withheld until submitted (skip link provided)
              └─ results → CTA to /oefenexamen/a2/[skill]
/oefenexamen/[level]/[skill]      PUBLIC overview — 10 exam slots, the SEO + funnel surface
  └─ /oefenexamen/[level]/[skill]/[n]  THE PLAYER — lives in (app), login required
       exam 1 free with an account; 2–10 → /premium
/premium                   €9,95 / €19,95 → Mollie → /betaling-gelukt → /dashboard
```

The email gate deliberately keeps a **skip link**. Withholding a result the visitor already
earned with no way out is coercive and mostly yields junk addresses. Don't remove it
without an explicit decision from the owner.

---

## Tech Stack
- **Next.js 16**, App Router, TypeScript strict
- **Tailwind v4** (`@theme` tokens in `app/globals.css`) + shadcn/ui primitives
- **Supabase** — Postgres, RLS, Supabase Auth
- **Mollie** payments · **Resend** email · **Vercel** hosting/cron
- **next-intl** — nl/en/ar, all pathnames in `i18n/routing.ts`
- **ElevenLabs** TTS — listening audio, question read-aloud
- **Vercel AI Gateway** — rubric grading for Schrijven/Spreken (planned, Phase 5)
- **GA4** analytics. **PostHog was removed** — don't reintroduce it; `track()` in
  `lib/analytics.ts` sends to GA only.
- **Vitest** unit tests (`tests-unit/`), **Playwright** e2e (targets localhost:3001),
  **Puppeteer** via `check-ui.mjs` / `check-ui-auth.mjs`

---

## Directory map

```
├── app/
│   ├── [locale]/
│   │   ├── (main)/                     # public site
│   │   │   ├── page.tsx                # homepage — four skill cards
│   │   │   ├── oefenen/                # free funnel: picker
│   │   │   │   └── [skill]/            #   10-question taster + FreePracticeEngine
│   │   │   ├── oefenexamen/[level]/[skill]/  # 10 exam slots per (level, skill)
│   │   │   ├── premium/                # pricing (€9,95 / €19,95)
│   │   │   ├── docent/ contact/        # trust pages
│   │   │   ├── blog/ oefenvragen/      # DISABLED — see lib/features.ts
│   │   │   └── privacybeleid/ gebruiksvoorwaarden/ terugbetalingsbeleid/
│   │   ├── (app)/                      # dashboard, leren, betaling-gelukt
│   │   ├── (auth)/                     # login, register, activate, admin-login
│   │   └── (admin)/                    # questions, exams, leren, woordkaarten, users
│   ├── api/                            # route handlers (see table below)
│   ├── sitemap.ts globals.css layout.tsx
│
├── components/
│   ├── Nav.tsx Footer.tsx              # public chrome
│   ├── site/                           # marketing kit — SkillCard, SkillIcon, TeacherCard,
│   │                                   #   FeatureCard, SectionHeader, GradientHero, …
│   ├── ui/                             # shadcn primitives
│   ├── reui/                           # ReUI data-grid (admin tables)
│   ├── proefexamen/                    # ExamQuestionCard, useReadAloud, ExamIntro
│   └── leren/                          # lesson components (feature-flagged off)
│
├── data/
│   ├── skills.ts                       # ★ the four components — counts, durations
│   ├── free-practice.ts                # ★ the 20 static taster items (10 Lezen, 10 Luisteren)
│   ├── woordkaarten.ts                 # vocab cards (feature-flagged off)
│   └── questions.ts blog-posts.ts oefenvragen-topics.ts leren/
│                                       #   typed-EMPTY stubs — engines kept, KNM content gone
│
├── lib/
│   ├── features.ts                     # ★ launch flags: blog/oefenvragen/leren/woordkaarten
│   ├── skills → see data/              # (taxonomy lives in data/, not lib/)
│   ├── exams.ts                        # fetchExamsForSkill() — [] until Phase 2 seeds it
│   ├── questions.ts                    # DB-first with static fallback
│   ├── api-constants.ts                # PRODUCTS, prices, endpoints
│   ├── analytics.ts                    # track() → GA4 only
│   ├── exam-readiness.ts xp.ts learning-queues.ts progression.ts
│   ├── email/                          # Resend templates + layout
│   └── supabase/{client,server,admin}.ts
│
├── i18n/ messages/{nl,en,ar}.json
├── public/audio/free-practice/         # 10 committed taster mp3s (3.5MB)
├── resources/                          # LOCAL ONLY, gitignored except images/ — see below
│   ├── images/                         #   hero source + CREDITS.md (tracked)
│   └── exam-references/A2/             #   official DUO examples — REFERENCE ONLY
├── scripts/generate-free-practice-audio.mjs
├── supabase/migrations/
├── tests/                              # Playwright — being rewritten per skill
└── check-ui.mjs                        # Puppeteer screenshots (mobile 390 + desktop 1440)
```

### API routes
| Route | Purpose |
|---|---|
| `submit-results` | anon results email + `email_campaign_queue` day2/day7 + `exam_submissions` |
| `claim-submissions` | links anon submissions to a new account |
| `mollie-checkout` / `mollie-webhook` / `payment-status` | payment + entitlement |
| `generate-question-audio` | ElevenLabs → `question-audio` bucket |
| `generate-stimulus-audio` | two-voice Luisteren stimulus audio from `script` + `voice_cast` |
| `admin/run-eval` | re-grades the held-out `grading_examples` and scores the model |
| `cancel-subscription` | cancels every live Mollie subscription; sets `modules_until` |
| `checkout-modules` | per-module subscription checkout, price computed server-side |
| `generate-wordcard-audio` / `admin/generate-lesson-audio` | other TTS surfaces |
| `pexels-search` / `pexels-query` / `upload-pexels-image` | admin image tooling |
| `send-campaign-emails` | Vercel Cron, daily 9am UTC |
| `contact-submit` `unsubscribe` `admin-revalidate` `reconcile-payments` | support |

---

## Content rules

### DUO reference material is copyright — do not reproduce
**`resources/` is local working material and is not published.** The repo is public, so
`.gitignore` excludes all of `resources/` except `resources/images/` (the hero source that
`scripts/build-hero-image.mjs` needs). Everything else — the DUO exam material and the
inherited KNM source files — stays on your disk and must never be committed. If you add
reference material, put it in `resources/` and it is excluded automatically.

`resources/exam-references/A2/` holds the official DUO practice exams. They carry
*"© Ministerie van SZW … U mag de vragen van dit examen niet delen"* and an explicit
no-reproduction notice.

**Use them for format only** — length, register, question style, pane layout. Every item we
ship is written from scratch. This is also the USP: our content is the docent's, not
anyone else's.

### Where content lives
- **Free taster (20 items):** `data/free-practice.ts`. Static on purpose — it is the top of
  the funnel and must render for anonymous visitors with no DB round-trip.
- **Paid exams:** Supabase (`exams` / `questions` / `open_tasks`), authored in `/admin`.
- **Taster audio:** committed mp3s in `public/audio/free-practice/`, generated by
  `scripts/generate-free-practice-audio.mjs` (two ElevenLabs voices, stitched with ffmpeg).
  Regenerate one item: `node scripts/generate-free-practice-audio.mjs lu-3`.
- **Paid exam audio:** Supabase Storage `question-audio` bucket, per-question from admin.

### TTS voices — always use the four in `data/tts-voices.json`
`data/tts-voices.json` is the **single source of truth** for ElevenLabs voice IDs; import it
via `lib/tts-voices.ts` (`VOICES`, `NARRATOR`, `DIALOGUE_VOICES`, `voiceId()`) in app code,
or read the JSON directly in `scripts/*.mjs`. **Never hardcode a voice ID anywhere.**

| Key | Voice | Gender | Age |
|---|---|---|---|
| `woman_young` | Female Voice 1 | female | younger |
| `woman_older` | Female Voice 2 | female | older |
| `man_young` | Male Voice 1 | male | younger |
| `man_older` | Male Voice 2 | male | older |

**The voice must match the speaker's gender.** A woman speaking gets a female voice, a man
gets a male voice — always. The script establishes gender through names and address forms
(`Sara Yilmaz`, `Hoi Peter`, `Meneer El Amrani`, `mevrouw De Wit`, `Youssef`, `mevrouw`), and
a mismatch there is an immediately audible content bug, not a stylistic slip.

- Casting is **per item**, never a blanket "A = female, B = male". `CASTING` in
  `scripts/generate-free-practice-audio.mjs` holds one entry per item with a comment
  recording what forces each choice; the script throws on an uncast item rather than
  guessing.
- Where the script leaves a speaker's gender open (a desk clerk, an announcer), the choice
  is ours — spread it across items so all ten don't sound like the same two people.
- Speaker A and B must always be **different voices**, and consistent within one item.
- Single-narrator surfaces (question read-aloud, lesson audio, woordkaarten) use `NARRATOR`.
- Do not add a fifth voice without the owner's approval.

### Generation settings — two pipelines, deliberately different

| | Taster listening audio | Read-aloud / lessons / woordkaarten |
|---|---|---|
| Script | `scripts/generate-free-practice-audio.mjs` | the three `generate-*-audio` API routes |
| Endpoint | `/v1/text-to-dialogue` (whole scene, one call) | `/v1/text-to-speech` (per request) |
| Model | `eleven_v3` | `eleven_multilingual_v2` |
| Settings | `stability 0.5` (Natural), speaker boost | `stability 0.45`, `similarity 0.75`, `speed 0.9` |
| Direction | delivery tags per turn (`DELIVERY`) | none |

Both apply `apply_text_normalization: 'on'` (Dutch prices/times/abbreviations), a stable seed,
and a two-pass ffmpeg `loudnorm` to **−20 LUFS** — measured off the official DUO audio
(−20.5 LUFS, 3.7 LU range). Never ship a taster mp3 that skipped the loudnorm pass.

**Delivery tags** (`DELIVERY` in the script) are v3 audio events, not spoken words. Rules:
no sound effects under exam speech; tag at the **start** of a turn; never around a time, day
or name; `[interrupting]` / `[overlapping]` are **banned in exam content** — they attack the
comprehension being tested. They are fine on marketing surfaces.

**Known tradeoff, accepted by the owner (2026-07-28):** v3 has no pacing control — no `speed`,
and it ignores `<break time>` outright (two renders differing only in breaks came back
byte-identical). The taster audio therefore runs ~150 wpm vs the ~110 wpm the multilingual_v2
pipeline reached and DUO's 57% speech ratio. If A2 candidates report it as too fast, set
`POST_ATEMPO = 0.88` in the script — a pitch-preserving time-stretch, the only lever left.
Don't "fix" this by switching models without raising it first.

---

## Blog & SEO — read `SEO/README.md` before writing any post

The blog lives in `data/blog-posts.ts` as data (`BlogPost` entries with `articleHtml` strings);
the routes in `app/[locale]/(main)/blog/` already generate all metadata, hreflang and JSON-LD.
**Do not create `app/blog/[slug]/page.jsx`** — that is not this project's shape.

`SEO/` holds the standard: `README.md` (process + on-page checklist), `facts.md`, `keywords.md`,
`used-keywords.md`, `voice.md`.

The three rules most likely to be broken:

1. **Every number comes from `SEO/facts.md`, with a `FactBox` carrying its source URL and
   consulted-on date.** If it is not in that file, it does not ship. `facts.md` §9 is an explicit
   do-not-publish list — chiefly the "18 van de 25" pass norm and the "500 punten" threshold,
   both of which every competitor states and none can source. DUO publishes no raw cut-off: the
   zak-slaaggrens is *"een cesuur, vastgesteld door de Minister"* (Examenreglement Artikel 10
   lid 5). Saying so is the wedge.
2. **Blog posts never target practice-exam keywords.** `inburgeringsexamen oefenen` and friends
   return tool SERPs that an article cannot win; they belong to `/oefenen/[skill]` and
   `/oefenexamen/[level]/[skill]`. The blog takes explanatory queries only.
3. **Write for an A2 reader.** Dutch posts: sentences averaging ≤15 words, `je` not `u`, common
   vocabulary, every term explained on first use. See `SEO/voice.md`.

Item counts (Lezen 25, Luisteren 25, Schrijven 4, Spreken 16) are **verified** off the start
screens of DUO's own public practice exams and match `data/skills.ts` — see `SEO/facts.md` §1 for
the method and the exact wording that is defensible. DUO's practice-exam content is copyright and
secret: counting items is fine, reproducing a question is not.

---

## Design rules

### Always build from the official elements and icons

**This is not a preference. A new page reaches for the existing vocabulary first, every time.**

| Need | Use | Never |
|---|---|---|
| Page header / hero | `HorizonHero`, `GradientHero`, or `HorizonBanner` inside your own section | a hand-rolled gradient block |
| Section heading | `SectionHeader` (it carries the horizon rule) | an `<h2>` with a 1px divider |
| A boundary between blocks | a background tier shift (`surface` → `surface-container-low`) | `border-top`, `<hr>` |
| Selection / focus | the inset `--ring-selected` | a border |
| Depth | `--shadow-ambient` + the four surface tiers | `shadow-md`, `--shadow-card*` on anything new |
| Progress, a surface edge, a card foot | `HorizonBand` | a custom bar |
| Naming an onderdeel, KNM or the gidsen | `CategoryMark` | a lucide glyph, an emoji, a new drawing |
| A control, an arrow, a close button | **lucide-react** | a `CategoryMark`, an emoji, an SVG of your own |
| The validation claim | `ValidationChip` / `DocentSeal`, once per page | a second trust mark in the same view |
| Decorative imagery | `Skyline`, `SunDisc`, `DotField`, `LensRing`, `GlassChip` | an illustration, a mascot, line art, a stock image |
| A skill/module card | `SkillCard`, `SkylineTopper` | a bespoke card |

Four things that follow from it and are easy to get wrong:

- **One sun disc per composition** (§7.3). Two orange discs in one view is the fastest way to make
  this palette look cheap. A 6px dot inside a badge is a bullet, not the composition's sun.
- **Scale a skyline by dropping houses, never by shrinking every part** (§7.1) — and a house stays
  roughly as wide as it is tall. Every header therefore needs **two counts behind one breakpoint**;
  `HorizonBanner` already owns that pair, which is the reason to reach for it rather than compose
  the four layers by hand.
- **No new hue for a status.** Correct/passed is clay (`secondary` / `secondary_container`), wrong is
  `--color-error`, and an icon carries the meaning for anyone who cannot separate the two. The
  greens (`#15803d` and family) were removed from every live surface once already; `/admin`'s answer
  key is the one documented exception, because it is internal.
- **A component that hard-codes `display` in its base class cannot be toggled by a responsive class
  from the caller** — wrap it in a plain `div`. `Skyline` sets `flex`, so `className="hidden sm:flex"`
  rendered *both* streets at 390px.

If the vocabulary genuinely cannot say what a page needs, **add to `components/horizon/` and write
down the rule**, so the next surface inherits it. Do not solve it locally: a one-off shape in one
page is how a design system turns back into a page-by-page accumulation.

### The design system is a document, and it lives in `docs/design/`

`docs/design/DESIGN_SYSTEM.md` is the **specification** — "The Civic Authority", imported
2026-08-22 from the Claude Design project *Horizon Element Library*.
`docs/design/horizon-element-library.html` is its reference implementation: open it in a browser
before designing a new surface, because no prose describes a skyline as well as a skyline does.
**When the spec and the code disagree, the spec wins and the code is the bug.**

The palette was already token-identical (`@theme` in `app/globals.css` and §2 of the spec are the
same eleven colours), so importing it added no colour and changed no brand. What it added is the
part the site did not have: a **graphic language**, a typographic register, and the rules that make
those two read as one system rather than as a page-by-page accumulation.

Four rules from the spec that constrain code, not taste:

- **The no-line rule (§2).** A 1px solid border may not be used for sectioning. Boundaries come from
  a background colour shift — a `surface-container-low` block on `surface`. Selection and focus are
  an **inset** `box-shadow` (`--ring-selected`), never a border. Where accessibility genuinely needs
  a border on a high-stakes input it is the ghost border (`--ghost-border`, `outline_variant` at
  20%), never 100% opacity.
- **Tonal layering, not drop shadows (§4).** Depth is four surface tiers: base → section → card →
  pop-over. A floating card gets `--shadow-ambient` (32px blur, no offset, 6%) — a glow of light,
  not a weight. The pre-existing `--shadow-card*` tokens are the older, heavier family; prefer the
  ambient one on anything new.
- **One sun disc per composition (§7.3).** The orange is a pointer. Two orange discs in one view is
  the fastest way to make this palette look cheap.
- **No illustrations, mascots or line-art imagery (§7.3).** All decorative imagery is built from the
  four CSS primitives. Functional UI icons remain lucide-react — the ban is on *drawn imagery*, not
  on affordances.

### `components/horizon/` is the graphic language, and it is reusable everywhere

The Dutch Horizon vocabulary is four primitives — **the gable house, the sun disc, the horizon band
and the dot field** — plus two derived forms, the **skyline row** and the **lens ring**. Everything
decorative in the system is a recombination of those six things, in CSS, with no image asset and no
licence.

| Export | What it is |
|---|---|
| `Skyline` | the canal-house row: full width, bottom-anchored, gable type cycled by index |
| `HorizonHero` | the structured page header — eyebrow / display title / lede / actions in the graphic frame |
| `HorizonBanner` | **the graphic layer alone** — dot field + responsive skyline + sun + band, to drop into any `relative overflow-hidden` section that already has its own copy |
| `SkylineTopper` | the card header (5–7 houses), with the neutral-ramp `locked` state |
| `SectionTransition` | the silhouette handover — **once per page maximum** |
| `SunDisc` `HorizonBand` `DotField` `LensRing` `GlassChip` | the primitives |
| `DocentSeal` `ValidationChip` | the trust layer (§7.4) |

- **Nothing in this folder uses `Math.random()`, and that is load-bearing.** A house's gable, height
  and tint are a function of its index (`tokens.ts`), because these are server components: a random
  skyline would render one street on the server and a different one in the browser — a hydration
  mismatch on every page that has a header.
- **Scale a skyline by dropping houses, never by shrinking every part** (§7.1) — *and* keep a house
  roughly as wide as it is tall. Those two rules pull against each other on a wide viewport: seven
  houses across 1440px are 200px wide against 56px of height and read as a bar chart, not as canal
  houses. `GradientHero` therefore renders **two counts behind one breakpoint** — 6 houses on a
  phone, 16 above `sm`. Copy that pattern rather than picking one count and living with it at the
  other end.
- **The skyline is clipped, not contained.** It needs a parent with
  `position: relative; overflow: hidden`, and it stays in the lower third with the copy in the upper
  two thirds. A graphic running behind a headline is explicitly forbidden (§7.3) — which is also why
  `GradientHero`'s sun disc is `hidden sm:block`: at 390px the copy fills the full width, and a
  composition with no sun is fine where an overlapped headline is not.
- **`GradientHero` kept its exact API when it became a Horizon banner**, so all six page headers
  using it — blog, docent, both guide hubs, oefenvragen, planned surfaces — picked up the gradient,
  dot field, skyline, sun disc and horizon band in one edit with no caller changed. Use
  `HorizonHero` for a *new* header that wants the structured eyebrow/title/lede stack.
- **`SectionHeader` now carries a horizon rule** — a 48px slice of the band that closes every hero —
  under the title. It is what a section heading gets *instead* of the 1px divider the no-line rule
  forbids, and it is the cheapest way a page reads as part of the system.
### The homepage's vertical rhythm was cut by ~16% on 2026-08-22

The page was 5,275px at 1440 and 8,301px at 390. It is 4,444 / 7,182 now. Nothing was removed — the
air between things was. Where the numbers came from, so a future section does not put them back:

- **`py-24` → `py-14 sm:py-16` on all four content bands.** 96px above *and* below every section is
  where a third of the length was.
- **`SectionHeader`'s defaults changed and that is site-wide**: `mb-14` → `mb-9`, the title
  `md:text-[2.5rem]` → `md:text-[2.25rem]`, and the three internal `mb-4`s → `mb-3`. Four headers on
  this page, six more elsewhere; consistently tighter is the point.
- **`SkillCard` lost 20px of topper (84 → 64) and a padding step (`p-7` → `p-6`).** Four of them
  stacked is most of the mobile page.
- `TeacherCard`'s full variant `p-8` → `p-6`, `FeatureCard` `p-7` → `p-5`, `FaqAccordion` rows
  `px-6 py-5` → `px-5 py-4`, grid gaps `gap-5`/`gap-8` → `gap-4`/`gap-6`.
- **The hero's own collage went 560 → 424px** and the phone from 248 to 228 wide. The mobile hero now
  fits in one 844px viewport, which it did not before.

**Compacting the collage broke it twice, both times by clipping text rather than by clipping a card
edge.** Overlap between two cards reads as a stack; overlap that cuts a sentence in half reads as a
bug. The KNM card's caption was the casualty and was dropped — the three thema marks and "8 thema's"
already said it. Check the collage at 1440 *and* at the `lg` breakpoint after moving any card.

### The homepage hero is centred, and the track chips are what license the word "alles"

Rebuilt to the owner's mockup on 2026-08-22, over the split navy hero, which was itself over the
photograph. The reason is positioning, not taste: a two-column hero holds one product card and says
"here is one thing", and the claim this page now has to make is that **the whole traject is here**.
A centred headline over a collage of six surfaces says that in one glance.

- **Light, not navy — and that is what the collage buys.** Six white cards need a surface to sit on;
  over `primary` they become the whole composition and the graphic language vanishes underneath
  them. The dot field, the light-ramp street and the closing band still carry it. There is
  deliberately **no sun disc**: a centred layout has no flank for an accent that is not either
  behind the copy or on top of a card.
- **`TRACKS` in `page.tsx` is the roadmap, stated once, and it is what makes the headline honest.**
  A2 · B1 · KNM · ONA as a bare list would advertise four things and deliver one: B1's thirty exams
  exist but are `noindex` behind the docent's review gate, KNM is the documented fifth onderdeel and
  is not built, ONA is announced and not built. `live: false` renders the "binnenkort" chip. **When a
  part goes live, this row and `data/skills.ts` change together** — and B1 in particular needs the
  `robots`/sitemap change recorded under "B1 stays `noindex`" as well, or the chip would promise a
  page search engines are told to ignore.
- **The satellites are positioned from the *centre*, not from the container's edges.** `left`/`right`
  percentages pinned them to the box, so on a wide viewport the box grew and the cards drifted away
  from the phone — six things scattered across 1024px rather than one cluster. `left: 50%` plus a
  pixel `marginLeft` keeps every card the same distance from the phone at every width.
- **The cards run 38px under the phone (`OVERLAP`), and the phone is on top (`z-20` over `z-10`).**
  That inversion of the DOM order is what makes overlap safe: whatever a card covers, it can never
  be the phone's own content. An earlier pass had the satellites on top and they covered the
  "3 / 12" progress chip — part of what the shot exists to show.
- **`under` pads a card's content back off the covered edge.** The card's *shape* overlaps; its text
  does not, or sentences get cut mid-word, which reads as a bug rather than as depth. The offsets
  are arithmetic, not taste: the phone is 300 wide at `lg`, so its edges are at ±150, a covered edge
  sits at ∓112, and a left-hand card's `x` is `-112 − width`. Getting that wrong by 84px put every
  left card's text under the phone — and it looked deliberate, so **check the words, not the
  shapes**, after moving anything.
- **The phone is rounded at the top only and runs off the bottom of the section.** A fully rounded
  panel floating clear of the edge reads as a pill; cropped, with corners only at the top, it reads
  as a screen continuing past the fold. The bottom padding (`pb-14 lg:pb-16`) exists so the crop
  lands in empty navy rather than through the last answer option — and it must stay larger than the
  negative `bottom`, which is why the two are set per breakpoint.
- **It is 300px wide at `lg` and 228 below, and that is positioning, not layout.** Most candidates
  sit this exam at a desktop, so the shot should not insist the product is a phone app; it keeps
  phone proportions on a phone, where 300px would not fit.
- **`_components/HeroShowcase.tsx` is `aria-hidden` in its entirety.** It is a picture of the
  product: the phone is an unanswerable multiple-choice question, the play button plays nothing, and
  the five satellites are fragments of state belonging to nobody. Anything a visitor needs to *know*
  belongs in the copy above it.
- **Every figure in it is illustrative UI state, and the test is whether it would still be true
  printed as prose on this page.** That is why the mockup's "58" badge and "240 vragen" on the KNM
  card are not here — they read as a catalogue size, and KNM is not built. "8 thema's" stayed,
  because it is a fact about the exam.
- **Below `lg` only the phone renders.** Six overlapping cards need ~1000px to overlap *legibly*;
  scaling the collage down instead makes the type illegible.
- **The phone is centred with `inset-x-0 mx-auto`, never `left-1/2 -translate-x-1/2`.** The
  satellites set `transform: rotate()` inline; mixing that with a Tailwind translate dropped the
  translate and left the phone at `left: 50%`, overflowing the viewport at 390px. Auto margins need
  no transform at all.
- **The collage has no negative bottom margin.** A 40px overhang cropped the phone through the
  middle of its third answer option, which reads as a rendering bug rather than as a composition.
  The section's own edge is the crop.
- **The positioning copy moved with it**: `home.meta_title`, `meta_description`, `hero_line1`,
  `hero_subheading`, `cta_primary` ("Begin gratis") and `footer.tagline` now describe the whole
  traject rather than "de vier onderdelen van het inburgeringsexamen A2". `hero_line2`, `cta_secondary`
  and the three `stat_*` pairs are gone. **Still A2-only in their wording and needing the owner's
  copy, not a search-and-replace:** `home.skills_subheading`, `home.faq_a1` (which is *correct* and
  says the platform covers the four taalonderdelen — resolve the tension in the copy, not by
  deleting the true sentence), the `/docent` and `/premium` headers, and the five blog posts.

### The homepage's second block is the shelf — one compact row

`app/[locale]/(main)/page.tsx`, directly under the hero, to the owner's mockup (2026-08-22). It
briefly was a two-row block of six *package* cards, each listing what was inside it (uitleg per
antwoord, beoordeling per criterium, nagekeken door de docent). That block said more and was worse
in this position: the question this strip answers is "what is on this site?", the onderdelen grid
below already sells them one at a time, and an answer at a glance beats an answer with a bill of
materials.

- **The rule under each name is a solid `HorizonBand`, not a part-filled meter.** The mockup draws
  it two-tone — an orange run and a grey remainder — which is a progress bar, and on an anonymous
  first visit there is no progress to report. It is also the detail a returning visitor would notice
  never moves. Solid, it reads as the surface edge every card on the site closes with.
- **ONA is announced as "binnenkort" and nothing is built** (owner's mockup, 2026-08-22).
  `data/skills.ts` has four onderdelen and KNM is the documented fifth; ONA is on no roadmap in this
  repo. If that changes, or if it should not be advertised, the tile's label is the only thing to
  touch.
- **The ONA tile is not a link and is drawn on the neutral ramp with a hollow ring.** An unbuilt
  onderdeel that looked identical to the five live ones would leave the "binnenkort" chip doing all
  the work, and a chip is easy to miss.
- **The section sits on `surface`, not `surface-container-low`.** The disabled tile *is*
  `surface-container-low`, so with the section on the same token the tile vanished into it — the one
  card that must read as different became the one card that read as absent.
- **No prices here.** `/premium` is the only page with `Offer` nodes and the only place a figure is
  read from `lib/pricing.ts`. A stale price keeps showing in the SERP after the page itself is
  corrected.
- **The two product cards in the hero are `aria-hidden`.** A Lezen item and a Luisteren player in a
  hero are a picture of the product, not the product: to a screen reader the first is three
  unlabelled options and a stray checkmark, and the second is a play button that plays nothing. The
  real exam is one link away.

### The official category marks are the icon layer — `components/horizon/CategoryMark.tsx`

Imported from the Claude Design project *Dutch Icon Studio* (§04 "Category marks v3") on
2026-08-22. Six marks: `lezen` `luisteren` `schrijven` `spreken` `knm` `gidsen`.

- **This is not a second icon set competing with lucide; the split is by job.** A category mark
  names *a thing the product sells* — an onderdeel, the KNM section, the gidsen — and it is brand
  imagery drawn from the same blocks and discs as the skyline. **lucide-react keeps every
  functional affordance**: chevrons, close buttons, nav items, the arrow inside a CTA. Confusing
  the two is how a system ends up with two visual voices, so a mark never stands in for a control
  and a lucide glyph never names a category on a marketing surface.
- **§7.3's ban on illustrations is not broken.** There is no line art and no drawing tool: every
  mark is composed of rectangles, discs and the one permitted triangle, in CSS, exactly like the
  houses. Which is also why they are here and not in `components/site/`.
- **All six are drawn on the studio's 72×72 grid and scaled by transform.** Pass `size`; never
  re-draw a mark at another size, or the 36px shelf tile and the 48px card tile become two sets of
  numbers to keep in step.
- **The `cut` colour is the tile showing through the ink** — the pages of the document, the gaps
  between the colonnade's columns. It must equal the tile behind it, which is why `tone` switches
  both together and why a mark cannot be dropped onto an arbitrary background.
- **KNM is the studio's "Instanties" colonnade and Gidsen is its "Brug".** KNM is the onderdeel
  about how the Dutch state works, which all eight thema's run into; the gidsen are the crossing.
  A book for the gidsen would have collided with Lezen, which is the document.
- **`SkillCard`'s tile *is* the mark.** It used to be a white 48px tile with a bare lucide glyph
  inside; `CategoryMark` draws its own `surface_container_high` square, so keeping the wrapper gave
  a tile inside a tile. `SkillIcon` still exists and is still right in the nav, the admin and the
  portal — those are affordances, not offers.

- **`tokens.ts` duplicates the palette as hex literals on purpose.** Those values go into inline
  `style` gradients, which cannot read a Tailwind colour utility. It is the one sanctioned copy of
  `@theme`; keep the two in step.

### `HorizonBanner` is the one to reach for, and why it exists

Six surfaces needed the same four layers over their own copy, so the composition is a component
rather than a recipe: `<HorizonBanner />` inside any `relative overflow-hidden` section, copy after
it with `position: relative`.

**It carries the responsive pair of house counts, and that is the point.** §7.1 says to scale a
skyline by dropping houses rather than shrinking every part — but a house also has to stay roughly
as wide as it is tall or it stops reading as a canal house. Fourteen houses look right at 1440px and
read as a **picket fence** at 390px; six look right on a phone and as a **bar chart** on a desktop.
Every header needs both counts, and no header should have to remember that. It also owns the
`hidden sm:block` on the sun disc, for the same reason: at 390px the copy fills the full width and
there is no empty flank for an accent to occupy without landing on a headline.

`sun={false}` for a **centred** header — there is no flank at any width.

### What was converted, and what was deliberately left (2026-08-22)

Converted: the shared chrome (`GradientHero` → all six page headers, `SectionHeader`'s horizon
rule, the glass `Nav`, the silhouette handover in `Footer` — which is why no page needs its own),
the homepage (hero band, the §7.4 comparison band, `SkillCard` → `SkylineTopper`), `/oefenen`,
`/premium` (hero, module toppers, and its many off-system values), `/oefenexamen/[level]/[skill]`
(exam-set header, `ValidationChip`, the three not-openable states), the free taster
(`ExamIntro` + `FreePracticeEngine`), the exam player (`ExamShell`'s start card and result
surfaces, `McqQuestion`'s quiz surfaces, `AudioPlayer` → the §7.2b audio surface,
`RubricFeedback`), and the live portal (`dashboard/page.tsx`, `betaling-gelukt`).

**The greens are gone from every live surface.** `#15803d` / `#16a34a` / `#22c55e` / `#4ade80` /
`#f0fdf4` / `#dcfce7` were carrying "correct", "passed" and "included" in eleven files, and none of
them is in a token file — §7.3 forbids a new hue for a status. Correct/passed is now clay
(`secondary`/`secondary_container`), wrong is `--color-error`, and the Check/X icon is what actually
carries the meaning for anyone who cannot separate the two hues. `#eef2ff` and `#eff6ff` (Tailwind
indigo-50 / blue-50) went the same way — those are the "standard blue" §6 names explicitly.

Deliberately **not** converted, and each for a reason:

- **`/admin`'s green answer key.** `#15803d` marks the correct option in `QuestionCard` and
  `ContentSheet`. It is internal, it is documented above as the intended affordance, and
  green-for-correct is right in a data-entry tool where the docent is scanning for the one ticked
  row. Public surfaces are where the palette has to hold.
- **`components/leren/`.** `FEATURES.leren` is off and nothing routes there. It still has emoji,
  `material-symbols` and the full green/red palette. Restyling code that will be rewritten when the
  feature is switched on is work thrown away twice.
- **`dashboard/components/*View.tsx`, `dashboard/analyse`, `dashboard/fouten`.** Documented above as
  unrouted KNM-shaped leftovers. Same argument.
- ~~**The homepage photo hero.**~~ **REVERSED 2026-08-22 — the hero is the constructed blue
  panel now.** The old argument (a real trapgevel beats a drawn one; §7.3's one-gradient rule means
  a drawn street would fight the scrim) was true and lost anyway: the photo made the homepage the
  one page on the site that did not speak the graphic language, so the hero read as a different
  product's. It is now two panels — solid `primary` under the copy, `--gradient-brand` under the
  graphic — carrying the dot field, **the** sun disc, the docent card and a 13-house street with a
  molen standing in it. `public/images/hero.webp` and `scripts/build-hero-image.mjs` stay on disk;
  this is a taste call and taste calls get re-made.
- **The `--shadow-card*` family.** Still used by ~40 callers. `--shadow-ambient` is the system's
  elevation and the one to use on anything new; a blanket swap is its own change.

### No emoji anywhere in the UI
### No emoji anywhere in the UI
Use **lucide-react** icons (what shadcn ships). Emoji render differently per platform and
cannot be colour-matched to the brand. `components/site/SkillIcon.tsx` maps each skill to
its icon (BookOpen / Headphones / PenLine / Mic) and renders it in the brand-tinted tile —
use it rather than re-picking icons. `FeatureCard` takes a `LucideIcon`, not a string.
Checkmarks, crosses and arrows in UI are lucide `Check` / `X` / `ArrowRight`, not glyphs.

### The mark has two definitions and a generator — never a third

The logo is **`components/site/LogoMark.tsx`** for anything React renders, and **`MARK` in
`scripts/build-icons.mjs`** for every file a browser or a mail client fetches as an image. Those two
are the only copies. Change them in the same commit and re-run the generator:

```bash
npm run build:icons        # favicon.svg, favicon-32x32, icon-512, apple-touch-icon,
                           # app/favicon.ico (16+32+48) and images/logo-email.png
```

- **The generator exists because the mark used to live in seven places** — the component, the SVG,
  three PNGs, the ICO and `BrandLoader` — so "update the logo" meant finding all seven and
  hand-editing rasters. The one on 2026-08-22 missed the favicons and the loader until asked.
- **Rasterising goes through Puppeteer**, the one `check-ui.mjs` already needs. There is no librsvg
  or ImageMagick on this machine, and a native image dependency for five files that change once a
  year is the worse trade.
- **`apple-touch-icon.png` is a full square with no corner radius.** iOS applies its own mask; a
  pre-rounded icon gets rounded twice and shows a ring of the page behind it inside the squircle.
  Everything else keeps the 23/100 radius.
- **`images/logo-email.png` is the *dark* variant**, because the mail header is navy — and it is the
  inverted tile, not a translucent one: an emailed PNG has no backdrop to be translucent against,
  and 12% white renders as a grey smudge in every client. It is rendered at 160 for a 34px slot
  because there is no `srcset` in email.
- **`app/favicon.ico` is PNG-encoded** (6-byte header, one 16-byte directory entry per image, then
  the PNG bytes). Every browser that matters has read PNG-in-ICO since IE11.
- **`BrandLoader`'s spinner arc orbits *outside* the tile, at r=80.** The old one span the logo's own
  outlined ring, which the mark no longer has. A replacement ring around the sun disc lands on the
  bar at any useful radius — the disc is at cx=65 and the bar starts at x=26 — and a ring inside the
  tile would show a retired logo on the one surface a user stares at. Its `strokeDasharray` sums to
  the exact circumference (2π·80 = 502.65); any other total repeats the pattern and draws a second
  stub arc opposite the first.

### The header is navy, and the logo tile inverts on it

Changed 2026-08-22 (owner's decision). It used to be glass — `surface` at 80% with a 20px
backdrop-blur, which §2 asks for on a floating element. Correct in the abstract and wrong here:
nearly every page header on this site is a navy Horizon banner, so a white bar sat on top of a navy
panel and read as **two headers stacked**. On `primary` the bar and the banner beneath it are one
surface, and the homepage hero needs no darkening gradient under the nav any more — there is no
seam to hide.

- **`LogoMark surface="dark"` is what the bar uses**, and the tile *inverts* (white tile, navy bar,
  orange disc) rather than going translucent. A 12%-white tile made the mark read as a disabled
  control.
- **The 1px bottom edge stays 1px**, because `--nav-h` includes it and the row is sized
  `calc(var(--nav-h) - 1px)`. It is now white at 10%: a ghost border is invisible on a dark bar.
- **The `<option>` elements need their colour set back explicitly.** The language `<select>` is
  white-on-navy in the bar, but its popup is drawn by the OS and does not inherit the bar's
  background — without `color: #191c1e` on each option the list is white on white. This is the kind
  of thing no screenshot of the closed bar can show.
- **The dropdown panels and the mobile drawer stayed light.** They are pop-overs (§4's fourth
  surface tier), not part of the bar; making them navy too would have removed the only tonal step
  that says a panel is floating above the page.
- `.glass-nav` is still in `globals.css` and still used by nothing on the public header. Leave it
  or remove it in its own change — it is not this section's business.

### The header's height is a token, not a number in three places
`--nav-h` in `app/globals.css` is the height of the fixed public header, border included. `Nav`
sizes its row to `calc(var(--nav-h) - 1px)`, the `(main)` layout reserves `pt-[var(--nav-h)]`, and
the homepage hero cancels exactly that much to slide under the bar. Those were three independent
numbers until 2026-08-21: the layout reserved 80px for a 73px header, so **7px of page background
showed as a stripe under the nav on every `(main)` page** — invisible on the homepage, which cancels
the spacer and so hid it. Change the nav's padding and the token together. Note the Tailwind trap:
`h-[calc(var(--nav-h)-1px)]` emits nothing (invalid CSS, silently dropped) — the spaces around the
minus must be written as underscores, `_-_1px`.

### A raster cannot flip, so anything labelling one must not flip either

The kennisgids explainer diagrams are generated **text-free** because a guide ships in nl/en/ar and
the Arabic renders RTL: text baked into a raster cannot be translated, cannot mirror, is invisible
to a screen reader and cannot be selected. The labels therefore live in HTML — `figure()` and
`figureSplit()` in `data/guides/kit.ts`.

**That moved the bug rather than removing it, and it took a screenshot to see.** `.guide-figure-split`
is a CSS grid, and a grid lays its columns out along the inline direction — so under `[dir="rtl"]`
the two halves swapped while the drawing above them did not. On the Arabic pages "Wet inburgering
2021" sat under the grey *pre*-2022 half of the timeline and "2013" under the navy one, with the
accent rule on the wrong side too: the labels contradicted the picture and told the reader the old
act was the new one. Nothing in the stack can notice that — the page is valid, the strings are
correctly translated, and both tests and `tsc` pass.

So `.guide-figure-split` is pinned `direction: ltr` and each side re-establishes `rtl` for its own
text under `[dir="rtl"]`. **Any future element that annotates a fixed image needs the same
treatment**: pin the placement to the image, and let only the text follow the locale.

Worth knowing for the next diagram: a left-to-right timeline still *reads* forwards to an RTL
reader only because the caption says so in words. Do not "fix" that with `transform: scaleX(-1)` on
RTL — it would mirror `explainer-twee-wetten` too, whose labels are now deliberately pinned, and
put them back out of step with the drawing.

### Anti-generic guardrails
- **Colours:** only brand tokens from `app/globals.css`. Never default Tailwind
  indigo/blue-600. Primary `#002b6d`, accent `#fe762c`, orange text `#a24000`.
- **Shadows:** layered and colour-tinted (`--shadow-card`, `--shadow-card-md`). Never flat
  `shadow-md`.
- **Typography:** `--font-headline` (Manrope) for headings, `--font-body` (Public Sans) for
  body. Tight tracking (`-0.03em`) on large headings, `1.7` line-height on body.
- **Animation:** only `transform` and `opacity`. **Never `transition-all`.** Spring easing
  (`cubic-bezier(0.22, 1, 0.36, 1)`). Always add a `prefers-reduced-motion` escape.
- **Interactive states:** every clickable element needs hover, focus-visible and active.
- **Depth:** base → elevated → floating. Surfaces must not all sit on one z-plane.

---

## Hard rules
- **Build every new page out of the official elements and icons.** `components/horizon/` is the
  graphic language and `components/horizon/CategoryMark.tsx` is the icon layer; `components/site/`
  is the marketing kit. A new surface starts by picking from those, not by drawing a header, a
  divider, a status dot or a category glyph of its own. See "Design rules" below for what each one
  is and the four spec rules that constrain code.
- Check `COMPONENTS.md` before creating a component — reuse beats new.
- No `transition-all`. No default Tailwind blue/indigo as primary. No emoji.
- **i18n on every feature:** a new user-facing string goes into `messages/nl.json`,
  `en.json` **and** `ar.json`. Exceptions: exam items (always Dutch) and lesson body text.
- **`grep` the locale file before adding a key.** Duplicate JSON keys don't error —
  `JSON.parse` silently keeps the last one. This has bitten us.
- Pricing must be a concrete number in €, never "from X".
- Payment trust badges (iDEAL, card logos) near every checkout CTA.
- Never a `<br>` inside an `<h1>` that splits a sentence mid-thought.
- Meta descriptions unique and 140–160 characters.
- Don't show a score before the email/upsell step on the public funnel.
- Questions come from Supabase (primary); `data/questions.ts` is the static fallback only.

---

## The study portal — real routes, four onderdelen

Rebuilt 2026-07-30 around the product's actual shape: **four onderdelen, ten oefenexamens
behind each.** The KNM SPA is gone — `/dashboard` was one client page holding every view in
`useState`, so the URL never changed, a skill was not linkable and back left the portal.

| Route | What it is |
|---|---|
| `(app)/dashboard/page.tsx` | overview — four skill cards, ten-segment progress strip each |
| `(app)/dashboard/[level]/[skill]/page.tsx` | the ten oefenexamens of one onderdeel |
| `(app)/dashboard/profiel/page.tsx` | account + per-onderdeel totals |
| `(app)/oefenexamen/[level]/[skill]/[number]` | the player (`components/exam/ExamShell.tsx`) |

All are **server components**. `AppShell` (sidebar + mobile tab bar) is wrapped per page rather
than by the layout, because the player needs the same chrome from a different route segment.
The portal chrome CSS lives in `AppShell` **only** — it used to be duplicated there and in
`dashboard/page.tsx`, and the two had already drifted.

- **Progress reads `exam_attempts`, keyed by (skill, exam_number)** — see
  `lib/portal-progress.ts`. KNM keyed it `exam_${number}` with no skill, so Lezen 1 /
  Luisteren 1 / Schrijven 1 / Spreken 1 all wrote to `exam_1` and overwrote each other. It
  reads attempts rather than the `exam_results` view because that view exposes only the *latest*
  attempt, so a worse retake would lower the card.
- **Leren and woordkaarten are out of the portal.** `lib/features.ts` already flagged them off;
  the nav was advertising two dead ends. The old `dashboard/components/*View.tsx` files are
  still on disk but nothing routes to them — delete them once the decision is final.
- `/dashboard/analyse` and `/dashboard/fouten` still exist and are still KNM-shaped (flat
  question pool, topic mastery). Nothing links to them. They are the next thing to rebuild or
  remove.
- A slot has **three distinct not-openable reasons** — unpublished, paid-plan-only, already
  passed — and they must stay visually distinct. One "locked" state for all three tells the
  candidate nothing.
- **Verifying the portal needs a session.** `check-ui.mjs` cannot: every page redirects to
  `/login`. Mint a local user via the auth admin API and hand-write the `sb-127-auth-token`
  cookie (`base64-` + base64 of the session JSON).

---

## Rubric grading — Schrijven en Spreken

The docent authors the criteria; a model applies them; the docent reviews the result. Never frame
it as "de AI beoordeelt je antwoord" — that inverts the product's only claim.

| Piece | Where |
|---|---|
| Rubric keying + scoring maths | `lib/rubrics.ts` |
| Draft criteria (form prefill **only**) | `lib/rubric-templates.ts` |
| Model ids, timeout, temperature | `lib/ai/gateway.ts` |
| Scribe transcription + measured signals | `lib/ai/transcribe.ts` |
| The one grading prompt | `lib/ai/grade.ts` |
| The endpoint | `app/api/grade-open/route.ts` |
| Candidate-facing result | `components/exam/RubricFeedback.tsx` |
| Rubric authoring | `(admin)/admin/rubrics/` |
| Review inbox + agreement eval | `(admin)/admin/beoordeling/` |

**Two models, and why.** Schrijven grades on text. Spreken transcribes with ElevenLabs Scribe
(`scribe_v2`) *and* sends the recording to an audio-capable model, because the owner's decision
(2026-07-30) is that pronunciation is judged from the audio, not inferred from a transcript. Two
calls per spoken answer is deliberate: the transcript is shown to candidate and docent, and Scribe's
per-word `logprob` yields an **objective** intelligibility number the docent can verify. That is
what keeps the pronunciation criterion defensible.

**Spreken records WAV, not WebM.** Verified: the grading model accepts wav/mp3/aiff/aac/ogg/flac and
**not** WebM or Opus, which is all `MediaRecorder` can emit. `lib/wav-recorder.ts` encodes 16 kHz
mono WAV in the browser (AudioWorklet + a 44-byte header, no dependency). Costs ~30 MB per Spreken
exam versus ~2 MB for Opus; buys one artifact that the browser, Scribe, the model and the docent's
inbox all read with no transcode anywhere. **Before changing the audio model, re-run
`npm run check:audio-model`** — it synthesises a Dutch sentence with unguessable words, sends only
the audio, and fails if they do not come back. Asking a model "did you get audio?" gets a yes either
way.

**Rubric keying is `(level, skill, task_type)`.** `rubrics.task_type` is free text. Schrijven uses `task_type`
(`email`, `short_text`, `form`, `picture_note`); Spreken has one task_type but four onderdelen with
different image rules, so it is keyed by `image_usage` → `speaking_none` / `speaking_describe` /
`speaking_choose` / `speaking_cover_all`. `rubricCategory()` is the only place that convention
lives. Eight rubrics cover all 20 open exams.

**Editing a rubric that has graded someone mints version + 1.** `open_criterion_scores.rubric_version`
is what makes a stored score interpretable later; rewriting v1 in place changes the meaning of every
grade already recorded against it. The decider is `used_count` from `open_criterion_scores`, **not**
`active` — a deactivated rubric can still have graded hundreds. `rubrics_one_active_idx` is
`UNIQUE (level, skill, task_type) WHERE active`, so activating v2 must deactivate v1 **first** —
and the deactivation must be scoped to the level, or activating a B1 rubric switches off A2's.

**AI and teacher scores coexist by design.** `UNIQUE (submission_id, criterion_key, source)`. The
candidate sees one number per criterion and it is the docent's where she entered one
(`effectiveScores()`); the pair is the dataset `/admin/beoordeling/evals` runs on. The headline
metric there is **signed bias per criterion**, not accuracy — "0.6 milder dan jij op grammatica" is
actionable, "71% overeenkomst" is not.

**`grading_examples.use_as_fewshot` is a train/test split.** `true` is fed to the grader; `false` is
held back to measure it. Promoting a held-back example inflates the next eval without the model
having improved. Never pass `use_as_fewshot = false` rows to `fetchFewShot`.

**A missing criterion is missing, not zero.** `pctFromCriteria` drops unscored criteria from the
denominator and the UI says so. Scoring them 0 would turn a grading bug into a failed exam.

**`exam_attempts.feedback_mode`.** The owner chose per-answer feedback inside full exams. A
`practice` sitting therefore lets the candidate revise after being told what was wrong, so its score
does not predict DUO. `exam` mode withholds feedback until submit. Anything claiming readiness must
filter on `feedback_mode = 'exam'`.

**Rubric attempts have a null score until graded.** `completeExamAttempt` takes
`score`/`pct`/`passed` as nullable. It used to write `0 / 0% / false` for open skills, which the
dashboard rendered as a fail and averaged in.

**`/api/grade-open` spends money per call.** It is capped at 3 grades per task (per attempt, or per
`(user, task)` when `attempt_id` is null), idempotent unless an admin passes `force`, and it records
`grade_error` on the row so a stuck answer surfaces in the inbox. There is deliberately **no
`/api/transcribe`** — transcription only ever runs as the first step of a grade.

**Live transcript: browser → ElevenLabs directly, no relay.** `/api/stt-token` mints a single-use
token (`POST /v1/single-use-token/realtime_scribe`, 15-minute expiry) so the key never reaches the
browser; the client then opens `wss://api.elevenlabs.io/v1/speech-to-text/realtime` itself with
`model_id=scribe_v2_realtime&audio_format=pcm_16000&commit_strategy=vad&filter_background_audio=true`.
Proxying would mean our infrastructure carrying audio it has no use for.

`WavRecorder` already produces 16 kHz mono PCM, which is what that endpoint wants, so
`lib/realtime-transcript.ts` taps the recorder's frames via `start({ onPcm })` rather than opening a
second `getUserMedia` — two mic streams conflict on some platforms and would capture subtly
different audio from the file that actually gets graded. The tap can never break the recording.

**`filter_background_audio=true` is not optional.** Without it Scribe invents words from silence: a
4.8-second probe followed by quiet produced a trailing "Ja." nobody said. A candidate who finishes
early leaves exactly that silence, and a readback showing words they did not say destroys the only
thing the pane is for.

**The live transcript is never the graded transcript.** Grading runs on the submitted WAV through the
batch call in `lib/ai/transcribe.ts`, which also yields the per-word confidence the docent reviews.
The two can differ, and the UI says so. The readback is Oefenmodus-only — DUO gives none, and reading
your own words mid-answer trains self-correction rather than speaking.

**ElevenLabs keys are per-product scoped.** Text-to-speech and `speech_to_text` are separate
permissions, and a key without the latter 401s with `missing the permission speech_to_text` on both
Scribe paths while TTS keeps returning 200. Rotating the key does not help; the scope does. Every
transcription path degrades rather than failing the grade.

**Never select `model_answer` or rubric criteria into a client component.** `ExamContent` goes
straight into `ExamShell`, so anything in `TASK_COLS` is in the page payload. The exemplar answer and
the anchors are a scoring key. `rubrics` has no non-admin SELECT policy for the same reason, which is
why grading is a server route.

---

## Stimulus audio is generated from admin

`/api/generate-stimulus-audio` renders a Luisteren stimulus from `stimuli.script` and
`stimuli.voice_cast` in **one** `/v1/text-to-dialogue` call (`eleven_v3`), uploads to the
`question-audio` bucket and writes `stimuli.audio_url`. Three modes: a **draft** (script not saved
yet, returns a URL and writes no row), one saved stimulus, or every audio stimulus in an exam that
has no file. `lib/tts-dialogue.ts` holds the parsing and casting rules and is the server twin of
`scripts/generate-free-practice-audio.mjs` — change one, look at the other.

- **Generation refuses rather than guesses.** An uncast speaker, an unknown voice key, or two
  speakers sharing a voice are all 400s. Casting is a content decision the script forces
  (`mevrouw De Wit` is female) and is **not** recoverable from the mp3, so a generator that picked
  for you would produce plausible audio that is quietly wrong.
- **Draft mode exists because of the CHECK, not by preference.**
  `stimuli_payload_matches_kind` requires an audio stimulus to have an `audio_url`, so a new one
  cannot be saved script-first and generated from afterwards. The editor generates first and saves
  the URL it gets back. Don't "simplify" this by relaxing the constraint — that is what keeps a
  half-authored stimulus out of a published exam.
- **Scripts may put every turn on one line.** The seeded exams store `A: … B: … A: …` as a single
  paragraph, so the parser splits on inline tags as well as newlines. An inline tag must start with
  a capital and contain no spaces (which keeps `Hij zei: kom maar` out); a multi-word label like
  `Mevrouw De Wit:` is only honoured at the start of a line.
- **No loudness normalisation here.** The taster pipeline runs a two-pass ffmpeg loudnorm to
  −20 LUFS and there is no ffmpeg binary in a serverless function, so exam audio generated from
  admin sits at ElevenLabs' native level. Known and accepted — do not "fix" it by dropping the
  loudnorm from the taster script, which is the surface where a level mismatch inside one sitting
  would actually hurt.

**`lib/admin/guard.ts` (`requireAdmin()`) is how an `/api` route checks the allowlist.** The
`(admin)` layout guards pages; a route handler has no layout above it. `generate-stimulus-audio`
and `admin/run-eval` use it. **`generate-question-audio`, `generate-wordcard-audio` and
`admin/generate-lesson-audio` still do not** — they are reachable by anyone who knows the path and
each spends ElevenLabs credits per call. Worth closing.

## Verification — required after every change

1. `npx tsc --noEmit`
2. `PATH="/opt/homebrew/bin:$PATH" npx next build` — the **only** thing that compiles the
   auth-gated `(admin)` routes. Run it whenever you touch admin.
3. **UI changes:** `node check-ui.mjs http://localhost:3001/<path> <label>` → writes mobile
   (390px) + desktop (1440px) full-page shots to `temporary_screenshots/`. **Read both**,
   fix what you find, re-run. Never declare a UI task done without this loop.
   For `(app)` and `(admin)` routes use **`check-ui-auth.mjs`** instead — `check-ui.mjs` can only
   ever photograph the login page there, because those routes redirect an anonymous visitor:
   ```bash
   node check-ui-auth.mjs http://localhost:3001/nl/admin/exams/2 label /path/to/cookie.txt \
     'button[aria-label="Stimulus bewerken"]'    # optional: click before the shot
   ```
   The cookie file holds one line, `sb-127-auth-token=base64-<base64 of the session JSON>`; mint
   the session with the auth admin API against the local stack. The optional selector is how a
   drawer or an inline editor gets into the picture at all — without it you photograph a page that
   looks fine and proves nothing.
4. **Schema changes:** query the table afterwards to confirm it landed.
5. **Deploys:** curl the live URL.

Report the actual output. Don't declare done without running these.

### Two test suites, different questions
```bash
npm run test:unit                                   # vitest — pure logic, fast, must stay green
PATH="/opt/homebrew/bin:$PATH" npm run test:e2e     # playwright — browser
PATH="/opt/homebrew/bin:$PATH" npm run test:open    # playwright HTML report
```
**`tests-unit/`** (vitest, `vitest.config.mts`) covers logic that needs no browser: `lib/pricing.ts`,
`lib/rubrics.ts`, `lib/entitlements.ts`, `lib/tts-dialogue.ts`. It runs in ~200 ms and **is expected
to be green.** Add a case here whenever you fix a logic bug; the dialogue parser regression (inline
speaker tags read as one speaker) is pinned that way. **`tests/`** is Playwright's and is excluded
from vitest's glob.

**`tests/` was rewritten per onderdeel (2026-08-04) and is green: 53 pass, 2 documented skips.**
Five files, each asking one question:

| File | What it pins |
|---|---|
| `public.spec.js` | four onderdelen always visible, the funnel's entry point, ten slots per overview, concrete prices, the disabled surfaces |
| `free-practice.spec.js` | feedback per question, the score withheld until the e-mail step, **the skip link** |
| `seo.spec.js` | 140–160 char descriptions, unique titles, per-locale canonical, hreflang, sitemap |
| `portal.spec.js` | **entitlement** — free vs paid vs module vs expired vs legacy plan |
| `admin.spec.js` | the allowlist, the single content surface, and that every credit-spending route 401s |

Locale is `nl-NL` in `playwright.config.js` — prevents the i18n redirect to `/en/`.

- **Auth is real, not mocked.** `tests/helpers/session.mjs` mints a session against the local stack
  through the same GoTrue endpoint the app uses, and chunks the cookie into `.0`/`.1` the way
  `@supabase/ssr` does — Chromium drops a cookie over ~4 KB, so an unchunked one silently runs the
  whole "authenticated" suite as an anonymous visitor. The old `mockAuth()` faked a session *and*
  overrode `document.cookie` so nothing could notice; it kept passing against a page no real user
  could reach. Run with `SUPABASE_SERVICE_KEY` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the
  environment; without them the auth-gated specs **skip** rather than fail.
- **Entitlement can only be tested on an exam that has items.** With no content the player calls
  `notFound()` before the gate is reached and the test passes for the wrong reason. The fixtures are
  therefore B1 exam 1 of each onderdeel (the only seeded content), and `setExamFree()` borrows one of
  them as the free case and restores it in `afterAll`.
- **Two skips are findings, not flakes.** `test.fixme` marks the flag emoji in the language switcher
  and the missing `<main>` landmark on the public pages. Both are one-line fixes waiting on a
  decision; deleting the tests would lose the record.
- **Assert structure and promises, not wording.** Copy changes weekly. A suite that fails on a
  reworded heading is a suite people learn to ignore.

---

## Investigation vs. action
When asked to **investigate / check / look into / diagnose** — report findings, change
nothing, wait for approval. Only implement after explicit confirmation.

## Scope control
Don't create files, pages or migrations beyond what was asked. Multi-file or
schema-touching work that wasn't scoped: stop and confirm first.

---

## Learning loop
Append an entry to `LEARNINGS.md` after **every session with a change** — before ending the
session. Re-read it at the start of every session and apply the lessons.

```
## [DATE] — [short title]
**Changed:** one sentence, with file paths.
**Outcome:** SUCCESS or FAILURE
**What worked / went wrong:** concrete.
**Lesson:** the generalizable rule.
```
Log failed attempts separately — a fix that took three tries is three entries.

---

## Outstanding work (see `~/.claude/plans/` for the full plan)

**The current roadmap is the milestone plan in `docs/MILESTONES.html` (M0–M6, 2026-08-19)** —
**M0 and M1 are done (2026-08-19).** M2 is underway: the pillar
(`data/guides/inburgering-stappenplan.ts`) published 2026-08-19, and the menu now implements
MILESTONES §3 with the first tool and free-practice placeholders (2026-08-20) — see "M2 — the
pillar is live" and "M2b — the menu implements §3". **The tijdlijn-maker is built (2026-08-20) — see "M2c" above, and
the hub became a three-fase route with per-section reading progress on 2026-08-22 — see "M2d".**
Next: the six spokes (start each
from `SEO/facts.md` §10), the EN top-3, and the inline diagnostic quiz inside the tijdlijn nodes.
The phases below are the original build-out, kept for their still-open items.

- ~~**Phase 2 — data model.**~~ **DONE** — `supabase/migrations/20260729000000_a2_baseline.sql`
  squashes the KNM chain and adds `exams`, reshaped `questions` (skill, exam_id, stimulus_*),
  `open_tasks`, `rubrics`, `open_submissions`, `grading_examples`, plus `sections` repurposed
  as the sub-skills. Verified against the local stack. **Still to do:** run it on a new hosted
  Supabase project and point `.env.local` at it — only local is set up.
- ~~**Phase 3 — exam engine.**~~ **DONE** — `components/exam/` holds `ExamShell` plus the
  renderers: `StimulusPane` (memoised on `stimulus.id` so the pane and its `<audio>` survive
  advancing within one stimulus), `McqQuestion` (3 or 4 options, `text | image | image_grid`),
  `WritingTask` (the four Schrijven shapes) and `SpeakingTask` (MediaRecorder, capped at
  `max_record_seconds`). `AudioPlayer` is DUO's ⟲10 / play / 10⟳ with a seek bar and
  **no play limit**. `lib/exam-content.ts` loads the exam; `duration_seconds` and
  `pass_threshold_pct` come off the exam row and the two module constants are gone.
  **Answers are held in state until submit** — going back and changing one is how the real
  exam works, and writing a row per click left superseded results skewing the mastery series.
  `startExamAttempt` opens the sitting before the first answer so every
  `user_question_results` / `open_submissions` row carries its `attempt_id`;
  `completeExamAttempt` closes it. Spreken recordings go to the private
  `speaking-submissions` bucket and the **path**, not a URL, is stored.
- ~~**Phase 4 — admin.**~~ **MOSTLY DONE — the question editor saves again.** `QuestionForm`
  writes `questions` + `question_options` (stimulus picker, 3–4 repeatable options, per-option
  image sets via `OptionImagePicker`). `/admin/exams` is the 40 slots with real counts;
  `/admin/exams/[id]` is the builder — stimulus CRUD, questions per stimulus, and a publish
  button gated on `exam_publish_issues()` (blocked on `error` rows only, never on warnings).
  `ExamsGrid` and `QuestionsTable`'s own edit drawer are **deleted**: that drawer was a second
  save path writing `category`/`option_a..c`, and one editor means one place to break.
  **Still open in this phase:** `admin/opgaven` for `open_tasks` (the builder lists them
  read-only), and two-voice stimulus audio (`/v1/text-to-dialogue` reading `stimuli.voice_cast`)
  plus a bulk generator — today an audio stimulus takes a pasted URL.

  Two option-table rules the editor depends on, worth knowing before touching it:
  `question_options_one_correct_idx` is `UNIQUE (question_id) WHERE is_correct`, so every row
  is written `is_correct: false` first and one is then flipped; and options are reconciled
  **by label**, never deleted and re-inserted, because a delete cascades
  `user_question_results.chosen_option_id` to NULL and erases what past candidates picked.
- **Phase 5 — rubric grading.** `/api/grade-open` via AI Gateway, `/api/transcribe` for
  Spreken, `/admin/beoordeling` with the docent's correction → few-shot → eval loop.
- **Phase 6 — seed** exam 1 of each skill. **Phase 7 —** rewrite the test suite.

### Known carried-over issues
- ~~`user_metadata.tier` vs `plan`~~ **FIXED** — `lib/entitlements.ts` (`planFromMetadata`,
  `canOpenExam`, `canSeeExplanations`) reads `plan` with a `tier` fallback and is the single
  source of truth. `proefexamen/page.tsx` uses it. Other `tier`-reading sites
  (`dashboard/fouten`, `leren/[slug]`) should move to it too.
- `submit-results` never writes `exam_number` despite `UNIQUE(email, exam_number)`.
- `exam_results` and `exam_submissions` coexist unreconciled; a migration dropped the former
  but its header says it never reached prod, and the dashboard still reads it.
- `ProefexamenEngine` ships **all** questions to the browser instead of filtering by exam.
- ~~Two different `PASS_THRESHOLD_PCT` values~~ **FIXED for the new engine** — it reads
  `exams.pass_threshold_pct`. The legacy `ProefexamenEngine` still uses the constant.
- **`ProefexamenEngine.tsx` + `/proefexamen` are now dead weight.** The A2 player is
  `components/exam/ExamShell.tsx`; the old engine survives only for the KNM-shaped flat-question
  route and still says "KNM Proefexamen" on screen. Delete it once nothing links there.
- **Marketing/legal copy still says KNM** in `gebruiksvoorwaarden`, `privacybeleid`, `docent`
  (including the claim "108 KNM-oefenvragen ontwikkeld") and the `oefenvragen` pages. These are
  factual claims about the product and about a real person, so they need the owner's wording, not
  a search-and-replace.
- Legal pages (voorwaarden, privacy, terugbetaling) still describe the KNM product.
- Domain is a placeholder: `inburgeringoefenen.nl`. The Instagram link points at a handle
  that may not exist.
- **The KNM service key was exposed to browsers** via `next.config.ts` before the fork
  (`NEXT_PUBLIC_SUPABASE_ANON_KEY` was mapped from `SUPABASE_SERVICE_KEY`). Fixed here —
  but that key must be rotated.
