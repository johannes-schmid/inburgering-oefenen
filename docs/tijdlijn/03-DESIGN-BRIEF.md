# Design Brief — Tijdlijn Builder

**For:** Claude Design / prototype build
**Product:** inburgeringoefenen.nl
**Route:** `/inburgering/tools/tijdlijn`
**Date:** 20 August 2026

---

## 1. The brief in one paragraph

Build a tool that answers one anxious question — *"am I going to make it?"* — for people navigating Dutch civic integration in a language they're still learning. The insight the design must carry is that **the deadline is not the problem; the queue in front of it is.** Registering for an exam takes over six weeks. Results take eight, sometimes sixteen. So the real deadline is months earlier than the legal one. The entire visual concept exists to make that invisible queue visible.

This is not a dashboard. It's closer to a **tide chart**: fixed things you cannot move (the deadline), and the time you have left to get to shore.

---

## 2. Non-negotiable constraints

### 2.1 It must look like inburgeringoefenen.nl

This extends an existing product, not a new brand. Read the tokens from the codebase; the values below are observed from the live build and should be confirmed, not overwritten.

| Token | Observed value | Use |
|---|---|---|
| `--navy-900` | ~`#1B3A6B` | Hero blocks, dark cards, primary text on light |
| `--navy-800` | ~`#22467F` | Card fills, timeline spine |
| `--orange-500` | ~`#E8763A` | Primary CTA only. Never decorative. |
| `--paper` | `#FFFFFF` | Card surfaces |
| `--surface-tint` | ~`#F4F6F9` | Page background |
| `--rule` | ~`#DCE2EA` | Hairlines, card borders |
| Radius | ~10–12 px on cards, ~8 px on buttons | Consistent with existing cards |
| Display/body face | the existing geometric sans (Poppins/Gilroy family — confirm) | Keep. Do not introduce a new display face. |

**Add exactly two new tokens** for this tool, because the existing palette has no vocabulary for risk:

| New token | Value | Meaning |
|---|---|---|
| `--risk-amber` | `#C97A12` | "Tight" — deliberately darker and less cheerful than the orange CTA, so it never reads as a button |
| `--risk-red` | `#A32D2D` | "At risk / overdue" — muted, not alarm-red. These users are already frightened; the interface should be calm and factual. |

Status must **never** be communicated by colour alone: every state also has a label and an icon shape.

### 2.2 Take one risk, in one place

The signature element (§4). Everything else stays quiet and disciplined: existing cards, existing type scale, generous whitespace, no gradients, no glassmorphism, no decorative illustration. The subject is bureaucracy and time; the aesthetic should be *legible calm*, closer to a well-set train timetable than to a SaaS landing page.

### 2.3 Readable at A2 Dutch

Every string must be understandable by someone at the language level they're studying toward. Short sentences. Active voice. Nouns before abstractions. If a sentence needs a comma to survive, rewrite it. Dates always written out (`3 december 2027`), never `03-12-27`.

---

## 3. Information architecture

```
/inburgering/tools/tijdlijn
├── Landing (empty state)         — what it does, one CTA, an example timeline
├── Wizard (steps 1..n)           — one question per screen
└── Result
    ├── Verdict card              — the headline number
    ├── Timeline (the signature)
    ├── Component detail sheets   — opened from a node
    ├── Diagnostic (inline)       — 10 questions per component
    ├── Cost panel
    ├── Extension checker         — only when relevant
    ├── Naturalisation leg        — only when requested
    ├── What-if controls
    └── Save / print / share / sources
```

The wizard and result live at the same URL, with state in the query string, so a result is always shareable and always back-navigable.

---

## 4. The signature element: **the waiting shadow**

Each exam on the timeline is drawn not as a point but as a **bar with a shadow**:

```
   ●━━━━━━━━┫▒▒▒▒▒▒▒▒▒▒▒▒▒┃▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒┃
   study     register-wait   exam    result-wait   ┃ ← DEADLINE
   (soft)    (7 weeks)               (8 or 16 wks) ┃    (hard wall)
```

- The **solid segment** is the part you control: studying.
- The **hatched segments** are the parts you don't: DUO's queues.
- The **wall** is the deadline: a full-height, hard vertical rule, the only element in the layout with no radius and no softness.

If a bar's shadow crosses the wall, it renders in `--risk-red` and the wall gains a subtle notch where it's hit. The user understands the entire product in one glance, without reading a word — which matters enormously for a multilingual, low-literacy-risk audience.

**This is the one memorable thing. Spend the boldness here and nowhere else.**

