<!--
  Imported 2026-08-22 from the Claude Design project "Horizon Element Library"
  (claude.ai/design/p/097820b3-02ca-4500-b11e-cb09e89772db).

  This file is the SPECIFICATION. The reference implementation of §7 is
  `docs/design/horizon-element-library.html` (open it in a browser), and the code that
  ships it is `components/horizon/`. When the spec and the code disagree, the spec wins
  and the code is the bug.
-->

# Design System Specification: The Civic Authority

**Product:** inburgeringoefenen.nl — an all-in-one Dutch civic integration (inburgering) platform that brings every exam component together in one place instead of sending users across separate tools.

**Scope the design must carry:**
*   **A2 language exam** — Lezen (reading), Luisteren (listening), Schrijven (writing); Spreken (speaking) planned. Listening uses custom Dutch voice-actor audio (ElevenLabs Voice Design) for monologues and role-play dialogues.
*   **KNM** — Kennis van de Nederlandse Maatschappij exam prep.
*   **ONA** — civic orientation portfolio, on the roadmap alongside B1 and beyond.

**Core positioning:** all content is written and validated by a real, practicing NT2 teacher — not AI-generated, unlike competitor platforms. This is the differentiator for the new platform and retroactively for knmoefenen.nl, so the design must make it *visible*, not just claimed (see §7.4).

## 1. Overview & Creative North Star
**Creative North Star: "The Modern Attache"**

This design system moves away from the "government form" aesthetic and toward a high-end, editorial educational experience. We aim for a "Modern Attache" feel—authoritative yet inviting, sophisticated yet hyper-accessible. By utilizing the Dutch national palette through a refined lens (Deep Navy and Burnt Clay), we establish immediate trust.

We break the "template" look by rejecting traditional grids in favor of **Dynamic Asymmetry**. Content is not just placed; it is curated on layered surfaces that mimic high-end stationery and frosted glass. This provides a clear mental model for non-native speakers: the interface is a helpful guide, not a hurdle.

---

## 2. Colors & Surface Philosophy

