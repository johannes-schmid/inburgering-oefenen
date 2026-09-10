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
| `WordPass` | `components/exam/WordPass.tsx` | The right answer's own words lighting up one after the other in green — the same pass `.sp-reading` runs while a Spreken answer is being checked. Props: `text`, `active`. Wrap the answer text of a **revealed correct** option in it; `active` off renders the plain string. Pair it with the `answer-correct` class on the box. |
| `playCorrectChime` | `lib/answer-chime.ts` | The one place a correct answer makes a sound (`public/audio/ui/correct.mp3`, 0.73s). Call it from the answer handler on a right answer. Follows the global `useAudioEnabled` switch. |

**The correct-answer reward is three things and they always travel together:** `playCorrectChime()`
in the handler, the `answer-correct` class on the box that was right (a green gradient frame runs
twice around it), and `WordPass` on that box's text. The verdict row that appears underneath gets
`answer-verdict`. All three are defined in `app/globals.css` under *Correct-answer reward*, and
**correct is always `--color-correct` green** — never clay, never a per-surface green.

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

## `components/horizon/` — Dutch Horizon graphic language

Reusable, server-safe, image-free. **Check here before drawing anything decorative.** Spec:
`docs/design/DESIGN_SYSTEM.md` §7; reference: `docs/design/horizon-element-library.html`.

| Component | Use it for |
|---|---|
| `Skyline` | the canal-house row along the bottom edge of any surface |
| `HorizonHero` | a structured page header (eyebrow / display title / lede / actions) |
| `HorizonBanner` | the graphic layer alone, over a section's own copy — **the usual one** |
| `SkylineTopper` | a card header, incl. the neutral-ramp `locked` / roadmap state |
| `SectionTransition` | the silhouette handover between a light and a dark section (once per page) |
| `SunDisc` | the single accent of a composition |
| `HorizonBand` | section edges, and the Dutch Horizon progress bar (`progress`) |
| `DotField` | texture on heroes, empty states and skeletons |
| `LensRing` | circular progress, level medals, avatar marks |
| `GlassChip` | a control floating over a `primary` surface |
| `DocentSeal` / `ValidationChip` | the NT2-docent validation claim, and nothing else |
| `CategoryMark` | **naming an onderdeel** — see §Icons below |
| `ExamMark` | **naming a track** (Taal A2, Taal B1, KNM, ONA) — see §Icons below |

---

## `PortalCrumbs` — de navigatie van het studieportaal

`app/[locale]/(app)/components/PortalCrumbs.tsx`, met de vorm en de twee vaste kruimels in
`lib/portal-crumbs.ts`.

**Elk portaalscherm dieper dan `/dashboard/[level]` draagt dit pad, en geen eigen terugknop.**
De losse `.wt-back`-links zijn er op 02-09 voor ingeruild: de leerlaag is vier niveaus diep
(onderdeel → spoor → module → les) en één terugknop kan daarvan alleen de vorige noemen.

```tsx
<PortalCrumbs trail={closeTrail(skillTrail({ locale, level, skill, overviewLabel, skillName }), {
  label: mod.name,
  siblings: modules.map(m => ({ label: m.name, href, current: m.slug === mod.slug })),
})} />
```

- **`skillTrail()` levert de kop** — Overzicht › A2 › Lezen — want zes pagina's beginnen ermee.
  De onderdeelkruimel draagt de vier taalonderdelen als zusjes.
- **`closeTrail()` zet de huidige pagina erachter**, zonder `href`. Dat ontbrekende `href` *is*
  "je bent hier".
- **`siblings` mag op elk kruimeltje**, niet alleen het laatste. De referentie zet de chevron
  alleen achteraan, en dat is precies de sprong die het weghaalde: vanuit een les naar Luisteren
  hangt aan de onderdeelkruimel, drie plekken terug.
- **De items in het menu zijn echte `<a>`'s** (base-ui `render`), zodat middelklik werkt.
  `router.push` in een `onClick` breekt dat stil en blijft alleen als toetsenbordvangnet staan.
