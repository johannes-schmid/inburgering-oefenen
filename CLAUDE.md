# CLAUDE.md — KNM Exam Practice Website

## Project Overview
The **#1 KNM practice platform** in the Netherlands for students preparing for the **KNM (Kennis van de Nederlandse Maatschappij)** exam. Core differentiator: **gevalideerde KNM-vragen** — questions curated and validated by a certified inburgering teacher, not crowd-sourced or AI-generated.

**Target audience:** Immigrants / newcomers in the Netherlands studying for the KNM integration exam.
**Primary goal:** Rank #1 for "KNM oefenen" and convert visitors into paying students.
**Core differentiator:** Validated questions from a certified teacher + direct feedback per question.

### Revenue Model
- **Free tier:** 1 proefexamen (mock exam) — no account required. Builds trust, demonstrates question quality.
- **Professioneel Pakket (€9.95):** All 10 proefexamens + vocabulary cards (woordkaarten).
- **Compleet Pakket (€19.95):** All 10 proefexamens + vocabulary cards + question explanations + all 7 leren modules (thema's 1–7).
- **Value promise:** "Gevalideerde vragen van een gecertificeerde docent — slaag voor je KNM-examen"
- **Upsell hook:** Show upgrade CTA after free exam + after email capture. Show explanation preview to Professioneel users to upsell to Compleet.
- **Payment:** Mollie (iDEAL-first, Dutch market)

---

## Platform vs. Homepage — Critical Distinction

These are four completely separate surfaces. Never mix their layouts or components.

### Homepage (public website)
- Route group: `app/[locale]/(main)/`
- Layout: **public Nav + Footer**
- Audience: anonymous visitors, prospects, SEO traffic
- Pages: `/`, `/proefexamen`, `/oefenvragen/*`, `/blog/*`, `/docent`, `/contact`, `/premium`, guides, legal, etc.
- Purpose: convert visitors → paying students

### Platform (logged-in dashboard)
- Route group: `app/[locale]/(app)/`
- Layout: **no public Nav/Footer** — `PlatformSidebar` (desktop) + bottom tab bar (mobile)
- Audience: authenticated users with a paid plan
- Pages: `/dashboard`, `/leren/*`, `/betaling-gelukt`
- Purpose: serve learning content to paying students

### Auth pages
- Route group: `app/[locale]/(auth)/`
- Layout: **no Nav/Footer** — minimal auth shell
- Pages: `/login`, `/register`, `/activate`, `/admin-login`
- Note: `/admin-login` lives here (not in `(admin)`) to avoid redirect loop

### Admin (internal only)
- Route group: `app/[locale]/(admin)/`
- Layout: **no public Nav/Footer** — admin-only shell, auth-guarded via service-key Supabase client
- Audience: internal content editors only
- Pages: `/admin` (dashboard), `/admin/questions` (CRUD + review), `/admin/woordkaarten` (CRUD), `/admin/leren` (content editing per thema/section)
- Purpose: manage questions, vocabulary cards, and learning content
- Note: admin routes are NOT in `i18n/routing.ts` — they don't need translation

**Rule:** Does it need the sidebar? → `(app)/`. Does it need the public nav? → `(main)/`. Is it auth/register? → `(auth)/`. Is it internal content management? → `(admin)/`.

---

## Always Do First
- **Start the dev server** — run `PATH="/opt/homebrew/bin:$PATH" npm run dev` from the project root (port 3001). Use `http://localhost:3001` for all `check-ui.mjs` calls.
- **Read `LEARNINGS.md`** — apply lessons from past successes and failures before touching any code.
- **Check `COMPONENTS.md`** — before creating any new component, find an existing one that fits.
- **Check `resources/`** for questions dataset, example files, SEO plan, and reference websites before building.
- **Check `todo/`** for project plans — read at session start, save new plans there.

---

## Tech Stack
- **Framework:** Next.js 16, App Router, TypeScript (strict)
- **Styling:** Tailwind CSS v4 (`@theme` tokens in `app/globals.css`) + shadcn/ui primitives
- **Database + Auth:** Supabase (PostgreSQL, RLS, Supabase Auth)
- **Payments:** Mollie (iDEAL-first)
- **Email:** Resend (transactional + campaign drip)
- **Hosting:** Vercel (serverless functions, ISR, Cron)
- **i18n:** next-intl (nl/en/ar; `routing.ts` defines all translated pathnames)
- **Data grids (admin):** ReUI `@reui/c-data-grid-23` (registered in `components.json`)
- **Testing:** Playwright (48 tests, localhost:3001)
- **Analytics:** Google Analytics 4 + Mixpanel

---

## File Structure

```
knm-website/
├── app/                            # Next.js App Router
│   ├── [locale]/
│   │   ├── (main)/                 # Public website (Nav + Footer)
│   │   │   ├── page.tsx            # Homepage
│   │   │   ├── proefexamen/        # Mock exam engine (10 exams)
│   │   │   ├── oefenvragen/        # Topic quiz pages (7 topics)
│   │   │   ├── blog/               # Blog (nl/en/ar)
│   │   │   ├── premium/            # Pricing page
│   │   │   ├── docent/             # Teacher profile
│   │   │   ├── contact/            # Contact form
│   │   │   └── ...                 # Legal, guides, etc.
│   │   ├── (app)/                  # Platform — no public Nav/Footer
│   │   │   ├── dashboard/          # 6-view dashboard (exams, leren, vocab, profile)
│   │   │   ├── leren/[slug]/       # Dynamic thema learning pages
│   │   │   └── betaling-gelukt/    # Payment success (logged-in flow)
│   │   ├── (auth)/                 # Auth pages — no Nav/Footer
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── activate/
│   │   │   └── admin-login/        # Admin login (here to avoid redirect loop)
│   │   └── (admin)/                # Admin — no public Nav/Footer, service-key auth guard
│   │       ├── page.tsx            # Admin dashboard (charts)
│   │       ├── questions/          # Questions list + new + [id]/edit
│   │       ├── woordkaarten/       # Vocab cards list + new + [id]/edit
│   │       └── leren/              # Leren content editor (thema → section)
│   ├── api/                        # Serverless API route handlers (TypeScript)
│   │   ├── mollie-checkout/        # Creates Mollie payment session
│   │   ├── mollie-webhook/         # Handles payment callbacks
│   │   ├── payment-status/         # Polls payment status
│   │   ├── submit-results/         # Saves exam results + queues email
│   │   ├── claim-submissions/      # Links anon submissions to account
│   │   ├── send-campaign-emails/   # Vercel Cron — daily 9am UTC
│   │   ├── unsubscribe/            # Email unsubscribe
│   │   ├── contact-submit/         # Contact form via Resend
│   │   ├── admin-revalidate/       # ISR revalidation on admin content save
│   │   ├── generate-question-audio/ # TTS audio generation for questions
│   │   ├── pexels-search/          # Searches Pexels for images
│   │   ├── pexels-query/           # Fetches specific Pexels image
│   │   └── upload-pexels-image/    # Uploads Pexels image to Supabase Storage
│   ├── sitemap.ts                  # Dynamic XML sitemap
│   ├── globals.css                 # Tailwind v4 @theme brand tokens + shared classes
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Root redirect → /nl
│
├── components/                     # Shared React components (see COMPONENTS.md)
│   ├── Nav.tsx / Footer.tsx        # Public nav + footer (main only)
│   ├── site/                       # Marketing components (GradientHero, SectionHeader, etc.)
│   ├── ui/                         # shadcn primitives (Button, Input, etc.)
│   ├── reui/                       # ReUI data-grid suite (admin tables)
│   └── leren/                      # Learning-specific components (SectionContent, StepTimeline)
│
├── data/                           # Static TypeScript data
│   ├── questions.ts                # 450+ validated KNM questions (fallback; DB is primary)
│   ├── woordkaarten.ts             # Vocabulary flashcards (NL/EN/AR)
│   ├── exam-assignments.ts         # Legacy exam→question mapping (DB is now primary)
│   ├── blog-posts.ts               # Blog content (all locales)
│   ├── oefenvragen-topics.ts       # 7 topic definitions
│   └── leren/                      # Thema 1–7 content + types
│
├── lib/                            # Utilities
│   ├── questions.ts                # fetchAllQuestions() — DB-first, static fallback
│   ├── api-constants.ts            # Typed API config (products, prices, endpoints)
│   ├── pexels-query.ts             # Pexels API helpers
│   ├── supabase/client.ts          # Browser Supabase client
│   ├── supabase/server.ts          # SSR Supabase client (cookies)
│   ├── supabase/admin.ts           # Service-key admin client
│   └── utils.ts                    # cn(), clsx helpers
│
├── i18n/                           # next-intl config
│   ├── routing.ts                  # Locales (nl/en/ar), pathnames (no admin routes here)
│   ├── navigation.ts               # Typed Link, useRouter
│   └── request.ts                  # getMessages() server-side
│
├── messages/                       # Translation files (JSON)
│   └── nl.json / en.json / ar.json
│
├── public/                         # Static assets
│   ├── robots.txt / favicon.svg / favicon-32x32.png
│   └── images/                     # hero.webp, marieke-schipper.jpg
│
├── resources/                      # Reference material — NOT deployed
├── supabase/                       # DB migrations + seed SQL
├── scripts/                        # Content-ops utilities — NOT deployed
├── tests/                          # Playwright e2e tests (target localhost:3001)
│   ├── e2e.spec.js
│   └── scenarios.spec.js
│
├── next.config.ts                  # Redirects, i18n plugin, cron config
├── tsconfig.json                   # TypeScript strict, @/* alias
├── components.json                 # shadcn + ReUI registry config
├── package.json
├── playwright.config.js            # Tests target http://localhost:3001
├── check-ui.mjs                    # Puppeteer screenshot checker (mobile + desktop)
├── COMPONENTS.md                   # Component registry — check before creating new components
├── LEARNINGS.md                    # Session log — read at start, append after changes
├── CLAUDE.md                       # This file
├── .env.local                      # Secrets — not committed
└── .env.example                    # Env var template
```

---

## Dashboard Architecture — Shadow Copies Warning

The dashboard (`/dashboard`) is a **client-side SPA** — all views (Leren, Proefexamens, Woordkaarten, Profiel) are rendered via `useState` inside a single page. The URL never changes. This means:

- `app/[locale]/(app)/dashboard/components/` contains its **own implementations** of features that also exist as standalone routes
- Fixing a shared component (e.g. `SectionContent`) does NOT automatically fix the dashboard — you must also update the matching `dashboard/components/` file

**Always check both surfaces when touching any feature:**

| Feature | Standalone route | Dashboard component |
|---|---|---|
| Leren thema content | `(app)/leren/[slug]/page.tsx` | `dashboard/components/LerenThemaView.tsx` |
| Proefexamens | `(main)/proefexamen/` | `dashboard/components/ExamsView.tsx` |
| Woordkaarten | *(none)* | `dashboard/components/WoordkaartenView.tsx` |

**For new dashboard features:** build as a real nested route (`/dashboard/feature/`) with a shared layout, not a new `*View.tsx` inside the dashboard SPA. The sidebar is a layout component and stays mounted across route changes — there's no reason to use client state for navigation.

---

## Component Registry
**Before creating any new component, check `COMPONENTS.md` for an existing one that fits.**
Reuse always beats creating new. If you build something reusable, add it to `COMPONENTS.md`.

---

## Reference Style
- A reference/example website screenshot is in `resources/`. Match its visual style, layout rhythm, and color feel exactly.
- Swap in KNM-specific content. Do not add sections or design elements not in the reference.

---

## Local Server
- **Always serve on localhost** — never screenshot a `file:///` URL.
- Start the dev server: `PATH="/opt/homebrew/bin:$PATH" npm run dev` (runs `next dev -p 3001`). Always on port **3001**.
- If the server is already running, do not start a second instance.

---

## UI Verification with Puppeteer (MANDATORY after every UI change)

After **any change that affects the visual interface**, you must:

1. Ensure the dev server is running on port 3001.
2. Run the UI checker: `node check-ui.mjs http://localhost:3001/<path> <label>`
   Captures both **mobile (390px)** and **desktop (1440px)** full-page screenshots.
3. **Read both screenshots** — look for layout bugs, broken spacing, text overflow, missing elements.
4. **Fix any issues found** immediately.
5. Re-run `check-ui.mjs` after fixes to confirm.

**Never declare a UI task done without completing this loop.**

---

## Brand Assets
- Brand tokens (colors, fonts, shadows) live in `app/globals.css` under the `@theme` block.
- Reference images: `public/images/` (hero.webp, marieke-schipper.jpg).

---

## Anti-Generic Guardrails

- **Colors:** Never use default Tailwind palette (indigo-500, blue-600, etc.). Use brand tokens from `globals.css`.
- **Shadows:** Never flat `shadow-md`. Use layered, color-tinted shadows with low opacity.
- **Typography:** Never the same font for headings and body. Apply tight tracking (`-0.03em`) on large headings, generous line-height (`1.7`) on body.
- **Gradients:** Layer multiple radial gradients. Add grain/texture via SVG noise filter for depth.
- **Animations:** Only animate `transform` and `opacity`. Never `transition-all`. Use spring-style easing.
- **Interactive states:** Every clickable element needs hover, focus-visible, and active states. No exceptions.
- **Images:** Add gradient overlay (`bg-gradient-to-t from-black/60`) and color treatment with `mix-blend-multiply`.
- **Spacing:** Intentional, consistent spacing tokens — not random Tailwind steps.
- **Depth:** Layering system (base → elevated → floating) — surfaces should not all sit on the same z-plane.

---

## Learning Loop

After **every session where you made a change**, append an entry to `LEARNINGS.md`. No exceptions.

### Format
```
## [DATE] — [short title]

**Changed:** One sentence on what was modified and in which file(s).
**Outcome:** `SUCCESS` or `FAILURE`
**What worked / What went wrong:** Concrete description.
**Lesson:** The generalizable rule to apply next time.
```

### Rules
- Write the entry **before ending the session**.
- If a fix required multiple attempts, log each failed attempt separately.
- At the **start** of every session, re-read `LEARNINGS.md` and apply lessons proactively.

---

## Pre-commit Test Gate
**Before committing ANY code change, always run the Playwright test suite.**

```bash
PATH="/opt/homebrew/bin:$PATH" npm run test:e2e    # pass/fail per test
PATH="/opt/homebrew/bin:$PATH" npm run test:open   # opens HTML report
```

- **Do not commit if any test is red.** Fix the test or the code first.
- Test files: `tests/e2e.spec.js` (smoke) and `tests/scenarios.spec.js` (48 tests)
- Auth-gated tests use `mockAuth()` — intercepts Supabase CDN + fakes session
- Locale is `nl-NL` in `playwright.config.js` — prevents i18n redirect to `/en/`
- `next build` is the only check that compiles auth-gated `(admin)` routes — run it when touching admin code

### Test coverage map
| Scenario | File | Key assertion |
|---|---|---|
| Homepage + free exam 1 | scenarios.spec.js | exam loads, questions visible |
| All 10 exams unlocked (premium) | scenarios.spec.js | 0 `.exam-card.locked` |
| 7 oefenvragen topic pages | scenarios.spec.js | quiz visible + 6 cross-links each |
| Leren locked for premium | scenarios.spec.js | themas 2–7 link to `/activate?upgrade=plus` |
| Leren unlocked for premium_plus | scenarios.spec.js | all 7 link to `/leren/thema-*` |
| Upgrade CTA (premium → plus) | scenarios.spec.js | upsell link + activate page |
| Exam 5 (random premium exam) | scenarios.spec.js | title has "5", questions render |
| Vocab cards flip + mark | scenarios.spec.js | `#wk-card-inner.flipped` + action btns |
| Logout → re-login premium | scenarios.spec.js | no locked cards after re-login |
| Free → Compleet upgrade | scenarios.spec.js | activate page + Compleet btn |

---

## Hard Rules
- Before creating a new component, check `COMPONENTS.md` — reuse what exists
- Do not use `transition-all`
- Do not use default Tailwind blue/indigo as primary color
- Do not show results before the email/upsell step is completed
- Always show a paid upgrade CTA at the post-quiz gate
- Pricing must be concrete (real number in €), not vague ("from X")
- Payment trust badges (iDEAL logo, card logos) must appear near every checkout CTA
- Never use a `<br>` inside an `<h1>` that splits a sentence mid-thought
- Meta description must be unique, specific, and 140–160 characters
- **i18n required on every feature:** After adding any user-facing string, add the key to `messages/nl.json`, `en.json`, and `ar.json`. Exceptions: questions (always Dutch) and leren content body text.
- Admin routes do NOT need i18n keys in `routing.ts`
- Questions are read from Supabase (primary); `data/questions.ts` is the static fallback only

---

## SEO

All SEO planning lives in `seo/`:
- `seo/keywords.md` — master keyword list + blog clusters; **add new keywords here**
- `seo/blog-ideas.md` — blog post backlog (keyword → post → status)
- `seo/strategy.md` — full strategy (competitive analysis, schema, E-E-A-T, KPIs)
- `seo/guardrails.md` — per-page SEO checklist; run on every new or migrated page

**Current position:** `KNM oefenen` at ~11 (close to page 1)
**Title format:** `KNM Oefenen — Gevalideerde KNM-oefenvragen van een gecertificeerde docent`
**Meta description:** mention "gevalideerde", "gecertificeerde docent", "directe feedback"
**H1:** must contain "KNM-oefenvragen" and "gecertificeerde docent" naturally
**#1 ranking blocker:** backlinks — outreach to inburgering Facebook groups + Dutch integration orgs
**Blog posts:** use `/blog-post` skill — enforces keyword clusters, on-page SEO, voice/tone, competitor analysis
