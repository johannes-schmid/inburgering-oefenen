# COMPONENTS.md — Component Registry

Before creating any new component, check this list. Reuse always beats creating new.
If you build something genuinely reusable, add it here.

---

## Shared / Layout (`components/`)

| Component | File | When to use |
|---|---|---|
| `Nav` | `components/Nav.tsx` | Public top nav — only in `(main)/` layout. Never in platform/admin. |
| `Footer` | `components/Footer.tsx` | Public footer — only in `(main)/` layout. |
| `KnmLoader` | `components/KnmLoader.tsx` | Full-page branded loading state. Use on any page that waits for auth/data before rendering. |
| `LoadingSpinner` | `components/LoadingSpinner.tsx` | Inline spinner for buttons, lazy sections. |
| `GoogleAnalyticsTracker` | `components/GoogleAnalyticsTracker.tsx` | GA4 page-view tracking. Already wired in root layout — do not add again. |
| `ArticleContent` | `components/ArticleContent.tsx` | Renders blog post / article HTML body via `dangerouslySetInnerHTML`. Use for all blog post detail pages. |
| `FaqAccordion` | `components/FaqAccordion.tsx` | Expandable FAQ list. Use on any page with Q&A sections. |
| `HeroWordCard` | `components/HeroWordCard.tsx` | Vocabulary word card for hero/marketing sections. |

---

## Marketing / Homepage (`components/site/`)

Import via `@/components/site` barrel export.

| Component | When to use |
|---|---|
| `GradientHero` | Hero section with layered gradient background. Use at the top of every `(main)/` page. |
| `SectionHeader` | Section title + subtitle block. Use to introduce every major section on public pages. |
| `CTABanner` | Full-width call-to-action strip. Use at the bottom of marketing pages. |
| `FeatureCard` | Feature highlight with icon + description. Use in feature grids. |
| `ReviewCard` | Testimonial / student review card. Use in social-proof sections. |
| `Card` | Generic content card with consistent border/shadow. Use for any content grid. |
| `TeacherCard` | Teacher profile card (Marieke Schipper). Use on homepage and `/docent`. |
| `EyebrowBadge` | Small label above headings (e.g. "Gecertificeerd"). Use to add credibility signals. |
| `Breadcrumb` | Breadcrumb navigation. Use on blog posts and guide pages. |
| `SkillCard` | Per-onderdeel card (icon, counts, CTA). Use wherever the four onderdelen are listed. |
| `LogoMark` | The site logo mark. `surface="dark"` on the footer's primary background. |

---

## Kennisgidsen (`app/[locale]/(main)/_components/`)

Route-local, because only the guide and placeholder routes render them. All three take their
subject as a prop — `/inburgering`, `/knm` and `/taalexamens` are the same page with different
content, and must stay that way.

| Component | When to use |
|---|---|
| `GuideHub` | A guide section's hub. Renders the guide list, the section's own orientation (which is what a hub with no reviewed guides shows), related blog posts and the funnel. Per-section differences live in `SECTION_CARDS` and `HUB_POSTS`, never in a branch. |
| `GuideArticle` | One guide: hero, `ArticleContent` body, FAQ, the draft notice, the reviewed-by line, sidebar and CTA. Emits `Article` + `BreadcrumbList` + `FAQPage` JSON-LD — and nothing at all for a draft. Every URL it renders comes from `guideHref()`. |
| `PlannedSurface` | A page announced in the nav but not built yet (`data/planned-surfaces.ts`): the tijdlijn-maker, the woordenlijsten, grammatica. States what it will do, what it will be built from, and links to what already exists. **Emits no JSON-LD**, and its route is `noindex` and absent from the sitemap. Use this rather than writing another "binnenkort" page. |

---

## shadcn/ui Primitives (`components/ui/`)

Always use these for form elements, buttons, and base UI. Never roll a custom button/input.

`Button` · `Input` · `InputGroup` · `Label` · `Textarea` · `Select` · `Checkbox` · `Badge` · `Card` · `Carousel` · `Toggle` · `ToggleGroup` · `Avatar` · `Popover` · `DropdownMenu` · `Sheet` · `Skeleton` · `Spinner` · `Separator` · `Table` · `Chart`

---

## Admin Data Grid (`components/reui/`)

| Component | When to use |
|---|---|
| `DataGrid` (`data-grid/data-grid.tsx`) | Every admin list view (questions, woordkaarten, etc.). Supports sorting, filtering, pagination, row click, DnD. Always use this — never build a custom table for admin. |
| `reui/badge.tsx` | Status badge with review-status variants. Use in admin for `pending`/`validated` pills. Different from shadcn `Badge`. |
| `reui/frame.tsx` | Frame wrapper used by DataGrid — typically not used directly. |

**Setup note:** ReUI registry must be in `components.json` as `"@reui": "https://reui.io/r/{style}/{name}.json"`. When adding new ReUI components, run `shadcn add` with `yes N |` to skip overwriting existing primitives.

---

## Learning Platform (`components/leren/`)

| Component | When to use |
|---|---|
| `SectionContent` | Renders a leren section's body content. Use in `/leren/[slug]` and `LerenThemaView`. |
| `StepTimeline` | Timeline visualization for thema steps/progress. Use in learning module pages. |

### Embeddable section widgets (`components/leren/widgets/`)
Drop into section content with an HTML comment marker `<!-- WIDGET:<id> -->`. Register new widgets in `SectionContent.tsx` **and** admin `_WidgetNode.tsx`. All accept optional `{ audioUrl?, audioCues? }`.

