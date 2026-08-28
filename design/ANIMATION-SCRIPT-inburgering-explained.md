# Animation script — "Inburgering in the Netherlands, explained"

**Format:** 4:00 explainer · 1920×1080 (with 1080×1350 and 1080×1920 crops noted) · English VO, English on-screen type
**Voice:** calm, plain, second person. Sentences short — the audience reads English as a second or third language.
**Where it goes:** YouTube, the `/inburgering` hub, the `/gidsen` index, paid social cutdowns.
**Brief for Claude Design:** animate this in the site's own graphic language. Every frame is built from
the Dutch Horizon primitives — gable house, sun disc, horizon band, dot field — plus the six category
marks. **No illustration, no line art, no mascot, no stock photography, no emoji.** If a shot cannot be
said with those blocks, say it with type.

---

## 0. Global spec (applies to every scene)

### Palette — the only colours allowed
| Role | Hex | Use |
|---|---|---|
| primary | `#002b6d` | navy grounds, the "authority" surface |
| primary-container | `#1d428a` | second navy for gradient / depth |
| secondary-container | `#fe762c` | **the sun. One per shot. Never two.** |
| secondary | `#a24000` | orange type on light grounds |
| surface | `#f8f9fb` | light ground |
| surface-container-low / -high | `#f2f4f6` / `#e6e8ea` | card tiers |
| on-surface | `#191c1e` | body type on light |
| on-surface-variant | `#434651` | secondary type |
| error | `#ba1a1a` | the one "this goes wrong" beat (Scene 5) |

Brand gradient: `linear-gradient(135deg, #002b6d 0%, #1d428a 100%)`.
**No greens, no blues outside these tokens, no new hue for a status.** Correct/passed is clay
(`#a24000` / `#fe762c`), never green.

### Type
- Display and headline: **Manrope** 800/700, tracking `-0.02em`. Sizes: hero 3.5rem, section 2.5rem, card 1.25rem.
- Body: **Public Sans**, line-height 1.6.
- Eyebrow labels: Public Sans 0.75rem, uppercase, tracking `0.12em`.
- Radii stay tight: 2px / 4px / 8px. Nothing pill-shaped except the chips.

### Motion rules
- Animate **transform and opacity only**. No colour tweens on large fills, no blur transitions, no `all`.
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)` for entrances (spring-out), `cubic-bezier(0.4, 0, 1, 1)` for exits.
- Durations: type 320ms, cards 420ms, skyline builds 900ms, scene transitions 600ms.
- **Stagger everything in a row by 60ms.** A skyline builds house by house, left to right.
- **Scale a skyline by dropping houses, never by shrinking every part.** A house stays roughly as
  wide as it is tall. 14–16 houses at 1920, 6 in the vertical crops.
- **The graphic layer never runs behind a headline.** Copy lives in the upper two-thirds, the skyline
  and band in the lower third.
- Depth is tonal (four surface tiers) plus one ambient glow — `0 0 32px rgba(0,43,109,0.06)`. No drop shadows.
- One reduced-motion variant: cross-dissolves instead of movement, same timings.

### Recurring device — the horizon band as the timeline
A 6px `#fe762c` band sits at the bottom of the frame from 0:14 onward and **fills left to right across
the whole film**. It is the viewer's progress and the candidate's route at the same time. Scene markers
are 2px navy ticks on it. It never resets.

### Accuracy guardrails (do not "improve" these in the edit)
- Every figure on screen is either **sourced with its origin visible**, or it does not appear.
- The only monetary figure in the film is **DUO's exam fee, €50 per component**, and it must carry
  `Source: duo.nl` in 0.75rem beneath it. **Our own subscription price appears nowhere.**
- KNM has **eight** themes. Not seven.
- No pass-mark claim. Do not put "18 of 25" or "500 points" on screen in any form — DUO publishes no
  raw cut-off, and saying so is the point of Scene 5.
- Say "practice exams", never "official exams". Say "reviewed by a certified NT2 teacher", never
  "AI-generated" and never "AI grades your answer".

---

## 1. SCENE LIST

| # | In | Out | Title card | Beat |
|---|---|---|---|---|
| 1 | 0:00 | 0:18 | — | Cold open: the letter |
| 2 | 0:18 | 0:42 | **What integration actually is** | The obligation, in one sentence |
| 3 | 0:42 | 1:12 | **Do you have to?** | Who is in, who is out |
| 4 | 1:12 | 1:52 | **The route** | Arrival → letter → PIP → deadline |
| 5 | 1:52 | 2:34 | **The six parts** | Reading, Listening, Writing, Speaking, KNM, ONA |
| 6 | 2:34 | 3:04 | **The queue is the problem** | Registration and results eat months |
| 7 | 3:04 | 3:32 | **What you can do now** | Practice, reviewed by a teacher |
| 8 | 3:32 | 4:00 | — | Close + endframe |