The palette is a contemporary evolution of Dutch heritage. We use `primary` (#002b6d) to anchor the experience in stability, while `secondary` (#a24000) acts as a precise surgical tool for attention.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning. Boundaries must be defined solely through background color shifts.
*   *Implementation:* A `surface-container-low` section sitting on a `surface` background creates a clear but soft boundary.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the `surface-container` tiers to create depth:
*   **Level 0 (Base):** `surface` (#f8f9fb)
*   **Level 1 (Sections):** `surface-container-low` (#f2f4f6)
*   **Level 2 (Cards/Focus):** `surface-container-lowest` (#ffffff)
*   **Level 3 (Pop-overs):** `surface-container-high` (#e6e8ea)

### The "Glass & Gradient" Rule
To elevate the "official" feel, use **Glassmorphism** for floating elements (like navigation bars or sticky progress indicators). Use `surface` colors at 80% opacity with a `20px` backdrop-blur.
*   **Signature Textures:** For Hero sections, apply a subtle linear gradient from `primary` (#002b6d) to `primary_container` (#1d428a) at a 135-degree angle to provide a "soul" that flat colors lack.

---

## 3. Typography: Editorial Clarity
We pair **Manrope** (Display/Headline) for a modern, geometric authority with **Public Sans** (Body/Label) for neutral, highly legible communication.

*   **Display (Manrope):** Use `display-lg` (3.5rem) with `-0.02em` letter spacing for hero headers. This creates an "editorial" impact.
*   **Headline (Manrope):** `headline-md` (1.75rem) should be used for quiz titles to ensure they feel like "Official Chapters."
*   **Body (Public Sans):** `body-lg` (1rem) is the workhorse. Line height must be set to `1.6` to assist non-native speakers with reading pace.
*   **Label (Public Sans):** `label-md` (0.75rem) in `on_surface_variant` (#434651) for metadata, ensuring a clear distinction from actionable text.

---

## 4. Elevation & Depth: Tonal Layering

We reject the "drop shadow" of 2010. Hierarchy is achieved through **Tonal Layering**.

*   **Ambient Shadows:** If a "floating" quiz card is required, use a shadow with a 32px blur, 0px offset-y, and 6% opacity using the `on_surface` color. It should feel like a soft glow of light, not a heavy weight.
*   **The "Ghost Border" Fallback:** For high-stakes inputs (like an exam answer), if a border is required for accessibility, use the `outline_variant` (#c4c6d2) at **20% opacity**. Never use 100% opacity.
*   **Layering Example:** A `surface-container-lowest` (#ffffff) card placed inside a `surface-container` (#eceef0) wrapper creates an "elevated" look through contrast alone.

---

## 5. Signature Components

### Official Buttons
*   **Primary:** `primary` background with `on_primary` text. Use `xl` (0.75rem) roundedness. Add a subtle 2px inner-glow (white at 10% opacity) on the top edge to give it a "pressed coin" quality.
*   **Secondary (The Dutch Accent):** Use `secondary_container` (#fe762c) with `on_secondary_container` (#5f2200). This is for "Next Question" or "Submit"—high visibility but secondary to the global navigation.

### Quiz Cards
*   **Structure:** No borders. Use `surface-container-lowest` (#ffffff) with `xl` (0.75rem) corners.
*   **Separation:** Instead of divider lines, use `spacing-6` (1.5rem) of vertical white space to separate the question from the options.

### Progress Indicators
*   **The "Dutch Horizon" Bar:** A full-bleed bar using `surface-container-highest` as the track. The fill is a gradient from `secondary` to `secondary_container`. Avoid "chunky" bars; keep the height at `spacing-2` (0.5rem).

### Input Fields
*   **State:** Default state uses `surface-container-high` as a background fill. Focused state shifts to `surface-container-lowest` with a 2px `primary` "Ghost Border" (at 40% opacity).

---

## 6. Do's and Don'ts

### Do
*   **DO** use white space as a structural element. If in doubt, increase spacing.
*   **DO** use `secondary_fixed_dim` (#ffb695) for hover states on orange elements to maintain a sophisticated tonal shift.
*   **DO** ensure all text on `primary` surfaces uses `on_primary` (#ffffff) for AAA accessibility.

### Don't
*   **DON'T** use black (#000000). Use `on_surface` (#191c1e) for all "black" text to reduce eye strain.
*   **DON'T** use 1px lines to separate list items. Use a background color shift of 2% or `spacing-4` (1rem) of clear air.
*   **DON'T** use "Standard Blue" (#0000FF). Only use the specified `primary` (#002b6d) to maintain the premium, trustworthy Dutch identity.

---

## 7. Graphic Language: "Dutch Horizon"

**Reference implementation:** `horizon-element-library.html` · **Code:** `components/horizon/`

The system uses **no illustrated characters and no drawn iconography**. All imagery is constructed from four CSS-native primitives recoloured from the Civic palette, and its signature form is the **canal-house skyline**: a row of gabled houses running left to right along the bottom edge of a surface. This keeps the "Modern Attache" register (illustrated mascots read friendly-startup, not authoritative), costs nothing to produce, scales to hundreds of questions, and never needs an illustrator or a licence.

### 7.1 The Four Primitives

| Primitive | Construction | Meaning / Use |
|---|---|---|
| **Gable house** | A plain body band under one of three roofs: **dome** (`border-radius: 999px 999px 0 0`, 66% width), **bell** (full width, 5–9px radius) or **stepped** (two stacked bands at 34% / 68% width) | The building block of every skyline |
| **Sun disc** | Circle, `linear-gradient(180deg, #fe762c, #a24000)` | The single point of attention per composition |
| **Horizon band** | 8px full-bleed bar, gradient `secondary → secondary_container` | Progress, footers, surface edges |
| **Dot field** | `radial-gradient(circle, <outline_variant> 1.5px, transparent 1.6px)` at `12–22px` | Texture for empty areas, hero depth, skeletons |

Two derived forms are permitted: the **skyline row** (houses in a full-width flex row with a 3–7px gap, each `flex: 1`, anchored to the bottom edge and clipped by `overflow: hidden`) and the **lens ring** (a disc with layered `box-shadow` rings, for circular progress and level medals).

**Skyline rules**
*   Always **left to right across the full width** — never a single house, and never a cluster floating in the middle of a surface.
*   Alternate the three gable types; never three identical roofs in a row.
*   Vary height and tint per house — 5–18% `on_primary` over the `primary` gradient, or one step of the neutral ramp on light surfaces. The tallest house sits off-centre.
*   Windows are optional and only on heroes: a small centred grid of 5px `on_primary`-10% squares, on the two or three tallest houses only.
*   Scale by dropping houses, not by shrinking every part: 11 houses on a hero, 5–7 on a banner or card topper, 3–4 inside a 120px scene circle.
*   Skylines carry no text. Copy sits in the upper two thirds; the skyline occupies the lower third at most.

### 7.2 Element Inventory

*   **Heroes & banners** — gradient hero (135°, `primary → primary_container`) with dot field, an 11-house skyline with windows, one sun disc, and a horizon band at the bottom edge; light banner on `surface-container-low` with a neutral-ramp skyline; inverted banner on flat `primary`.
*   **Module cards** — 92px skyline-topper header of five houses (one palette tint per module), metadata label, title, Dutch Horizon bar. Locked state drops all colour to the neutral ramp.
*   **Category marks (v3)** — one topic-true geometry per subject on a 72px `surface-container-high` rounded tile, drawn only with rounded bands, discs and radii: **canal row** of three houses (Wonen), cross in a rounded square (Gezondheid), case + handle (Werk), spine-split block (Onderwijs), colonnade + plinth (Instanties), ballot slot + falling card (Waarden), page with text lines (Lezen), waveform (Luisteren), bubble pair (Spreken), nib + rule (Schrijven), folder (ONA). Rule: **one recognisable form, reduced — never a detailed pictogram and never a stroke icon.** If the topic can't be reduced to two or three of our shapes, use a label instead. The marks scale to 52px (hub tiles), 40px (card headers) and 36px (inline) by dropping detail, never by shrinking every part. Construction rules in §7.5.
*   **Progress family** — Dutch Horizon bar, step segments (one per question, clay→orange ramp), lens ring (`conic-gradient`), polder bars (streaks), sun-height meter, journey checkpoints.
*   **Quiz surfaces** — floating quiz card (32px/6% ambient shadow) with arc-tile question mark; answer options as `surface-container-low` fills, selected via 2px inset `primary` at 40%; feedback cards with disc-in-disc mark; input fields per §5.
*   **Scene states** — one 120px circle crop holding a four-house skyline, restaged by sun height: sun high = pass, sun low = "come back tomorrow", dot field + neutral skyline = empty, clay skyline + cold disc = error.
*   **Small parts** — three button tiers, geometric icon buttons (44px minimum), chips, segmented tabs, level medals (`A2/B1/B2` in lens rings), stat tiles, glass navigation, arc-based loading skeletons.
*   **Section transitions** — tonal step (default) or the **silhouette handover**: a white band with the dot field and a bottom-anchored skyline in solid `primary` / `primary_container` tints, cut off by the dark section starting at the street line — the houses read as silhouettes, not as a wash (**once per page maximum**). Never hang the skyline from the top edge.

### 7.2b Exam-Component Elements

**Component hub** — one shelf for the whole platform. A2 language components (Lezen / Luisteren / Schrijven) get full arc-topper cards; KNM and ONA get compact tile rows; anything not shipped yet uses the roadmap treatment. Level switching is a segmented control (`A2 · B1 · B2 later`) at the top of the hub, never a page reload metaphor.

**Roadmap & coming-soon states** — an uppercase `label-md` chip on `surface-container-high` in `on_surface_variant` (`Binnenkort`, `Op de roadmap`). The whole tile drops to the neutral ramp, its category mark becomes a hollow `outline_variant` ring, and progress tracks render empty. Never grey out with opacity; never hide the component — visible scope is the all-in-one promise.

**Luisteren (audio)**
*   **Waveform** — the polder-bar primitive, sized to the container: played bars in `secondary_container`, unplayed at `on_primary` 28%. Always on a `primary` card so the audio surface is instantly recognisable.
*   **Transport** — 56px `secondary_container` disc play button with the pressed-coin inner glow; speed toggles, replay counter (`Nog een keer (2 over)`) and transcript reveal as glass chips at 16% `surface` + 20px blur.
*   **Role-play dialogue** — one lettered disc per voice actor (`primary` for A, `secondary_container` for B), asymmetric-corner speech surfaces (`12px 12px 12px 4px`), transcript withheld until the answer is given.
*   **Audio badge** — a three-bar mini waveform marking any item that carries a recording, in lists and result reports.

**Lezen (reading)**
*   Reading passages sit on `surface-container-lowest` at `body-lg`/1.7 with a `headline` title and a source label (`brief van de gemeente`, `advertentie`).
*   **Two highlight tiers only:** exam-relevant terms get `secondary_container` at 22%; neutral vocabulary gets `surface-container-high`. Both as 4px-radius background fills — never underlines or borders.
*   **Word help** is a `surface-container-low` block (inline) or a glass pop-over (floating) with the term in `primary` and a plain-Dutch gloss.
*   **Question types:** gap fill (an inline `surface-container-lowest` slot with the 2px `primary` ghost border) and matching pairs (two columns joined by a short 4px connector bar — `secondary_container` when linked, `outline_variant` when not).

**Schrijven (writing)**
*   Task card: uppercase task label, monospace countdown chip, `headline` prompt, `surface-container-low` writing area, word counter paired with a Dutch Horizon bar, `secondary_container` submit.
*   **Teacher feedback card** — lens-ring avatar mark, the byline "Feedback van je NT2-docent", then criterion blocks on `surface-container-low` with the criterion name in Manrope. Feedback is never colour-coded red/green; hierarchy comes from order and weight.
*   **Rubric rows** — criterion label plus a 120px Dutch Horizon bar, one row per criterion.

**Results**
*   **Examenklaar strip** — one lens ring per exam component in a fixed order (Lezen, Luisteren, Schrijven, KNM), with the platform's next recommendation as a `primary` CTA. The lowest ring drives the recommendation.

### 7.4 The Trust Layer (NT2-Teacher Validation)

The differentiator gets its own dedicated elements, and they are the only place where a mark may read as a "seal":

*   **Docent seal** — a disc in `primary` ringed with 8px `secondary_container` and a 15px `on_primary`-12% halo. Reserved for the validation claim; never reused as decoration.
*   **Validation chip** — pill on `surface-container-high`: a small `primary` disc with a `secondary_container` core plus "Gecontroleerd door een NT2-docent". Sits at the top of the component hub and on every exam-set header.
*   **Comparison band** — two stacked rows on tonal surfaces, ours marked with a `secondary_container` disc, competitors with an `outline_variant` disc. Factual copy only, no logos, no crossing out.

**DO** state the claim in plain language once per page, near the content it applies to.
**DON'T** stack multiple trust marks in one view, and **DON'T** turn the seal into a watermark or a background texture.

### 7.5 The Icon Layer (Gables, Rows & Dutch Objects)

**Reference implementation:** `horizon-element-library.html` §14–18.

Icons are built on the same primitives, but with their own construction so they survive at small sizes and so the houses read as *Dutch canal houses*, not as a bar chart.

**Construction**
*   72px tile, 10px keepline (geometry lives in the 52px core; only the skyline base touches the bottom edge), 4px unit grid.
*   Weights at 72px: structure 8, detail 6, hairline 4. Below 72 the whole ramp scales proportionally (3px at 48, 2px at 24) — never mix scales inside one icon.
*   Corners: 3px on masonry, full round on roofs, discs and wheels; never mixed within one form.
*   All detail — windows, doors, splits — is **cut in the tile colour**, never drawn in a lighter blue. On `primary` and `secondary_container` tiles the silhouette takes the on-colour and the cut takes the tile colour.
*   Tile radius is a quarter of the tile: 18 at 72, 12 at 48, 8 at 32, 6 at 24. Round tiles only for avatars, level medals and map pins. `secondary_container` tiles are reserved for completion/reward.

**Gable typology** — the house is no longer one generic shape. Five real Amsterdam gables form the alphabet, and a row mixes them: **trapgevel** (step, odd number of steps), **klokgevel** (bell crown on flared shoulders), **halsgevel** (neck with shoulder scrolls and the hoisting beam in `secondary_container`), **puntgevel** (the only permitted triangle in the system), **tuitgevel** (spout — the workhorse filler).

**The row** — houses are never alone: narrow, touching (2–3px gap), uneven at the top, level at the street. At 72 and 48px the row keeps window pairs and one arched door; at 32 and 24px the detail drops entirely to three houses with a single curved top. Scale by dropping houses and detail, never by shrinking every part.

**Objects in the row** — a skyline may replace one or two houses with an object from the set so the street reads as a specific Dutch place: a **molen** (trapezoid tower + two crossed sails on a hub), a **kerktoren** (spire + tower with a clock disc), a **fiets** at street level, or a **brug** arch. One or two per row, never adjacent, never overlaid on top of a house, and a different mix per row so no two skylines on a page are identical.

**Dutch object set** — a second family for empty states, lesson chips and reward moments: molen, fiets, tulp, brug, grachtenboot, kaas, stroopwafel, klomp, vlag & wimpel, paraplu, tram/OV, bollenveld. Rules: **one silhouette and one accent per object**; if a shape needs three colours to read at 24px it doesn't belong at chip size; objects are cultural furniture, never mascots, and never combined two-to-a-tile.

### 7.3 Graphic Do's and Don'ts

**DO**
*   Let the skyline run edge to edge and clip it with `overflow: hidden` so it reads as a street, not as floating shapes.
*   Keep exactly **one** sun disc per composition; the orange is a pointer, never a texture.
*   Hold the three gable types constant across every element so all imagery reads as one street.
*   Express selection and focus with inset `box-shadow`, honouring the no-line rule.

**DON'T**
*   **DON'T** draw illustrations, mascots, or line icons — if a concept can't be said with the four primitives plus a label, use words.
*   **DON'T** centre a single house in open space, mirror the skyline, or let it run behind copy; every skyline is anchored to an edge and stays in the lower third.
*   **DON'T** stack two gradients in one composition; the hero gradient and the horizon band are the only two, and never in the same element.
*   **DON'T** let a house become a plain rectangle — every house in an icon-scale row carries a gable, and at 48px and up a window pair.
*   **DON'T** introduce new hues for categories. Category variety comes from the existing palette tints and from geometry.
