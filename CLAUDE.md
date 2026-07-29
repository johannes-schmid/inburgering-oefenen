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
`bbgrsfcevbavgsmnqjrd` · **Inburgering Oefenen** · Central EU (Frankfurt) · linked, and the
baseline is recorded as applied in its migration history. Vercel project
`inburgering-oefenen` (`prj_94BtwDjLI3WNdPeGESCLTZKdtRl9`) serves www.inburgeringoefenen.nl
and already has the three Supabase vars from the Supabase↔Vercel integration.

`.env.local` targets the hosted project; **`.env.development.local` targets the local stack and
takes precedence in dev**, so `npm run dev` cannot write to production. Keep it that way.

Two live mismatches worth knowing:
- **Local Postgres is 15, hosted is 17.** `supabase link` warns about it. Aligning means
  `major_version = 17` in `config.toml` plus recreating the local volume, so local dev currently
  tests against a different major version than production.
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

**Schema lives in exactly one file:** `supabase/migrations/20260729000000_a2_baseline.sql`.
The 26 inherited KNM migrations are archived in `supabase/legacy-knm-migrations/` and are
**not** applied — that chain could not be replayed on an empty database at all, because one
migration backfills from an `exam_results` table no migration ever created. See the README
there. Add real migrations *after* the baseline; never edit it once it has run on production.

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

**10 practice exams per skill = 40 exams.** All four must stay visible on the landing page.
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

### Revenue model
- **Free:** exam 1 of every skill, plus a 10-question taster per skill (no account).
- **Professioneel €9,95:** all 40 exams, score per skill and per question type.
- **Compleet €19,95:** + per-question explanations + rubric feedback on Schrijven/Spreken.
- Payments via **Mollie** (iDEAL-first). One-off, lifetime access, no subscription.

---

## The four surfaces — never mix their layouts

| Surface | Route group | Layout | Audience |
|---|---|---|---|
| **Homepage / marketing** | `app/[locale]/(main)/` | public `Nav` + `Footer` | anonymous, SEO |
| **Platform** | `app/[locale]/(app)/` | `PlatformSidebar` + mobile tabs, no public nav | paying users |
| **Auth** | `app/[locale]/(auth)/` | minimal shell | login/register/activate |
| **Admin** | `app/[locale]/(admin)/` | admin shell, `admin_users` allowlist guard | internal only |

**Rule:** needs the sidebar → `(app)`. Needs the public nav → `(main)`. Auth → `(auth)`.
Internal content management → `(admin)`.
`/admin-login` lives in `(auth)`, not `(admin)`, to avoid a redirect loop.
Admin routes are **not** in `i18n/routing.ts` and need no translations.

---

## Funnel — how a visitor becomes a customer

```
/                          hero + four skill cards
  └─ CTA "Start gratis oefenexamen" → /oefenen
       /oefenen                    pick a skill (Lezen/Luisteren live; Schrijven/Spreken "Binnenkort")
         └─ /oefenen/[skill]       10-question taster, static content, no DB
              ├─ per-question explanation revealed inline
              ├─ EMAIL GATE — score withheld until submitted (skip link provided)
              └─ results → CTA to /oefenexamen/[skill]
/oefenexamen/[skill]       10 exam slots; exam 1 free, rest locked → /premium
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
- **Playwright** e2e (targets localhost:3001), **Puppeteer** via `check-ui.mjs`

---

## Directory map

```
├── app/
│   ├── [locale]/
│   │   ├── (main)/                     # public site
│   │   │   ├── page.tsx                # homepage — four skill cards
│   │   │   ├── oefenen/                # free funnel: picker
│   │   │   │   └── [skill]/            #   10-question taster + FreePracticeEngine
│   │   │   ├── oefenexamen/[skill]/    # 10 exam slots per skill
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
   `/oefenexamen/[skill]`. The blog takes explanatory queries only.
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

## Dashboard shadow copies — recurring trap

`/dashboard` is a **client-side SPA**: every view renders via `useState` inside one page and
the URL never changes. `app/[locale]/(app)/dashboard/components/` therefore holds its **own
implementations** of features that also exist as standalone routes. Fixing the shared
component does **not** fix the dashboard.

| Feature | Standalone route | Dashboard copy |
|---|---|---|
| Leren thema | `(app)/leren/[slug]/page.tsx` | `dashboard/components/LerenThemaView.tsx` |
| Exams | `(main)/oefenexamen/` | `dashboard/components/ExamsView.tsx` |
| Woordkaarten | *(none)* | `dashboard/components/WoordkaartenView.tsx` |