- **`muted`** is "bestaat, maar heeft nog geen inhoud" — een NULL `itemCount`, dus B1 Luisteren.
  Grijs en wél klikbaar, niet weggelaten.
- Scheiding is een lucide `ChevronRight` met `.rtl-flip`, geen `/`. Geen lijn, geen achtergrond:
  het pad is chrome en mag niet als blok lezen.

## `LessonNarration` + `NarrationScope` — de ingesproken uitleg

`components/lessons/`. De speler staat in de leskop, de elementen die oplichten in
`LessonStream`: twee broers, dus een context ertussen (`NarrationScope`) en geen module-store.
Een store op moduleniveau leeft langer dan de pagina en liet bij KNM de laatste cue van de
vorige les staan.

- **`useNarrated(id)`** in een element: `{ active, note }`. De wrapper `Narrated` in
  `LessonStream` zet `data-narrate` en `is-narrating` — vijf elementen doen hetzelfde ding.
- **De context draagt géén tijd.** Zou de seconde erin staan, dan hertekende elke `timeupdate`
  — vier keer per seconde — de hele lesstroom. Nu verandert hij acht keer per opname.
- **De markering is een inset ring in klei** (op navy oranje), plus `translateY(-2px)` en
  `scale(1.012)`. Geen border (no-line-regel), geen nieuwe kleur voor een status. De niet-
  besproken elementen zakken naar `opacity: .55` via `.les-narrating` op de wrapper — en alleen
  zolang er iets speelt, want een halfdoorzichtige pagina zonder geluid leest als een defect.
- **De noot is gepind, niet in de flow.** In de flow gemeten liet hij zijn element groeien en
  duwde alles eronder ~40px omlaag, acht keer heen en terug per opname.
- Pauze laat de markering staan — je pauzeert juist om te kijken. Het einde zet hem uit.

### De speler zelf (herzien 07-09)

- **Navy kaart onder de inleiding, niet als lichte aside ernaast.** In de rechterkolom las de
  ingesproken uitleg als een kadertje naast de les; navy is op deze pagina het niveau "dit is van
  de docent". `.les-top` is daarom weer één kolom. Eén oranje accent: de speelknop.
- **Eén statusregel zegt drie dingen** — `0:58 / 1:28 · meelezen aan · nu: de regel`. Die derde
  is waarom de speler `cueNames` krijgt: kijk je naar de speler en niet naar de pagina, dan zie
  je wél dat er iets oplicht maar niet wat.
- **Het meelezen is een tweede, fijnere korrel.** `FollowAlong` zet het voorgelezen script neer
  met het huidige woord onder een markeerstift; gezegde woorden treden terug naar `opacity: .45`.
  Elk woord is een spoelknop. De voorkeur staat in `localStorage` (`les-meelezen`).
- **De woorden komen uit `lesson_narration.word_times`, nooit uit `script`.** Zou de client zelf
  tokeniseren, dan zijn er twee tokenizers die gelijk moeten blijven — en het verkeerde woord dat
  oplicht ziet niemand in een test. De tokenizer staat in `narration-script.mjs`.
- **De lus loopt op `requestAnimationFrame`, niet op `timeupdate`.** Die laatste vuurt ~4×/s:
  genoeg voor een balk, zichtbaar te weinig voor een woordmarkering. De lus draait alleen tijdens
  het spelen en zet state alleen als de woordindex verandert.

## `LessonVisual` — het lesplaatje

`components/lessons/LessonVisual.tsx`, data in **`data/lesson-visuals.ts`** (per lesslug).
Staat **boven** de regel: eerst zien welke vorm de zin heeft, dan de woorden erbij.

- **Tien soorten, elk voor één grammaticale vraag** — `zinslots` `bijzin` `vervoeging` `bouwer`
  `tijdbalk` `sorteer` `trap` `paren` `ruimte` `frequentie`. Géén generiek "diagram" met vrije
  vakjes: dat is de weg naar 28 plaatjes die alle 28 anders zijn. Nu ziet plaats twee er in les 2
  uit als in les 1.
