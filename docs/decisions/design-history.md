# The design system as built, and the calls that were re-made

Horizon, the category marks, the homepage compositions, the logo generator and the navy header.

> Moved out of `CLAUDE.md` on 2026-09-02, unchanged. It is the reasoning behind decisions
> that are already made — read it when a task touches this area, not every session.
> The rules that must hold at all times live in `CLAUDE.md`; this file is why they hold.


## Design rules

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