On mobile the timeline rotates to vertical: today at the top, the deadline as a horizontal wall near the bottom, bars descending toward it. The metaphor survives rotation — it's a wall you're approaching either way.

---

## 5. Screen specifications

### 5.1 Landing / empty state

```
┌──────────────────────────────────────────────────────────┐
│ [breadcrumb] Home › Inburgering › Tools › Tijdlijn       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  TIJDLIJN                              ┌───────────────┐ │
│                                        │  Example      │ │
│  Wanneer moet je wat doen?             │  timeline,    │ │
│                                        │  greyed,      │ │
│  Je hebt 3 jaar. Maar aanmelden        │  static,      │ │
│  duurt 6 weken en de uitslag 8.        │  showing the  │ │
│  Reken uit wanneer je écht moet        │  wall + one   │ │
│  beginnen.                             │  shadow bar   │ │
│                                        └───────────────┘ │
│  [ Maak mijn tijdlijn ]  ← orange, single CTA            │
│                                                          │
│  Geen DigiD. Geen BSN. Niets wordt opgeslagen.           │
│  6 vragen · 2 minuten                                    │
└──────────────────────────────────────────────────────────┘
```

The hero is the thesis: an example of the shadow bar hitting the wall, live and animating once on load. Not a stock illustration, not a big number with a gradient.

The privacy line sits directly under the CTA in body-size text, not in a footer. For this audience it is a feature, not fine print.

### 5.2 Wizard

One question per screen. Large tap targets. Progress as a thin rule that fills, not a percentage.

```
┌──────────────────────────────────────────────────────────┐
│ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬░░░░░░░░░░░░░░░  Vraag 3 van 6            │
│                                                          │
│  Wanneer begon je inburgeringstermijn?                   │
│  Deze datum staat in je PIP of in je brief van DUO.      │
│                                                          │
│  [  Maand ▾ ] [  Jaar ▾ ]                                │
│                                                          │
│  ○ Ik weet het niet                                      │
│    → Dan rekenen we met een schatting.                   │
│                                                          │
│  ⓘ Waar vind ik deze datum?          ← expands inline    │
│                                                          │
│  [ ← Terug ]                       [ Volgende → ]        │
└──────────────────────────────────────────────────────────┘
```

Rules:
- "Ik weet het niet" is always present and never styled as a failure. It's a normal option in normal type.
- The "Waar vind ik dit?" disclosure shows a small annotated diagram of the DUO letter / PIP with the relevant field circled. Build these — they're the highest-value micro-content in the tool.
- From question 3 onward, a slim persistent strip at the bottom previews the emerging answer: `Je deadline: ± mei 2028`. Value before completion.

### 5.3 Result — verdict card

The first thing on the page. Not the deadline; the actionable date.

```
┌──────────────────────────────────────────────────────────┐
│  ● Je hebt ruimte                        [ mode badge ]  │
│                                                          │
│  Meld je uiterlijk aan op                                │
│                                                          │
│      3 december 2027                                     │
│      nog 67 weken                                        │
│                                                          │
│  voor je laatste examen (Schrijven).                     │
│  Daarna is er geen tijd meer voor de uitslag             │
│  vóór je deadline op 13 mei 2028.                        │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Begin met KNM. Dat kun je het snelst halen.        │  │
│  │ [ Gratis oefenexamen KNM → ]                       │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

Typographic hierarchy: the date is the largest type on the page — larger than the page title. Everything else is set at body size. Resist the urge to add supporting stat tiles.

### 5.4 Result — timeline

Vertical on mobile, vertical on desktop too (with a right-hand rail for detail). A vertical spine is correct here: it's a list of things in order, and it prints.

```
        vandaag ──●
                  │
     ┌────────────┴──────────────────────────────────────┐
     │ KNM                                   ~ 11 weken  │
     │ ●━━━━━━━┫▒▒▒▒▒▒┃▒▒▒▒▒▒▒▒                          │
     │ leren    aanmelden  examen  uitslag               │
     │ € 50 · jij betaalt                    [ Oefenen ] │
     │ ⓘ Waar sta je nu? 10 vragen →                     │
     └───────────────────────────────────────────────────┘
                  │
     ┌────────────┴──────────────────────────────────────┐
     │ Lezen A2                              ~ 19 weken  │
     │ ...                                               │
     └───────────────────────────────────────────────────┘
                  │
     ┌────────────┴──────────────────────────────────────┐
     │ PVT — bij je gemeente                gratis       │
     │ Geen wachttijd van DUO.                           │
     └───────────────────────────────────────────────────┘
                  │
     ══════════════════════════════════════════════════════
      13 mei 2028 · DEADLINE                    ← the wall
     ══════════════════════════════════════════════════════
