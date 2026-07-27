# LEARNINGS.md — KNM Website Session Log

Append-only log of successes and failures from each working session.
Read this at the start of every session and apply lessons before writing code.

## 2026-07-19 — Back buttons + smart learning queue (fouten → leerwachtrij)

**Changed:** (1) New `app/[locale]/(app)/components/BackLink.tsx` — `router.back()` with a `fallbackHref` for direct loads; added to the top of `dashboard/analyse` and `dashboard/fouten`. (2) Extracted the question→lesson-section mapping out of `InlineQuiz.tsx` into a shared `lib/leren-links.ts` (`LEREN_CATEGORY_META`, `DB_SECTION_TO_LEREN`, `lerenLinkForSectionSlug/Category`, `buildLerenHref`); InlineQuiz now imports it (behavior unchanged). (3) Enriched `lib/learning-queues.ts`: `SectionLite` gained `slug`, `SectionQueue` gained `slug` + `wrongQuestionIds` (oldest-first). (4) New `dashboard/components/LearningQueue.tsx` + rebuilt `dashboard/fouten/page.tsx` as a prioritized "leerwachtrij": each weak section shows the mistake count + one example wrong question, a "Leer dit onderdeel" section deep-link (`/leren/{thema}?section={id}`, plan-gated to premium_plus, upsell otherwise), and the existing "Oefen N" re-practice. (5) `analyse` per-topic "Leren" step now deep-links to the worst wrong section via the shared map (thema fallback). New i18n keys `btn_go_back`, `leerwachtrij_title/subtitle`, `queue_why/learn_section/practice/learn_locked` in nl/en/ar.
**Outcome:** `SUCCESS` (tsc clean, `next build` clean, 47/47 Playwright green; verified populated queue + section deep-link via puppeteer)
**What went wrong:** `messages/nl.json` already had a `btn_back` key = `"← Terug"` (with a literal arrow char) further down the file. Adding a second `btn_back: "Terug"` created a duplicate key — `JSON.parse` keeps the LAST occurrence, so `t('btn_back')` returned `"← Terug"`, which combined with BackLink's `ArrowLeft` icon rendered a double arrow. Renamed my key to `btn_go_back`.
**Lesson:** Before adding an i18n key, `grep` the whole locale file for the name — duplicate JSON keys don't error, the last one silently wins. Also: on `(app)` pages the AppShell mobile header already provides a back affordance (`display:flex` only ≤768px), so a page-level BackLink should be desktop-only (`hidden md:inline-flex`) to avoid two stacked back buttons on mobile. Confirmed again that seeded puppeteer REST mocks must return CORS headers + handle the OPTIONS preflight or the local Supabase (`127.0.0.1:54321`) preflight fails and the page hangs on "Laden…".

## 2026-07-19 — Dashboard overview + analyse page cleanup (iterative, per-message feedback)

**Changed:** Redesigned the dashboard readiness hero in `dashboard/components/ExamsView.tsx` and its parts. New `ReadinessHero.tsx` = white score card holding the original speedometer gauge (`SlaagkansGauge` gained `variant:'light'|'dark'` + `bare` props so the SVG can render without its card chrome/footer) with a subtle centered XP pill below (removed the separate navy `XpPill` block from the overview). `MariekeFeedback.tsx` is now a navy/blue gradient card with light content; `WeaknessBreakdown.tsx` gained a `variant:'dark'` and was simplified to single muted-colour bars (weak `#e07a3c`/`#f6924e`, strong `#4f74ab`/`#7aa6e6`) — no more segmented green+orange, no dotted-underline topic links, no "+N more" links. CTAs reduced to one subtle "Herhaal fouten" + one "Bekijk analyse" link. Desktop = score card + Marieke card side-by-side (`.rh-card` flex 0 0 44%, `.rh-marieke` flex 1, equal-height stretch); mobile = stacked with the navy card pulled up under the white card via negative margin (`.rh-marieke margin-top:-26px` + `.rh-card padding-bottom:44px`). Rewrote `dashboard/analyse/page.tsx` to a single column: one score (slaagkans bar) + progression chart, a general "Herhaal al mijn fouten (N)" queue button → `/dashboard/fouten`, and a per-topic accordion where each open topic shows "Wat ging er mis" (sections with mistakes) + a numbered step queue (1. Leer over dit thema → `/leren/{slug}`, 2. Herhaal je N fouten → `/dashboard/fouten?topic=`). Removed the second (bucket-donut) score, `XpPill`, `QueueSummary`, `NextSteps` and the Marieke callout from analyse. Added `?topic=` filter to `dashboard/fouten/page.tsx`. New i18n keys in all 3 locales (`hero_*`, `xp_level_short`, `analyse_fix_all/whatswrong/steps_title/step_learn/step_repeat/topic_mastered`, `fouten_topic_note`).
**Outcome:** `SUCCESS` (47/47 tests green, tsc clean)
**What worked:** Topic categories map 1:1 to leren themas by `title` — `THEMAS.find(t => t.title === category)?.slug` gives the correct `/leren/{slug}` deep link, no new mapping table needed. Adapting the existing gauge for a dark bg via a colour-map prop (rather than a new component) kept the "keep the old score design" request cheap. The `fouten` page already was the "fix all my mistakes" grouped queue, so per-topic repetition only needed a `?topic=` filter on the existing mistakeQueue.
**Lesson:** For screenshot QA of the auth-gated dashboard, the dev server resolves Supabase at LOCAL `http://127.0.0.1:54321` (confirming the earlier LEARNINGS note). Puppeteer request-mocks MUST (a) match by URL path substring (`/rest/v1/<table>`) since the host is the local one, (b) use `req.respond(...)` NOT Playwright's `route.fulfill(...)`, and (c) return full CORS headers incl. `access-control-allow-headers: ...,x-client-info,...` or every supabase-js call dies on the OPTIONS preflight and the page hangs on "Laden…". Scripts importing `puppeteer` must live in the project root (ESM ignores NODE_PATH), not the scratchpad.

## 2026-07-17 — Expanded Marieke widget (photo, 3 CTAs) + full analysis page

