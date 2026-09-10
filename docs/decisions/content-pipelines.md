# Where the 1,700 exam items came from

The A2 dataset, the B1 generator, the KNM migration off knmoefenen.nl, and the two TTS pipelines.

> Moved out of `CLAUDE.md` on 2026-09-02, unchanged. It is the reasoning behind decisions
> that are already made — read it when a task touches this area, not every session.
> The rules that must hold at all times live in `CLAUDE.md`; this file is why they hold.


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
- ~~**B1 stays `noindex`**~~ **B1 IS LIVE — the gate came down on 2026-08-23** (owner's
  confirmation that the docent has been through the thirty exams). **The gate was in four places,
  not the three this section listed**, and the fourth is the one worth remembering:
  `scripts/check-schema.mjs` carried `forbid: ['Course']` on `/nl/oefenexamen/b1/lezen`. Nothing
  else would have caught it — tsc, the build and every screenshot were clean.
  - **What replaced the gate is a fact, not a level.** `robots` is now
    `{ index: skill.itemCount !== null }`, and `app/sitemap.ts` skips on the same condition.
    `itemCount === null` is B1 Luisteren and only B1 Luisteren (no DUO reference material — see
    `data/skills.ts`), so its overview is still `noindex` and still absent from the sitemap. Filling
    in those counts opens the page in the same commit, which is the coupling to want.
  - **B1 Luisteren's ten exams are unpublished** on local *and* production; the other thirty are
    published on both. No DB write was needed to ship this.
  - **The landing page's tile row is the fifth place, and it was the one that mattered most to a
    visitor.** `TRACKS` (the small chip strip in the hero) was only half the job: the "Het hele
    examen, blok voor blok" row rendered B1 as a `SoonBlock` — "Binnenkort" plus a *houd me op de
    hoogte* link to `/contact`. It is now a live tile, and it follows the row's existing vocabulary
    rather than inventing one: **a filled white disc means live** (KNM's tile established it), **a
    hollow ring means not built** (`SoonBlock`), and there is **no second `SunDisc`** because the A2
    tile beside it carries the composition's single sun (§7.3).
  - **Its chips are derived, not typed**: `B1_CHIPS` filters `SKILLS` on
    `getFormat('b1', slug).itemCount !== null`, the same fact as the `robots` gate. So the row shows
    Lezen/Schrijven/Spreken today and picks up Luisteren on the commit that counts its format —
    rather than needing someone to remember this line. Linking B1 Luisteren today would put a
    `noindex` page behind a chip on the most-linked page on the site.
  - **B1's CTA is solid white, deliberately unlike KNM's `bg-white/22`.** That opacity reads fine on
    KNM's dark `secondary` and is nearly invisible on `primary-container`; worse, the skyline's
    houses showed through the button and it looked like a rendering fault. Two live language levels
    with the same button is the honest outcome — the titles and chips separate them.
  - ~~**No B1 exam is `is_free`.**~~ **SETTLED — B1 exam 1 of Lezen, Schrijven and Spreken is free
    on production** (verified 2026-09-02). The free tier is "oefenexamen 1 of every published
    onderdeel", which is eight exams; B1 Luisteren is the only gap and only because it has no
    content. **`supabase/seed.sql` still flags only the five A2+KNM slots**, so a freshly reset
    local database disagrees with production — see `CLAUDE.md` §2.
- **Pictures live under `b1/` in the same bucket, with their own lock file.**
  `createImages({ level })` parameterises the object prefix, the lock path and the credits
  heading; A2's defaults are unchanged and its 399-entry lock is untouched.

### KNM is the fifth onderdeel, and it is the one without a level (2026-08-24)

The content moved across from **knmoefenen.nl production** — not from that repo's `data/*.ts`
files, which are a snapshot the docent's admin edits had already moved past (owner's
instruction). 419 questions, 43 sub-topics, 7 lesson modules of 43 sections, 366 woordkaarten,
and 3,201 media objects.

```bash
node scripts/knm-content/export-from-knm.mjs        # read knm-website production -> generated/
node scripts/knm-content/generate-leren-data.mjs    # generated/ -> data/leren/*.ts
node scripts/knm-content/seed-knm-content.mjs --dry-run
node scripts/knm-content/seed-knm-content.mjs                 # local stack
node scripts/knm-content/seed-knm-content.mjs --production    # the hosted project
```