---

## 2. SCENE-BY-SCENE

### Scene 1 — Cold open: the letter · 0:00–0:18

**Ground:** `#f8f9fb`. Dot field at 6% opacity, 24px grid, drifting up 8px over the whole scene.

**0:00–0:04** Black frame. One `#fe762c` sun disc, 12px, centre. It scales 12px → 96px on the spring
curve and settles slightly above centre. The dot field fades in behind it.

**0:04–0:10** A single white card (`surface-container-lowest`, 2px radius, ambient glow) rises 24px into
frame under the disc. It is an envelope rendered as a card: a navy 4px top band, three grey type-lines,
and one line set in navy Manrope that types on, character by character, at 40ms/char:

> `You are required to integrate.`

The sun disc slides behind the card's top-right corner — **the card overlaps the disc, and the disc is
the only orange in the frame.**

**0:10–0:18** Camera pulls back (scale 1 → 0.82, 900ms). The card becomes one card among a row of five
identical grey cards, stagger 60ms — same letter, five different people. The horizon band draws in at
the bottom, 0 → 100% width, and stops at 7%.

**VO**
> A letter arrives. It says you have to integrate — *inburgeren* — and it gives you a deadline.
> Most people read it twice and still don't know what to do first. Here is the whole thing, in four minutes.

**On-screen type (lower third, after 0:12):** `INBURGERING IN THE NETHERLANDS, EXPLAINED` — eyebrow style.

---

### Scene 2 — What integration actually is · 0:18–0:42

**Transition:** the five cards slide left out of frame; the ground wipes to navy `--gradient-brand` behind
them (a masked wipe from the horizon band upward, 600ms).

**Ground:** navy gradient. Dot field at 10% white. A 14-house skyline builds along the bottom, house by
house, 60ms apart, over 900ms. One house is a windmill silhouette (same block vocabulary: body, cap, four
2px sails) standing third from the right. The sun disc sits above the skyline on the right, `hidden` in the
vertical crops.

**Layout:** headline upper-left, three chips below it.

**0:22** Headline sets on, word by word (opacity + 8px rise, 60ms stagger):

> `Learning the language, and learning how the country works.`

**0:28–0:42** Three `GlassChip`s enter left to right, each with its category mark drawn on:
`LANGUAGE` (Reading mark) · `SOCIETY` (KNM colonnade mark) · `WORK` (Guides bridge mark).
Each mark **draws itself** — rectangles wiping open from their own baseline, 240ms, never a stroke-dash
line animation, because these are blocks and not drawings.

**VO**
> Integration is one legal obligation with two halves. You show that you can use Dutch in daily life,
> and you show that you understand how living and working here works. The government sets the level,
> DUO runs the exams, and your municipality helps you get there.

---

### Scene 3 — Do you have to? · 0:42–1:12

**Ground:** back to light `surface`. `SectionTransition` handover: the navy skyline silhouette from Scene 2
becomes the top edge of the light section, so the two scenes hand over rather than cut.

**Device:** a two-column yes/no grid, built as cards on `surface-container-low`, 2px radius, no borders —
the boundary is the tone shift, never a line.

**Left column, "Usually yes"** — three rows, stagger 120ms:
`Family migrant` · `Refugee with a residence permit` · `Non-EU, staying long-term`

**Right column, "Usually not"** — three rows:
`EU / EEA / Swiss citizen` · `Under 18 or over the state pension age` · `Short-stay: study, exchange, work permit`

Each row slides in from its own side, 320ms. A small orange tick (lucide `Check`, `#fe762c`) sets on the
left rows; a grey `X` on the right rows. **The tick is the only orange in the shot — the sun disc is absent
here on purpose.**

**1:04–1:12** Both columns compress to 60% width and a third card slides up between them, navy, full
opacity, holding one line:

> `DUO decides, and DUO writes to you.`

**VO**
> Whether you have to integrate depends on your nationality, your age, and why you came. Family migrants
> and permit-holding refugees usually do. EU citizens usually do not. But this is not a quiz you can pass
> for yourself — DUO makes the decision and sends it to you in writing. If no letter has come, that is
> worth checking rather than assuming.