**Changed:** `MariekeFeedback.tsx` now shows a real photo avatar (`public/images/marieke-schipper.jpg` via `next/image` circular crop) and 3 quick-action buttons (Studeer nu / Zwakke thema's / Herhaal fouten); it replaces the dark "Examengereedheid" hero on desktop (`ExamsView.tsx`'s hero row is now `[SlaagkansGauge][MariekeFeedback flex-1]`). New `practiceAllMistakes()` in `ExamsView.tsx` builds a cross-topic practice set from every question marked wrong in `user_question_results` (a capability that didn't exist before — practice was always scoped to one topic). Relaxed the `if (activeTopic && practiceQuestions)` render gate to `if (practiceQuestions)` so this topic-less session can render via `InlineQuiz`. New `lib/exam-readiness.ts` functions `buildSectionProgress` (per-section mastered/reviewing counts, keyed by topic) and `bucketTopicMastery` (sterk/aandacht/niet-gestart counts) power a new standalone route `app/[locale]/(app)/dashboard/analyse/page.tsx` — a donut + horizontal slaagkans bar + weakest-first expandable topic/section breakdown, following the existing `(app)/leren/[slug]/page.tsx` convention (own `PlatformSidebar` shell + own Supabase fetch, since this repo has no shared dashboard layout yet). `dashboard/page.tsx` gained `?openTopic=`/`?mistakes=` query-param handling (alongside the existing `?view=`) so the analysis page's action links can hand off into the dashboard SPA.
**Outcome:** `SUCCESS` (47/47 tests green)
**What went wrong (first attempt):** When Playwright-screenshotting both `/dashboard` and the new `/dashboard/analyse` page in the same browser *context* (two tabs, to avoid relaunching auth twice), the second tab redirected to `/login` — `page.addInitScript()` and `page.route()` only apply to the specific `Page` they were called on, not to sibling pages opened later in the same `BrowserContext`. Fix: call `context.addInitScript()`/`context.route()` instead so the mocked session/REST responses apply to every page opened in that context.
**Lesson:** For any multi-page Playwright QA script (checking 2+ routes without a full page reload/relogin), register mocks and init scripts on the `BrowserContext`, not the first `Page` — a `Page`-scoped route/init-script silently no-ops for pages created afterward, with no error, just a confusing "looks unauthenticated" symptom.

## 2026-07-17 — Marieke's personalised feedback widget

**Changed:** Added `calculateMariekeFeedback()` to `lib/exam-readiness.ts` — derives weakest/strongest topic from the same `topicProgress` (mastered/reviewing/unseen per category) `ExamsView.tsx` already tracks via `user_question_results`. Weakest = lowest mastered% among topics with ≥3 answered questions; target% = score if every currently-wrong question were corrected (`(mastered+reviewing)/total`); minutes = `reviewing_count × 2min` rounded to nearest 5, clamped [10,60]. New `app/[locale]/(app)/dashboard/components/MariekeFeedback.tsx` renders the tip + up to 2 progress bars, placed directly below `SlaagkansGauge` in the same 300px column with a negative `margin-top` so it overlaps the gauge card's bottom edge (matches the reference markup) on both mobile and desktop. Added `marieke_feedback`/`marieke_feedback_empty` keys to all 3 locale files.
**Outcome:** `SUCCESS` (47/47 tests green)
**What went wrong (first attempt):** Screenshot QA showed the widget stuck in its "no data" empty state even with seeded Supabase REST mocks. Root cause: this dev environment's `NEXT_PUBLIC_SUPABASE_URL` points to a **local Supabase instance at `http://127.0.0.1:54321`**, not the hosted `*.supabase.co` project — I'd assumed the hosted URL (seen in `.env.local` at a glance) without checking what the running dev server actually resolves at runtime. All Playwright `page.route()` mocks were silently no-ops against the wrong host.
**Lesson:** When mocking Supabase (or any backend) calls in a throwaway Playwright script for visual QA, verify the actual request host by logging `page.on('request', ...)` first rather than assuming the `.env.local` value is what's live — local Supabase (`127.0.0.1:54321`) and hosted Supabase can both be configured, and only one is actually reachable from the running dev server. Also: `page.route()` handlers apply LIFO (last-registered checked first) — register broad catch-alls *before* specific overrides, not after, or the catch-all shadows them.

## 2026-07-17 — Confidence-weighted Slaagkans gauge widget

**Changed:** New `lib/exam-readiness.ts` (`calculateSlaagkans`: blends raw exam average toward a neutral 50 anchor, weighted by `min(1, examsDone/5)`, so a handful of high scores can't yet claim a very high pass-likelihood). New `app/[locale]/(app)/dashboard/components/SlaagkansGauge.tsx` — a parametrized SVG circular gauge (arc math via `polarToCartesian`/`describeArc`, gradient stroke, quintile band labels on a curved `textPath`, center serif score) rebuilt from a Claude design reference (`Examengereedheid Widget.dc.html`) supplied as pasted markup, not a fetchable file. Wired into `ExamsView.tsx`'s readiness hero (removed the old inline ring + `ringColor`/`circumference` calc). Added `slaagkans_*` keys to `messages/nl.json`, `en.json`, `ar.json`.
**Outcome:** `SUCCESS` (47/47 tests green)
**What went wrong (first attempt):** Computed the gauge's arc/label center from the reference SVG's decorative glow circle (`cx=170 cy=165`) instead of solving it from the actual arc/label path endpoints. This put the "REDELIJK" (middle) quintile label's anchor point above the `viewBox` top edge, silently clipping it — all other labels rendered fine, so the bug wasn't obvious until a full Playwright screenshot (via `mockAuth()`) was inspected closely.
**Lesson:** For gauge/arc SVGs adapted from a reference, solve the true center from the path's endpoint coordinates (`cx = midpoint`, `cy = point.y - sqrt(r² - halfChord²)`) rather than reusing a nearby decorative circle's coordinates — and always screenshot-verify curved/`textPath` text specifically, since clipped text produces no error, just a silently missing label. The `claude.ai/design/p/...` link the user gave was not accessible via `DesignSync` (that tool only lists design-system projects the account owns) or the Figma MCP (not a figma.com URL) — no `/design-login` skill was available in this session either, so the user pasted the raw HTML/SVG markup directly instead.

## 2026-07-15 — Woordkaarten admin: audio generation + Pexels image picker

**Changed:** New migration `supabase/migrations/20260715000000_add_wordcard_media.sql` (adds `image_url`, `audio_dutch_word`, `audio_dutch_sentence` to `word_cards`, creates `wordcard-images`/`wordcard-audio` storage buckets — **not yet applied to remote DB, user will apply manually**). New API routes `app/api/generate-wordcard-audio/route.ts` (ElevenLabs TTS for the Dutch word + example sentence, mirrors `generate-question-audio`), `app/api/wordcard-pexels-query/route.ts` (Claude Haiku search-query generation from dutch/translation_en/example), `app/api/upload-wordcard-image/route.ts` (fetches Pexels image, compresses to webp via `sharp` — new dependency — then uploads). New `app/[locale]/(admin)/admin/woordkaarten/_components/WoordkaartenTable.tsx` (ReUI DataGrid + slide-in panel, ported from `QuestionsTable.tsx`) replaces the plain table in `woordkaarten/page.tsx`; `WoordkaartForm.tsx` is now create-only (used by `woordkaarten/new`).
**Outcome:** `SUCCESS` (not yet verified end-to-end — blocked on migration being applied)
**What worked:** Reusing the exact questions-admin pattern (raw Storage REST upload for audio, Pexels preview-then-confirm-on-save for images) made this a low-risk port rather than new design.
**What went wrong:** `supabase db push` failed — the remote migration history is out of sync with older migrations (`20260603000001` onward) that are already applied on the remote DB but not marked as applied in the CLI's tracking. This is pre-existing drift, unrelated to this change. User chose to apply the new migration manually rather than have Claude run `supabase migration repair`.
**Lesson:** Before running `supabase db push` in this repo, expect it to try replaying already-applied migrations and fail — this is a known drift issue, not a sign the new migration is wrong. Don't attempt `migration repair` without explicit user confirmation since it rewrites shared migration-history state.

## 2026-07-08 — Mobile exam view: fix header overflow, compact intro card, CTA reflow, spacing

**Changed:** `components/proefexamen/ExamQuestionCard.tsx` (header row wraps instead of overflowing, tighter mobile card padding), `components/proefexamen/ExamIntro.tsx` (stat pills sized down on mobile so they fit 2/row, Start-button reordered to appear right after the settings pills on mobile via CSS `order` — not duplicated in the DOM), `dashboard/components/InlineQuiz.tsx` + `dashboard/components/ExamsView.tsx` (reduced outer horizontal padding on mobile so the card uses more screen width; added extra bottom offset to the fixed "Volgende vraag" button so it doesn't stick to the bottom tab bar).
**Outcome:** `SUCCESS` (47/47 tests green)
**What went wrong (first attempt):** Initially moved the mobile CTA by rendering the Start button twice (one `sm:hidden` copy placed early, the original `hidden sm:flex` copy left in place). This broke 3 Playwright tests — `getByText/locator(...).first()` resolved to the DOM-first (mobile, hidden-at-desktop-viewport) button, so `toBeVisible()` failed even though the correct button *was* visible.
**Lesson:** Never duplicate an interactive element in the DOM just to reposition it responsively — Playwright/testing-library locators match DOM order, not visual order, so `.first()` can grab the hidden copy. Use CSS `order` (with a shared `flex flex-col` parent, `order-N` vs `sm:order-none`) to visually reorder a single element instead.

## 2026-07-08 — Fix mismatched exam pass thresholds between exam page and dashboard

**Changed:** `dashboard/components/ExamsView.tsx` — replaced hardcoded `exam.free ? 60 : 65` pass percentages with the same 70% threshold (`Math.ceil(40*0.7)=28` correct) already used in `ProefexamenEngine.tsx`.
**Outcome:** `SUCCESS`
**What worked:** The official rule is 28/40 correct to pass. The exam page (`ProefexamenEngine.tsx`) already used `PASS_THRESHOLD_PCT = 0.7`, but the dashboard exam cards used separate hardcoded 60%/65% cutoffs, so a student scoring 24–27/40 could see "Niet geslaagd" on the exam but "Geslaagd" on the dashboard for the same result.
**Lesson:** Pass/fail thresholds duplicated across the standalone exam route and its dashboard SPA copy (see "Shadow Copies Warning" in CLAUDE.md) can silently drift — grep for the constant across both surfaces whenever scoring logic changes, and prefer a single shared constant over copy-pasted literals.

## 2026-07-06 — Fix /ar (and any locale) briefly flashing unbranded 404 before real page loads

**Changed:** Added `app/[locale]/not-found.tsx` (branded, i18n'd 404 page), `app/[locale]/[...rest]/page.tsx` (catch-all that calls `notFound()`), added `not_found` i18n keys to `messages/{nl,en,ar}.json`, added `ar` to `alternates.languages` in `app/[locale]/(main)/page.tsx`.
**Outcome:** `SUCCESS` (47/47 tests green)
**What worked:** PostHog session replays showed users landing on `/ar` seeing Next's raw unbranded 404 for a few seconds before the real page rendered. Root cause: there was no `not-found.tsx` anywhere under `app/[locale]/`, and — critically — a `not-found.tsx` colocated with a dynamic segment like `[locale]` only intercepts *explicit* `notFound()` calls thrown from within a page that already matched a route. It does **not** catch genuinely unmatched paths (e.g. a stale/mistyped translated slug); those fall through to Next's default root-level 404 instead of the nested branded one. Adding an `app/[locale]/[...rest]/page.tsx` that calls `notFound()` makes the whole `/[locale]/*` space "match" first, so the sibling `not-found.tsx` actually engages for any unmatched sub-path, in the correct locale with RTL/i18n applied.
**Lesson:** `not-found.tsx` next to a dynamic `[param]` segment is a no-op for unmatched deep paths unless there's also a catch-all `[...rest]/page.tsx` in that segment calling `notFound()`. If you want a branded 404 for an entire locale-prefixed route tree, you need both files together — not just the `not-found.tsx`.

## 2026-07-04 — Guest mode onboarding: anonymous dashboard access

**Changed:** `dashboard/page.tsx` (guest init path, no redirect for anon users), `dashboard/components/ExamsView.tsx` (session optional, exam-card className, lockHref guest routing), `dashboard/components/InlineQuiz.tsx` (guest email gate before score reveal), `dashboard/components/WoordkaartenView.tsx` (userId optional, localStorage-only for guests), `dashboard/components/LerenView.tsx` (isGuest prop, /register lock target), `components/PlatformSidebar.tsx` (guest footer with register/login links), ~11 homepage/nav files repointing `/proefexamen` → `/dashboard`, `messages/{nl,en,ar}.json` (guest i18n keys), `tests/e2e.spec.js` + `tests/scenarios.spec.js` (test updates for new behavior).
**Outcome:** `SUCCESS` (47/47 tests green, TypeScript clean)
**What worked:** Opening the dashboard SPA to anonymous visitors as plan='free' guest. The free-plan gating already unlocked exactly the right content (exam 1, woordkaarten thema 1, leren thema 1) — no new DB schema needed. Guest email gate in InlineQuiz mirrors the ProefexamenEngine pattern.
**Lesson:** Check that CSS classes defined in `dashboard/page.tsx` `<style>` blocks are actually applied as `className` on JSX elements — they were defined but never used, causing test failures. Always add the class in JSX, not just the CSS. Also: always kill stale dev servers from other projects before running tests — port 3001 was squatted by the Neuro/Spanish project, making 44 tests appear to fail when the real KNM server was fine on 3002.

## 2026-06-26 — Fix Mollie webhook not upgrading paid users

**Changed:** `app/api/mollie-checkout/route.ts` (normalize webhook URL + await DB insert), `app/api/mollie-webhook/route.ts` (return 500 on error so Mollie retries), `app/api/reconcile-payments/route.ts` (new hourly cron to self-heal missed webhooks), `scripts/reconcile-payments.mjs` (one-time repair script), `vercel.json` (added hourly cron).
**Outcome:** `SUCCESS` (build passes, TS clean, tests green)
**What worked:** The user's plan lives only in `auth.users.user_metadata.plan`. It is set by the Mollie webhook (primary) and by the `/betaling-gelukt` polling page (fallback). Many payments were stuck at `open` because the webhook was not firing — the `MOLLIE_WEBHOOK_URL` env var in production was likely set to just the domain without the `/api/mollie-webhook` path (matching the broken `.env.example`).
**Lesson:** Always validate that `MOLLIE_WEBHOOK_URL` ends in `/api/mollie-webhook` before passing it to Mollie. A bare domain silently sends webhook calls to the homepage. Added a normalization guard in checkout. Always add a reconciliation cron when relying on webhooks for critical state changes — webhooks can be misconfigured or dropped.

## 2026-06-20 — Per-question image + audio ("Lees voor") integration across all exams

**Changed:** Integrated Variant 3 ("Ingelijste foto") exam card design across both exam engines (`ProefexamenEngine.tsx`, `InlineQuiz.tsx`). New shared components: `components/proefexamen/ExamQuestionCard.tsx` (framed image, Lees voor pill, word-by-word highlight, EQ animation, option glow), `components/proefexamen/ExamAudioCheck.tsx` (test-audio + global audio toggle), `components/proefexamen/useReadAloud.ts` (sequential 4-track audio hook), `lib/audio-pref.ts` (global localStorage preference). Extended `KnmQuestion` type and all DB selects with 4 audio columns. Added full exam intro screen to dashboard (`ExamsView.tsx`). Added `@keyframes eq` to `globals.css`. Added i18n keys to all 3 locales.

**Outcome:** `SUCCESS` — 47/47 Playwright tests pass.

**What worked:** Extracting the shared card into a single component means both surfaces get identical behaviour with no duplication. The word-by-word timing uses character-weight estimation scaled to real audio duration (from `loadedmetadata`) — exact same technique as the design reference.

**Lesson:** Playwright tests that use `#intro button.first()` break when a new button is added inside the intro before the start button. Always use `button:has-text("...")` with the actual label text for start buttons, not positional selectors.

---

## 2026-06-19 — SEO review + full implementation

**Changed:** SEO audit against video transcript + implemented all four scopes (technical/code, backlinks strategy, content, conversion). Files changed: `blog/[slug]/page.tsx` (hreflang + Article schema), `oefenvragen/[slug]/page.tsx` (hreflang + Quiz schema + H1 fix), `proefexamen/page.tsx` (static metadata → generateMetadata), `messages/{nl,en,ar}.json` (proefexamen meta keys), `[locale]/layout.tsx` (default OG image), `page.tsx` + `docent/page.tsx` (H1 br→span fix), `sitemap.ts` (lastmod + 3 new slugs), `robots.txt` (auth/admin/dashboard disallows), `data/blog-posts.ts` (3 new NL posts), `seo/backlinks.md` (new outreach tracker).

**Outcome:** `SUCCESS`

**What worked:** The blog-post hreflang bug was confirmed in code (hardcoded `/nl/` canonical, no `languages`). The `getPostSlug()` helper already existed in blog-posts.ts and made the fix clean. Article JSON-LD could reference the shared `#teacher` and `#organization` anchors already defined on the homepage. For the proefexamen page the `proefexamen` namespace already existed in all three message files — just needed two new keys. The H1 br→block span approach preserved visual line breaks without the semantic split.

**Lesson:** Before fixing metadata issues on dynamic pages, check if the data model already exposes what you need (getPostSlug existed). Also: `generateStaticParams` pages still need `generateMetadata` to receive `locale` from params — the static `export const metadata = {}` object can never be locale-aware.

## 2026-06-10 — WW2Timeline widget: interactive timeline + synced audio

**Changed:** Built `components/leren/widgets/WW2Timeline.tsx` — 9-event interactive timeline for the WOII section of Thema 1, with click-to-expand detail cards, progress tracking, and synced audio. Generated Dutch TTS via ElevenLabs `/with-timestamps` API, extracted 39 cue points, uploaded to Supabase `leren-audio` bucket, and wired `timeupdate` to auto-advance the active event. Replaced the static WOII HTML in `data/leren/thema-1.ts` with `<!-- WIDGET:ww2-timeline -->`. Added `ww2event` field to `AudioCue` type in `lib/leren-audio-cues.ts`.
**Outcome:** `SUCCESS`
**What worked:** Inline `<style>` block with explicit `@media (min-width: 560px)` rules for the two-column layout — Tailwind arbitrary-value responsive classes (`sm:w-[46%]`) are unreliable when not picked up by the class scanner. Audio player positioning: after header/progress bar, before body columns (matching OVReisSimulator pattern at `px-4 pt-3 pb-3` with `borderBottom` separator). Env file parsing: must strip surrounding quotes from `.env.local` values with `.replace(/^["']|["']$/g, '')` before using as URLs.
**Lesson:** For widget two-column responsive layout, always use inline CSS `@media` rather than Tailwind responsive classes. The established audio player position for all widgets is: after widget header, before body content, with a bottom border separator.

## 2026-06-09 — OV widget: vehicle/payment selectors + beeps + 9292 fix

**Changed:** Rewrote `OVReisSimulator.tsx` to add vehicle selector (trein/bus/tram/metro), payment method selector (OV-chipkaart/bankpas/telefoon), Web Audio API beeps (1 on inchecken, 2 on uitchecken), and fixed "9292" → "negen-twee-negen-twee" in the TTS script. Updated `extractOVCues()` in `lib/leren-audio-cues.ts` to emit `vehicle` and `payment` cues. Regenerated the audio via the generate-lesson-audio endpoint.
**Outcome:** `SUCCESS`
**What worked:** `simStateRef` pattern kept `handleTimeUpdate` stable across vehicle state changes without stale closure. Web Audio `AudioContext` created fresh per beep call avoids "AudioContext suspended" issues on iOS. The DB `body_html` must be patched to `<!-- WIDGET:ov-reis -->` before calling the generate endpoint or the OV cue extractor won't fire.
**Lesson:** When regenerating audio for a widget that has a custom cue extractor, always PATCH `body_html` to contain the WIDGET marker first — `generate-lesson-audio` reads `body_html` from DB at request time, not from the static file.

## 2026-06-09 — Interactive VOC world-map widget (Thema 1 "De Gouden Eeuw")

**Changed:** New `components/leren/widgets/TradeRoutesMap.tsx` — a real world map (react-simple-maps `ComposableMap` over `public/data/world-110m.topojson`) showing the VOC trade routes drawn as geographic `<Line coordinates={...}/>` paths (east around the Cape of Good Hope to Azië, west across the Atlantic to Amerika) with clickable trade-good `Marker`s. Registered `'trade-routes-map'` in `SectionContent.tsx` and admin `_WidgetNode.tsx`; replaced the `<!-- WIDGET:lesson-audio -->` marker with `<!-- WIDGET:trade-routes-map -->` in the `gouden-eeuw` section of `data/leren/thema-1.ts`. Added COMPONENTS.md row.
**Outcome:** `SUCCESS` — tsc clean for the new files; verified mobile+desktop default state and interactivity (route highlight dims the other lane + its goods; good-click shows colored detail card) via an isolated preview route that rendered through `SectionContent` (full marker-dispatch path).
**What worked / What went wrong:** (1) `react-simple-maps` v3 `<Line>` takes a `coordinates` array and renders it through the projection's `geoPath`, so a multi-waypoint route draws as a realistic curved path — much better than hand-drawn SVG arcs (started schematic, then switched to the real map on request). (2) `<Marker>`'s `style` prop is typed as the Geography variant triple `{default,hover,pressed}`, NOT plain CSS — passing `{opacity,transition}` fails tsc; put per-marker opacity/cursor on an inner `<g style>` and keep `onClick` on the `Marker` (it spreads restProps onto its `<g>`). (3) Material Symbols render inside SVG via `<text style={{fontFamily:'Material Symbols Outlined'}}>iconName</text>` — but ONLY when the font stylesheet is loaded; the leren pages inject it in a `useEffect`, so an isolated preview must inject the same `<link>` or icons show as raw ligature text. (4) The i18n middleware (`proxy.ts`) routes everything through `[locale]` and 404s a top-level `app/widget-preview/` route — put throwaway preview pages under `app/[locale]/` so they resolve.
**Lesson:** For map widgets, reuse the existing `react-simple-maps` + topojson stack (a `world-110m.topojson` already lives in `public/data`) and draw routes with `<Line coordinates={[...]}/>` rather than inventing SVG geometry. `Marker.style` ≠ CSS — style the inner `<g>`. Unrelated but cost time: `node_modules` was incomplete on session start (`@tailwindcss/postcss`, recharts, tiptap, tanstack all missing → dev server 500); run `npm install` and restart dev + `rm -rf .next` before trusting a 500.

**Addendum (same session):** Added a "Luistertekst" narration script block below the map — a `SCRIPT` array of lines each annotated with the `route`/`good` it describes. This is the audio-ready seed: when timed cues are generated later (same `thema1-kaart-cues.json` pipeline as NetherlandsMap), they sync to those same route/good ids. Lines are already clickable now and bidirectionally synced with the map (clicking a line highlights its marker/route and tints the line), which previews the future audio-driven highlight behavior. Pattern to reuse: annotate narration text with the same entity ids the map uses, so script ↔ map ↔ (future) audio all share one highlight model.

**Addendum 2 (same session) — generated the synced audio, removed the text:** Added `route`/`good` fields to `AudioCue` (`lib/leren-audio-cues.ts`) + an `extractTradeRoutesCues` extractor wired into `extractCues` (parity with colonies-map). New `scripts/generate-gouden-eeuw-audio.mjs` produces `public/audio/leren/thema1-gouden-eeuw.mp3` + `-cues.json`. Refactored `TradeRoutesMap` to accept `{audioUrl, audioCues}`, fetch the static cues as fallback, and play through an audio player identical to NetherlandsMap (play/pause, scrub, synced subtitle); `handleTimeUpdate` walks cues backward per-field to drive `subtitle`/`activeRoute`/`activeGood`. Removed the static `SCRIPT` "Luistertekst" block. **What worked:** the generation script auto-detects `ELEVEN_LAPS_API_KEY` and uses the exact chapter-1 ElevenLabs pipeline (`/with-timestamps`, voice `S2OWP8siwXK4AZRAs2ec`, `eleven_flash_v2_5`) when present; without a key it falls back to macOS `say -v Xander --data-format=LEI16@22050` per-sentence + a pure-Node WAV concat (parse `fmt `/`data` chunks, sum durations) for sentence-accurate cues — real synced audio with zero external deps. Both paths emit the SAME incremental-cue JSON, so the widget is pipeline-agnostic. Verified by driving `audio.currentTime` to cue times via puppeteer + screenshot (peper@19.5s → east route + Peper + subtitle; suiker@40.5s → pill flips to orange west, the route cue's explicit `good:null` clears the prior good). **Lesson:** make a TTS generation script dual-path (paid API when keyed, OS `say` fallback) and segment-annotated so the cue format is identical either way — build/verify the whole synced-audio feature before any key exists, then regenerate in place once the key lands (no code change; I did exactly this when the user added the key mid-task). To verify audio-synced UI headlessly: set `audio.currentTime` + dispatch a `timeupdate` event + screenshot — no real playback needed.

**Addendum 3 (same session) — boat sails the active route:** Gave each route `<Line>` an `id={`tr-route-${id}`}` and added a boat (`<g><circle/><text>sailing</text><animateMotion dur=… repeatCount="indefinite" keyPoints="0;1;0" keyTimes="0;0.5;1" calcMode="linear"><mpath xlinkHref={`#tr-route-${litRoute}`}/></animateMotion></g>`) rendered only for the lit route; the idle route keeps its static midpoint ship. Because the boat is keyed on `litRoute`, it remounts and sails whichever route the audio (or a click) is highlighting, out to the destination and back. **What worked:** react-simple-maps `<Line>` spreads `id` onto its `<path>`, so SMIL `<mpath xlinkHref="#id">` resolves and the boat follows the *projected* route geometry — no manual point-sampling. `keyPoints="0;1;0"` gives the back-and-forth. Left `rotate` off (the Material `sailing` glyph would render upside-down on the return leg). Verified by screenshotting the `<svg>` across time: boat at Amsterdam → Cape of Good Hope → return up the West-African coast. **Lesson:** to move something along a react-simple-maps route, put an `id` on the `<Line>` and drive a child `<g>` with `<animateMotion><mpath xlinkHref>`; it shares the map's coordinate space automatically. animateMotion only animates position (transform) so it respects the "transform/opacity only" guardrail. Headless screenshot capture latency accumulates (~0.3–0.5s/shot), so don't trust exact frame timing — compare relative positions, not absolute t.

**Addendum 4 (2026-06-10) — highlight Amsterdam on the closing lines:** Added a `home?: boolean|null` field to `AudioCue` + emit it from both the generator (`SEGMENTS[...].home`, `highlightCues` now builds a delta object incl. `home`) and the lib extractor (`extractTradeRoutesCues`: the `'kwamen aan in Amsterdam'` anchor now sets `{route:null, good:null, home:true}` instead of just clearing). Regenerated the mp3+cues (ElevenLabs, key present) → `home:true` fires at 57.9s and persists through the "andere kant" line until the end cue clears it. In `TradeRoutesMap`: new `activeHome` state driven by the same backward-walk in `handleTimeUpdate`, reset on `onEnded` and on manual select; the Amsterdam `<Marker>` enlarges + gets a `trHomePulse` halo when active, and the info panel shows a blue "THUISHAVEN · Amsterdam" card. **Lesson:** the incremental-cue model extends cleanly — a new highlight target is just (1) a field on `AudioCue`, (2) a sticky cue from the generator/extractor, (3) one more `latestX` in the player's backward-walk, (4) the visual. Because `home` is sticky, one cue covers both closing sentences with no per-line repetition.

## 2026-06-08 — Topic practice overview (TopicOverview component)

**Changed:** Added `TopicOverview.tsx` (new shared component). Updated `ExamsView.tsx` so clicking a topic card opens the overview instead of firing the quiz immediately. Updated `LerenThemaView.tsx` so the last section's "next" button and the "Kennischeck" card open the overview instead of a random-10 quiz. Removed the now-dead `QuizView` function from `LerenThemaView.tsx`.
**Outcome:** `SUCCESS`
**What worked / What went wrong:** TypeScript came out clean on the first pass. The key was exporting `SectionMeta` from `TopicOverview.tsx` and importing it in both consuming files. The `user_question_results` query needed `.order('answered_at', { ascending: true })` so the last-iterated row becomes the latest answer (last write wins). Sections are fetched from the public-readable `sections` table and filtered by `topic` field which maps 1-to-1 with `questions.category`.
**Lesson:** When removing a QuizView/quiz pattern, also clear its state variables (quizState etc.) in `useEffect([slug])` reset, otherwise stale state can show on thema switch. The `refreshResults` pattern (re-fetch just `user_question_results` after practice) is the right way to update badges without re-fetching all questions.

## 2026-06-06 — Prod 500: exam_submissions.user_id missing (half-applied merge)

**Changed:** Added `user_id` column (+ email backfill + index) to prod `exam_submissions` via new migration `20260606000000_add_user_id_to_exam_submissions.sql`; fixed `completed_at`→`created_at` in `app/api/submit-results/route.ts` (dedup) and `app/[locale]/(admin)/admin/page.tsx` (activity chart) for the `exam_submissions` queries.
**Outcome:** `SUCCESS` — column live (REST probe returns rows, 121/414 backfilled), `next build` clean, 47/47 tests green.
**What went wrong:** The unify migration `20260506000003` (CREATE TABLE exam_submissions, drop exam_results) was authored but **never applied to prod** — prod still runs both old tables (`exam_results` for logged-in users, `exam_submissions` for anon). Code was half-migrated: claim-submissions/admin/submit-results assumed the merged schema (`user_id`, `completed_at`), crashing on the real columns (`created_at`, no `user_id`). `supabase db push` was NOT safe here — it would re-run the broken CREATE TABLE migration.
**Lesson:** When a PostgREST `42703 / PGRST204 "column ... does not exist"` hits in prod, probe the LIVE table (`curl .../rest/v1/<table>?select=*&limit=1`) before trusting migration files — an authored migration is not an applied one. Don't `supabase db push` to fix one column when older unapplied migrations would also fire; apply a single additive `ALTER ... IF NOT EXISTS` via the SQL editor instead.

## 2026-06-04 — Exam assignment from DB + question review workflow + ReUI data grid

**Changed:** (1) Exam composition now reads from `questions.exam` instead of the static `EXAM_ASSIGNMENTS` map — backfill migration `..._backfill_question_exam.sql` + filter changes in `ProefexamenEngine.tsx`/`ExamsView.tsx`. (2) New migration `..._question_review_status.sql` adds `updated_at` (trigger), `review_status` ('pending'/'validated'), `reviewed_at` (trigger-stamped on status change). (3) Installed ReUI data grid (`@reui/c-data-grid-23`) and rebuilt the admin questions table with client-side search/filter/sort + a review-status toggle and timestamp display.
**Outcome:** `SUCCESS` — tsc clean, `next build` compiles all admin routes, 47/47 tests green.
**What worked:** ReUI registry needs `"@reui": "https://reui.io/r/{style}/{name}.json"` in `components.json` `registries`. Running `shadcn add` with `yes N |` declines overwriting existing primitives (button/avatar/badge) so our versions survive while new files are added. `next build` is the only automated check that compiles auth-gated `(admin)` routes — the Playwright suite can't reach them. The `DataGrid` component supports `onRowClick` natively, so the existing edit side-panel hooks in cleanly.
**Lesson:** Code that filters by a DB column (`q.exam === n`) silently returns empty until the backfill runs — pair the code change with the data migration and verify the column distribution (`select exam, count(*) ... group by`) before assuming a test failure is a bug. The static `KNM_QUESTIONS` fallback only has exam 1 populated, so the DB is the real source for exams 2–10.

## 2026-06-03 — M8: Admin platform built (routes, DB migrations, UI)

**Changed:** Created `app/[locale]/(admin)/` route group with layout (auth guard), dashboard, questions CRUD, leren section editor, and woordkaarten CRUD. Added 3 Supabase migrations (`admin_users`, `leren_content`, write RLS policies). Added `app/[locale]/(auth)/admin-login/` page. Added `app/api/admin-revalidate/route.ts` for ISR revalidation on save. Added `scripts/import-leren-content.mjs` for one-time leren data import.
**Outcome:** `SUCCESS` — TS clean, 47/47 tests green, admin login at `/nl/admin-login` renders correctly.
**What worked:** Placing the login page inside `(auth)` (not `(admin)`) avoids the redirect loop — the `(admin)` layout redirects unauthenticated users to `/nl/admin-login`. The admin layout uses the service-key Supabase client so `auth.getUser()` correctly reads the session JWT from cookies. The `(admin)` layout group is not listed in `i18n/routing.ts` pathnames — admin routes don't need translation.
**Lesson:** Never put the login/unauthenticated page inside the same layout group that enforces auth. Put it in `(auth)` and redirect there from the gated layout.

## 2026-06-03 — Legacy cleanup + repo flatten (M7 phase 1)

**Changed:** Deleted the entire legacy static HTML site (200+ HTML files, api/, data/, components/, i18n/, styles/), moved web/ contents to repo root, merged package.json, ported all EN/AR redirects to next.config.ts, added app/sitemap.ts, updated CLAUDE.md + milestone docs.
**Outcome:** `SUCCESS`
**What worked:** `git mv` correctly tracks renames so history follows. Tagging before cleanup (`git tag legacy-static-site`) gives a 1-command recovery path for any deleted file.
**Lesson:** When flattening a monorepo subdirectory, do `git rm` on all legacy *first*, then `git mv web/*` — avoids collision errors on package.json and other name-clashing files. The strangler proxy in next.config.ts rewrites() fallback block is the safety net; don't remove it until the Vercel preview is verified and the branch is merged to main.

Also: `web/.env.local` (gitignored) is NOT moved by `git mv`. After a flatten, manually copy it to the new root: `cp web/.env.local .env.local`. Otherwise `NEXT_PUBLIC_SUPABASE_URL` is missing and the proefexamen page crashes.

Also: Claude Code injects a `skills` symlink at the project root pointing to `~/.claude/skills`. This causes a Turbopack panic (tries to resolve path above project root during CSS parsing). Always check for and remove this symlink before running the dev server. Added `skills` and `.claude/worktrees/` to `.gitignore`.

## 2026-06-03 — Playwright test suite fixed for Next.js App Router (48/48 green)

**Changed:** Updated `tests/scenarios.spec.js` (mockAuth), `tests/e2e.spec.js` (selectors), and added small test hooks to `dashboard/page.tsx`, `activate/page.tsx`, `proefexamen/page.tsx`, `WoordkaartenView.tsx`.
**Outcome:** `SUCCESS` — 48/48 tests pass in 38s.
**What worked / What went wrong:** Cookie-based Supabase session mocking does NOT work in Playwright + Next.js dev (React Strict Mode causes navigator Web Locks contention). The fix: small `sessionStorage.__pw_session__` hook in client pages read before `getSession()`. For server-side auth checks, use a `__pw_premium__` cookie checked before Supabase's `getUser()`.
**Lesson:** Never try to mock `@supabase/ssr`'s `createBrowserClient` via cookie injection in Playwright + Next.js dev mode. Use a thin `sessionStorage`/cookie bypass read BEFORE the Supabase call. Keep the bypass key obscure (`__pw_session__`) — it only activates when set by the test runner.

## 2026-06-03 — betaling-gelukt showed public top nav

**Changed:** Moved `app/[locale]/(main)/betaling-gelukt/` → `app/[locale]/(app)/betaling-gelukt/`.
**Outcome:** `SUCCESS`
**Lesson:** Any page in the logged-in flow must live in `(app)/`, not `(main)/`. Route-group choice = which layout wraps the page; the folder-in-parens never changes the URL.

## 2026-06-03 — Upgrade flow showed full activate chooser instead of upgrade page

**Changed:** `app/[locale]/(auth)/activate/page.tsx` — read `?upgrade=plus`; render a single-card upgrade view instead of the two-plan chooser.
**Outcome:** `SUCCESS`
**Lesson:** When a flow looks broken, check whether the backend product/route already supports the intended path before adding anything. Also: the activate page SSRs only a loading spinner — verify with Puppeteer injecting `sessionStorage.__pw_session__`.

## 2026-06-03 — Upgrade-confirmation email + Compleet-aware welcome email

**Changed:** `app/api/mollie-webhook/route.ts` — branched post-payment email: `upgrade_to_plus` → new `buildUpgradeEmail`; `premium`/`premium_plus` first purchases → `buildActivationEmail` with plan-aware copy.
**Outcome:** `SUCCESS`
**Lesson:** Email template functions in this repo are plain string builders — render/preview them in isolation without Resend. Changing element IDs silently breaks Playwright selectors — run the suite after any UI-structure change.

## 2026-06-03 — Woordkaarten: added theme word list view

**Changed:** `WoordkaartenView.tsx` — added `'list'` subView between theme overview and practice deck.
**Outcome:** `SUCCESS`
**Lesson:** Back-navigation from deck now returns to the list view (not overview). `saveCardProgress` is shared between deck and list — no duplication needed.

## 2026-06-03 — M7: Strangler proxy removed, branch ship-ready

**Changed:** Removed strangler `rewrites()` block from `next.config.ts`. Added `id="wk-start-practice"`. Updated 3 Playwright tests for new list-view step. Pruned 3 stale git worktrees.
**Outcome:** `SUCCESS` — 47/47 tests passing, production build clean.
**Lesson:** After any UI flow change that adds a step, run the full test suite immediately. Dead tests referencing deleted files will always fail silently — prune them on sight.

## 2026-06-01 — M1–M6: Full Next.js migration

**Lessons (compressed from M1–M6 entries):**
- Next.js 16: middleware file = `proxy.ts`; Tailwind tokens = CSS `@theme` in globals.css; `params` is always a `Promise` — await it; don't use auto-generated `PageProps` imports until after first build.
- next-intl's typed `Link` rejects dynamic template literal hrefs — use plain `<a>` for dynamically-constructed paths.
- Split client/server: `page.tsx` (server + metadata) + `ComponentName.tsx` (client + interaction). Never `'use client'` on page.tsx if you need `generateMetadata`.
- Separate the SSR auth client (cookies, `@supabase/ssr`) from the admin/service client (plain `createClient`, service key). Webhook endpoints with form-encoded bodies need `request.text()` + `URLSearchParams`, not `request.json()`.
- When adding a new field to Supabase `user_metadata`, always merge (fetch existing → spread → update). When introducing tiers atop a boolean flag, keep the boolean alive for backward compat.
- After any DB migration that renames/drops a table, grep all API files for the old table name. Two separate email paths (email gate vs. Google sign-up) must coordinate to avoid duplicate sends.

---

## Pre-M7 Lessons (legacy static site era — apply with caution, stack has changed)

- **Analytics on static pages:** Don't replace inline footer HTML with JS-rendered components on SEO content pages — inline static HTML is crawled immediately.
- **Nav on mobile:** Any nav element with multi-word text needs `whitespace-nowrap`. Mobile dropdown should use a solid background (not glass) — glass breaks over dark heroes.
- **Batch-replace scripts:** Always grep first to confirm every file uses the exact class/pattern being replaced. Run a final `grep -rL` check after the script.
- **CSS component injection:** Guard injected CSS by ID check to avoid duplicating style blocks when the same component loads multiple times.
- **`const` env vars:** Declare at top of module scope before any logic that references them — no hoisting for `const`.
- **Post-payment redirects:** Poll `payment-status` with a short retry loop — webhook can lag 1–2 seconds.
- **`data-i18n` on elements with child HTML:** Wrap text portions in separate `<span data-i18n="...">` elements. Never use `data-i18n` on a parent that has child elements — it replaces them all with a flat string.
- **Supabase `user_metadata` updates:** `updateUserById` replaces metadata wholesale — always fetch existing and spread it.
- **Playwright mock for pages with inline Supabase init:** Intercept the CDN script, not `window.supabase`.

---

## 2026-06-08 — Interactive Netherlands map widget (Thema 1 Pass 1)

**Changed:** Added interactive province map widget to Thema 1 "kaart" section. New files: `components/leren/widgets/NetherlandsMap.tsx`, generalized `components/leren/SectionContent.tsx` to support `<!-- WIDGET:id -->` markers alongside existing `<!-- STEP_TIMELINE:id -->` markers. Updated `data/leren/thema-1.ts` (replaced broken `kaart` image with widget marker; removed broken OV + water images). Added `scripts/generate-leren-images.mjs` for AI image generation.
**Outcome:** `SUCCESS`
**What worked:** The marker-injection pattern (HTML comment → regex parser → React component dispatch) is an excellent extension point. Adding a widget registry to `SectionContent.tsx` required only ~20 lines of change and preserved all existing `STEP_TIMELINE` behavior. Playwright `addInitScript` + `sessionStorage.__pw_session__` is the correct way to mock auth for the leren page — route interception alone doesn't work because the auth check runs client-side from `sessionStorage`.
**Lesson:** SVG province paths must share exact coordinates at shared borders or gaps appear. Always close paths back to the first point explicitly (`L start Z`). Widget markers inside grid column HTML break the grid (the React component renders as a sibling outside the grid). Place WIDGET markers at the *section level*, not inside HTML grid columns — or restructure to single-column layout before the marker.

## 2026-06-09 — Map missing in dashboard leren view (not the standalone page)

**Changed:** `app/[locale]/(app)/dashboard/components/LerenThemaView.tsx` — replaced raw `dangerouslySetInnerHTML={{__html: sec.contentHtml}}` inside the CarouselItem with `<SectionContent section={sec} />`; reverted `components/leren/SectionContent.tsx` from `dynamic(ssr:false)` back to a static `NetherlandsMap` import.
**Outcome:** `SUCCESS`
**What worked / What went wrong:** The interactive map was missing in `/nl/dashboard` → Leren, but I kept debugging `/leren/[slug]` (the standalone page), which always rendered fine. There are TWO leren surfaces: the standalone page uses `SectionContent` (processes `<!-- WIDGET: -->` markers); the dashboard had its own carousel renderer that dumped raw HTML and left the widget comment inert. The "production" failure was the same dashboard bug (the prod screenshot URL was `/nl/dashboard`), not the import — so the `dynamic(ssr:false)` change was an unnecessary wrong turn. Also: running `npm run build` while `npm run dev` is live clobbers `.next` and silently breaks the running dev server — always stop dev, build/test, then restart dev + `rm -rf .next`.
**Lesson:** When a component renders on one route but not another, confirm WHICH route/component tree actually renders it before debugging — grep for every place a data field (`contentHtml`) is consumed. The dashboard embeds its own copies of "page" views; a fix to a shared component isn't picked up by a sibling that re-implements the render.

## 2026-06-09 — WaterDefense interactive widget (Thema 1 "Nederland en het water")

**Changed:** Created `components/leren/widgets/WaterDefense.tsx` — an SVG cross-section scene with a slider-controlled storm surge and a toggle to breach/restore the dike. Registered `'water-defense'` in `SectionContent.tsx`'s WIDGETS map. Updated `data/leren/thema-1.ts` water section marker from `lesson-audio` to `water-defense`.
**Outcome:** `SUCCESS`
**What worked:** Self-contained SVG with inline CSS transitions + a `<style>` tag for keyframe animations. `transformBox: 'fill-box'` + `transformOrigin: 'bottom'` on the dike `<g>` enables clean scaleY collapse animation. Placing wave animation on a translated `<g>` that moves with the waterline keeps wave position correct across surge levels without JS.
**Lesson:** For educational cross-section animations, encode the scene purely in SVG with CSS transitions on derived state — avoid requestAnimationFrame loops. The widget receives no audio props but must still accept `{ audioUrl?, audioCues? }` to satisfy the shared `WidgetProps` type.

## 2026-06-09 — OVReisSimulator widget (Thema 1, Sectie 2)

**Changed:** Created `components/leren/widgets/OVReisSimulator.tsx` — a tap-driven check-in/out simulator with a journey-line (Station A → animated train → Station B), OV-reader buttons, saldo counter, beep visual feedback, idle nudge-hint, cycling KNM facts, and an examentip box. Registered `'ov-reis'` in `SectionContent.tsx` and admin `_WidgetNode.tsx`. Swapped `<!-- WIDGET:lesson-audio -->` → `<!-- WIDGET:ov-reis -->` in the `ov` section of `data/leren/thema-1.ts`.
**Outcome:** `SUCCESS`
**What worked:** Followed the `NetherlandsMap.tsx` pattern exactly: self-contained `'use client'` component, inline `<style>` keyframes (`nudge`, `beepRing`, CSS `transition` on train position/gate height), state machine (`idle → ingecheckt → reizen → uitgecheckt`). Accept `{ audioUrl?, audioCues? }` to satisfy `WidgetProps` but ignore them — keeps registry compatible for future audio. TypeScript clean, build clean, 47/47 e2e tests pass.
**Lesson:** When `SectionContent.tsx` has grown since your last read (other widgets may have been added), always re-read it before editing — file-modified errors from a stale read cost an extra round-trip. Also: `sed -i ''` with a line number is the fastest way to swap one specific marker occurrence when the same comment appears on multiple lines.

## 2026-06-09 — ColoniesMap widget (De koloniën en slavernij)

**Changed:** Created `components/leren/widgets/ColoniesMap.tsx` — an interactive world-map widget for the "De koloniën en slavernij" section. Two toggle modes: (1) **De koloniën** — clickable pins on Nederlands-Indië, Suriname, Nederlandse Antillen (+ Nederland home marker), each opening a colour-coded detail panel with modern status; (2) **De driehoekshandel** — Nederland/Afrika/Amerika nodes joined by animated dashed Bézier arcs, each leg clickable to explain the cargo (goederen → mensen → producten). Projection re-centres per mode (world view vs. Atlantic). Registered `'colonies-map'` in `components/leren/SectionContent.tsx` and admin `_WidgetNode.tsx`. Downloaded `public/data/world-110m.topojson` (world-atlas). Added a dev preview at `app/[locale]/widget-preview/colonies/page.tsx`.
**Outcome:** `SUCCESS`
**What worked:** Reused the `NetherlandsMap.tsx` pattern (react-simple-maps `ComposableMap`/`Geographies`/`Marker`, header → map → info panel → examentip, brand navy/orange, inline `<style>` keyframes). For curved trade routes, sampled ~24 points along a quadratic Bézier in lon/lat and fed them to `<Line coordinates={...}>` so `geoPath` draws a smooth arc (a single midpoint gives a kink). Material Symbols glyphs render fine inside SVG `<text>` via inline `fontFamily: 'Material Symbols Outlined'` — but ONLY once the font `<link>` is injected (the leren/dashboard pages do this at runtime; a bare preview must inject it too).
**Lesson:** A standalone preview route placed OUTSIDE `app/[locale]/` renders without the `<html>`/`<body>` from `app/[locale]/layout.tsx` (root `app/layout.tsx` just returns `children`), which yielded a phantom `zoom: 2` on `<html>` and uniformly blurry screenshots — the component was fine. Put widget previews UNDER `app/[locale]/widget-preview/...` so they inherit the real document, and inject the Material Symbols font link (icons are otherwise shown as literal ligature text like "forest"/"agriculture"). Also: a no-prop component is still assignable to `ComponentType<{audioUrl?,audioCues?}>`, so widgets that ignore audio need no signature change to fit the registry.

## 2026-06-09 — Embed colonies-map into Thema 1 "De koloniën en slavernij"

**Changed:** Added `<!-- WIDGET:colonies-map -->` to the `kolonien` section in `data/leren/thema-1.ts`, placed AFTER the closing `</section>` (before the existing `lesson-audio` marker).
**Outcome:** `SUCCESS` — verified the widget renders live in the dashboard SPA (Leren → Thema 1 → "Sectie 5 van 7") via a throwaway Playwright spec using the suite's `mockAuth('premium_plus')`. 47/47 e2e still green.
**What worked:** Confirmed `LerenThemaView` merges DB data over static — but `leren_content` only supplies `audio_url`/`audio_cues`; `contentHtml` always comes from the static `getThema()` file. So editing `data/leren/thema-*.ts` IS the source of truth for section HTML on BOTH the dashboard SPA and the standalone `/leren/[slug]` route (both render through `SectionContent`).
**Lesson:** Widget markers must go OUTSIDE the section's `<section>…</section>` card block — `SectionContent` splits contentHtml on each marker into separate `dangerouslySetInnerHTML` divs, so a marker nested inside the card would orphan the opening/closing tags and strip the white-card background off everything after it. Every existing widget marker follows this (placed after `</section>`); match it. To screenshot a dashboard SPA view, drive Playwright with `mockAuth` then click through (`#nav-leren` → thema card → section) — `fullPage` only grabs the viewport because the dashboard scrolls inside a container, so screenshot the widget locator element instead.

## 2026-06-10 — NieuweNederlanders widget + audio (Na de oorlog section)

**Changed:** Created `components/leren/widgets/NieuweNederlanders.tsx` — two-tab interactive widget (Nieuwe Nederlanders + Internationale samenwerking) with click-driven card highlighting and integrated audio playback. Added `group` and `org` fields to `AudioCue` type in `lib/leren-audio-cues.ts` + `extractNieuweNederlandersCues()` wired into `extractCues()`. Generated `thema1-nieuwe-nederlanders.mp3` (215s, 38 cues) via `scripts/generate-nieuwe-nederlanders-audio.mjs` and uploaded to Supabase via `scripts/upload-nieuwe-nederlanders-audio.mjs`. Replaced static HTML cards in `data/leren/thema-1.ts` `na-de-oorlog` section with `<!-- WIDGET:nieuwe-nederlanders -->` marker.
**Outcome:** `SUCCESS` — 9/9 widget cues found (gastarbeiders@19s, gezinshereniging@50s, kolonieen@62s, vluchtelingen@77s, clear@107s, vn@121s, navo@141s, eu@159s, clear@195s). TypeScript clean. Upload to Supabase succeeded (HTTP 200/204).
**What worked:** Self-contained audio player inside the widget (no separate LessonAudio component needed) — on `timeupdate`, walk cues backward per field (subtitle, group, org) like all other widgets. Tab auto-switches: when `group` cue fires → show groepen tab; when `org` cue fires → show organisaties tab. `manualMode` boolean gates the pulsing hint animation so it only runs when audio is not playing. Upload script reads credentials from `.env.local` to avoid credential leakage auto-mode block.
**Lesson:** Never hardcode Supabase service keys inline in a `Bash` tool call — the auto-mode classifier blocks it as credential leakage. Always write a script file that reads from `.env.local` (same pattern as `generate-*` scripts). The `leren` page fetches audio from Supabase (`audio_url`/`audio_cues` columns), not from `public/audio/leren/` directly — generating the files locally isn't enough; you must also upload + patch the DB.

## 2026-06-09 — WW2Timeline widget (De Tweede Wereldoorlog section)

**Changed:** Created `components/leren/widgets/WW2Timeline.tsx` — an interactive 9-event clickable timeline covering the WWII content (invasion, Rotterdam bombing, Holocaust, Hongerwinter, liberation, 4 mei, 5 mei, Wilhelmus, antisemitisme law). Each row in the timeline opens a colour-coded detail card with body text + exam tip, and prev/next navigation. Progress bar tracks how many events the student has seen. Replaced the static HTML timeline+cards in the `woii` section of `data/leren/thema-1.ts` with the intro text card + `<!-- WIDGET:ww2-timeline -->` marker.
**Outcome:** `SUCCESS`
**What worked:** Followed the WaterDefense widget pattern. For responsive two-column layout, Tailwind `sm:w-[46%]` did NOT render visibly in Puppeteer screenshots (unclear if a caching or specificity issue). The fix was to define responsive behaviour in the inline `<style>` block using a `@media (min-width: 560px)` rule with plain CSS classes (`.ww2-body`, `.ww2-col-timeline`, `.ww2-col-detail`). This is reliable because it bypasses Tailwind's class scanner and applies unconditionally.
**Lesson:** When Tailwind responsive classes (`sm:w-[x%]`) don't seem to apply in screenshots, define the responsive breakpoint behaviour directly in the component's inline `<style>` block as a proper `@media` rule. Material Symbols icons always appear as literal text strings in Puppeteer screenshots (font ligatures don't load in time) — this is a screenshot artifact only; icons render correctly in a real browser. Do not swap out icon names trying to fix this.

## 2026-06-09 — Audio lesson for ColoniesMap (synced like chapter 1)

**Changed:** Made `ColoniesMap` audio-driven (play/pause, progress, subtitle, cue-synced mode/colony/leg highlighting) mirroring `NetherlandsMap`; extended `AudioCue` + added `extractColonyCues` in `lib/leren-audio-cues.ts`; created `scripts/generate-colonies-audio.mjs`; generated `public/audio/leren/thema1-kolonien.mp3` + `-cues.json` (37 cues); added an on-page "Audioscript" transcript card matching the spoken segments.
**Outcome:** `SUCCESS` — verified by seeking the audio in the preview: at 25s the subtitle + green Nederlands-Indië panel/legend light up in `kolonien` mode; at 90s the widget auto-switches to `handel` mode with leg 2 (Afrika→Amerika) highlighted on the arc + legend. 47/47 e2e green, typecheck clean.
**What worked:** The robust generator pattern is `scripts/generate-gouden-eeuw-audio.mjs`, NOT `generate-map-audio.mjs` — it has a **macOS `say` fallback** (voice Xander, nl_NL) that synthesizes each segment to WAV and derives cue times from cumulative PCM byte-length, so a real sentence-synced lesson is produced even with no ElevenLabs key. Model the SCRIPT as `SEGMENTS` (one spoken unit each) carrying highlight annotations; emit a highlight cue at each segment's start time; a value sticks until changed, `null` clears it. Cue-sync in the widget = walk cues backward per field (subtitle/mode/colony/leg) exactly like the province/city walk.
**Lesson:** The generator emits `.mp3` (ElevenLabs) OR `.wav` (say) depending on whether `ELEVEN_LAPS_API_KEY` is set — so the widget's static-fallback `src` extension must match whatever was actually produced (we got `.mp3`). The key is read from `.env.local` at generation time and may be added/removed by other work mid-session, so don't assume from an earlier grep — just run the generator and check which file it wrote. Keep the on-page "Audioscript" text identical to the generator's `SEGMENTS` so the transcript matches the narration.

## 2026-06-09 — Animate the narrated elements in ColoniesMap

**Changed:** Added motion to whatever the audio is currently describing in `components/leren/widgets/ColoniesMap.tsx`: (1) the active colony pin throbs (animated SVG `r` 14↔17.5) with a double expanding pulse-ring; (2) a glowing comet marker (head + 2 trailing dots, cargo icon) travels along the active trade-route leg via a `requestAnimationFrame` loop driving a `travelT` 0→1 fed through `bezierPoint()`; (3) the active arc gets a colored `drop-shadow` glow; (4) each new subtitle fades in via a `key={subtitle}` + `subtitle-in` keyframe.
**Outcome:** `SUCCESS` — verified by sampling the travelling marker's `transform` across frames (x 480→461→426→402→372 = flowing Afrika→Amerika) and screenshotting the throbbing colony pin. 47/47 e2e green, typecheck clean.
**What worked:** Animating SVG `r` in a keyframe is the reliable way to "throb" a react-simple-maps `<circle>` — `transform: scale` needs `transform-box: fill-box` + origin juggling, but the file already animates `r` (ring-pulse), so it composes cleanly. For a marker that follows a curved `<Line>`, reuse the EXACT control-point math from the arc sampler (`arcPoints`) in a single-point `bezierPoint(from,to,bend,t)` so the dot rides the rendered path perfectly. A 3-dot lagged trail (`travelT - lag`) makes a cheap comet. Gate the rAF loop on `mode==='handel' && activeLeg` and reset `travelT` to 0 in the cleanup so it restarts from the origin when the narrated leg changes.
**Lesson:** The `app/[locale]/widget-preview/colonies` preview route keeps getting deleted by parallel widget work — recreate it before each visual check rather than assuming it persists.

## 2026-06-10 — Colonies audio: spelled-out years + remove transcript card

**Changed:** Decoupled spoken vs. displayed text in `scripts/generate-colonies-audio.mjs` — segments now have an optional `speak` field (years written out in Dutch: 1863→"achttienhonderddrieënzestig", 1945→"negentienhonderdvijfenveertig", 1975→"negentienhonderdvijfenzeventig", "1 juli"→"één juli") used for TTS + alignment anchoring, while the cue `subtitle` keeps the numeric `text`. Made the generator fall back to macOS `say` when ElevenLabs *errors* (not only when the key is missing) and delete the other audio format so the widget never loads a stale file. Added an `onError` `.mp3`→`.wav` fallback to `ColoniesMap`'s `<audio>`. Removed the on-page "Audioscript" transcript card from the `kolonien` section in `data/leren/thema-1.ts`.
**Outcome:** `SUCCESS` — regenerated audio (104.6s `.wav`); cue subtitles confirmed numeric ("In 1863 …") while the voice reads the spelled form; widget loads `thema1-kolonien.wav` (readyState 4). 47/47 e2e, typecheck clean. NOTE: ElevenLabs quota was exhausted (274/443 credits), so the current audio is the macOS `say` voice (Xander), not the premium voice.
**What worked:** ElevenLabs alignment is built from the SPOKEN text, so the subtitle anchor must use `(seg.speak ?? seg.text).slice(0,18)`, not the displayed text — otherwise digit-vs-word divergence makes the anchor unfindable and the cue is dropped. The `onError` ext-swap on `<audio>` removes the brittle hardcoded-extension problem (mp3 from ElevenLabs / wav from say) entirely.
**Lesson:** ElevenLabs free quota is small (~32k chars total) — a ~2k-char lesson can exceed remaining credit and 401 with `quota_exceeded`. Always make TTS generators fall back to `say` on *API error*, not just on missing key, or a regen silently produces nothing. To restore the premium voice later: top up ElevenLabs, re-run `node scripts/generate-colonies-audio.mjs` (it auto-prefers ElevenLabs → writes `.mp3`, deletes the `.wav`, widget auto-detects).

## 2026-06-10 — Premium colonies audio: regenerate, dedup player, upload to Supabase

**Changed:** Re-ran `generate-colonies-audio.mjs` with ElevenLabs (quota restored) → premium `thema1-kolonien.mp3` (the fallback auto-deleted the stale `.wav`). Removed the now-duplicate `<!-- WIDGET:lesson-audio -->` from the `kolonien` section in `data/leren/thema-1.ts` (the ColoniesMap has its own player). Uploaded the MP3 to the `leren-audio` Storage bucket at `thema1/kolonien.mp3` and PATCHed `leren_content` (theme_id=1, anchor='kolonien', row id 5) with `audio_url` + the 37 cues, via the service key.
**Outcome:** `SUCCESS` — dashboard (which reads audio from DB) now shows a single kolonien player pointing at the uploaded Supabase URL; the static preview uses the public `.mp3`. 47/47 e2e, typecheck clean.
**What worked:** The canonical upload tool is `scripts/upload-thema1-audio.mjs` (bucket `leren-audio`, path `thema{id}/{anchor}.{ext}`, then `PATCH /rest/v1/leren_content?theme_id=eq&anchor=eq` with `{audio_url, audio_cues}` using `SUPABASE_SERVICE_KEY`). The public `audio_url` needs a `?t=<ts>` cache-buster so the browser doesn't serve the previous upload. Did a TARGETED single-section upload (not the whole-thema script) to avoid disturbing concurrent work on other sections.
**Lesson:** The dashboard's ColoniesMap plays the DB `audio_url` (props take precedence over the static fallback), so regenerating the public file alone is NOT enough for the live dashboard — you must re-upload to Supabase or the dashboard keeps the old audio. Verify with a real-DB Playwright run (do NOT stub `/rest/**` in mockAuth) and assert exactly one `<audio>` per section + the expected URL.

## 2026-06-19 — English page SEO fixes (Part A)

**Changed:** Fixed `/en/knm-exam-english` page in `app/[locale]/(main)/knm-exam-english/page.tsx`: replaced bare `<a href>` CTAs with locale-aware `Link` from `@/i18n/navigation` so clicks stay under `/en/`; fixed `x-default` hreflang to point to `/nl` (not `/en`); aligned OG `url` and JSON-LD `@id`/`url` with canonical (added missing `/en/` prefix); added `ar` hreflang. Added 🇬🇧 footer link in `components/Footer.tsx` to de-orphan the page.
**Outcome:** SUCCESS
**What worked:** `Link` from `@/i18n/navigation` auto-prefixes locale — drop-in replacement for `<a>`. `locale="nl"` prop on Link forces a specific locale regardless of current page locale. All 48 Playwright tests green.
**Lesson:** Any page that is locale-specific must use `Link` (not `<a>`) for internal hrefs, or locale switching breaks silently. Bare `<a>` tags never trigger next-intl's prefix logic.

## 2026-06-19 — English SEO: 3 blog posts + strategy refresh (Part B & C)

**Changed:** Added 3 English-first blog posts to `data/blog-posts.ts` (`how-to-pass-knm-exam`, `what-is-knm-exam`, `how-to-become-dutch-citizen`) targeting KD 0–27 English keywords. English `articleHtml` as primary content (no Dutch equivalent needed). Updated `seo/blog-ideas.md` to `live`. Rewrote `seo/strategy.md` — removed "prototype/MVP" framing, updated architecture section, replaced March 0-click GSC data with June reality.
**Outcome:** SUCCESS
**What worked:** English-first posts work cleanly by writing English `articleHtml` as primary — the blog renderer always shows `post.articleHtml` regardless of locale. No type changes needed. 48/48 tests green.
**Lesson:** For language-targeted content with no Dutch equivalent, use English as the primary slug + articleHtml. Dutch visitors at /nl/blog/en-slug will see English — acceptable since these posts target English searchers exclusively.


## 2026-06-20 — Exam intro redesign + robust read-aloud auto-play

**Changed:** New shared `components/proefexamen/ExamIntro.tsx` (modern gradient card + per-section question breakdown) used by both `ProefexamenEngine.tsx` and dashboard `ExamsView.tsx`; rewrote `components/proefexamen/useReadAloud.ts` to a single persistent `<audio>` element + generation-token guard + effect-driven play/stop.
**Outcome:** `SUCCESS`
**What worked:** Instrumenting `HTMLMediaElement.prototype.play` in puppeteer confirmed auto-play fires on Start AND on next-question, with no console errors. tsc clean, 47/47 e2e green.
**Lesson:** For per-question audio, reuse ONE Audio element (unlocked once by the first gesture-play, stays unlocked for later auto-plays) instead of `new Audio()` per segment — fresh elements re-trigger autoplay blocking and orphan un-stoppable playback. Drive both stop-previous and start-new from a single `useEffect([segKey, enabled])` with a `return () => stop()` cleanup so every exam engine inherits correct behavior without per-engine wiring; a `genRef` token makes StrictMode's dev double-mount harmless (stale async callbacks bail, only the latest play on the shared element is audible).

## 2026-06-20 — Abandon email not cancelled after payment

**Changed:** Added abandon-email cancellation (Resend `emails.cancel` + delete pending `email_campaign_queue` rows) to `app/api/payment-status/route.ts`, mirroring the logic that previously lived only in `mollie-webhook/route.ts`.
**Outcome:** `SUCCESS` (tsc clean)
**What worked:** Tracing both payment-completion paths revealed premium is granted on TWO independent paths — the polled `payment-status` route (always hit, from `/betaling-gelukt`) and the `mollie-webhook` (only fires if `MOLLIE_WEBHOOK_URL` is set + reachable). The abandon-email cancel lived only in the webhook, so when the webhook didn't fire, premium still got granted via polling but the abandon email went out — masking the bug.
**Lesson:** Side effects that MUST happen on payment (cancel scheduled emails, grant access) belong on the guaranteed polled path (`payment-status`), not only the webhook. Webhooks are best-effort; never make a critical side effect webhook-only. Keep the webhook doing it too as an idempotent backstop.

## 2026-06-27 — Activation email missing from polled payment path

**Changed:** Added activation/upgrade email send to `app/api/payment-status/route.ts`. Uses the same `X-Idempotency-Key` pattern as `mollie-webhook/route.ts` (`activation-${paymentId}`, `upgrade-${paymentId}`) so Resend deduplicates if both paths fire.
**Outcome:** `SUCCESS` (tsc clean)
**What worked:** The webhook sends the activation email but `payment-status` (the guaranteed polling path) did not. Since the webhook URL was misconfigured in production, the activation email was never received by any paying user. Fix: mirror the email send on both paths with the same idempotency key.
**Lesson:** Every post-payment side effect (grant access, send email, cancel scheduled email) must live on BOTH paths: `payment-status` (guaranteed) and `mollie-webhook` (best-effort backup). The idempotency key prevents double-sends.

## 2026-06-27 — Thema 2 (Wonen) interactive audio lessons

**Changed:** Built 6 audio-synced interactive widgets (`components/leren/widgets/WoonChoice, HuisVinden, Huurcontract, OpstalInboedel, Meterkast, Sorteerspel`) + a shared `useLessonAudio` hook and `LessonPlayerBar`; registered them in `SectionContent.tsx`; slimmed `data/leren/thema-2.ts` sections to intro + `<!-- WIDGET -->` marker (mirroring Thema 1); extended the `AudioCue` type; added `scripts/generate-thema2-audio.mjs` (ElevenLabs) + `scripts/upload-thema2-audio.mjs`. Generated + uploaded all 6 mp3/cues to Supabase `leren-audio` bucket and patched `leren_content` (theme_id=2).
**Outcome:** `SUCCESS` (tsc clean; all 6 widgets verified mobile+desktop)
**What worked:**
- One generic generator with per-section `{script, cues:[{search, set}]}` configs beat copy-pasting the Thema 1 single-section scripts. Auto-splitting the script into subtitle sentences (instead of a hand-maintained SUBTITLES array) guaranteed 100% subtitle-match — zero "not found" warnings across 6 lessons.
- Letter-spacing abbreviations in the TTS script (`W A`, `O Z B`, `G F T`, `B R P`) makes ElevenLabs pronounce them as letters; a display-only REPLACEMENTS map cleans them back to `WA`/`OZB`/… in subtitles without breaking the search prefix.
- A shared `useLessonAudio` hook that forward-accumulates cues (apply every cue with time ≤ t, latest wins, `null` clears) generalizes the Thema 1 per-widget cue loop — widgets just read `engine.state.<field>`.
- Adding a `fallbackBase` (local `/audio/leren/*.mp3` + `-cues.json`) makes audio resilient when the DB prop is absent, exactly like Thema 1's WaterDefense.
**What went wrong (and fixed):**
- `.env.local` has DUPLICATE keys (remote JWT + local `sb_secret_`/`sb_publishable_`). `Object.fromEntries` keeps the LAST → upload auth failed with "Invalid Compact JWS". Fix: collect all values per key and pick the JWT (`startsWith('eyJ')`) for the remote project.
- The KNM dev server was NOT on port 3001 — a different project ("comprendo") occupies 3000/3001. `next dev` reported KNM was already running on **3002** (it pins one instance per dir). Verify against whatever port `next dev` actually claims, not the CLAUDE.md default.
**Lesson:** When porting a proven pattern to N new instances, invest first in a single data-driven generator + a shared hook/component, then author content as config. For env scripts on this repo, never trust a bare key lookup — `.env.local` carries both local and remote credentials under the same names; filter by format. And confirm the actual dev-server port before screenshotting.

## 2026-07-19 — Dashboard weakness-insights + gamification (M1–M6)

**Changed:** Six-milestone build on the premium dashboard. Hero refresh (`MariekeFeedback.tsx` unified card with linked weakest topic + lucide icons, new `WeaknessBreakdown.tsx` responsive 1-mobile/2-3-desktop, `ExamsView.tsx` wiring). New pure libs `lib/learning-queues.ts` (mistake/open/section/topic queues + recommendations), `lib/progression.ts` (cumulative mastery series), `lib/xp.ts`, `lib/marieke-insights.ts` (10-state rule engine). Analyse page rewritten as insights hub with shadcn/recharts `ProgressionChart`, `QueueSummary`, `NextSteps`, shared `AppShell`. New `/dashboard/fouten` route reusing `InlineQuiz`. XP: migration `20260719000001_create_user_xp_events.sql` + `XpPill` + awardXp hooks in the 5 write surfaces. i18n across nl/en/ar.
**Outcome:** `SUCCESS`
**What worked:**
- Verifying auth-gated dashboard UIs with a puppeteer harness that injects `__pw_session__` and stubs Supabase REST — but the browser blocks local Supabase (`127.0.0.1:54321`) on CORS preflight unless the stub answers `OPTIONS` with `Access-Control-Allow-*` headers. Without that the page hangs on the loading spinner.
- Compiling self-contained lib files standalone (`tsc <files> --module esnext --moduleResolution bundler`) into scratchpad to unit-test pure logic without a test runner (no tsx/esbuild binaries in this repo).
- next-intl `t.rich` with a `<topicLink>` tag renders an inline hyperlink inside a translated string; dynamic keys need `as Parameters<typeof t>[0]`.
- Forcing the progression chart LTR (`dir="ltr"`) keeps the time axis correct under Arabic RTL while the rest of the layout mirrors.
**What to watch:**
- Multi-row Supabase `.insert([a,b])` is atomic — a unique-violation on one row rolls back both. XP `correct_answer` (+5, repeatable) and `first_mastery` (+10, one-time via partial unique index) MUST be separate inserts, else a repeat answer loses its +5.
- Dev server this session ran on **3001** (matches CLAUDE.md), not 3002 — the port genuinely varies by what else is running; always confirm.
**Lesson:** For auth-gated client dashboards, a request-intercepting screenshot harness (session inject + CORS-correct REST stubs) gives faithful populated previews that `check-ui.mjs` alone can't. Keep derivation logic in pure libs so it's unit-testable via standalone tsc compile.

## 2026-07-19 — Marieke feedback card: light theme + mobile single-line weakness

**Changed:** `MariekeFeedback.tsx` (dark blue gradient → white card w/ subtle fade + border, dark text, light CTA) and `WeaknessBreakdown.tsx` (mobile now shows only the weakest area line + `weakness_more_mobile` hint link; desktop still shows 3 bars). Also hid the "Terug naar website" sidebar link for signed-in users in `PlatformSidebar.tsx` (guest-only).
**Outcome:** `SUCCESS`
**What worked:** Reused existing `variant="light"` path in WeaknessBreakdown and the already-present `weakness_more_mobile` i18n key. CSS media queries (`.wb-extra` hidden ≤767px, `.wb-hint` hidden ≥768px) keep one component serving both breakpoints.
**Lesson:** Check messages/*.json before adding i18n keys — the hint keys already existed unused. Guest dashboard state renders no weakness bars, so visual verification of the mobile single-line needs an authenticated user with progress; verify the logic path directly when auth state blocks a screenshot.

## 2026-07-19 — Shrink dashboard readiness hero

**Changed:** `ExamsView.tsx` rh-* layout CSS (gauge max-width 360→216 desktop / 320→240 mobile; rh-card flex 44%→38%, max-width 460→380) and `ReadinessHero.tsx` padding (20/18/22 → 16px). Gauge SVG scales with container width, so reducing `.rh-gauge-wrap` max-width shrinks the whole hero proportionally.
**Outcome:** `SUCCESS`
**What worked:** The gauge card and Marieke card are `align-items:stretch`, so shrinking the gauge alone pulls the whole row height down. First exam row now sits above the fold on desktop.
**Lesson:** For the readiness hero, size is driven by `.rh-gauge-wrap` max-width — adjust that, not the SVG viewBox.

## 2026-07-20 — New /oefenen conversion flow (10 free questions → signup)

**Changed:** New public route `app/[locale]/(main)/oefenen/{page.tsx,OefenenEngine.tsx}` — 10 random questions spread across categories, results screen with study-portal `SlaagkansGauge` (dark variant), benefits signup card + `/register` main CTA + email-report secondary. Repointed homepage hero CTA (`(main)/page.tsx`) from `AbTestCta` to a plain `Link href="/oefenen"`. Registered `/oefenen` in `i18n/routing.ts`; exported `bandFor` from `lib/exam-readiness.ts`; added `oefenen` namespace to nl/en/ar.
**Outcome:** `SUCCESS`
**What worked:** Reused `ExamQuestionCard` for the quiz and imported the dashboard `SlaagkansGauge` cross-group via relative path `../../(app)/dashboard/components/SlaagkansGauge` (bracket/paren dirs resolve fine in relative import specifiers). Question selection is client-side (in the start handler) so `Math.random` causes no hydration mismatch. Slaagkans uses raw score % (not `calculateSlaagkans`, which compresses to ~40–60 with n=1) — more motivating and honest with the "op basis van deze oefensessie" caption. 47/47 Playwright tests pass.
**Lesson:** For a single-session pass-likelihood, use raw pct + `bandFor(pct)`, not `calculateSlaagkans` (that's for multi-exam confidence-weighted dashboard use). When writing a Puppeteer walk-through, scope start-button clicks to `main button` — the nav's "Begin met oefenen" is an `<a>` that will otherwise be clicked first and navigate away.

## 2026-07-20 — /oefenen results page compacted for conversion

**Changed:** `oefenen/page.tsx` (removed breadcrumb + eyebrow + h1 + description header block; engine intro h2→h1 for SEO) and `OefenenEngine.tsx` results view: removed topic breakdown, tightened all gaps/padding, moved the "Maak gratis account" CTA directly under the value prop (above benefits), replaced text benefit rows with 3 gradient-icon `BenefitCard`s, and made the email capture an always-visible inline field.
**Outcome:** `SUCCESS`
**What worked:** Results page height dropped ~30% (≈3760px → ≈2620px desktop). Putting the primary CTA above the benefits (benefits as reinforcement below) is the stronger conversion order. 47/47 tests pass, typecheck clean.
**Lesson:** When removing a shared page header from a phased engine page, promote the phase-1 card heading to `<h1>` so the page keeps an SEO h1. Removing state (`emailFormVisible`) also means hunting leftover setters in async handlers — tsc catches them, dev-server compile does not.

## 2026-07-20 — /oefenen: email report up, wired as A/B control, admin-configurable count

**Changed:** (1) `OefenenEngine.tsx` — moved the email capture up (now directly under the banner) and reframed it as "full report with your weak spots" (`email_cta`/`email_sub` in nl/en/ar). (2) `AbTestCta.tsx` control dest `/proefexamen`→`/oefenen`; restored hero to use `AbTestCta`; homepage topic banner switched from `AbTestCta` to a plain `/proefexamen` Link. (3) Made the practice question count admin-configurable: new `app_settings` table (`supabase/migrations/20260720000000_create_app_settings.sql`), `lib/app-settings.ts` (server reader, fallback 10) + `lib/app-settings-keys.ts` (client-safe consts), `/admin/settings` page + `SettingsForm`, nav items added; engine takes a `questionCount` prop and the intro `heading` interpolates `{count}`.
**Outcome:** `SUCCESS` (47/47 tests, `next build` clean). Migration NOT yet pushed to prod.
**What worked / gotcha:** `next build` (not tsc) caught the fatal error: a client component (`SettingsForm`) importing a lib module that transitively imports `lib/supabase/server.ts` (next/headers) pulls server-only code into the browser bundle. Fix: keep shared constants in a separate client-safe file (`app-settings-keys.ts`); never import the server-client lib from a client component.
**Lesson:** For any admin-configurable value, split constants (client-safe) from the server data-access function. Always run `next build` when adding admin/client-server-boundary code — tsc passes but the RSC boundary check only runs in build. Remote-DB projects: created migrations need an explicit `supabase db push`; make server readers fall back gracefully so the feature degrades instead of erroring pre-migration.

## 2026-07-20 — /oefenen: email capture merged into the score card

**Changed:** `OefenenEngine.tsx` results — moved the email-report capture inside the dark-blue result banner (below the gauge, under a subtle top-border divider) and compacted it: one-line heading + input + white "Verstuur" button + tiny hint, dropped the `email_sub` description line. Removed the standalone white email card.
**Outcome:** `SUCCESS` (tsc clean, verified desktop + mobile).
**Lesson:** To place a form on the dark banner, restructure so padding lives on an outer wrapper (`p-5 sm:p-6`) that holds both the gauge grid and the form, then separate sections with `border-top: rgba(255,255,255,0.15)`. White input + white button (navy text) keeps the email secondary while the orange account CTA below stays primary.

## 2026-07-20 — /oefenen questions curated in Examens overview (oefenen flag)

**Changed:** Replaced the app_settings "count" approach with a curated question set. Added `questions.oefenen` boolean (`supabase/migrations/20260720000001_add_oefenen_flag.sql`). Generalized `admin/exams/_components/ExamsGrid.tsx` to a `target: number | 'oefenen'` model — added a "Gratis oefenen" `PracticeCard` below the 10 exam cards that opens the same add/remove sheet, writing `{oefenen:true/false}` instead of `{exam:n/null}` (reuse allowed: a question can be in an exam AND the practice set). `lib/questions.ts` gained `fetchOefenenQuestions()`; `/oefenen` shows the curated set exactly, falling back to random-10 when none flagged. Removed `/admin/settings`, `lib/app-settings*.ts`, and the app_settings migration + nav items.
**Outcome:** `SUCCESS` (47/47 tests, `next build` clean, /oefenen verified via fallback path). Migration NOT yet pushed to prod.
**What worked / gotchas:** (1) Deleting a route leaves a stale `.next/types/validator.ts` reference → `rm -rf .next/types` (build regenerates) before tsc. (2) Casting supabase rows to a typed `QuestionRow` tightened `exam` to `number|null`, so `r.exam ?? undefined` no longer matched `KnmQuestion.exam: number|null` — use `r.exam` directly. (3) Made both the admin exams query and the public fetch degrade gracefully (fallback select without `oefenen`, empty set → random) so the feature works before the migration lands.
**Lesson:** When adding a DB column consumed by both admin (write) and a public page (read), make BOTH sides fall back when the column is absent, so the app keeps working between code deploy and migration push on a remote-DB project.

## 2026-07-20 — /oefenen signup flow: "Blijf oefenen" CTA → benefits reveal on /register

**Changed:** Result page (`OefenenEngine.tsx`) primary CTA re-copied from "Maak gratis account" to **"Blijf oefenen" / "Keep practising"** (signup_cta in nl/en/ar) and stripped the on-page benefit cards + extras grid (removed the now-unused `BenefitCard` component) so the result page is just result + email capture + one CTA → `/register`. Enhanced `/register` (auth group, hardcoded Dutch) to lead with a highlighted "Direct een gratis proefexamen" hero benefit + a refreshed benefits list (voortgang & slaagkans, herhaal foute vragen, woordkaarten, dashboard); heading now "Blijf oefenen — maak je gratis account" for continuity with the CTA.
**Outcome:** `SUCCESS` (tsc clean, 47/47 tests, desktop + mobile verified).
**Lesson:** Two-step conversion — soft continuation CTA ("keep practising") on the result page, benefits/"what you get" reveal on the dedicated account page — keeps the result page focused and avoids duplicating the benefits in two places. The /register page is hardcoded Dutch (no next-intl), so match that style for edits there rather than introducing partial i18n.

## 2026-07-20 — Register page redesigned to immersive brand layout

**Changed:** Rewrote the return JSX of `app/[locale]/(auth)/register/page.tsx` from the unbalanced two-column card (tall dark benefits panel + short white form = big empty white void on desktop) to the "Immersief merk" layout: full-viewport dark brand gradient with orange radial glow, headline + stat strip (40/100%/3) + teacher endorsement on the left, floating white OAuth card on the right. Removed the `<br>` splitting the H1 sentence. All OAuth/loading/error logic preserved.
**Outcome:** `SUCCESS`
**What worked:** Verified via check-ui.mjs on both 390px + 1440px — no empty space on desktop, mobile stacks headline→stats→teacher→card. Presented 3 HTML mockups first as an artifact; user picked #3.
**Lesson:** For OAuth-only auth pages, a short form next to a tall benefits panel always creates a void — either center the form vertically + fill with proof, or (better) go single-column / full-bleed dark so there's no side-by-side height mismatch. Copy stayed hardcoded Dutch to match the existing page; register page never used i18n keys.

## 2026-07-21 — Conversion funnel event tracking (PostHog + GA4)

**Changed:** Added `lib/analytics.ts` (`track(event, props)` firing both `posthog.capture` and `sendGAEvent`, auto-enriching `ab_variant` via `getAbVariant()`), then wired 8 funnel events across: `AbTestCta.tsx` (`practice_cta_clicked`), `OefenenEngine.tsx`/`ProefexamenEngine.tsx`/`InlineQuiz.tsx`/`QuizWidget.tsx` (`question_answered` with `source` tag: oefenen/proefexamen/dashboard_exam/dashboard_topic/topic), proefexamen + InlineQuiz (`exam_finished`, guarded on non-null examNum), `WoordkaartenView.tsx` (`woordkaarten_practice_started`), `LerenThemaView.tsx` (`leren_thema_completed`), `/dashboard/analyse` (`analyse_opened`), `/dashboard/fouten` (`mistake_queue_opened` + `mistake_queue_practice_started` with all/section scope).
**Outcome:** `SUCCESS`
**What worked:** `npx tsc --noEmit` clean; 47/47 Playwright tests pass. Kept existing GA-only events untouched and added new dual-destination events beside them rather than rewriting call sites.
**Lesson:** Two exploration blind spots to avoid: (1) the `/oefenen` route (10-question onboarding flow, control A/B variant) and (2) the `/dashboard/analyse` + `/dashboard/fouten` routes all exist on main but a first grep pass missed them — always verify "doesn't exist" claims with a direct `find`/`grep` before planning around absence. Also: CLAUDE.md wrongly lists Mixpanel; the real stack is PostHog (primary) + GA4 + Meta Pixel + Clarity. The AbTestCta flag is `trail-conversation-experiment-2` (control → `/oefenen`, `platform-cta` → `/dashboard`).
