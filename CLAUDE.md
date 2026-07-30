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
              └─ results → CTA to /oefenexamen/[skill]
/oefenexamen/[skill]       PUBLIC overview — 10 exam slots, the SEO + funnel surface
  └─ /oefenexamen/[skill]/[n]  THE PLAYER — lives in (app), login required
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

## The study portal — real routes, four onderdelen

Rebuilt 2026-07-30 around the product's actual shape: **four onderdelen, ten oefenexamens
behind each.** The KNM SPA is gone — `/dashboard` was one client page holding every view in
`useState`, so the URL never changed, a skill was not linkable and back left the portal.

| Route | What it is |
|---|---|
| `(app)/dashboard/page.tsx` | overview — four skill cards, ten-segment progress strip each |
| `(app)/dashboard/[skill]/page.tsx` | the ten oefenexamens of one onderdeel |
| `(app)/dashboard/profiel/page.tsx` | account + per-onderdeel totals |
| `(app)/oefenexamen/[skill]/[number]` | the player (`components/exam/ExamShell.tsx`) |

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

**Rubric keying needs no migration.** `rubrics.task_type` is free text. Schrijven uses `task_type`
(`email`, `short_text`, `form`, `picture_note`); Spreken has one task_type but four onderdelen with
different image rules, so it is keyed by `image_usage` → `speaking_none` / `speaking_describe` /
`speaking_choose` / `speaking_cover_all`. `rubricCategory()` is the only place that convention
lives. Eight rubrics cover all 20 open exams.

**Editing a rubric that has graded someone mints version + 1.** `open_criterion_scores.rubric_version`
is what makes a stored score interpretable later; rewriting v1 in place changes the meaning of every
grade already recorded against it. The decider is `used_count` from `open_criterion_scores`, **not**
`active` — a deactivated rubric can still have graded hundreds. `rubrics_one_active_idx` is
`UNIQUE (skill, task_type) WHERE active`, so activating v2 must deactivate v1 **first**.

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