**Hedging is mandatory here.** Never let a frame say "you do not have to integrate." Every row reads
"usually", and the navy card closes the point.

---

### Scene 4 — The route · 1:12–1:52

**Ground:** navy. This is the film's centrepiece: a horizontal timeline drawn **as the horizon band
itself**, thickened to 12px and running centre-frame.

Five nodes travel along it, each a small navy card that pops up above the band (spring, 420ms) with a
2px orange tick down into the band:

1. **`You arrive`** — the day your residence starts.
2. **`A letter from DUO`** — the obligation, in writing.
3. **`Talk with your municipality`** — the intake, and a learning plan (the PIP).
4. **`Your deadline`** — the period you have to finish in, set in that plan.
5. **`Diploma`** — with a sun disc rising behind it, the only one in the scene.

Between nodes 4 and 5 the band shows **grey hatching**, 8px diagonal, 40% opacity — dead waiting time.
Point at it; it is Scene 6's setup.

**1:44–1:52** Node 4's card lifts and a caption fades under it: `Extensions exist. They are decided, not assumed.`

**VO**
> The route is the same for almost everyone. You arrive. DUO writes to you. You sit down with your
> municipality, and together you write a plan — what you will learn, and by when. That deadline is real:
> miss it, and there can be consequences. An extension is possible, but somebody has to grant it. Planning
> on one you don't have yet is the most expensive mistake in this whole film.

**Motion note:** the camera does a slow 6% push-in across the whole scene, no pan. The band's fill reaches
46% by 1:52.

---

### Scene 5 — The six parts · 1:52–2:34

**Transition:** the timeline band flattens back to 6px, the nodes drop out, and the frame wipes to light.

**Ground:** `surface`. Six tiles, 3×2 at 1920, 2×3 at 1080×1350, 1×6 scroll in 9:16.
Each tile: `surface-container-low`, 2px radius, its **category mark at 48px**, a Manrope 1.25rem label, and
a single Public Sans line. They enter in reading order, 90ms apart, each rising 16px.

| Tile | Mark | Label | Line |
|---|---|---|---|
| 1 | lezen | `Reading` | Short Dutch texts, then questions. |
| 2 | luisteren | `Listening` | Conversations and announcements. |
| 3 | schrijven | `Writing` | An email, a form, a short note. |
| 4 | spreken | `Speaking` | You answer out loud, into a microphone. |
| 5 | knm | `Knowledge of Dutch society` | **Eight** themes: work, health, housing, rules, money, history, and more. |
| 6 | gidsen | `Orientation on the labour market` | Your own plan for finding work here. |

**2:18–2:26** The tiles dim to 40% and one card slides over them, navy, holding the fee:

> `€50 per part` · beneath it, 0.75rem: `Exam fee — Source: duo.nl`

**2:26–2:34** The card slides away; the tiles return. A last line sets on beneath the grid, in `#a24000`:

> `The pass mark is set by the Minister. DUO publishes no raw score.`

**VO**
> There are six parts. Four are language: reading, listening, writing, speaking. One is knowledge of
> Dutch society — eight themes, from healthcare to housing to how a Dutch workplace behaves. The last one
> is about work: your own orientation on the labour market. Each part is a separate exam, each with its own
> fee. And this is worth knowing, because you will read otherwise: DUO does not publish a fixed pass score.
> The cut-off is set by the Minister. Anyone who quotes you an exact number is guessing.

**This is the film's credibility beat.** Do not soften it, do not shorten it, and do not put a number on screen.

---

### Scene 6 — The queue is the problem · 2:34–3:04

**Ground:** navy, at its darkest — flat `#002b6d`, no gradient, dot field down to 6%. This is the sober scene.

**Device:** three stacked bars, left-aligned, growing right on the spring curve, 520ms each, 200ms apart.
Each bar is orange at its head and grey-hatched along its length — the hatching is waiting, the head is you.

- `Registering for an exam` — bar grows to 22% of frame width. Caption: `weeks, not days`
- `Waiting for a result` — 46%. Caption: `weeks per part`
- `Doing this six times` — 92%, and it runs off the right edge of the frame.

**2:52** The third bar collides with a vertical `#ba1a1a` wall labelled `YOUR DEADLINE`. The bar stops, shakes
2px, and holds. **This is the only red in the film.**

**2:56–3:04** Everything slides left; one line lands centre:

> `So the date that matters is not your deadline. It is the day you have to register by.`

