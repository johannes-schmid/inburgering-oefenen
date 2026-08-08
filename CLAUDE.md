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

---

## Project Overview

Practice platform for the **four language components of the Dutch inburgeringsexamen at
A2 level**. Forked from the KNM platform (`knm-website`) in July 2026 and rebuilt around a
new content domain; the whole machine — exam engine, admin CRUD, ElevenLabs TTS, Mollie,
Resend, Supabase auth/entitlements, dashboard — is reused.

| Skill | Items/exam | Duration | Item shape | Scoring |
|---|---|---|---|---|
| **Lezen** (reading) | 25 | 65 min | text stimulus + MCQ A/B/C | auto |
| **Luisteren** (listening) | 25 | 45 min | audio stimulus + MCQ A/B/C | auto |
| **Schrijven** (writing) | 4 | 40 min | open task: e-mail / short text / form | rubric |
| **Spreken** (speaking) | 16 | 35 min | audio prompt + image(s) → 60s recording | rubric |

**10 practice exams per (level, skill) = 40 exams per level.** All four onderdelen must stay
visible on the landing page. A2 is the shipped product; B1's 40 slots exist and are empty.
The taxonomy lives in `data/skills.ts` — the single source of truth for counts and durations.

### The USP, and what it constrains
**"Echt door een docent gevalideerd, geen AI."** Competitors generate exercises with AI;
at least one disclaims accuracy in its own terms. That is the wedge.

This is a **hard constraint on the code, not just the copy**:
- No AI-generated exam content. Every item is written or reviewed by a certified NT2 docent.
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

- **`_components/StimulusEditor.tsx` is the one fragment editor** — kind, tekstsoort, intro, body,
  script, voice casting, audio generation, length, review status. It owns its own draft state and
  writes directly, so any screen can drop it in with an `onSaved` callback.
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
  fragment has nothing on it yet" is exactly what the screen is for. Clicking one opens
  `StimulusSheet`, the same right-hand drawer the question editor uses.
  `?onderdeel=` opens a tab and `?fragment=` opens that fragment's editor — which is how the exam
  builder links out rather than editing in place.
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

### No emoji anywhere in the UI
Use **lucide-react** icons (what shadcn ships). Emoji render differently per platform and
cannot be colour-matched to the brand. `components/site/SkillIcon.tsx` maps each skill to
its icon (BookOpen / Headphones / PenLine / Mic) and renders it in the brand-tinted tile —
use it rather than re-picking icons. `FeatureCard` takes a `LucideIcon`, not a string.
Checkmarks, crosses and arrows in UI are lucide `Check` / `X` / `ArrowRight`, not glyphs.

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
