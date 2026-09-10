# Strategy 2026, the milestones and the public content

M0–M2d as shipped, the header decision, the tijdlijn tool, the gidsen and their translations, and the blog standard.

> Moved out of `CLAUDE.md` on 2026-09-02, unchanged. It is the reasoning behind decisions
> that are already made — read it when a task touches this area, not every session.
> The rules that must hold at all times live in `CLAUDE.md`; this file is why they hold.


## Strategy 2026 — van A2-oefensite naar inburgeringsplatform

Based on an external SEO advice deck ("Strategisch Contentadvies & Sitestructuur", Aug 2026)
and owner decisions of 2026-08-19. **The full milestone plan is `docs/MILESTONES.html`** (M0–M6:
technisch fundament → architectuur → TOFU-gidsen → KNM-consolidatie → taalgidsen & B1 → CRO →
video & kanalen). Key facts any session touching public pages should know:

- **The funnel shift:** ~80% of the ±284k/mo "inburgering" search volume is informational
  (oriëntatiefase). The site today is BOFU-only; the strategy adds TOFU/MOFU authority content
  (pillar-cluster) that converts via gids → gratis proefexamen → module.
- **Target menu structure:** Inburgering (TOFU gidsen: stappenplan, Wi2021, A2 vs B1, kosten &
  DUO, boete/termijn, vrijstelling, MAP & PVT) · KNM Kennisgidsen (8 officiële thema's, MOFU) ·
  Taalexamens A2/B1 (per-skill gidsen, MOFU) · Oefenexamens (BOFU). Guides get first-class
  routes (`/inburgering/[slug]`, `/knm/[thema]`), not blog posts; the blog stays for explainers.
- **Domain decision:** inburgeringoefenen.nl is the one brand. KNM becomes the fifth onderdeel
  here (the migration-free path documented in `data/skills.ts`; content migrates from
  `knm-website`). **knmoefenen.nl 301s only after KNM rankings hold here** — until then it is
  a ranking asset, not tech debt.
- **Who pays:** the self-study buyer is primarily gezinsmigranten (±10–12k/yr, self-funded or
  DUO-loan, often EN/AR/TR-speaking); statushouders are the free-content/B2B audience
  (municipality-paid courses). Price anchor for copy: DUO exams cost €50 per onderdeel —
  "één maand oefenen kost minder dan één herkansing".
- **Content ops:** guides are AI-drafted, docent-reviewed before publish (owner decision
  2026-08-19). Exam items keep the unchanged USP. Every number in a guide still comes from
  `SEO/facts.md` with a source.
- The empty, flagged-off `oefenvragen` quiz pages are earmarked as free KNM topic quizzes in M3;
  don't repurpose or delete them for something else.

### M0 — technisch fundament — DONE (2026-08-19)

Structured data, sitemap, KNM cleanup and the nulmeting. What a later session needs to know:

- **One JSON-LD `@id`, one owning page.** `components/JsonLd.tsx` renders the block (it escapes
  `<`, which `JSON.stringify` does not — a `</script>` inside any string value truncates the graph);
  `lib/schema.ts` holds `absUrl`, `breadcrumbs`, `courseId` and `omitEmpty`; `lib/site.ts` holds the
  three site-wide anchors. **The homepage owns `#organization` and `#website`, `/docent` owns
  `#teacher`, and `/oefenexamen/[level]/[skill]` owns its `#course`.** Everything else references
  by `@id` and never restates the node. Two pages used to define both the organisation and the
  docent in full and disagreed — the org was called "KNM Oefenvragen" on one and "Inburgering
  Oefenen" on the other. No validator reports that; a crawler picks one body and the facts that win
  are luck. `node scripts/check-schema.mjs [origin]` fails if it recurs, and also if a block stops
  parsing, an `@id` reference resolves to nothing, or **any page grows an `aggregateRating` or
  `review`** — the product still has no customers.
- **`/premium` is the only page with `Offer` nodes, and every figure is read from `lib/pricing.ts`.**
  Never retype a price into a schema object: a stale `Offer` is a false price claim that keeps
  showing in the SERP after the page itself is corrected. `priceValidUntil` is deliberately absent
  (open-ended subscriptions; an invented expiry makes Google drop the offer).
- **B1 carries no structured data at all**, deliberately. Those pages are `robots: index:false`
  until the docent publishes, and rich data on a noindex page contradicts the page's own meta tag.
  `omitEmpty()` exists for the same discipline as `formatCount`: B1's counts are `null`, and in
  JSON-LD an absent property means "not stated" while `0` is a claim.
- **`/proefexamen` is gone** — route and `ProefexamenEngine.tsx` deleted, 301 to `/oefenen` in
  `next.config.ts`, entry removed from `i18n/routing.ts`, `proefexamen` namespace dropped from all
  three locale files. `components/proefexamen/ExamIntro.tsx` and `ExamQuestionCard.tsx` **stay** —
  the dashboard's `InlineQuiz` and `ExamsView` import them. This also removed the second
  `PASS_THRESHOLD_PCT` and the namespace whose own strings disagreed about 40 versus 45 vragen.
- **`/contact` now has an Arabic slug in `i18n/routing.ts`, and it had to.** `next.config.ts` 301s
  `/ar/contact` → `/ar/تواصل-معنا`; without a per-locale mapping that target matched no route, so
  the Arabic contact page 404'd from every footer link and the sitemap advertised the dead URL.
  **A sitemap is only complete once every URL in it has been fetched** — see the loop in
  `docs/BASELINE.md` §6, which is how this was found.
- **`.prose ul li` is `display: flex`**, so every element child of an `<li>` becomes its own column
  and the text between them becomes anonymous ones. One leading `<strong>` per `<li>`; a second one
  renders the sentence out of order. Both legal pages are written to that rule.
- **The docent page's "108 KNM-oefenvragen" stat was dropped, not replaced with another number.**
  `KNM_QUESTIONS` is an empty array and nothing substantiates 108 or a successor, so the tile shows
  a figure read from `data/skills.ts` instead. The KNM quotation was turned into prose rather than
  reworded: rewriting words inside quotation marks puts a claim in a real person's mouth.
- **Both legal pages were rewritten** (owner instruction, overriding the milestone card). The
  privacy policy's §2 had described only an e-mail address and a score; it now covers accounts,
  payments, written answers and **Spreken voice recordings**, and §10 no longer claims the site
  sets no analytical cookies while loading GA4, Clarity and the Meta pixel. §6 lists the real
  processors. **Retention periods and the legal basis are the owner's commitments** — the draft
  states what the code does and nothing more.
- **The nulmeting is `docs/BASELINE.md`**, and §5 (GSC + GA4) is empty because the numbers have not
  been read out yet — every blank reads `— niet gemeten —`, never `0`, so an unmeasured row can
  never be mistaken for a measured zero. **Search Console ownership was already verified on
  2026-07-29** via a **Domain property** (DNS TXT), which the absence of a meta tag in this repo
  made look like the opposite. So `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` is **not needed and should
  stay unset**; the `verification` block in `app/[locale]/layout.tsx` renders nothing without it and
  exists only as a fallback for a future URL-prefix property. **Copy the file to
  `docs/baseline/YYYY-MM.md` before refreshing it**, or M5 has a current reading and no trend.
- Still stale, needing owner wording: `(app)/betaling-gelukt` says "Professioneel Pakket" and "alle
  10 proefexamens", neither of which the per-module pricing sells. The `oefenvragen` namespace keeps
  its KNM copy on purpose — M3 repurposes that surface.

### M1 — architectuur & herpositionering — DONE (2026-08-19)

The IA, the guide pipeline and the repositioning, shipped **before** the guides themselves (M2/M3).

- **`data/guides/` is one file per guide**, unlike `data/blog-posts.ts` which holds all five posts
  in one 2,288-line module. A guide is about as long as a post and there will be ~15; a single
  module would pass 7,000 lines and every docent review would be a diff against everything.
  `types.ts` + `helpers.ts` + `index.ts` (the registry) + one file per guide.
- **`status: 'reviewed'` is the only state that publishes**, and it is the owner's 19-08 decision
  expressed as a constraint rather than a comment. A `draft` guide is `noindex`, absent from its
  hub, absent from the sitemap, absent from every `related` list and carries **no JSON-LD at all** —
  but is reachable by URL, which is what makes it reviewable. `tests-unit/guides.test.ts` refuses
  a `reviewed` guide with no `reviewedBy`/`reviewedOn`.
- **Guide slugs are identical across locales, and must stay that way.** See the switcher bug below.
- **`getGuideBySlug` is section-scoped**, so `/knm/<an-inburgering-slug>` 404s instead of serving
  one guide under two URLs — a duplicate of our own making.
- **The hubs are one component.** `_components/GuideHub.tsx` renders both `/inburgering` and
  `/knm`; `GuideArticle.tsx` renders both detail routes. Two hubs that drift apart is the
  `sections`-versus-`task_type` mistake again.
- **The zero-guide hub is content, not a placeholder.** The owner chose visible nav over
  content-gated nav (2026-08-19); the thin-content risk that creates is answered by giving each hub
  its own orientation — what the section is, five phase cards — plus the blog posts that already
  cover part of the ground and the four onderdelen. `tests/public.spec.js` asserts the phase cards
  are there, so a future edit cannot quietly turn the hub back into a stub.
- **The hub links `taalniveaus-a1-a2-b1-nederlands` rather than M2 writing a second page.** That
  post already owns the "A2 of B1 / taalniveaus" ground and GSC shows it at positions 56–90. One
  query, one owning page — applied before the duplicate exists.
- **All content sat under one "Inburgering" dropdown** (owner's decision, 2026-08-19).
  **SUPERSEDED 2026-08-20 — see "M2b" below.** The header is now six items implementing
  MILESTONES §3. The research below still stands and simply lost to a stronger argument; it is
  kept because the *reasons* still constrain the labels.
  - The comparable products all do this: theorie.nl has one **Examentips** dropdown,
    leernederlands.online one **DUO inburgeringsexamen** item, and IELTS puts "Preparation
    resources" as a *heading inside* a dropdown. **"Resources" is a footer convention in this
    category, not a nav one** — including in the Zutobi example that prompted the question, where it
    is a footer column.
  - The parent is named **"Inburgering", not "Kennisbank" or "Resources"**: a nav label is site-wide
    anchor text and `inburgering` is the head term (~284k/mo), while a generic label is a word
    nobody searches for and, at A2, may not be understood.
  - **It enforces the split that was previously muddled: tools under Oefenexamens, content under
    Inburgering.** When KNM becomes the fifth onderdeel (M3) its oefenexamens join the Oefenexamens
    dropdown while its kennisgidsen stay in this one — so "KNM" never names two different things in
    two places. `tests/public.spec.js` pins the four top-level entries, because a top-level item per
    section is what a later edit drifts back towards and it grows the header every milestone.
  - **`Nav` must not import the guide registry.** It is a client component, so enumerating published
    guides in the dropdown would ship every `articleHtml` string into the browser bundle. The
    dropdown links hubs; the hub lists the guides.
- **"Taalexamens A2/B1" is deliberately not a menu section.** The milestone card lists it, but its
  content is M4's per-skill guides and the existing **Oefenexamens** dropdown already covers the
  intent. Adding a third empty section is the same bet twice. When those guides exist they become a
  fourth group inside the Inburgering dropdown, not a fifth top-level item.
- **Nothing 301s.** Nothing was ever served at `/inburgering` or `/knm`, so M1's "oude URL's
  301'en" had no work in it. Saying so beats inventing redirects.
- **`alternatesFor(locale, path)` in `lib/schema.ts`** is the first shared alternates helper. The
  fourteen `(main)` pages that hand-roll the block were **not** refactored — that touches every
  canonical on the site and belongs in its own change. It only covers untranslated slugs;
  `/premium`, `/docent` and `/contact` keep their literal maps because their per-locale paths
  cannot be derived by interpolating a locale.
- Guides emit **`Article`, not `BlogPosting`** — a kennisgids is a maintained reference page, and
  the type is the honest one. `scripts/check-schema.mjs` grew rows for both hubs, for the draft
  guide (`forbid: ['Article']`) **and for `/nl/blog`, which the M0 guard never covered**.

**The language switcher was broken on every dynamic route, and had been for as long as those routes
existed.** `usePathname()` returns the *template* (`/blog/[slug]`), not the concrete path, and
`Nav.tsx` called `router.replace(pathname)` with no `params` — which resolves to nothing. Changing
the select did nothing at all on all five blog posts, both free tasters and every exam overview. The
comment in that function asserted the opposite and called the cast safe. It is fixed with
`useParams()`, and `tests/public.spec.js` now pins it across four route shapes, including a
translated slug. **This is why guide slugs are not localised**: with a per-locale slug, `params`
from the current locale would be substituted into another locale's route and 404.

**Still open, found while verifying and deliberately not fixed:** `notFound()` inside a
`[locale]/…/[slug]` route returns **HTTP 200** with the not-found body — a soft 404. It reproduces
on production for `/nl/blog/does-not-exist` and is not specific to guides (the `[...rest]` catch-all
does return a real 404). Project-wide and pre-existing; worth its own change.

### M2 — the pillar is live (2026-08-19); six spokes and the EN top-3 remain

`data/guides/inburgering-stappenplan.ts` is `status: 'reviewed'` — the owner's hand-written
manuscript, fact-checked line by line the same day. What a later session must know:

- **`SEO/facts.md` §10 is the traject fact sheet** (plicht, vrijstelling/ontheffing, brede intake,
  leerbaarheidstoets, PIP, termijn, leerroutes, KNM/PVT/MAP, examens, uitslag, diploma), verified
  2026-08-19 against wetten.overheid.nl, inburgeren.nl, duo.nl, rijksoverheid.nl. The **Besluit
  inburgering 2021 is BWBR0045555**. Every spoke starts from §10, not from a competitor's page.
- **The manuscript needed seven factual corrections**, all recorded in §10 and in the M2 card in
  `docs/MILESTONES.html` — chiefly: KNM has **8** thema's (not 7), "praktijkonderwijs" is on no
  official vrijstellingslijst, the PIP extension is not "12 weken", the Z-route's 800+800 holds
  for asielstatushouders only, and naturalisatie does **not** currently require B1 (that is a
  pending wetsvoorstel). A hand-written manuscript gets the same factcheck as an AI draft.
- **The "16 weken" uitslag claim is real but scoped and dated**: a DUO nieuwsbericht of 31-07-2026,
  Schrijven A2 en Spreken A2 only, with an automatic 6-month verlenging. It will go stale — DUO
  announces changes via nieuwsbericht, so re-check it whenever this guide is touched.
- **Guide visuals are CSS classes in `app/globals.css`** ("Kennisgids visual elements"):
  `.docent-note` (the docent's voice, with the hero's photo), `.guide-steps` (numbered timeline),
  `.guide-cards`, `.yesno-grid`, `.guide-cta-inline`. Icons are inline lucide SVG paths in the
  HTML string — no emoji, and no new React components for article bodies.
- **Two docent-notes are deliberately missing** (manuscript MARIEKE-BLOK 3 and 4: PIP-fouten and
  the B1-of-A2 conversation) — they were authoring questions to Marieke, not content. Add them as
  `.docent-note` blocks in stap 3 and stap 4 once she answers.
- **The draft-gate e2e tests flipped to their positive forms** in `tests/public.spec.js` when this
  slug published. The draft side of the gate is still pinned by `tests-unit/guides.test.ts`; give
  it back an e2e case with M2's first draft spoke.
- The pillar links the leerbaarheidstoets-oefenomgeving at
  `minerva.optimumassessment.com` — that URL comes from duo.nl (zakelijk) and may move; it is in
  facts.md §10 with its provenance.

### The header is four plain links, and `/platform` + `/gidsen` carry the rest (2026-08-22)

**Platform · Gidsen · Prijzen · Over ons.** No dropdowns. This supersedes, in one day, the
two-mega-panel bar, the 2026-08-21 five-item mockup and M2b below.

- **A dropdown is a landing page you refused to build.** The panels held ~20 destinations and
  duplicated, in a hover state on every page, work that two real pages do better — with room for
  copy, benefits and the roadmap that a dropdown row cannot carry.
- **The cost is real and is paid on those two pages.** A header dropdown is a *site-wide internal
  link* to everything inside it; four links are not. So **`/platform` must list the four
  onderdelen, the taster, the tools and the money page, and `/gidsen` must list every published
  guide plus the three hubs.** Anything added to the platform that appears in neither has no route
  in from the chrome at all. The footer carries both pages as the second site-wide route.
- **`/gidsen` is an index, not a fourth hub.** `/inburgering`, `/taalexamens` and `/knm` keep their
  own orientation (the three-fase route, the four onderdelen, the eight thema's) and are linked
  from it. Hubs that drift apart is a mistake this repo has already made once.
- **A section with nothing reviewed still points somewhere real.** `SECTION_POSTS` surfaces the
  blog posts that already own that ground (Taalexamens has two), and a genuinely empty section
  renders its hub as a card — with the trailing hub link suppressed, because the same destination
  twice reads as a rendering bug.
- **`/platform` states the catalogue and the roadmap in one list, and the unbuilt three are
  `<div>`s, not greyed links.** B1 is the one that matters: its pages exist, are `noindex` behind
  the docent's review gate, and a nav link would hand a crawler exactly the page we tell it to
  ignore. Keep it in step with `TRACKS` on the homepage.
- **No prices on either page.** `/premium` is the only page with `Offer` nodes;
  `scripts/check-schema.mjs` now `forbid`s `Offer`/`Product` on both.
- **`SkillCard` gained an `href` prop, and new callers must pass the locale-prefixed path.** Its
  default is locale-less and survives only because the i18n middleware redirects it — a redirect
  hop per card, and invisible to any test asserting on the rendered href.
- **Nina's deck (`Strategisch Contentadvies` §Nieuwe Menu-items) is implemented as page structure,
  not as the bar.** Her four items — Inburgering / KNM Kennisgidsen / Taalexamens / Oefenexamens —
  are the sections of `/gidsen` and `/platform`. As a bar they put the item that sells fourth and
  ask the visitor to know which funnel stage they are in.

### M2b — the menu implements §3, and the first tools appear (2026-08-20) — SUPERSEDED, see above

The header now carries **five top-level items** — `Inburgering ▾ · KNM ▾ · Taalexamens ▾ ·
Oefenexamens ▾ · Docent` — implementing `docs/MILESTONES.html` §3 and **reversing M1's
single-dropdown decision**. Each content section splits into **Gidsen** (read) and **Tools** or
**Gratis oefenen** (do).

**Modules is inside the Oefenexamens dropdown, not top-level** (owner's decision, 2026-08-20, when
six items read as crowded). That dropdown is now `PER ONDERDEEL` (the four skills) + `TOEGANG`
(Modules). Buying access and practising are one intent a step apart, so they belong together — but
note the consequence: **the money page's only header entry is now one level deep.** If premium
conversion from the nav matters, that is the thing to watch.

- **M1's reasoning expired rather than being wrong.** It refused a top-level item per section
  because KNM and Taalexamens were empty, and an empty section is thin content twice over. Now the
  M2 pillar is live, Taalexamens carries the two per-onderdeel blog posts that already exist, and
  each section has tools or free material. The category research (theorie.nl, IELTS) is still
  true; §3 is the site's own published architecture and outranks it. **The labels still follow that
  research**: sections are named for head terms ("Inburgering", ~284k/mo), never "Kennisbank".
- **The desktop nav has its own measured breakpoint, `menu:` (1152px), defined in `globals.css`.**
  Not cosmetic and not a round number. The bar used to appear at `md` (768px) where the links had
  ~344px — "Over de docent" was already squeezed from 99px to 46px with *four* items, unnoticed.
  With the logo at 234px and the right cluster at 362px the links get 508px at 1152px, and the five
  items need 486px. `lg` (1024px) overflows; `xl` (1280px) needlessly puts 1152–1279px laptops on
  the hamburger. Verified switching exactly at 1151/1152 and clean at 1200/1280/1440/1600.
  **Below `menu:` the drawer is the whole menu** — it already contained every item, which is what
  made raising the breakpoint safe. Also `gap-5` not `gap-7`, and `nav.docent` shortened to
  "Docent" (the footer keeps `footer.aboutTeacher`).
  **Re-measure before adding a sixth item or lengthening the CTA.**
- **The right-hand cluster was most of the crowding, not the links.** It was 386px of bordered
  select + text link + long filled button, three competing weights. Now: borderless select (it
  reads as a control on hover/focus, enough for a three-item choice) and Inloggen as an *outlined*
  button paired with the filled CTA — one visual pair. 362px, and it reads much quieter.
- **The language switcher lost its flag emoji, which closed a documented violation.** It was the
  one place in the UI breaking the no-emoji rule and carried a `test.fixme` in
  `tests/public.spec.js` awaiting a decision. Dropping the flags bought header width *and* fixed
  it, so `no emoji in the site chrome either` is now a **live test**. Flags-for-languages was its
  own bug anyway: a Union Jack is not "English" for most of this site's readers.
- **`CONTENT_SECTIONS` in `Nav.tsx` is one definition rendered by both the desktop panel and the
  mobile drawer.** With one dropdown the duplication was survivable; M1 still shipped the Blog link
  twice on mobile because it was removed on desktop only, caught by a screenshot. With three
  sections it is not survivable, so there is exactly one list.
- **The blog stays in the header**, under Inburgering → Gidsen. §3 does not mention it, but it is a
  live indexed surface and a header link is a site-wide internal link on every page — dropping it
  for a tidier menu is a self-inflicted ranking cost. `footer.blog` is a different key, so the
  footer is not a substitute.
- **`/taalexamens` extends `GuideSection` instead of being a third hub.** `GuideHub`'s own comment
  says hubs that drift apart is a mistake this repo already made (`sections` vs `task_type`); a
  bespoke hub would be that mistake. So one union gained a value and the hub, the article renderer,
  the sitemap and the copy convention are all reused — which also pre-builds M4's guide route.
  Per-section facts that cannot come from a message are two `Record<GuideSection, …>` maps
  (`SECTION_CARDS`, `HUB_POSTS`); Taalexamens renders **four** cards, one per onderdeel.
- **`guideHref()` / `hubHref()` in `data/guides/helpers.ts` are new, and they closed a live trap.**
  Four separate `section === 'inburgering' ? … : '/knm'` ternaries decided guide URLs — one in
  `GuideHub`, three in `GuideArticle`. Every one type-checks against a third section and routes it
  to `/knm/[thema]`: a wrong page, not a build error. `guideHref` is a `switch` with a `never`
  default, so a fourth section is now a compile error. It must stay a **discriminated** union —
  `next-intl`'s typed `Link` correlates `pathname` with `params`, and a lookup table that widens
  `pathname` is rejected (correctly: it would allow `/knm/[thema]` with a `slug` param).
- **`data/planned-surfaces.ts` + `_components/PlannedSurface.tsx` are the placeholder mechanism.**
  Four announced-but-unbuilt pages: `/inburgering/tools/tijdlijn`, `/knm/woordenlijst`,
  `/taalexamens/woordenlijst`, `/taalexamens/grammatica`. All `noindex, follow`, all **absent from
  `app/sitemap.ts` by never being added** rather than by being filtered — there is no condition to
  get inverted later. They emit **no JSON-LD at all**, and `related` is required and asserted
  non-empty, because a placeholder that is a dead end is the one thing it must not be.
  **No feature flag** — the registry is the gate, and a flag would be a second switch for the same
  thing.
- **A static child route shadows its dynamic sibling, so slugs are reserved by a test.**
  `/knm/woordenlijst` wins over `/knm/[thema]`. A guide authored at that slug would pass every
  other check, appear on its hub and in the sitemap, and serve the placeholder.
  `tests-unit/guides.test.ts` derives the reserved set from `planned-surfaces.ts`, so registering a
  placeholder reserves its slug automatically.
- **The KNM woordenlijst is `ontsluiten`, not authoring.** `data/woordkaarten.ts` already holds
  **366 words across 7 KNM themes** with article, plural, description, example and EN/AR/TR
  translations. It is 7 of the 8 official thema's — "Omgangsvormen, waarden en normen" is missing.
  The owner chose (2026-08-20) to ship the placeholder now and surface the data later, after
  docent review.
- **`/taalexamens` overlaps two existing blog posts on purpose.**
  `lezen-examen-inburgering-a2` and `luisteren-examen-inburgering-a2` are two of the four
  per-onderdeel guides M4 plans. `HUB_POSTS.taalexamens` links them; M4 must not write competing
  pages. One query, one owning page — the same call M1 made for `taalniveaus-a1-a2-b1-nederlands`.

### M2c — de Tijdlijn Builder is echt (2026-08-20)

`/inburgering/tools/tijdlijn` is geen placeholder meer. Het is een **volledig client-side
rekentool**: zes tot acht vragen in, een gedateerd persoonlijk plan uit. De vijf brondocumenten
(PRD, rekenregels, ontwerpbrief, technische spec, seed-rules) staan in `docs/tijdlijn/`; lees
`02-RULES-AND-DATA.md` §0 vóór je iets in de engine aanraakt.

- **Het inzicht dat de tool verkoopt: de deadline is de beperking niet, de wachtrij ervóór is dat.**
  Aanmelden duurt >6 weken, een uitslag 8 (16 voor Spreken/Schrijven A2 zolang de DUO-melding
  staat), ONA 6+6+8. De kop is daarom **niet** de deadline maar *"meld je uiterlijk aan op …"*, en
  die datum ligt vijf tot zes maanden eerder. `termijnEnd − uitslagwachttijd − 7 weken`.
- **`LegalDate` en `EstimatedDate` zijn verschillende types en niet aan elkaar toewijsbaar.** Een
  wettelijke datum draagt `sourceId` + `checkedOn` en mag het badge "volgens DUO"; een schatting is
  altijd een *reeks*, draagt "ongeveer" en mag dat badge nooit. Dat onderscheid is de hele
  betrouwbaarheid van de tool en het is op typeniveau afgedwongen, niet alleen visueel.
- **`data/tijdlijn/inburgering-rules.v1.json` is de wet, `lib/tijdlijn/rules.ts` parseert hem bij
  import.** Een tarief wijzigen is een data-edit. Alles onder `legal` heeft een bron en een
  controledatum; alles onder `planning` is van ons (urenbanden, diagnose-multipliers,
  `examSpacingWeeks`, `componentBaseWeeks`) en mag nooit als DUO-regel renderen. Een parsefout
  faalt de build, niet de request.
- **De engine is een pure functie**: `computeTimeline(input, rules, today)`. Geen I/O, geen React,
  geen `Date.now()` erin. `today` wordt geïnjecteerd. `PlainDate` (`{y,m,d}`) — **nooit** een JS
  `Date`; `addYears`/`addMonths` klemmen (29 feb + 3 jaar = 28 feb) en `diffWeeks` kapt naar nul.
- **Twee van de vier worked examples in het brondocument zijn fout en de engine wijkt bewust af.**
  Voorbeeld 2 vinkt de 2,5-jaarvoorwaarde af bij 26 maanden; voorbeeld 1 claimt "on track" terwijl
  de eigen urenbanden dat uitsluiten. `tests-unit/tijdlijn-engine.test.ts` pint de datums (die
  kloppen wél exact) en documenteert het verschil in de header. **Reken een voorbeeld na vóór je het
  tot golden test maakt.**
- **Een beoordeelde verlenging verlengt de termijn nooit.** Alleen `grantedExtensionMonths` — de
  gebruiker die meldt dat DUO al besloot — schuift `termijnEnd`. Een plan op een afgewezen
  verlenging is de enige faalwijze die iemand echt schaadt.
- **Asielstatushouders krijgen nooit een boete** (Raad van State) en kunnen onder Wi2021 **niet**
  lenen bij DUO. Dat laatste wordt op het hele Nederlandse internet fout verteld; het staat er
  daarom expliciet.
- **De gantt staat vanaf vraag één in beeld en beweegt mee** (beslissing eigenaar, 2026-08-20).
  `components/tijdlijn/TimelineChart.tsx` is er één van, gebruikt door de landing, de wizard *en*
  het resultaat. Eén gedeelde tijdas met een vaste labelgoot; muren zijn één laag over het
  plotgebied. Per rij schalen zet de muur op elke regel op een andere x — dan lijkt een balk die
  door de deadline schuift op een balk die past. `lib/tijdlijn/milestones.ts` leidt de mijlpalen af
  (aankomst, brief, PIP, termijn, PVT-jaar, boete-horizon, paspoort); een geschatte mijlpaal in het
  verleden wordt weggelaten — een voorspelling van iets dat al gebeurd is kost je het vertrouwen in
  elke andere datum.
- **Vraag 2 is "sinds wanneer woon je in Nederland?"**, aan iedereen. Het is de enige datum die
  bijna elke lezer zonder opzoeken weet, en hij vult de tijdas, de geschatte brief/PIP-mijlpalen en
  de naturalisatieklok. De ankerdatum (PIP of DUO-brief) komt daarna en vraagt éérst *welk papier*
  je in handen hebt: de drie papieren dragen drie verschillende datums en de termijn begint de dag
  **ná** de dagtekening van de eerste PIP.
- **"Ik weet het niet" staat op elke vraag, in normale opmaak.** `unknown` is een eersteklas waarde
  tot in de engine; de tool moet met alles onbekend nog een bruikbare pagina opleveren.
- **De URL is de state** (`?t=…`, versie-geprefixt) en er gaat geen antwoord over de lijn. De
  privacyregel op de landing ("geen DigiD, geen BSN") is een architectuurbelofte: voeg hier geen
  server-round-trip voor "personalisatie" toe. Een onbekende versie geeft `null` en opent de wizard
  — een stilzwijgend verkeerd geparseerde string zou een verkeerde deadline opleveren.
- **Alleen de mail vraagt een e-mailadres; het resultaat is nooit gated.** `/api/tijdlijn-email`
  herrekent de tijdlijn server-side uit de state (nooit de datums uit de body — een mail is het enige
  artefact dat je niet kunt corrigeren) en zet de herinnering acht weken vóór de laatste
  aanmelddatum in `email_campaign_queue` als `tijdlijn_reminder`. `tijdlijn_plans` bewaart alleen
  e-mail + state-string, RLS aan zonder policy (deny-all; de route gebruikt de service key).
  De cron slaat betalende klanten over voor de *campagne*mails, niet voor deze herinnering.
- **Nog open, uit `02-RULES-AND-DATA.md` §12:** de NT2 B1/B2-uitslagtermijn is nooit vastgelegd (de
  engine valt terug op 8 weken **met waarschuwing**), de 2-jaars verlengingsgrens en de
  basisexamen-buitenland-tarieven wachten op een primaire bron, en of DUO op examendatum of
  uitslagdatum toetst is niet bevestigd — tot dan rekenen we naar de uitslag en zeggen dat.
- **De drie datums waar een kandidaat op handelt staan op `ComponentPlan`:** `startStudyingBy`
  (achteruit gerekend vanaf `registerBy` min de studieweken — dít is de datum waar mensen naar
  handelen), `examWindow` en `resultWindow`, plus `studyWeeks` en `level`. `startStudyingBy` is
  bewust een **`EstimatedDate`**, ook al rekent hij terug vanaf een wettelijke datum: de aftrekking
  loopt door ons studiemodel. Let op de richting van de reeks — méér studieweken betekent *eerder*
  beginnen, dus `hi` levert `earliest`. Omgedraaid vertelt de tool mensen dat ze later kunnen
  beginnen dan veilig is, precies de fout waarvoor hij bestaat.
- **`lib/tijdlijn/agenda.ts` is het plan als instructies**: één gedateerde lijst, samengevoegd over
  alle onderdelen en chronologisch gesorteerd, want de onderdelen lopen door elkaar en niemand
  reconstrueert dat uit vier losse rijen. `actor` scheidt "dit doe jij" van "dit gebeurt dan" — een
  lijst die die twee mengt leest als twee keer zoveel werk. Een verstreken datum blijft staan
  (`overdue`) en wordt nooit verwijten; weghalen zou het plan haalbaar laten lijken door precies het
  deel te schrappen dat het niet is.
- **`AT_THE_GEMEENTE` (`pvt`, `map`, `z_eindgesprek`) is op identiteit gekeyed, niet op "heeft geen
  wachttijd".** PVT *heeft* een DUO-doorlooptijd van ~3 weken, en daarop testen gaf PVT een
  leren/aanmelden/examen/uitslag-keten: vier instructies voor één afspraak. Zowel de agenda, de
  gantt als de detailkaart importeren die lijst — niet opnieuw afleiden.
- **De gantt is chronologisch en de balken beginnen wanneer het *leren* begint**, niet vandaag
  (`readyBy.latest − studyWeeks.hi`, dus vandaag + de stagger). Dat levert de trap uit de mockup op
  en het is een echt feit over het plan. De paspoortrij (5 jaar wonen) is één gestreepte balk: het
  is wachttijd die je niet kunt versnellen, dezelfde betekenis als DUO's wachtrijen. Een mijlpaal
  buiten het venster wordt **niet** gepind — `x()` klemt op [0,100] en zou hem op de rand tekenen
  alsof hij daar plaatsvond; de lijst eronder houdt de echte datum.
- **De urenschuif staat bij de tekening**, niet in een instellingenpaneel: slepen en zien dat elke
  datum meebeweegt is de snelste uitleg van waarom lesuren uitmaken. Range + getalveld samen, want
  een slider alleen is vijandig op een kleine telefoon.
- De diagnose-quiz per onderdeel (`readinessFor` leest `diagnosticScore` al) en de `.ics`-export
  staan nog niet in de UI. De rest van het PRD is er.

### M2d — /inburgering is een route, en de gids houdt bij wat je las (2026-08-22)

De hub is geen grid van vier gelijke kaarten meer. Het is **één route in drie fasen** met de
stappenlijst van de open fase eronder, een hulpmiddel ernaast, en per gids een inhoudsopgave in de
zijbalk die bijhoudt wat je gelezen hebt. **Geen artikel is aangeraakt** — opdracht van de eigenaar:
elke gids blijft compleet, de secties komen aan de zijkant te staan.

- **De stappen zijn de `<h2 id>`'s van de gidsen zelf** (`lib/guides/sections.ts`), nooit een
  handgeschreven outline. Die ids bestonden al en zijn **identiek in nl/en/ar** — alleen de tekst is
  vertaald — dus een sectie-id is meteen een leesvoortgang-sleutel die over de talen heen werkt, en
  een docent die een kop herschrijft verzet de stap in dezelfde edit. Een `<h2>` **zonder** id wordt
  overgeslagen: een uit de kop afgeleide slug zou per taal verschillen en de voortgang van één
  sectie in drieën splitsen.
- **De extractie gebeurt op de server.** De steptitels komen uit `articleHtml` — ~90 kB proza dat de
  hub niet rendert. `GuideHub` stuurt alleen `{ id, title, minutes }` naar de client.
- **Een fase bevat één of meer gidsen** (`data/guides/phases.ts`). "Wat kost inburgeren?" zit in
  fase 1 naast "Moet ik inburgeren?" (beslissing eigenaar, 2026-08-22); een vierde kaart ervoor zou
  de vierde concurrerende navigatie van de site zijn geworden. Elke gepubliceerde
  `inburgering`-gids moet in **precies één** fase staan — in geen enkele fase is hij onvindbaar
  vanaf zijn eigen hub, in twee fasen dubbeltelt hij zijn secties en liegen de balkjes.
  `tests-unit/inburgering-route.test.ts` pint dat.
- **Alle drie de panelen worden gerenderd; de dichte krijgen `hidden`.** Met alleen het open paneel
  in de DOM hadden de gidsen van fase 2 en 3 **geen enkele interne link vanaf hun eigen hub** — op
  de belangrijkste TOFU-pagina, die juist bestaat om autoriteit naar zijn cluster door te geven.
  `tsc`, de build en elke screenshot waren schoon; twee e2e-asserties vonden het. Daarom staat er ook
  onder elke stappenlijst een **hash-vrije** "Lees de hele gids"-link: een URL met een fragment is
  voor een crawler dezelfde pagina, maar de hub moet de pagína benoemen.
- **Wisselen van fase verandert geen URL.** Het is een `tablist`. Drie routes zouden drie bijna
  identieke dunne pagina's op indexeerbare URL's zetten, vóór de gidsen waar ze naartoe linken.
  `?fase=` wordt alleen *gelezen*, voor een deeplink vanaf de strip op een gidspagina.
- **De "huidige" stap wordt over de hele fase berekend, niet per gids.** Een `findIndex` per
  stappenlijst gaf fase 1 twee oranje huidige stappen. Twee is erger dan geen: de markering bestaat
  om te zeggen waar je verdergaat, en er is één plek.
- **Voortgang is localStorage, geen cookie** (beslissing eigenaar). Functionele state die de browser
  nooit verlaat, dus geen consent-banner en niets extra op elk request — dezelfde belofte als de
  tijdlijn-tool. `lib/guides/progress.ts` hydrateert in een effect (lezen tijdens render kost een
  hydration error op elke gidspagina) en faalt overal stil: een leesvinkje mag de pagina die het
  versiert nooit kunnen breken.
- **Een sectie geldt als gelezen als je er *voorbij* scrolt, niet als hij in beeld komt.** Sectie *i*
  wordt gemarkeerd als *i+1* de sectie op het scherm wordt. Een balk die vollooopt omdat iemand snel
  naar beneden veegde is erger dan geen balk. **Het einde van het artikel markeert álle secties** —
  de laatste kan nooit "achtergelaten" worden, en bij een korte staart delen de laatste twee koppen
  het slotvenster, dus de observer kiest er één en de ander wordt nooit de sectie op het scherm. Zo
  bleven er van vier secties twee ongemarkeerd na het hele artikel te hebben doorgescrold.
- **`lib/guides/situation.ts` is de "Check jouw situatie"-tool, en elke regel erin is een herhaling
  van `moet-ik-inburgeren.ts` §wie-moet-inburgeren** — door de docent nagekeken, met bron in
  `SEO/facts.md` §10. Niets hier is een nieuwe claim en niets mag er een worden. De vrijstellingen
  worden **vóór** de plicht getoetst (nationaliteit en leeftijd eerst): een EU-burger met een
  gezinsvergunning is niet inburgeringsplichtig, en op reden-eerst toetsen gaf die lezer `likely`.
  De copy hedged in alle drie de talen — DUO beslist en stuurt een brief; een tool die "je hoeft niet
  in te burgeren" zegt doet een juridische uitspraak die hij niet kan doen, en zit fout in de richting
  die iemand een boete kost. "Ik weet het niet" staat op elke vraag in normale opmaak en is een
  eersteklas waarde tot in de tabel, waar hij `unclear` oplevert plus de sectie die het oplost.
- **De fase-illustraties zijn drie doelgetekende SVG's** (`PhaseIcon.tsx`), op één 32×32-grid en één
  streekdikte, met `currentColor` voor de structuur en `--color-secondary-container` voor één accent
  per tekening — daardoor werkt hetzelfde bestand op een navy en op een witte kaart. Geen emoji
  (harde regel) en geen lucide: een fase is een *begrip*, en drie willekeurige glyphs zouden
  decoratie zijn die zich voordoet als betekenis.
- **`.article-body h2` heeft nu `scroll-margin-top: calc(var(--nav-h) + 24px)`.** Zonder dat landt
  elke sprong naar een sectie *achter* de vaste header. Gelezen uit de token, niet getypt.
- **Elke voorwaartse pijl draagt `.rtl-flip`.** De layout spiegelde zich in het Arabisch en de pijlen
  niet, dus die wezen tegen de leesrichting in. Let bij `.step-row-arrow` op de functievolgorde:
  `translateX(-3px) scaleX(-1)` — omgekeerd geschreven beweegt de nudge achteruit.
- **Turbopack serveerde één CSS-edit lang een verouderde chunk**, dus een fix stond op schijf en niet
  op de pagina. `curl` de gecompileerde chunk en grep de regel vóór je concludeert dat de CSS fout is;
  een newline aan `globals.css` toevoegen forceert de hercompilatie.

De diagnostische quiz per onderdeel en de `.ics`-export van de tijdlijn staan nog open (zie M2c); de
vijf overige M2-spokes ook.

### The gidsen are translated, and the site now describes itself to models (2026-08-24)

Twenty-three guides were live in Dutch and only four had EN/AR bodies, so `hasTranslation()`
`noindex`ed **forty pages** in the two languages much of the paying audience reads. The gate was
right; it was empty. It is filled now, and the AI-crawler surface was built at the same time.

**Translations live in `data/guides/translations/<slug>.<locale>.ts`, one file per (guide, locale),
and the registry merges them onto the guide.** The four earliest guides keep their EN/AR inline;
both shapes coexist and `data/guides/index.ts` is the only place they meet.

- **The arrow points one way: a translation imports its guide, a guide never imports its
  translation.** A translated body reuses the guide's own `row()`, `card()` and `SRC_*` — that is
  what stops the markup drifting between three languages — so the guide file *exports* them. If the
  guide then imported its translations back, that ESM cycle resolves to `undefined` in whichever
  half loses the race, and both modules evaluate template literals at import time. The merge
  therefore happens in the registry, which is downstream of both.
- **`scripts/translate-guides.mjs` writes them, one Opus call per (guide, locale)**, cached on a
  hash of the Dutch source in `scripts/.translation-cache/` (gitignored). `plan` shows the work,
  `--check` re-validates what is on disk, `--force` re-renders from cache and `--retranslate` pays
  for new calls — the two are separate because most re-runs fix how a file is *rendered*, and
  re-paying 38 translations to fix a header is waste.
- **The model is handed the `.ts` source, not rendered HTML**, and returns TypeScript. Handing it
  HTML gets HTML back and freezes every block at the shape it had that day.
- **`<h2 id>` values are keys and are never translated.** `lib/guides/sections.ts` reads them as the
  step list on `/inburgering` and reading progress is stored under them, so a translated id splits
  one section's progress into three and empties the step list on the translated hub. The script
  refuses a body whose id sequence differs, and `tests-unit/guide-translations.test.ts` pins it
  again for the hand edits the generated files invite.
- **The validator's other rule that matters is the interpolation *sequence*.** It is the only check
  that sees a *dropped block*: a body missing one `${card(…)}` compiles, renders, reads perfectly
  and is quietly missing a third of a comparison.
- **Imports are derived from every identifier inside an interpolation, not from its head.** A fact
  box is `${factIn('en', claim, label, SRC_HUURWONING, CHECKED)}`, so the two constants that need
  importing never appear at the head of anything. Deriving from heads produced a file referencing
  four undefined names.
- **`fact` / `factTwo` / `docent` must become `factIn` / `factTwoIn` / `docentIn`.** The Dutch three
  hardcode "Bron:", "geraadpleegd" and "NT2-docent" — a translated page still saying them is the
  defect that looks completely finished. A test refuses those four strings in any translated body.
- **The translations are machine-produced and were NOT reviewed** (owner's decision, 2026-08-24).
  The Dutch source was. `guides.translated_note` says exactly that, in the reader's own language,
  appended to the `reviewed_by` line — **do not drop that clause to tidy a layout.** Without it a
  machine translation inherits a human review it never had, which is the one thing the site's only
  claim cannot survive.
- **hreflang no longer advertises a `noindex` locale.** `alternatesFor()` takes an optional locale
  list and the three guide routes pass `indexableLocales(guide)`. Pointing hreflang at a page whose
  own meta tag says `noindex` is a contradiction Google resolves by distrusting the cluster — so the
  locales that *are* translated were paying for the ones that were not. The sitemap already gated
  correctly.

**`/llms.txt`, `/llms-full.txt` and `/robots.txt` are all generated routes now** (`lib/llms.ts`,
`app/llms.txt/`, `app/llms-full.txt/`, `app/robots.txt/`). `public/robots.txt` is deleted.

- **The old `robots.txt` exempted the six bots that matter from every `Disallow`.** A robots.txt
  group is **not additive**: a crawler that matches a named group ignores `User-agent: *` entirely.
  The file had `User-agent: GPTBot` / `Allow: /` with no disallows under it, so GPTBot,
  ChatGPT-User, PerplexityBot, ClaudeBot, anthropic-ai and Bingbot were each told everything was
  allowed, including `/admin` and `/login`. Every group is now built from one `DISALLOW` array. It
  also had `Googlebot-Extended`, which is not a token — Google's is `Google-Extended`, and a
  typo'd user agent is a group that matches nothing while reading like a decision.
- **A route handler rather than `app/robots.ts`** because the metadata convention cannot emit
  comments, and the reasoning belongs in the file a person opens.
- **Both llms files are derived from the same registries the sitemap reads**, so they inherit
  `publishedGuides()`, `hasTranslation()` and the `itemCount !== null` gate for free. A
  hand-written index of 23 guides is stale the day one publishes, and a stale llms.txt is worse
  than none.
- **No prices and no exam items, ever.** `/premium` is the only page that may state our figure.
  `htmlToText()` drops the `.guide-cta-inline` blocks for exactly this reason — one of them
  interpolates `MODULE_PRICE`, correctly, and a subscription price in a corpus gets quoted back
  months after the page is corrected. DUO's own €50 fee **stays**: it is sourced reference content
  with its government URL and consulted-on date beside it.
- **`/llms.txt` carries a "How to cite this site" block, and it is the wedge in machine-readable
  form**: every figure comes with its source and date, and the unsourceable pass norms
  (`SEO/facts.md` §9 — "18 van de 25", "500 punten") are named there in order to be refused, so a
  model cannot attribute them to us. `tests-unit/llms.test.ts` pins that both ways.
- **`proxy.ts`'s matcher skips any path containing a dot**, which is why these three are served at
  the root and not locale-prefixed. Nothing had to change there.

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