The words `register by` in `#fe762c`.

**VO**
> Here is the part nobody tells you. The exams are not the slow bit — the queues around them are.
> Registering takes weeks. Waiting for a result takes weeks. Do that six times and the calendar closes on
> you long before your deadline does. So the date that actually matters is not the deadline. It is the last
> day you can register and still get your result in time.

**Motion note:** the wall must be drawn *before* the third bar reaches it, or the collision reads as a
rendering fault instead of a fact.

---

### Scene 7 — What you can do now · 3:04–3:32

**Transition:** the red wall becomes the left edge of a light card that expands to fill the frame (600ms,
scale-x from the wall's x-position). Red → navy over the first 120ms of the expansion, then no more colour tweens.

**Ground:** `surface`, dot field, a 16-house skyline low in frame, sun disc upper right.

**Device:** a product card, `surface-container-lowest`, ambient glow, holding three rows that tick on 300ms apart:

- `Practice exams for every language part` — with the four category marks in a row, 24px.
- `Written and checked by a certified NT2 teacher` — with the `ValidationChip` drawing on beside it.
- `Feedback per answer, against the teacher's own criteria` — a small three-row rubric block, each row filling to a clay marker.

**3:24** A `SkylineTopper` card slides in from the right, half overlapping: a phone-shaped panel, rounded at
the top only, cropped by the bottom of the frame, showing one reading question with three options and a clay
tick on the second. **Nothing in it is answerable and nothing claims a score.**

**VO**
> You cannot speed up DUO. You can arrive at the exam already knowing what it looks like. Practise each
> part the way it is actually set — the same shapes, the same length, the same register. Everything you
> practise here is written and checked by a certified Dutch language teacher, and your writing and speaking
> come back with feedback against her own criteria, not a number from nowhere.

**Guardrail:** the phrase "reviewed by a certified NT2 teacher" is load-bearing. It may not become
"AI-powered", "instant AI feedback", or anything of that shape.

---

### Scene 8 — Close · 3:32–4:00

**3:32–3:44** Everything except the horizon band lifts out of frame upward, 700ms, staggered. The band
completes its fill to 100% and thickens to 12px.

**3:44–3:52** The frame goes navy. The full 16-house skyline builds one last time, faster — 40ms per house —
with the windmill in the same position it held in Scene 2. The sun disc rises from behind the skyline into
the upper right. The logo mark sets centre, inverted (white tile, orange disc) on the navy.

**3:52–4:00** Endframe, held 8 seconds:

- Manrope 2.5rem, white: `Know the route. Then practise it.`
- Public Sans 1rem, `#c4c6d2`: `Reading · Listening · Writing · Speaking · Society · Work`
- One orange CTA button, 2px radius, `--gradient-btn-orange`: `Start free`
- Beneath it, 0.75rem, `#c4c6d2`: `inburgeringoefenen.nl`
- Bottom-left, 0.75rem: `Every figure in this film is sourced. Rules change — check duo.nl for your own situation.`

**VO**
> Know the route, then practise it. Start with one free exam, and find out where you actually stand.

**No end-screen animation loop.** The disc holds still. One sun, held, is the last frame.

---

## 3. Crops and cutdowns

| Deliverable | Notes |
|---|---|
| **1920×1080 master** | as specced |
| **1080×1350** | drop the sun disc in Scenes 2 and 7; skyline to 8 houses; Scene 5 grid becomes 2×3 |
| **1080×1920** | Scene 5 becomes a vertical scroll of six tiles; Scene 6's bars become vertical columns growing upward into the red wall |
| **0:30 cutdown** | Scene 6 + Scene 8 only. That is the whole ad: the queue is the problem, here is the practice. |
| **0:15 cutdown** | Scene 1 (0:00–0:10) + Scene 8 endframe. |
| **Six stills** | one per Scene-5 tile, for the guide hubs — tile, mark, label, line, on `surface`. |

## 4. Subtitles and localisation
Burned-in English subtitles, Public Sans 1rem, `#ffffff` on a 60% navy plate, bottom-safe above the horizon
band — the band must never be covered, it is the film's clock.

Dutch and Arabic versions reuse every frame, but **the Arabic cut mirrors the layout and the timeline runs
right to left.** Two things must be re-authored rather than flipped: Scene 4's node order and Scene 6's bar
direction. Do not `scaleX(-1)` the frame — the skyline, the windmill and the category marks would mirror with
it and the marks are drawn asymmetrically on purpose.