**For new dashboard features:** build a real nested route (`/dashboard/feature/`) with a
shared layout. The sidebar is a layout component and stays mounted across navigations —
there is no reason to use client state for routing.

---

## Verification — required after every change

1. `npx tsc --noEmit`
2. `PATH="/opt/homebrew/bin:$PATH" npx next build` — the **only** thing that compiles the
   auth-gated `(admin)` routes. Run it whenever you touch admin.
3. **UI changes:** `node check-ui.mjs http://localhost:3001/<path> <label>` → writes mobile
   (390px) + desktop (1440px) full-page shots to `temporary_screenshots/`. **Read both**,
   fix what you find, re-run. Never declare a UI task done without this loop.
4. **Schema changes:** query the table afterwards to confirm it landed.
5. **Deploys:** curl the live URL.

Report the actual output. Don't declare done without running these.

### Pre-commit test gate
```bash
PATH="/opt/homebrew/bin:$PATH" npm run test:e2e     # pass/fail per test
PATH="/opt/homebrew/bin:$PATH" npm run test:open    # HTML report
```
Locale is `nl-NL` in `playwright.config.js` — prevents the i18n redirect to `/en/`.
Auth-gated tests use `mockAuth()` (intercepts the Supabase CDN + fakes a session).

**Current state: the suite is KNM-shaped and partly red.** The failures are the deliberately
emptied content areas (oefenvragen topics, blog, leren thema) and the redesigned homepage
CTA selector. Rewriting it per skill is outstanding work — until then, check that your
change didn't break anything *else*, and don't treat green as achievable yet.

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
- **Phase 3 — exam engine.** Split `ProefexamenEngine.tsx` (820 lines, hard-wired to 3-option
  MCQ) into `ExamShell` + four item renderers. It must render a **stimulus shared by 1..N
  questions** (the pane must not remount when advancing within a stimulus, or Luisteren audio
  restarts), **3 or 4 options**, and `option_layout = image | image_grid` as thumbnails. Read
  `duration_seconds` and `pass_threshold_pct` from the exam row instead of the two module
  constants.
- **Phase 4 — admin. ⚠ THE QUESTION EDITOR CANNOT SAVE RIGHT NOW.** `QuestionForm`,
  `QuestionsTable` and `ExamsGrid` still write `category` / `exam` / `option_a..c`, which the
  new schema does not have, so saving shows *"column category does not exist"*. It fails
  loudly rather than corrupting anything, but it is broken until this phase lands:
  a stimulus picker, a repeatable option editor with per-option image upload, and exam
  assignment through `stimuli.exam_id` rather than a `questions.exam` integer. Reads already
  work — they go through the `questions_flat` view.
  Also in this phase: skill switch, `admin/opgaven` for `open_tasks`, four-tab exam builder,
  two-voice stimulus audio (`/v1/text-to-dialogue`, reading `stimuli.voice_cast`) + a bulk
  generator, and a publish button wired to `exam_publish_issues(exam_id)` — which replaces
  `ExamsGrid`'s hardcoded "40 questions / 7 KNM categories" warnings.
- **Phase 5 — rubric grading.** `/api/grade-open` via AI Gateway, `/api/transcribe` for
  Spreken, `/admin/beoordeling` with the docent's correction → few-shot → eval loop.
- **Phase 6 — seed** exam 1 of each skill. **Phase 7 —** rewrite the test suite.

### Known carried-over issues
- `proefexamen/page.tsx` paywall reads `user_metadata.tier` while the payment routes write
  `user_metadata.plan` — a paid user gets bounced to `/activate`. Standardise on `plan`.
- `submit-results` never writes `exam_number` despite `UNIQUE(email, exam_number)`.
- `exam_results` and `exam_submissions` coexist unreconciled; a migration dropped the former
  but its header says it never reached prod, and the dashboard still reads it.
- `ProefexamenEngine` ships **all** questions to the browser instead of filtering by exam.
- Two different `PASS_THRESHOLD_PCT` values (engine 0.7 vs `api-constants` 60).
- Legal pages (voorwaarden, privacy, terugbetaling) still describe the KNM product.
- Domain is a placeholder: `inburgeringoefenen.nl`. The Instagram link points at a handle
  that may not exist.
- **The KNM service key was exposed to browsers** via `next.config.ts` before the fork
  (`NEXT_PUBLIC_SUPABASE_ANON_KEY` was mapped from `SUPABASE_SERVICE_KEY`). Fixed here —
  but that key must be rotated.
