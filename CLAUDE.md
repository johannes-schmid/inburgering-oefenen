# CLAUDE.md — Inburgering Oefenen (A2)

## Dev server (always use this)
```bash
PATH="/opt/homebrew/bin:$PATH" npm run dev     # next dev -p 3001, hot reload
```
Always **port 3001**. If it's already running, don't start a second instance.
All `check-ui.mjs` calls target `http://localhost:3001`.

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
├── public/audio/free-practice/         # 10 committed taster mp3s (2.5MB)
├── resources/exam-references/A2/       # official DUO examples — REFERENCE ONLY, see below
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

| Key | Voice | Gender |
|---|---|---|
| `roos` | Roos | female |
| `ruth` | Ruth | female |
| `eric` | Eric | male |
| `ido` | Ido | male |

- Single-narrator surfaces (question read-aloud, lesson audio, woordkaarten) use `NARRATOR`.
- Dialogues / conversations use `DIALOGUE_VOICES` — speaker A and B must be **different
  voices**, and consistent within one exam so the listener can follow who is speaking.
- Need more than two speakers, or variety across exams? Pick further keys from the table.
  Do not add a fifth voice without the owner's approval.

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
- **Phase 2 — data model.** Needs a **new Supabase project**. Tables: `exams`, reworked
  `questions` (skill, exam_id, stimulus_html/script, sub_skill), `open_tasks`, `rubrics`,
  `open_submissions`, `grading_examples`.
- **Phase 3 — exam engine.** Split `ProefexamenEngine.tsx` (820 lines, hard-wired to 3-option
  MCQ) into `ExamShell` + four item renderers.
- **Phase 4 — admin.** Skill switch, stimulus editor, `admin/opgaven`, four-tab exam builder,
  two-voice stimulus audio + bulk generator.
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