- **Het werkwoord is het enige navy vakje**, in alle 28 lessen. Eén kleur voor één ding.
- **Genummerde stappen, op drie manieren te doorlopen**: uit de opname (cue `vis-2`), met de hand
  (klik), of automatisch (de doorloopknop). De opname wint van de hand.
- **`stepCount()` staat in de data en niet in de component** — de pagina is een servercomponent en
  moet de cue `vis-3` een naam kunnen geven. Een client-export daar aanroepen faalt hard.
- **Elke stap is een `button`**, dus met een toetsenbord te doorlopen.
- Een **foute zin mag** in het plaatje staan (de docent vraagt erom), maar nooit zonder kruisje en
  doorhaling. Uitzonderingen staan in een eigen zandkleurig vak, niet in een bakje.
- `tijdbalk`, `ruimte` en `frequentie` staan **vast op `dir="ltr"`**: "voor", "naast" en "later"
  hebben een kant, en meespiegelen zou van het plaatje een leugen maken.
- `tests-unit/narration-cues.test.ts` controleert dat elke `vis-N`-cue een stap heeft die bestaat.

## `LessonRecorder` — de microfoon in een les

`components/lessons/LessonRecorder.tsx`, gebruikt door de twee opgavesoorten waarin de cursist
spreekt: **`naspreken`** (blok B van Spreken: hoor de zin, zeg hem na) en **`opnemen`** (blok C en
D: geef een gesproken antwoord).

- **Dit is niet `components/exam/SpeakingTask`.** Die neemt op om ín te leveren: hij uploadt een
  WAV, laat hem tegen een rubriek beoordelen en toont de uitslag met gemarkeerde spans. Hier wordt
  niets ingeleverd en niets beoordeeld — de opname blijft een blob in het tabblad. Ze delen de
  *bouwstenen* (`WavRecorder`, `RealtimeTranscriber`) en niet de component: de examenspeler meet,
  de les leert.
- **De opgave keurt nooit af.** Zodra er een opname is, is hij gedaan. Precies dezelfde afspraak als
  `open_zin`, en om een sterkere reden: een kruis omdat de spraakherkenning een accent niet volgde
  zou de enige belofte van dit product omdraaien. Er is dus geen foutstaat te stylen.
- **Het transcript is een observatie, geen cijfer.** Slaat de spraakherkenning aan, dan staat er
  wát er verstaan is — voor uitspraak het nuttigste signaal dat bestaat. Het wordt nooit tegen de
  doelzin afgezet.
- **Mislukken mag en is de normale situatie.** Geen microfoontoegang, geen `speech_to_text`-scope,
  geen netwerk: elk daarvan geeft één regel tekst en laat de rest van de les met rust. De
  transcriptie is optioneel bovenop de opname, nooit een voorwaarde ervoor.
- De niveaumeter komt uit de PCM-frames die de recorder tóch al maakt, en animeert op `transform`
  (nooit `width`), met een `prefers-reduced-motion`-uitgang.
- Alleen de opnameknop mag de accentkleur dragen, en alleen zolang hij loopt: één oranje ding per
  kaart.

## Icons — three layers, one job each

Imported from the Claude Design project **Dutch Icon Studio** (§04 category marks, §04b exam
marks, §06 tiles & states) on 2026-09-02. There is no fourth layer and no per-page exception:
if a surface names an onderdeel or a track, it uses the mark below and no other drawing.

| Layer | Component | Names | Tile | Sizes it survives |
|---|---|---|---|---|
| **Track** | `ExamMark track="a2\|b1\|knm\|ona"` | the thing you buy and sit an exam in | **inverted** — navy tile, white ink | **32–72**, `knm` from 40 |
| **Onderdeel** | `CategoryMark category="lezen\|luisteren\|schrijven\|spreken\|knm\|gidsen\|ona\|wonen\|gezondheid\|werk\|woorden\|grammatica\|examentraining"` | what is *inside* a track: the onderdelen, the gidsen, the KNM thema's and the three leerroute steps | light — neutral tile, navy ink | **19–72**, 22 in prose |
| **Control** | **lucide-react** | an affordance: chevron, close, lock, arrow, play | none | any |