- **`SKILLS`, `SkillSlug`, `FORMATS`, `RULES` and `TASK_RULES` still mean the four
  *taalonderdelen*, and that is deliberate.** KNM lives at the bottom of `data/skills.ts` as
  `KNM`, with `OnderdeelSlug` as the union for surfaces that genuinely mean "anything we sell".
  Roughly eighty modules read those exports and nearly all are per-level; the decisive one is
  `priceForSelection`, which reads `SKILLS.length` to decide a basket holds a **complete
  level** and therefore gets the bundle price. Widening `SKILLS` would have made the A2 bundle
  unreachable and turned every "vier onderdelen" string into a wrong number, with nothing
  failing to say so.
- **`exams.level IS NULL` for KNM, and `.eq('level', null)` matches nothing in PostgREST.**
  That is the trap this onderdeel sets over and over: the query returns zero rows, 200 OK, and
  every KNM surface renders its empty state with nothing logged. `levelFilter()` in
  `lib/exams.ts` is the single place that branch lives — route every new level-filtered query
  through it.
- **Its URLs carry no level** — `/oefenexamen/knm`, `/oefenexamen/knm/[n]`, `/dashboard/knm` —
  as static siblings of the `[level]` segment.
  **A static segment does not save you from a redirect**, which is matched *before* the App
  Router: the A2-implicit rule in `next.config.ts` swallowed both KNM pages into
  `/oefenexamen/a2/knm`, which is not a route. Its `(?!a2$|b1$)` lookahead anchored `$` against
  the whole path, so it only ever excluded a value ending the URL — the two-segment rule had no
  working guard at all and was saved only by the levelled URLs having one more segment. **Both
  rules are now an explicit allowlist of the four legacy slugs**, which cannot fail that way.
  `tests/public.spec.js` pins both KNM URLs, and `scripts/check-schema.mjs` has a row for the
  overview — nothing else noticed while `tsc` and `next build` were clean.
- **A KNM question stands alone: `stimulus_id IS NULL`.** `ExamContent.standalone` carries them
  and `ExamShell` renders them single-column, because keying the left pane on a synthetic
  one-question stimulus would remount an empty pane forty times. `questions.section_id` is new
  and is the sub-topic of a *standalone* question only — `stimuli.section_id` is still the
  authority wherever a stimulus exists. Reading only the stimulus put every KNM answer under
  "Overig" and threw away the 43-way score breakdown.