```

Node anatomy (every node, same order): **name · duration estimate · shadow bar · cost & payer · action**. Consistency here is what makes a dense screen scannable.

Legal dates carry a small `DUO` badge and link to the source. Estimates carry a dashed underline and the word *ongeveer*. A user must be able to tell, at a glance, which numbers are law and which are ours.

### 5.5 Inline diagnostic

Collapsed inside the relevant node. Expands in place — never a modal, never a new page.

On completion the node's bar **animates to its new position over ~600 ms**, with a one-line explanation appearing beneath: *"Je KNM-examen kan 5 weken eerder. Je bent verder dan we dachten."*

That movement is the product's emotional payload. Give it real design attention: ease-out, the bar leading, the label following, the buffer figure counting. Respect `prefers-reduced-motion` by cross-fading instead.

### 5.6 Mode variants

Only the verdict card and the wall change; the timeline structure stays identical. This consistency is deliberate — a person moving from "tight" to "on track" should recognise their own plan.

| Mode | Verdict colour | Wall treatment | Copy tone |
|---|---|---|---|
| Pre-clock | navy | dashed wall, no date | "Je klok is nog niet begonnen." |
| On track | navy | solid | matter-of-fact |
| Tight | `--risk-amber` | solid, thicker | direct, prioritising |
| At risk | `--risk-red` | solid + notch where bars cross | honest, never scolding; lead with options |
| Overdue | `--risk-red` | wall moves *above* today; a second, new wall appears for the extra time | "Je termijn is voorbij. Dit gebeurt er nu." |
| Exempt | navy | no wall | "Je hoeft niet in te burgeren." |
| Naturalisation | navy | two walls: residence and diploma | neutral, forward-looking |

**Tone rule for at-risk and overdue states:** never use exclamation marks, warning triangles, or the word *fout*. State what is true, then what to do. These people have been made to feel bad by enough institutions.

### 5.7 Cost panel

Plain table, no chart. Two columns: *nu* (best case) and *waarschijnlijk* (with expected retakes). A "wie betaalt" column that says **jij**, **gemeente**, or **lening mogelijk** per row. One footnote line for childcare allowance.

### 5.8 Extension checker

Only rendered when the user might qualify. A checklist, not a form:

```
┌──────────────────────────────────────────────────────────┐
│  Misschien krijg je 6 maanden extra                      │
│  Je hoeft dit niet aan te vragen. DUO doet dit zelf.     │
│                                                          │
│  ☑ Je volgt de B1-route                                  │
│  ☑ Je termijn begon meer dan 2,5 jaar geleden            │
│  ☑ Je hebt 2 van de 4 taalexamens gehaald                │
│  ☐ Je hebt KNM gehaald                                   │
│  ☐ Je hebt PVT en MAP afgerond                           │
│                                                          │
│  Nog 2 dingen te gaan.        [ Bekijk bij DUO → ]       │
└──────────────────────────────────────────────────────────┘
```

Checkboxes reflect the user's own answers, and are tappable to correct them — the checklist doubles as an input.

---

## 6. Motion

Four moments only:

1. **Load:** the example bar grows left-to-right into the wall once, 900 ms, then rests.
2. **Wizard transitions:** 180 ms horizontal slide; no bounce.
3. **Recompute** (diagnostic or what-if slider): bars translate, 600 ms ease-out, buffer number counts.
4. **Wall hit:** when a bar crosses the deadline, a single 400 ms notch draw. Once. Never looping, never pulsing.

Everything honours `prefers-reduced-motion`.

---

## 7. Multilingual & RTL

- NL, EN, AR at launch. Nothing hard-coded; all copy in resource files.
- **Arabic is RTL and the timeline must mirror**: today on the right, the wall on the left, bars growing right-to-left. Design and build the horizontal variant with logical properties (`inline-start`/`inline-end`) from the first commit — retrofitting a mirrored timeline is painful.
- Dates render via `Intl.DateTimeFormat` per locale. Never string-concatenate a date.
- Allow +40 % text expansion in Dutch and German-length strings; Arabic needs more line-height.
- The language switcher is visible on the tool itself, not only in the site header. People land here from ads in their own language and must be able to switch instantly.

---

## 8. Print / PDF

A real deliverable, not an afterthought — klantmanagers and teachers will print this and hand it over.

- One A4 page, portrait.
- Black and white safe: status shown by pattern and label, not colour.
- Includes: verdict, full timeline with dates, cost table, source list with check dates, and the URL to return to the interactive version.
- Header: "Deze tijdlijn is een hulpmiddel. DUO bepaalt je officiële termijn."

---

## 9. Accessibility floor

- WCAG 2.2 AA contrast on all text, including on navy.
- Timeline exposed to assistive tech as an ordered list with dates as `<time datetime>`; the visual bar is `aria-hidden` with an equivalent text summary.
- Full keyboard path through wizard, nodes, diagnostic and what-if controls, with visible focus rings (2 px, `--orange-500`).
- Touch targets ≥ 44 px.
- No colour-only meaning anywhere.
- The what-if slider has a paired number input — sliders are hostile on small screens and to motor impairments.

---

## 10. Copy deck (Dutch, ready to translate)

| Slot | Copy |
|---|---|
| Page title | Tijdlijn: wanneer moet je wat doen? |
| Sub | Je hebt 3 jaar om in te burgeren. Maar aanmelden voor een examen duurt vaak meer dan 6 weken, en de uitslag nog eens 8 weken. Reken uit wanneer je écht moet beginnen. |
| CTA | Maak mijn tijdlijn |
| Privacy | Geen DigiD. Geen BSN. Je antwoorden blijven op je eigen telefoon. |
| Verdict (on track) | Je hebt ruimte — als je nu begint. |
| Verdict (tight) | Het wordt krap. Dit is de volgorde. |
| Verdict (at risk) | In dit tempo red je het niet. Je hebt twee opties. |
| Verdict (overdue) | Je termijn is voorbij. Dit gebeurt er nu. |
| Verdict (pre-clock) | Je klok loopt nog niet. Dit komt eraan. |
| Estimate label | ongeveer |
| Legal badge | volgens DUO |
| Disclaimer (persistent, once) | Dit is een hulpmiddel, geen officieel besluit. DUO bepaalt je termijn. Kijk in Mijn Inburgering. |
| Diagnostic invite | Waar sta je nu? 10 vragen, 3 minuten, geen account. |
| Recompute note | Je examen kan {n} weken eerder. Je bent verder dan we dachten. |
| Save | Stuur mij deze tijdlijn |
| Empty/unknown | Je weet deze datum nog niet. Dat geeft niet — we rekenen met een schatting en laten zien hoe je de echte datum vindt. |

Errors state what happened and what to do, in the interface's voice: *"Deze datum ligt in de toekomst. Kies de datum waarop je termijn begon."* — no apologies, no "oops".

---

## 11. Prompt for Claude Design

> Design an interactive planning tool called **Tijdlijn** for inburgeringoefenen.nl, a Dutch civic-integration exam prep platform. The user answers 6 short questions and receives a dated personal timeline showing when they must register for, sit, and receive results from each integration exam before their 3-year legal deadline.
>
> **Core insight to express visually:** the deadline isn't the constraint — the waiting is. Registering for an exam takes over 6 weeks; results take 8 to 16. So each exam is drawn as a bar with a solid "study" segment you control and hatched "waiting" segments you don't, running toward a hard vertical wall that represents the legal deadline. If the waiting crosses the wall, the bar turns red and the wall shows a notch. This shadow-bar-against-a-wall is the signature element; everything else stays quiet.
>
> **Brand:** extends an existing site — deep navy (#1B3A6B), single orange CTA (#E8763A), white cards on a light grey-blue page, ~10 px radius, geometric sans. Add only two colours: muted amber (#C97A12) for "tight" and muted red (#A32D2D) for "at risk". Calm and factual, never alarming — the audience is already anxious. No gradients, no illustration, no stat tiles.
>
> **Screens:** (1) landing with a live example bar hitting the wall and a privacy line under the CTA; (2) wizard, one question per screen, with a prominent "I don't know" option and a live deadline preview strip from question 3; (3) result: a verdict card whose largest type is a single date ("Register by 3 December 2027 — 67 weeks left"), then the vertical timeline of exam nodes, then a cost table, then an extension checklist. Each node shows name, estimate, shadow bar, cost and who pays, and a button into practice material, plus a collapsible 10-question self-test that visibly moves the bar when completed.
>
> **Must:** distinguish legal dates (solid, "volgens DUO" badge) from our estimates (dashed, "ongeveer") — never let them look alike. Mobile-first, vertical timeline, printable to one A4 page in black and white, and mirrorable for Arabic RTL. Dutch copy at A2 reading level. Show the "tight" and "overdue" variants too.

---

## 12. What "done" looks like

- A person who speaks no Dutch understands, from the shape alone, whether they are going to make it.
- A person who *does* speak Dutch can tell which numbers are law and which are our guess.
- A klantmanager can print it and hand it over without explaining it.
- Nothing on the screen looks like a government form.