### Why the split exists

A **mark** is brand imagery. It is built from the same rectangles, discs and one permitted
triangle as the skyline, on a 72×72 grid, and it says *this is a thing we sell*. **lucide** is the
control layer and says *you can press this*. Mixing them is how a design system ends up with two
visual voices — which is exactly what happened before this pass: the same Lezen was a canal-house
mark on the homepage and a `BookOpen` glyph in the portal. The deleted `components/site/SkillIcon`
was that second voice.

### When to use which

- **A row of modules** (dashboard catalogue, the gratis-oefenen chooser, `/premium`'s picker) →
  `ExamMark`. The navy tiles are the priced things; the light tiles below them are the practice.
- **A row of onderdelen** (`SkillCard`, `ModuleSkillGrid`, the sidebar, the mobile tabs, an
  overview hero's eyebrow) → `CategoryMark`.
- **The three leerroute steps** (`woorden`, `grammatica`, `examentraining`) name the stages
  *inside* one onderdeel and map 1:1 onto `ConceptKind` in `lib/lessons/lessons.ts`
  (`woordenschat` → `woorden`, `strategie` → `examentraining`). Added 2026-09-02 for the A2 Lezen
  redesign; `LeerModuleCard` is the only surface that uses them so far. They are category marks,
  not `ExamMark`s: a step is not a thing you buy.
- **`bare` drops the tile**, for the oversized watermark in a card header where a tile would draw
  a second rectangle inside the one already there. `cut` then becomes `transparent`, which is the
  only correct answer over a gradient — there is no single hex to repeat. Use it at low opacity
  and large sizes only: below ~40px the cut shapes are what make a mark readable.
- **A navy card header is not the navy tile.** `LeerModuleCard` puts a category mark on a navy
  gradient cap, which reads *against* the "navy tile = a priced module" rule in CLAUDE.md §7. It
  is the owner's decision (2026-09-02) because the KNM woordkaarten cards already ship that shape
  and it reads as a card; the mark itself stays a **category** mark, so the layer it belongs to
  has not moved. Do not read it as licence to promote other category marks onto navy tiles.
- **KNM is in both sets and they are not interchangeable.** As a track it is the molen-mens-tulp
  mark; as a category it is the colonnade. Pick by the question the surface answers: *which
  module?* or *which onderdeel?*
- **ONA** is announced only. `ExamMark track="ona" muted` is the grey "binnenkort" tile — the one
  sanctioned way to show it as a module. `CategoryMark category="ona"` is the live-ink compass and
  belongs only on gidsen and the tijdlijn, which *describe* ONA rather than sell it.
- **Never a lucide glyph where a mark belongs**, and never a mark where a control belongs. A mark
  is `aria-hidden` and carries no meaning a screen reader needs — the label beside it does.

### Rules that constrain the code

- **One geometry per mark, scaled by transform.** Both components draw on the studio's 72×72 grid
  and scale to `size`. Never re-draw a mark at another size, and never nudge a coordinate for one
  call-site.
- **Tile radius is a quarter of the tile** at every size (studio §06). Both components compute it.
- **The `cut` colour must equal the tile behind it.** `CategoryMark`'s cutouts (the pages of the
  document, the doorway in the house) are the tile showing *through* the ink, which is why `tone`
  switches ink and cut together and why a mark cannot be dropped on an arbitrary background.
- **On a navy surface**: `CategoryMark tone="dark"`, `ExamMark onDark`. Nothing else.
- **One accent per mark.** Orange is the pointer — the short last line in Lezen, the tallest bar in
  Luisteren, the lit step in the stair, the compass needle. A second orange in one mark is a bug.
- **A muted mark spends no orange**, because there is nothing live to point at.
- **`ExamMark` has a floor of 32px (40 for `knm`).** `a2`/`b1` set their two characters at 18px on
  the 72 grid, so below that the label is unreadable and the mark says nothing. Under the floor,
  either fall back to `CategoryMark` (the colonnade, the compass) or set the level as plain text —
  which is what the portal sidebar does at 19px, and why its module rows are *not* track marks.