- **It is its own module at EUR 9,95, outside both level bundles** (owner's decision). `ModuleId`
  gained the bare slug `knm`; `ownsKnm()` is separate from `ownsModule()` on purpose, because
  widening the latter to `Level | null` would make "I forgot to pass the level" type-check as
  "KNM". Exam 1 is free with an account, matching A2.
- **`itemCount: 40` is ours, not DUO's** — the 419-question bank divides into ten sittings of
  forty, with nineteen in the backlog. `durationMinutes: 45` *is* DUO's published length. Never
  restate 40 as a DUO norm; same discipline as `SEO/facts.md` section 1.
- **The media is mirrored into our own buckets, not linked.** 3,201 objects under `knm/`,
  keyed on *our* row ids so a re-run is a HEAD and the two projects never share a namespace.
  Pointing exam items at knmoefenen.nl's Storage is the failure the admin upload route exists
  to prevent, and that domain is on a path to being retired. **knmoefenen.nl is deliberately
  still up and not redirected** — it stays a ranking asset until KNM ranks here.
- **`FEATURES.leren` and `FEATURES.woordkaarten` are on, and both surfaces are KNM's**, reached
  from the KNM module rather than from the portal's top level: Lezen and Luisteren still have
  no lesson content, which is why they were flagged off in the first place. `/leren` (the index
  it never had) and `/dashboard/woordkaarten` are new routes; both `notFound()` when their flag
  is false, so the gate is intact.
- **In the sidebar they are a *collapsible sub-menu under* KNM, not a second top-level
  section** (owner's decision, 2026-08-25). They briefly sat under their own "KNM LESMODULES"
  heading, which read as a peer of ONDERDELEN — a second thing the portal offers — when they are
  what the KNM module contains, beside its ten exams. `.nav-sub`'s 1px rail is the one line in
  the portal chrome and is deliberate: §2's no-line rule is about not *sectioning* with borders,
  and a navy sidebar has no background tiers to shift between to say "these belong to the row
  above". The admin sidebar's level sub-menu already draws it that way.
- **The row is a link and the chevron is a separate trigger**, which is shadcn's
  `SidebarMenuAction` shape rather than `sidebar-07`'s, where the whole `SidebarMenuButton` is
  the `CollapsibleTrigger`. Making the entire row toggle is the tidier markup and it takes away
  `/dashboard/knm`, which is the page the row is *for*. Two hit targets in one row is the price
  of keeping both, and it is the owner's instruction on both counts.
- **`components/ui/collapsible.tsx` is a new shadcn primitive, and it is on `@base-ui/react`**,
  not Radix — that is the layer the rest of `components/ui/` already uses (see `accordion.tsx`).
  The panel animates on `--collapsible-panel-height`, the variable base-ui sets from the
  measured content: `height: auto` is not animatable and a hardcoded pixel height breaks the
  moment the list gains an item.
- **The expanded state is `localStorage`, not `useState` alone.** Every portal page is a server
  component, so the sidebar remounts on each navigation — plain state would snap the menu shut
  the instant you clicked one of its own children, which is the one interaction it exists for.
  It initialises from `inKnm` rather than from storage, because reading storage during render
  costs a hydration mismatch on every portal page; the effect reconciles afterwards. **Being on
  a KNM page always beats a stored "closed"**: collapsing the menu that contains the current
  page would hide where you are. Every access is wrapped — a nav sub-menu must never be able to
  break the page it decorates.
- **The `<style>` block in `AppShell` is a template literal, so it cannot contain a backtick.**
  A CSS comment written with `` `height:auto` `` in it terminated the literal and produced a
  JSX parse error twenty lines further down, where nothing looks wrong.
- **The KNM row has a third state, `.within`.** `active` is the current page and `within` is
  "you are somewhere inside this onderdeel". Without it the lesson and woordkaarten pages left
  *no* onderdeel marked at all, so the candidate could see which page they were on but not which
  module it belonged to — the one thing the nesting exists to say. It is half `.active`'s tint
  with no inset ring, so the current child stays the strongest row, and `aria-current="page"`
  is still only on the true current one.
- **Mobile has no sidebar**, so the nesting is a desktop affordance; the bottom tab bar's sixth
  tab goes to `/dashboard/knm`, whose two cards are the way into both surfaces there.
- **The admin's level sub-menu gained a third tab, `?niveau=knm`, which resolves to `level =
  null`.** `AdminLevel` is `Level | null` and `undefined` means "no level in the URL" — the
  three are distinct and collapsing them highlights KNM on every detail route. Rubrics has no
  KNM tab: KNM is `scoring: 'mcq'` and has nothing to grade. **The "Opzet" sheet renders
  nothing for KNM** rather than shipping a silent no-op — all six of its panels save with
  `.eq('level', level)`, which for KNM would return 200 and change nothing.
- **`ContentTable`'s `atLevel` changed meaning.** A null-level row used to show under *every*
  level tab, so it could be reached at all; now it shows only under the KNM tab, which is where
  it belongs. Leaving the old rule would have put 419 KNM questions inside A2's and B1's counts.

**Three pre-existing bugs were fixed on the way through, all found by KNM needing the thing they
got wrong.**

1. **Every B1 sitting was being recorded as A2.** `exam_attempts.level` carries `DEFAULT 'a2'`
   and *no caller ever sent the column* — so `fetchPortalProgress`, which keys on (level, skill,
   number), put a B1 Lezen 3 attempt on the A2 Lezen 3 card. Nothing errored. `AttemptInput.level`
   is now **required**, not optional: a default that is right for the original case is exactly the
   shape that fails silently when a second case arrives, and KNM would have been the third.
2. **PostgREST caps a plain `select()` at 1,000 rows, silently, and two admin screens had
   passed it.** `/admin/exams` tallies items per exam by fetching every `questions` row, so a
   complete forty-question exam rendered as "23 / 40" with its progress bar two-thirds full;
   `/admin/questions` simply omitted 269 items from the only screen that lists them. B1's thirty
   exams got the table close to the cap and KNM's 419 questions took it past — the number is
   plausible enough that it reads as missing content rather than as a bug, on the screen whose
   whole job is telling the docent what is missing. **`lib/admin/fetch-all.ts` pages with
   `range()`, and any admin query that tallies or lists a whole table must go through it.**
3. **The woordkaarten gated on `plan !== 'free'`**, the legacy all-access check, so a customer
   who had bought the KNM module and nothing else saw themes 2-7 locked — the same disagreement
   between the card and the gate that `ownsModule` was introduced to fix in the exam player. It
   takes an `owns` prop now. Its locked badge also still read "Professioneel Pakket", a tier
   nothing has sold since the move to per-module pricing.

**The anonymous KNM taster shipped on 2026-08-28**, and `/oefenen` became a two-step picker.
Ten questions from KNM oefenexamen 1 (which is `is_free`) at `/oefenen/knm` — a **static** sibling
of `[skill]`, because that route resolves through `getSkill()`, the four taalonderdelen.
`lib/free-practice-db.ts` is level-agnostic now: `Level | null` throughout, a `sourceKey()` that
spells KNM's absent level `none` (two keys differing only by a missing segment collide), and it
reads `content.standalone` beside `content.stimuli`. **A stimulus-less item changes the renderer,
not just the query** — `FreePracticeEngine` drops the left pane and goes single-column, the same
call `ExamShell` makes, because a two-pane grid whose left pane is empty reads as content that
failed to load. The `oefenvragen` free topic-quiz pages are still empty and still earmarked (M3).

**KNM reads itself aloud, and that is the fifth onderdeel's own affordance (2026-08-29).** The
vraag and then every antwoord are spoken in sequence, with the word being said marked, exactly as
knmoefenen.nl presents it. It is on the free taster (`/oefenen/knm`) *and* in the paid player
(`/oefenexamen/knm/[n]`), asked once on the start screen.

- **The playback engine was already here and unused.** `components/proefexamen/useReadAloud.ts`
  and `lib/audio-pref.ts` came across with the KNM fork. The hook is **index-generic** —
  `activeSeg` is only an array position — so a four-option B1 item needs no change to it. Only the
  presentation was ported, into `components/exam/ReadAloud.tsx`, because KNM's version was
  pre-Horizon inline hex and used the retired greens.
- **It is KNM-only by construction, not by a flag.** It needs `question_options.audio_url`, which
  `/api/generate-question-audio` populates for KNM's bank and nothing else. The taster derives
  `canReadAloud` from the audio actually present (`readAloudSegments()`); `ExamShell` additionally
  gates on `exam.skill === 'knm'`. **Auto-reading a Luisteren question would speak over the
  fragment the item is testing** — that is the reason for the second gate, not tidiness.
- **The kit's CSS lives in `app/globals.css`, never in a `<style>` block in the component.** Every
  one of those blocks sat *inside* a button or inside the question text, and a `<style>` element
  contributes its source to the element's `textContent` and so to its accessible name: a screen
  reader read a media query aloud as part of an answer. No screenshot can show that; a DOM probe
  of `textContent` is what found it.
- **Answer state wins over reading state, in *two* layers.** The option's surface and the word
  mark are separate, and shielding only the surface leaves a clay highlight sitting inside the
  green "Goed" row — the sequence reads on past the click. Both are dropped once answered.
- **The sample button on the start screen is load-bearing.** Browsers block programmatic playback
  until a gesture unlocks it, and the hook reuses one `<audio>` element for the whole sitting, so
  pressing "Beluister" unlocks autoplay for every question after it. Without it the first question
  is silent and reads as broken.
- **Word timings are estimated, not measured** — character weight scaled to the clip's real
  duration. There is no `/with-timestamps` call here. Good enough at one word per ~300ms; if it
  ever needs to be exact, that ElevenLabs endpoint plus a cues JSON is the upgrade, and the hook
  would take a `timings` array and skip `scheduleWordTimers`.
- **The answers play at `OPTION_RATE` (1.25×) and the question at 1×.** `rate` is per segment,
  because the vraag is the thing that has to be understood while the antwoorden are short and the
  candidate is reading along. Two traps: `playbackRate` must be re-set **after** assigning `src`
  (some browsers reset it on a source change), and the word timers must be divided by the rate or
  the highlight falls progressively behind the voice.
- **Every clip of a question is prefetched on mount, and that is what removed the audible gap.**
  One `<audio>` element means each segment is a fresh `src` and so a fresh network fetch — a pause
  between the vraag and antwoord A, and again between each answer. A `fetch(url, {cache:
  'force-cache'})` per clip warms the HTTP cache; measured silence between clips is then 30–43 ms.
- **A standalone question fills the page's own `max-w-5xl` column, and its picture is capped at
  560px / 38vh.** `max-w-2xl` without `mx-auto` pinned the card to the left and let the progress
  bar run past it (owner's report). Going full width then blew the photo up to ~1450px and pushed
  all three answers below the fold — on a question frequently *about* the photo. **A width fix
  moves the problem to the largest child;** check that the answer is still in view, not that the
  card looks right.
- **The preference is `localStorage` (`knm-audio-enabled`), default on**, shared across tabs by a
  `CustomEvent`. So the candidate is asked once and the answer survives the next oefenexamen.

**`/oefenen` is examen → onderdeel, and mobile is a different flow from desktop.** Flow 1b of
`Gratis Oefenen Opties.dc.html` (Claude Design), owner's instruction 2026-08-28. It replaced three
stacked grids that listed nine cards and left the visitor to work out from the headings that A2 and
B1 are the *same four onderdelen* twice.
- **`_components/FreePracticeChooser.tsx` renders both flows from one `tracks` array and one
  `selected` state.** Desktop is the tile row plus an open panel (A2 pre-selected); **mobile is two
  screens** — the 2×2 examen grid, then the onderdeel list with a back control, the other examens as
  chips and "stap 2 van 2". A second data path for the phone is how the two drift apart.
- **Both flows are in the DOM at every width**, one hidden by a media query. An e2e assertion of
  "nothing is on screen yet" must therefore use `:visible`; a plain `toHaveCount(0)` never reaches
  zero and silently tests nothing. `tests/public.spec.js` pins the flow that way.
- **Nothing is derived in the browser.** The server page resolves which onderdelen have a taster,
  which need an account and where each links; a client component re-deriving that would need the
  exam registry in the bundle and could disagree with the routes' own `generateStaticParams`.
- **A track with no `parts` is the roadmap statement** — one condition, not a second flag. That is
  ONA, drawn on the neutral ramp with a hollow ring (the homepage's "not built" vocabulary) and
  rendered as a `<div>`, never a disabled button.

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
- **The B1 taster is the exception, and deliberately so** (owner's decision, 2026-08-23).
  `lib/free-practice-b1.ts` derives ten items from **B1 Lezen oefenexamen 1** rather than authoring
  a second static set. The browser still does no query — it is a server component — but three
  things follow and are easy to forget:
  - **The page depends on that exam staying published.** `fetchExamContent` returns null for an
    unpublished exam, so unpublishing turns the taster *off* (the route `notFound()`s) rather than
    rendering an empty quiz. That is the failure mode to want.
  - **It gives away ten of that exam's thirty-five questions**, and B1 exam 1 is not free. Whether
    it should be was the open pricing decision above, and the answer turned out to be yes.
  - **It must never widen past `stimuli`.** `ExamContent` also carries `open_tasks`, including
    `model_answer` — a scoring key — and this module's return value goes straight into a client
    component. It reads only the fields the taster renders; do not spread a row.
  - **Lezen only.** Luisteren has no B1 content and no verified format; Schrijven and Spreken are
    rubric-graded, so every answer costs a model call and needs an account first — the same reason
    they have no anonymous A2 taster.
- **`/oefenen/[skill]` is A2 and `/oefenen/b1/[skill]` is B1 — the asymmetry is intentional.** The
  four A2 taster URLs are indexed and ranking; re-pathing the entry point of the funnel to
  `/oefenen/a2/[skill]` would cost a redirect hop and some equity to buy nothing a visitor can see
  (owner's decision, 2026-08-23). A2 is the unprefixed default; a level nests.
- **`FreePracticeItem` has an optional `optionD`, and it is load-bearing.** The twenty A2 items are
  all three-option, which is DUO's A2 shape; B1 Lezen is 3 *or* 4, and one of the ten items the
  taster shows has **D** as its correct answer. The engine builds its option list from
  `optionKeys(item)` for that reason — hardcoded A/B/C left that question with no selectable
  correct answer, on a page that looked entirely normal.
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


## De ingesproken uitleg van een les (02-09, proef op één les)

`b1-hoofdzin-woordorde` heeft een gesproken uitleg van 1:26 naast de lestitel. Eén les, als
proef — er is niets gebackfilld.

**De stem is `woman_older`** (`ULmkhRyAInKrnTGbI1tP`, keuze van de eigenaar), in
`lib/tts-voices.ts` als `LESSON_NARRATOR`. Apart van `NARRATOR`, die vragen en woordkaarten
voorleest: dat is neutraal materiaal waar de stem niemand hoort te zijn, en een les is precies
het tegendeel.

**Het script staat als tekstbestand in de repo**, `scripts/lesson-content/narration/<slug>.txt`,
niet als prompt en niet alleen in de database. De docent moet kunnen nakijken wát er gezegd
wordt, en een diff op een tekstbestand is de enige vorm waarin dat herhaalbaar is. Het script
van deze proef voegt **geen grammaticabewering toe** die niet in haar eigen `uitleg`-blok,
`voorbeeld`-items of `what_you_learn` staat — het leest die uit en telt de plaatsen mee.

**De opname stelt zich niet voor als Marieke.** Een synthetische stem die "ik ben Marieke" zegt
is een feitelijke bewering over een echt persoon, en die hoort van de eigenaar te komen, niet
van een script. Dat is bewust weggelaten en is een openstaande keuze.

**De rij wordt altijd `pending` geschreven**, ook bij een herhaalde run: een gewijzigd script is
niet meer wat er is goedgekeurd. `pending` speelt wél — anders kan de docent niet horen wat ze
nakijkt — en de speler draagt dan de regel "nog niet nagekeken door de docent".

**Genereren gaat via een script, niet via de route.** `/api/admin/generate-lesson-audio` heeft
geen admin-guard (CLAUDE.md §12) en spendeert credits; die gebruiken zou dat gat vergroten.

```bash
node scripts/lesson-content/generate-narration.mjs b1-hoofdzin-woordorde --dry
node scripts/lesson-content/generate-narration.mjs b1-hoofdzin-woordorde
node scripts/lesson-content/generate-narration.mjs b1-hoofdzin-woordorde --production
```

Zonder `--production` landt de audio in de **lokale** Storage en staat er een `127.0.0.1`-URL in
de database. Voor productie moet de run met `--production` opnieuw.

### De cues: welk element wordt wanneer besproken

Terwijl de opname loopt licht het element op waar de stem het over heeft, met een extra uitleg
erbij die niet in de opname zit.

**Markers in het scriptbestand, geen tekstmatching.** `[[card-0 | extra uitleg]]` op een eigen
regel; de marker gaat niet mee naar de stem, en zijn positie in de schoongemaakte tekst is
precies het tekenoffset dat de ElevenLabs-alignment in een tijdstip omzet. KNM deed dit door het
script tegen de `body_html` te matchen — 452 regels heuristiek in `lib/leren-audio-cues.ts` die
stil de verkeerde alinea koos zodra een zin twee keer voorkwam. Een marker zégt het.

Daarvoor is de endpoint `/with-timestamps` nodig in plaats van de gewone; die geeft per teken
een starttijd. Cues schatten uit het aantal woorden loopt na een halve minuut zichtbaar uit.

Geldige id's zijn de elementen die `LessonStream` van een `data-narrate` voorziet: `rule`,
`card-<n>`, `demo-<n>`, `exercises`. **Een id dat niet bestaat licht niets op en geeft geen
fout** — de generator kent de lesitems niet en kan het niet controleren.

**De extra uitleg mag niet zeggen wat de stem net zei.** Dat is de hele reden dat hij er is: de
opname legt de regel uit, de noot geeft het randgeval erbij ("plaats twee is niet het tweede
wóórd"). Hij is lescontent en valt onder dezelfde `pending` als het script.

Kosten van deze proef: 1.082 tekens ElevenLabs, `eleven_multilingual_v2`, 1,4 MB mp3, twee runs.