| Widget id | Component | What it renders |
|---|---|---|
| `netherlands-map` | `NetherlandsMap` | Interactive map of the 12 provinces + capital cities, audio-synced |
| `colonies-map` | `ColoniesMap` | World map of the former Dutch colonies + the triangular slave trade (two toggle modes), for "De koloniën en slavernij" |
| `trade-routes-map` | `TradeRoutesMap` | World map of the VOC trade routes (Amsterdam → east to Azië around Africa, west to Amerika), with clickable trade-good markers + a synced audio lesson (highlights the route/good as it plays), for "De Gouden Eeuw" |
| `lesson-audio` | `LessonAudio` | Audio player with synced subtitles |

---

## Exam Components (`components/proefexamen/`)

Shared across public proefexamen and dashboard. Always use these — never duplicate exam card markup.

| Component | File | When to use |
|---|---|---|
| `ExamQuestionCard` | `components/proefexamen/ExamQuestionCard.tsx` | Renders a single question card (framed image, "Lees voor" pill with EQ animation, word-by-word highlight, A/B/C options with reading glow, inline feedback). Use in every exam surface. Props: `question`, `questionNumber`, `selected`, `onSelect`, `audioEnabled`, `showFeedback`. |
| `ExamAudioCheck` | `components/proefexamen/ExamAudioCheck.tsx` | "Test je geluid" start-screen widget — plays a sample audio track, toggles global audio on/off (localStorage). Embed in every exam intro. Props: `sampleUrl`. |
| `ExamIntro` | `components/proefexamen/ExamIntro.tsx` | Shared exam start-screen card (gradient header, stat pills, per-section question breakdown computed from the exam's questions, embedded `ExamAudioCheck`, teacher row, Start button). Used by both public `ProefexamenEngine` and dashboard `ExamsView`. Props: `questions`, `sampleUrl`, `onStart`, `labels`, optional `teacherHref`/`secondaryAction`. |
| `useReadAloud` | `components/proefexamen/useReadAloud.ts` | Hook for sequential-track audio playback with word-by-word highlight. Takes segments `{url, text}[]` and `enabled`. Returns `{reading, activeSeg, activeWord, toggle, stop}`. |
| `useAudioEnabled` | `lib/audio-pref.ts` | Global audio-on/off preference via localStorage. Returns `[enabled, setEnabled]`. Syncs across tabs. |

---

## Platform — Dashboard Views (co-located in `app/[locale]/(app)/dashboard/components/`)

These are view-level components for the dashboard, not general-purpose. Don't use them outside `(app)/`.

| Component | What it renders |
|---|---|
| `ExamsView` | Proefexamen cards grid (free exam 1 + locked/unlocked premium exams) |
| `LerenView` | Thema overview grid (locked/unlocked per plan) |
| `LerenThemaView` | Single thema learning content |
| `WoordkaartenView` | Vocabulary flashcard practice (overview → list → deck) |
| `InlineQuiz` | Inline quiz widget embedded in dashboard |
| `ProfileView` | User profile, plan info, account settings |
| `PlatformSidebar` | Sidebar nav (desktop) + bottom tab bar (mobile). Only in `(app)/layout.tsx`. |

---

## Admin — Page-level Components (co-located in `app/[locale]/(admin)/`)

Not general-purpose — only use within admin routes.

| Component | What it does |
|---|---|
| `QuestionForm` | Create/edit form for a KNM question (all fields + image + audio) |
| `QuestionsTable` | ReUI DataGrid implementation for the questions list with review-status filter |
| `WoordkaartForm` | Create-only form for a new vocabulary card (`woordkaarten/new`) |
| `WoordkaartenTable` | ReUI DataGrid + slide-in panel for editing vocab cards — audio generation (word + example sentence) and Pexels image picker, mirrors `QuestionsTable` |
| `ActivityLineChart` | Admin dashboard activity over time chart |
| `CategoryRadarChart` | Admin dashboard question category distribution |
| `QuestionsDonutChart` | Admin dashboard question count by status |

---

## Leren — Interactive Lesson Widgets (`components/leren/widgets/`)

Audio-synced interactive lessons rendered via `<!-- WIDGET:name -->` markers in `data/leren/thema-*.ts` (mapped in `SectionContent.tsx`). Each receives `audioUrl` + `audioCues` (overlaid from DB `leren_content`) and falls back to local `/audio/leren/*` files. Audio + cues are generated by `scripts/generate-*-audio.mjs` and uploaded by `scripts/upload-thema*-audio.mjs`.

| Component | Thema | What it renders |
|---|---|---|
| `useLessonAudio` (hook) | shared | Audio engine: play/seek/progress + forward-accumulated cue `state` (latest value per field). Optional `fallbackBase` for local mp3/cues. |
| `LessonPlayerBar` + `LessonHeader` | shared | Reusable play/progress/subtitle bar + widget header strip. |
| `WoonChoice` | 2 | Sociale vs vrije huursector + huwelijk vs partnerschap compare cards |
| `HuisVinden` | 2 | Huren/kopen route splitter + audio-synced step timeline + wachttijd-simulator |
| `Huurcontract` | 2 | Clickable contract clauses + borg-simulatie + rechten/plichten + hulp |
| `OpstalInboedel` | 2 | Clickable house (opstal vs inboedel) + belasting/verzekering chips + huurtoeslag |
| `Meterkast` | 2 | Clickable meters (gas/stroom/water) + vast/variabel tarief + bespaarchallenge |
| `Sorteerspel` | 2 | Afval sorting game (10 items → 7 bins) + audio-synced bin highlight + statiegeld |
| `NetherlandsMap`, `OVReisSimulator`, `WaterDefense`, `TradeRoutesMap`, `ColoniesMap`, `WW2Timeline`, `NieuweNederlanders` | 1 | Thema 1 interactive widgets |
