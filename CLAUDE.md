# CLAUDE.md — Inburgering Oefenen

The all-in-one platform for the Dutch **inburgering**: the four taalonderdelen at **A2 and B1**,
**KNM**, and **ONA**. Read §1–§5 before touching anything; the rest is reference.

**Detail lives in `docs/decisions/`** — one file per area, holding the reasoning behind decisions
that are already made. This file holds the rules that must hold at all times. When the two
disagree, this file is current and the decision file is history.

| Read when a task touches… | File |
|---|---|
| the local stack, the hosted project, deploys | `docs/decisions/ops.md` |
| tables, migrations, constraints, the level axis | `docs/decisions/schema.md` |
| where exam items came from, TTS, seeding | `docs/decisions/content-pipelines.md` |
| the portal screens, the leerlaag, `/admin`, auth | `docs/decisions/portal-and-admin.md` |
| public pages, gidsen, the tijdlijn tool, SEO | `docs/decisions/seo-and-content-strategy.md` |
| any visual surface | `docs/decisions/design-history.md` + `docs/design/DESIGN_SYSTEM.md` |
| Schrijven/Spreken grading, AI spend | `docs/decisions/grading-and-costs.md` |
| what is still open | `docs/decisions/open-items.md` + `docs/MILESTONES.html` |

---

## 1. Dev server (always use this)

```bash
supabase start                                 # local Postgres + Auth + Storage (Docker)
PATH="/opt/homebrew/bin:$PATH" npm run dev     # next dev -p 3001, hot reload
```

Always **port 3001**. If it is already running, don't start a second instance. All `check-ui.mjs`
calls target `http://localhost:3001`.

**The local stack is on the 544xx block, not the CLI's default 543xx — leave it there.** The
Supabase CLI gives every project the same defaults (54321 API, 54322 Postgres), so two projects on
the defaults fight over them and only whichever started first comes up; the second fails with a
port-in-use error that reads like Docker being broken. Moving this one to 544xx is what lets it run
at the same time as the `knm-website` stack, which is still needed occasionally — it is the source
`scripts/knm-content/export-from-knm.mjs` reads, and knmoefenen.nl stays live as a ranking asset
until KNM ranks here. "Fixing" these back to the defaults breaks whichever stack starts second.

| | |
|---|---|
| API | http://127.0.0.1:54421 |
| Studio (browse tables) | http://127.0.0.1:54423 |
| Mailpit (catches all mail) | http://127.0.0.1:54424 |
| Postgres | `…@127.0.0.1:54422/postgres` |
| Next dev | 3001 |

`supabase status` prints them all; `supabase stop` frees them (plainly — never with `--no-backup`).

`.env.development.local` points at the local stack and takes precedence in dev, so `npm run dev`
can never write to production. Keep it that way.

Five things that have each cost real work — see `docs/decisions/ops.md`:

- **Never run `supabase db reset`.** It re-applies the baseline and `seed.sql`, which holds only
  structural data — the 1,700 script-seeded exam items are gone. Apply a new migration with `psql`
  against the running container instead.
- **Never pass `--no-backup` to `supabase stop`.** It deletes the Docker volumes. It destroyed
  `knm-website`'s local database once already.
- **Never edit a migration that has run anywhere**, including one merely "recorded as applied".
  A rewritten baseline caused a production outage; the migration history is a record of intent,
  not of fact. When production misbehaves where local does not, diff the two schemas.
- **`psql` is not on the host** — query through the container:
  `docker exec -i supabase_db_inburgering-oefenen psql -U postgres -d postgres -c '<sql>'`
- **Deploys go through GitHub only.** Push to `main`; the Vercel Git integration builds. There is
  deliberately no `.vercel/` link — don't run `vercel link`, `vercel deploy` or `vercel env pull`.

---

## 2. What this is, and what already exists

Forked from the KNM platform (`knm-website`) in July 2026; the whole machine — exam engine, admin
CRUD, ElevenLabs TTS, Mollie, Resend, Supabase auth/entitlements, portal — is reused.

**The brand is the whole traject; the *catalogue* is what is built, and the two are stated
separately on every surface.** This is the one rule a public page must not break: the site's only
claim is that a docent stands behind what is on it, and advertising an onderdeel with no reviewed
content spends exactly that credibility.

| Track | Status | What a page may say |
|---|---|---|
| **Taal A2** | live — 40 oefenexamens published | available, by name |
| **Taal B1** | live — Lezen/Schrijven/Spreken published and indexed; **Luisteren empty** | available, by name |
| **KNM** | live — 10 oefenexamens, 7 lesmodules, 366 woordkaarten | available, by name |
| **ONA** | announced only; covered by the tijdlijn tool and the gidsen | *binnenkort* |

`TRACKS` in `app/[locale]/(main)/page.tsx` is that table as code. **When a track goes live, `TRACKS`,
`data/skills.ts` and the copy move in one commit.**

**A1 and B2 are deliberately out of scope.** `Level` is `'a2' | 'b1'` and stays that way (owner's
decision). Widening it means a migration, 40 empty exam slots, routes, pricing modules and dashboard
sections for a level nobody has authored an item at.

### The USP, and what it constrains

**"Echt door een docent gevalideerd, geen AI."** Competitors generate exercises with AI; at least
one disclaims accuracy in its own terms. That is the wedge, and it is a constraint on the code:

- **No AI-generated exam content.** Every item is written or reviewed by a certified NT2 docent.
  The claim covers exam content and grading framing, at every level and in every onderdeel.
- **Schrijven/Spreken feedback is rubric-driven**: the docent authors the rubric and the model
  answers, a model applies them, the docent reviews the gradings. Never frame or build it as
  "de AI beoordeelt je antwoord" — that inverts the product's only claim.
- **Informational gidsen and blog posts may be machine-drafted**, but publish only after the docent
  has reviewed them. The **guide translations (EN/AR) are machine-produced and unreviewed**, and
  `guides.translated_note` says so in the reader's own language — never drop that clause to tidy a
  layout.
- **Never ship invented social proof.** Three fabricated testimonials and an `AggregateRating` came
  across in the fork and were removed. The product has no customers yet.

### Who pays, and what it costs

**`lib/pricing.ts` is the single source of truth. The numbers below are a summary.**

- **Free, with an account: oefenexamen 1 of every published onderdeel.** That is **eight** exams
  today — A2 Lezen/Luisteren/Schrijven/Spreken, **B1 Lezen/Schrijven/Spreken**, and KNM. B1
  Luisteren has no content, so it has nothing to give away; the rule is "exam 1 of everything that
  is published", not a per-level allowance. Verified against production 2026-09-02.
- **Free, with no account:** a 10-question taster per onderdeel (`/oefenen/[skill]`,
  `/oefenen/b1/lezen`, `/oefenen/knm`). It ends on one result card and cannot be extended into a
  full exam — the account is what is being sold there.
- **€9,95 per month per module**, where a module is `level:skill` (or bare `knm`).
- **€29,95 per month for all four taalonderdelen of one level** — ten cents above three modules, so
  it is effectively *take three, get the fourth free* and the copy says *bijna* four for the price
  of three. `BUNDLE_SAVING_PCT` and `BUNDLE_PAID_MODULES` are derived, never typed by hand.
- **KNM is its own module at €9,95 and sits outside both level bundles** (owner's decision). So
  "everything" is a level bundle plus €9,95, not a product of its own — **there is no all-access
  subscription**, and `ownsKnm()` is deliberately separate from `ownsModule()`.
- Mollie, iDEAL-first then SEPA. Cancellable in `/dashboard/profiel`; access runs to `modules_until`.
- The buyer is primarily the gezinsmigrant (self-funded or DUO loan, often EN/AR/TR-speaking).
  Price anchor for copy: a DUO exam costs €50 per onderdeel.

**Entitlement is `ownsModule(meta, level, skill)` / `ownsKnm(meta)` — never a bare plan check.**
Nothing has written `user_metadata.plan` since per-module pricing, so a paying customer reads as
`plan: 'free'`. That mistake has now shipped twice: the exam player, and the grading limit in
`lib/grading-limits.ts` (fixed 2026-09-01, which paywalled a subscriber after ten checked opdrachten).
Grep `planFromMetadata` before adding any gate.

---

## 3. The onderdelen — what we sell

Six things, and the taxonomy lives in **`data/skills.ts`**, the single source of truth for counts
and durations.

| Onderdeel | A2 | B1 | Item shape | Scoring |
|---|---|---|---|---|
| **Lezen** | 25 items · 65 min | 35 items · 110 min | text stimulus + MCQ | auto |
| **Luisteren** | 25 items · 45 min | *no content, no verified format* | audio stimulus + MCQ | auto |
| **Schrijven** | 4 items · 40 min | 12 items · 100 min | open task: e-mail / short text / form | rubric |
| **Spreken** | 16 items · 35 min | 8 items · 30 min | audio prompt + image(s) → recording | rubric |
| **KNM** | 40 items · 45 min, **no level** | — | standalone MCQ, reads itself aloud | auto |
| **ONA** | announced only | — | — | — |

**10 oefenexamens per (level, onderdeel).** All four taalonderdelen must stay visible on the landing
page, alongside KNM and ONA.

### De leerlaag: vier cursussen plus een vijfde spoor

`scripts/lesson-content/plan.mjs` is de syllabus, met de hand vastgelegd; `BUILT` noemt de vier
`a2:*`-cursussen. **129 lessen in totaal**, in dezelfde vijf blokken:

| Cursus | Lessen | Blok B is… |
|---|---|---|
| **A2 Lezen** | 53 | **het regelhuis** — 28 regellessen, gelezen door alle vier de cursussen |
| **A2 Luisteren** | 26 | **Klank en tempo** — getallen, verkorte spraak, klanken die lijken |
| **A2 Schrijven** | 24 | **Bouwstenen** — de fouten die je maakt als je zelf schrijft |
| **A2 Spreken** | 26 | **Uitspraak** — zes lessen met `naspreken` |

**De taalregels staan één keer in de database en worden per examen samengesteld** (besluit
eigenaar, 09-09 en 10-09). Er zijn **31 regels**, waarvan 28 een les hebben. Ze liggen fysiek in
blok B van Lezen (`RULES_HOME`) en worden gelézen per onderdeel: elke cursus toont in stap 2 de
regels die dát examen vraagt, gegroepeerd per conceptgroep. Zie `lib/lessons/taalregels.ts`,
`fetchRuleModules` in `sporen-server.ts` en `docs/decisions/grammar-architecture.html` (met de
ijkpunten: TaalCompleet A2 zet 43% van het boek aan grammatica onder géén vaardigheid;
nt2taalmenu.nl zet *Grammatica* als gelijke in het hoofdmenu).

**Eén woord per laag, en ze overlappen niet.** Dit is de afspraak van 10-09, nadat *Concepten*,
*Taalregels* en *Grammatica* drie namen bleken voor dezelfde rijen met drie verschillende
tellingen eronder:

| De kandidaat ziet | Betekent | In de database |
|---|---|---|
| **Woord** | een woord dat je moet kennen | `lesson_words` |
| **Taalregel** | een regel die je moet kunnen gebruiken | `concepts`, `kind = 'grammatica'` (31) |
| **Examentip** | een truc voor het examen zelf | `concepts`, `kind = 'strategie'` |
| **Module** | een brok lessen over één onderwerp | `concept_groups`, of `lesson_blocks` C/D/E |
| **Les** | één zitting van 8–12 minuten | `lessons` |

*Concept* en *Grammatica* komen in de UI niet meer voor; *spoor* alleen nog in URL's.
`guides.draft_notice` = "Concept." is Nederlands voor *kladversie* en blijft.

**`concept_onderdelen` is een échte drietrapsas**, en dat is wat de verbouwing van 10-09 oploste:

| Stand | Betekent | Waar hij staat |
|---|---|---|
| **kern** | je moet de regel in dit examen zélf goed doen | stap 2, in de bovenste modules |
| **herkennen** | begrijpen als je hem tegenkomt is genoeg | stap 2, in de onderste modules |
| **geen rij** | dit examen vraagt de regel niet | niet in deze cursus, punt |

Elf dingen die hieruit volgen en die stil fout gaan:

- **De lessen zijn NIET verhuisd in de database.** Ze staan in `lesson_blocks` van
  (a2, lezen, B) — `RULES_HOME`. `lesson_blocks.onderdeel` is een FK naar `skills.slug`, en een
  vijfde slug erbij verzinnen verbreedt `SKILLS`; dan wordt de bundelprijs onbereikbaar, want
  `priceForSelection` leest `SKILLS.length` om te bepalen of een mandje een heel niveau is. Wat
  veranderde is waar ze vandáán worden geadresseerd. De module-URL's zeggen daarom nog
  `/lezen/spoor/grammatica/<groep>`; de spoor-index zelf leidt om via `next.config.ts`.
- **Alle regels van een onderdeel staan ín stap 2, als eigen modules** (besluit eigenaar,
  10-09). `fetchRuleModules(level, onderdeel, userId)` groepeert ze op `concept_groups`, zwaarste
  module eerst, en `sporenFromBlocks` zet het eigen blok B van de cursus ervóór. Luisteren wordt
  "Taalregels · 23 lessen" (5 eigen + 18 regellessen), Schrijven en Spreken 34 (6 + 28), Lezen 20
  (geen eigen blok B). **Er zit geen gewichtsfilter meer tussen:** wat in dit onderdeel staat,
  staat in deze lijst.

- **`weight` sorteert en labelt, en filtert nooit.** Dit is dé fout die 10-09 is opgelost:
  `fetchRulesLessons` filterde op `weight === 'kern'` terwijl de bibliotheekpagina op hetzelfde
  gewicht alleen *sorteerde*. Eén kolom, twee lezingen, twee totalen voor dezelfde rijen — de
  bibliotheek zei "28 lessen voor Luisteren", stap 2 zei "8". Er ging niets stuk en er logde
  niets. Nu beslist het lidmaatschap wat een cursus bevat en zet `SpoorModule.kern` alleen de
  volgorde en de regel op de kaart ("4 van 4 zijn kern" / "alleen herkennen").

- **De leerroute is drie kaarten en er komt niets naast** (besluit eigenaar, 10-09): woorden →
  de taalregels die dit examen vraagt → het examen. Er stonden achtereenvolgens een vierde kaart
  *Alle taalregels* en een bibliotheek als menu-item; beide vervallen. Een verzameling om in te
  grasduinen is navigatie, en náást een genummerde route wordt hij als stap gelezen.

- **Er is geen bibliotheekpagina meer.** `/dashboard/[level]/taalregels` en `.../concepten` zijn
  weg en leiden om naar het niveauscherm; de twee zijbalkrijen zijn weg. Wat blijft is de naslag
  per régel op `/dashboard/[level]/taalregel/[slug]` — enkelvoud, zonder index erboven. Alleen
  díe pagina toont `body_html`, de beheersing per regel en de vier oefenwegen naast elkaar, en
  `fetchConceptAdvice` linkt er na een examen rechtstreeks naartoe.

- **Blok B van Lezen is het regelhuis en niet de leeslijst van Lezen.** `plan.mjs` bouwt het uit
  `rulesHomeConcepts()` (alle 28 regels met een les), níet uit `conceptsFor('lezen')` (20). Dat
  wás hetzelfde zolang Lezen aan 28 van de 31 hing; sinds de afweging zou het acht lessen
  weghalen die Schrijven en Spreken nog nodig hebben — er is er maar één van elk. Lidmaatschap is
  een keuze bij het lézen, niet bij het schrijven. `tests-unit/lesson-syllabus.test.ts` bewaakt dat.

- **De seeder kan een koppeling ook wéghalen.** `concept_onderdelen` werd alleen geüpsert, dus de
  koppeling kon alleen groeien: zo kwam Lezen aan `lidwoorden` en `wederkerende-werkwoorden`. De
  diff-en-delete staat in `seed.mjs` naast de upsert, gescoped op de concepten van die run.

- **Drie kernregels hebben nog geen les**, en dat is nu zichtbaar: `bijvoeglijk-naamwoord` (kern
  bij Schrijven en Spreken), `klemtoon` en `lange-korte-klank`. De conceptgroep
  `spelling-uitspraak` heeft überhaupt geen les. Ze staan in `RULES_WITHOUT_LESSON` in
  `concepts-a2.mjs`, dus het gat staat opgeschreven in plaats van dat het uit een filter valt.
  Daarom toont Luisteren 18 regellessen op 20 regels en Schrijven 28 op 30.

- **`fetchLesson` valt terug op het regelblok.** Een taalregel staat één keer in de database, in
  blok B van Lezen, maar wordt geopend vanuit de cursus waar de kandidaat in zit — dus zoekt
  `fetchLesson(level, onderdeel, slug)` eerst in dit onderdeel en dan in `RULES_HOME`. Zonder die
  val-terug was `/luisteren/leren/b1-hoofdzin-woordorde` een 404. De poort blijft het onderdeel
  waar je hem vandaan opent: de pagina controleert `ownsModule(meta, level, onderdeel)`.

- **De regelstap toont géén conceptentelling.** `conceptCount` telt de regels van dat onderdeel
  (20 bij Luisteren), de stap telt lessen (23). Twee getallen naast elkaar over bijna-hetzelfde
  lezen als een fout, en gelijk worden ze nooit: drie regels hebben geen les.

- **De verdeling is inhoudelijk en ligt vast in een test.** De maatstaf is de examenvorm: A2 Lezen
  en Luisteren zijn meerkeuze, dus een verkeerde werkwoordsuitgang kost daar niets maar een
  gemiste `omdat`, `hoeft niet` of `het goedkoopst` kost de vraag. Uitkomst: **Lezen 20 regels
  (9 kern), Luisteren 20 (8), Schrijven 30 (21), Spreken 31 (22)** — 101 rijen in
  `concept_onderdelen`, waar het er 118 waren toen 27 van de 31 op `ALL` stonden. De tellingen
  staan vast in `tests-unit/lesson-syllabus.test.ts`, dus een hertagging door Marieke is een
  bewuste testwijziging en geen cijfer dat stil verschuift. `Concept.weight` is alléén gevuld door
  `fetchConcepts(level, onderdeel)`: zonder onderdeelfilter zijn er vier rijen met vier gewichten
  en valt er niets te zeggen.

- **Elke cursus heeft zijn eigen woorden.** `lesson_words` is unique op
  `(level, onderdeel, dutch)`, en die sleutel bestaat precies hiervoor: Luisteren is vrijwel
  volledig `receptief`, Schrijven en Spreken vrijwel volledig `productief`. `USAGE_MIX` in
  `words.mjs` dwingt die verhouding af. Een les die naar het thema van een ánder onderdeel wijst
  krijgt een lége woordenlijst — er faalt niets.
- **`KINDS_PER_LESSON` in `author.mjs` is een inhoudelijke uitspraak, niet configuratie.**
  `luistertraining` heeft géén `leestekst` (een meegeleverde tekst haalt de vaardigheid weg die
  getoetst wordt), `spreektraining` geen `gap_type` (typen is niet spreken). Blok E van Luisteren
  en Spreken is daarom `luistertoets` / `spreektoets` en niet `toets`: die laatste staat geen audio
  en geen microfoon toe, en zou de toets van een luistercursus als geschreven tekst overhoren.
- **De kind-lijst wordt op drie plekken afgedwongen** — `validateLesson`, `generate.mjs --check`
  en `seed.mjs` — via `kindProblems()`. Structured outputs zijn hier géén muur: het model leverde
  een `opnemen`-item in de toets van een luistercursus ondanks de enum, en `validateItems` vindt
  elke bestáánde soort geldig.
- **Blok D en E geven niets gratis weg.** `withOrder()` zet `is_free` op de eerste les van A, B en
  C; een gratis examentraining zonder de uitleg ervoor verkoopt niets.

Four traps this taxonomy sets, all of which have bitten:

- **`SKILLS`, `SkillSlug`, `FORMATS`, `RULES` and `TASK_RULES` mean the four *taalonderdelen* only.**
  KNM is `KNM` at the bottom of `data/skills.ts`; `OnderdeelSlug` is the union for surfaces that mean
  "anything we sell". `priceForSelection` reads `SKILLS.length` to decide a basket is a complete
  level — widening `SKILLS` would make the bundle price unreachable.
- **`exams.level IS NULL` for KNM, and `.eq('level', null)` matches nothing in PostgREST.** Zero rows,
  200 OK, empty state, nothing logged. `levelFilter()` in `lib/exams.ts` is the one place that branch
  lives — route every level-filtered query through it.
- **A NULL count means unverified, never zero.** B1 Luisteren's `itemCount` is `null` because nobody
  has counted DUO's material; the validator skips the check rather than blocking the docent on a
  guess, `robots` is `{ index: skill.itemCount !== null }`, and the sitemap gates on the same fact.
  Filling those counts in opens the page in the same commit.
- **`itemCount: 40` for KNM is ours, not DUO's.** `durationMinutes: 45` *is* DUO's. Never restate 40
  as a DUO norm.

---

## 4. The three surfaces — never mix their layouts

| Surface | Route group | Layout | Audience |
|---|---|---|---|
| **Public site** | `app/[locale]/(main)/` | `Nav` + `Footer` | anonymous, SEO |
| **Study portal** | `app/[locale]/(app)/` | `PlatformSidebar` + mobile tabs, no public nav | candidates |
| **Auth** | `app/[locale]/(auth)/` | minimal shell | login/register/activate |
| **Admin** | `app/[locale]/(admin)/` | admin shell, `admin_users` allowlist | internal only |

**Rule:** needs the sidebar → `(app)`. Needs the public nav → `(main)`. Auth → `(auth)`. Internal
content management → `(admin)`. `/admin-login` lives in `(auth)`, not `(admin)`, or the admin
layout's redirect loops. Admin routes are **not** in `i18n/routing.ts` and need no translations.

- **The public site** sells: homepage, `/platform`, `/gidsen`, the three gids hubs, the free tasters,
  the per-onderdeel `/oefenexamen/[level]/[skill]` overviews, `/premium`. The header is four plain
  links (Platform · Gidsen · Prijzen · Over ons) with no dropdowns — the cost of that is paid on
  `/platform` and `/gidsen`, which **must** list everything the chrome no longer links.
- **The study portal** is what a candidate logged in for: `/dashboard` (the catalogue, one card per
  module, "wat nu?" beside it), `/dashboard/[level]`, `/dashboard/[level]/[skill]`, `/dashboard/knm`,
  the lesson and woordkaarten surfaces, `/dashboard/profiel`, and the player at
  `/oefenexamen/[level]/[skill]/[n]`. All server components. **A guest may browse the portal**; the
  wall is at the player, which redirects to `/register?next=…`.
- **`/admin` is the docent's.** `/admin/lessen` lists the leerlaag per (level, onderdeel) and
  `/admin/lessen/[id]` is where a lesson is **written**: the leerstof and its opgaven in one
  ordered stream, because `lesson_items` is one table with one sortering and "na de uitleg oefen je
  meteen" is what this layer adds. **Nagekeken and vrijgegeven are two separate facts**
  (`lessons.checked_by` vs `review_status`), with a button each — releasing an unchecked lesson is a
  warning, never a block. **`/admin/woorden` is the leerlaag's word list** (`lesson_words`, levelled,
  no KNM tab) and is a *different table* from `/admin/woordkaarten` (the 366 KNM `word_cards`) —
  one screen for both would make two different keys pretend to be one.
  `/admin/questions` is the **single content surface** for exam items — it lists
  `questions` *and* `open_tasks` together, because the split between those tables is a database fact
  and she thinks in "the items of examen 3". Items are **written** there and only **assigned** in
  `/admin/exams`. A fragment is edited on its own page, `/admin/fragmenten/[id]`. The level is in the
  admin navigation (`?niveau=`), not in a filter on the page.
- **Admin access is not a separate credential.** Everyone signs in with Google through
  `components/auth/AuthPanel.tsx` — the only place that calls Supabase Auth — and the `(admin)`
  layout then checks the allowlist. There is deliberately no e-mail + password, hence no
  password-reset flow.

### The funnel, in one picture

```
/  ──CTA──▶  /oefenen  ──▶  /oefenen/[skill] · /oefenen/b1/[skill] · /oefenen/knm
                              10-question taster, no account, feedback per question
                              └─ result: one card, score behind a blur until the e-mail step
                                 (the SKIP LINK stays), then the platform card
/oefenexamen/[level]/[skill]        PUBLIC overview — 10 slots, the SEO + funnel surface
  └─ /oefenexamen/[level]/[skill]/[n]   THE PLAYER, in (app): a guest is sent to /register
       exam 1 of every published onderdeel is free with an account; the rest → /premium
/premium  ──▶  Mollie  ──▶  /betaling-gelukt  ──▶  /dashboard
```

A slot has **three distinct not-openable reasons** — unpublished, not in your package, already
passed — and they must stay visually distinct. One "locked" state for all three tells the candidate
nothing.

**Two admin rules that fail silently.** An RLS-denied UPDATE through PostgREST returns **200 with
zero rows**, so a missing policy looks like a successful save — test write paths through a real
session. And a plain `select()` is **capped at 1,000 rows**: any admin query that tallies or lists a
whole table must go through `lib/admin/fetch-all.ts`.

---

## 5. Tech stack

- **Next.js 16**, App Router, TypeScript strict · **Tailwind v4** (`@theme` in `app/globals.css`) +
  shadcn/ui primitives on `@base-ui/react`
- **Supabase** — Postgres 17, RLS, Supabase Auth (Google only)
- **Mollie** payments · **Resend** email · **Vercel** hosting + crons
- **next-intl** — nl/en/ar, every pathname in `i18n/routing.ts`
- **ElevenLabs** — TTS (`eleven_v3` dialogue, `eleven_multilingual_v2` single voice) and Scribe STT
- **Vercel AI Gateway** — rubric grading and the B1 authoring runs. Note the global instruction
  against using the Gateway does **not** apply here: it is load-bearing and documented.
- **GA4** analytics. **PostHog was removed** — don't reintroduce it; `track()` sends to GA only.
- **Vitest** (`tests-unit/`), **Playwright** (`tests/`, targets localhost:3001), **Puppeteer** via
  `check-ui.mjs` / `check-ui-auth.mjs`

### Directory map

```
├── app/[locale]/
│   ├── (main)/          # public: homepage, platform, gidsen, oefenen, oefenexamen, premium, blog
│   ├── (app)/           # portal: dashboard, the player, leren, woordkaarten, pakketten, profiel
│   ├── (auth)/          # login, register, activate, admin-login
│   └── (admin)/         # questions, fragmenten, exams, rubrics, beoordeling, users, woordkaarten
├── app/api/             # route handlers — see the table below
├── components/          # horizon | site | ui | reui | exam | leren | proefexamen
├── data/
│   ├── skills.ts        # ★ the taxonomy: onderdelen, counts, durations, formats, rules
│   ├── lesson-visuals.ts # ★ het plaatje per les van blok B (A2 Lezen) — tien soorten, per lesslug
│   ├── guides/          # one file per gids + translations/<slug>.<locale>.ts
│   ├── free-practice.ts # the 20 static taster items
│   └── tts-voices.json  woordkaarten.ts blog-posts.ts tijdlijn/ leren/
├── lib/
│   ├── pricing.ts entitlements.ts features.ts        # ★ money and access
│   ├── exams.ts exam-content.ts portal-progress.ts portal-traject.ts
│   ├── ai/ (gateway, grade, transcribe, usage)  rubrics.ts grading-limits.ts
│   ├── admin/ (guard, fetch-all, backlog, exam-setup)  guides/  tijdlijn/  email/
│   └── supabase/{client,server,admin}.ts
├── docs/decisions/      # ★ the reasoning behind what is already decided
├── docs/design/         # the design spec + the element library
├── docs/tijdlijn/       # the five source documents for the tijdlijn engine
├── scripts/             # a2-content/ b1-content/ knm-content/ + generators, build-icons
├── supabase/migrations/ # + legacy-knm-migrations/ (archived, NOT applied)
├── tests/ tests-unit/   # playwright | vitest
├── SEO/                 # README (process), facts.md (★ every number), keywords, voice
└── check-ui.mjs check-ui-auth.mjs   # screenshot harnesses
```

`resources/` is local-only working material (DUO reference exams) and is gitignored except
`resources/images/`. **`LEARNINGS.md` is the running success/failure log** — read it at the start of
a session, append to it at the end.

### API routes

| Route | Purpose |
|---|---|
| `grade-open` | the one grading endpoint: rubric + model, capped and idempotent |
| `stt-token` | mints a single-use ElevenLabs realtime token; the key never reaches the browser |
| `generate-stimulus-audio` | two-voice Luisteren audio from `script` + `voice_cast` |
| `generate-question-audio` / `generate-wordcard-audio` / `admin/generate-lesson-audio` | other TTS surfaces |
| `mollie-checkout` / `mollie-webhook` / `payment-status` / `checkout-modules` | payment + entitlement |
| `cancel-subscription` / `reconcile-payments` | cancels live subscriptions; sets `modules_until` |
| `submit-results` / `claim-submissions` | anon results mail + campaign queue; links them to an account |
| `send-campaign-emails` | Vercel Cron, daily 09:00 UTC |
| `tijdlijn-email` | recomputes the plan server-side and queues the reminder |
| `admin/upload-image` / `pexels-*` / `upload-pexels-image` | admin image tooling |
| `admin/run-eval` / `admin/suggest-item` / `admin-revalidate` | admin tooling |
| `contact-submit` / `unsubscribe` / `track-activate-visit` | support |

**Every exam item points at our own Storage.** `admin/upload-image` re-encodes to WebP and stores in
`question-images`; an item pointing at a third-party CDN breaks silently months later.

---

## 6. The data model

**An exam** has **stimuli** (the left pane: a text, an image or an audio fragment), and each stimulus
carries **1..N questions** — DUO shares one text across 2–3 questions, so the stimulus cannot live on
the question. Each question has 3 or 4 **question_options**, which may hold text or images. KNM
questions are **standalone**: `stimulus_id IS NULL`. Schrijven/Spreken use **open_tasks**
(+ **open_task_images**) grouped into **exam_parts**.

Answers are append-only: **exam_attempts** is one row per sitting, **user_question_results** every
MCQ answer, **open_submissions** every written/spoken answer, **open_criterion_scores** one row per
rubric criterion — which is what makes Schrijven/Spreken progress chartable. `exam_results` is a
**view** of the latest attempt; never write to it. Read `questions_flat` for the old flat
option_a/b/c shape; write `question_options`.

Around that sit the rule tables: **`exam_formats`** (item count, duration, stimulus and option
ranges per level+skill), **`sections`** (the tekstsoort axis, MCQ onderdelen only),
**`exam_task_rules`** (per soort opgave, for Schrijven/Spreken), **`task_categories`** (the category
a rubric keys on), **`rubrics`**, **`skills`** (a reference table the CHECK constraints became FKs to).

**Een les is één lijst `lesson_items` met zestien soorten**, waarvan negen een antwoord vragen.
Twee daarvan zijn spraak: **`naspreken`** (hoor het, zeg het na) en **`opnemen`** (een gesproken
antwoord). Beide keuren nooit af — de opname verlaat de browser niet, er is geen rubriek en geen
cijfer, en de cursist vergelijkt zelf met het voorbeeldantwoord. Zie de kop van
`supabase/migrations/20260908120000_lesson_speaking_items.sql`. **`audio.audio_url` is nullable**:
de les wordt geschreven vóór de TTS-run.

**Schema lives in the migrations under `supabase/migrations/`, newest last.** The 26 inherited KNM
migrations are archived in `supabase/legacy-knm-migrations/` and are **not** applied. Add real
migrations *after* the baseline. `supabase/seed.sql` seeds only structural data — the admin allowlist
and the 40+10 exam slots — because placeholder questions would be indistinguishable from the
docent's real content in admin.

Nine invariants, each of which has already produced a silent wrong answer once:

1. **The level is part of the key everywhere** — exam numbers restart at 1 per level, so
   `(skill, number)` is not unique. A module is `level:skill`.
2. **`exams.level` is nullable behind a trigger** (KNM), and the unique keys use
   `NULLS NOT DISTINCT` — in a plain UNIQUE, NULLs are *distinct*, so two rows for the same
   non-levelled exam would both be allowed.
3. **`AttemptInput.level` is required, not optional.** Every B1 sitting was recorded as A2 for months
   because the column had `DEFAULT 'a2'` and no caller sent it.
4. **A rubric is keyed `(level, skill, task_type)` and `task_type` is a `task_categories` FK.** A
   rubric from the wrong category or level is an *error*, not a warning: it returns a mark that looks
   entirely legitimate.
5. **Editing a rubric that has graded someone mints version + 1.** The decider is `used_count` from
   `open_criterion_scores`, not `active`. Activating v2 must deactivate v1 **first**, scoped to the
   level.
6. **Options are reconciled by label, never deleted and re-inserted** — a delete cascades
   `user_question_results.chosen_option_id` to NULL and erases what past candidates picked. Every row
   is written `is_correct: false` first, then one is flipped (`question_options_one_correct_idx`).
7. **`exams.number = 0` is the per-(level, skill) backlog**, a holding area. It can never be published
   or free, it is exempt from every exam-level count, and anything listing the ten real exams must use
   `exams_real`. `lib/admin/backlog.ts` is the only place the number 0 means anything.
8. **Every rule column is nullable and NULL means unverified** — the validator skips the check.
   Every structure rule is a **warning**, never an error, except the option count. A 24-of-25 exam the
   owner wants live must be able to go live.
9. **Never select `model_answer` or rubric criteria into a client component.** `ExamContent` goes
   straight into `ExamShell`, so anything in `TASK_COLS` is in the page payload. The exemplar answer
   and the anchors are a scoring key; `rubrics` has no non-admin SELECT policy for the same reason.

**A big function re-created in a later migration is a rewrite.** `exam_publish_issues()` has twice
lost an earlier fix that way. Diff it against the version actually in the database, not against the
file you copied from.

---

## 7. Components and icons

**Build every new page out of the official elements. A new surface starts by picking from these, not
by drawing a header, a divider, a status dot or a category glyph of its own.**

| Folder | What it is |
|---|---|
| `components/horizon/` | the graphic language — `Skyline`, `HorizonHero`, `HorizonBanner`, `SkylineTopper`, `SectionTransition`, `SunDisc`, `HorizonBand`, `DotField`, `LensRing`, `GlassChip`, `DocentSeal`, `ValidationChip` |
| `components/horizon/CategoryMark.tsx` | **the mark for an onderdeel** — `lezen` `luisteren` `schrijven` `spreken` `knm` `gidsen` `ona`, plus the KNM thema's `wonen` `gezondheid` `werk` |
| `components/horizon/ExamMark.tsx` | **the mark for a track** — `a2` `b1` `knm` `ona`, on the inverted navy tile |
| `components/site/` | the marketing kit — `SkillCard`, `TeacherCard`, `FeatureCard`, `SectionHeader`, `GradientHero`, `LogoMark` |
| `components/ui/` | shadcn primitives (on `@base-ui/react`, not Radix) |
| `components/reui/` | the ReUI data grid, for admin tables |
| `components/exam/` | the player — `ExamShell`, `StimulusPane`, `McqQuestion`, `WritingTask`, `SpeakingTask`, `AudioPlayer`, `RubricFeedback`, `ReadAloud` |
| `components/lessons/` | de leerlaag — `LessonStream`, `LessonNarration` (+ `NarrationScope`), **`LessonVisual`**, **`LessonRecorder`** |

**Check `COMPONENTS.md` before creating a component — reuse beats new.**

| Need | Use | Never |
|---|---|---|
| Page header / hero | `HorizonHero`, `GradientHero`, or `HorizonBanner` in your own section | a hand-rolled gradient block |
| Section heading | `SectionHeader` (it carries the horizon rule) | an `<h2>` with a 1px divider |
| A boundary between blocks | a background tier shift | `border-top`, `<hr>` |
| Selection / focus | the inset `--ring-selected` | a border |
| Depth | `--shadow-ambient` + the four surface tiers | `shadow-md` |
| Naming an onderdeel, a KNM thema or the gidsen | `CategoryMark` | a lucide glyph, an emoji, a new drawing |
| Naming a track — Taal A2, Taal B1, KNM, ONA | `ExamMark` (`muted` for ONA) | `CategoryMark`, a level gauge, a hollow ring |
| A control, an arrow, a close button | **lucide-react** | a `CategoryMark`, an emoji, your own SVG |
| De microfoon in een les (`naspreken`, `opnemen`) | `LessonRecorder` | `components/exam/SpeakingTask` — die levert in en laat beoordelen |
| The validation claim | `ValidationChip` / `DocentSeal`, once per page | a second trust mark in one view |
| Een grammaticaregel in beeld | een soort uit `data/lesson-visuals.ts` (`LessonVisual`) | een eigen diagram in één lespagina |

**The icon split is by job, not by taste — and it has exactly three layers.** A **track mark**
(`ExamMark`) names *a thing you buy and sit an exam in*, on an **inverted navy tile**. A **category
mark** (`CategoryMark`) names *what is inside a track*, on a **light tile**. **lucide-react** keeps
every functional affordance. The tile inversion is load-bearing: in a dashboard row the navy tiles
are the priced modules and the light ones are the practice inside them, so never move a mark to the
other tile to tidy up a layout. KNM has a mark in **both** sets and they are not interchangeable —
molen-mens-tulp as a track, the colonnade as a category; pick by whether the surface is answering
*which module?* or *which onderdeel?*

Every mark is drawn on the studio's 72×72 grid and scaled by transform — pass `size`, never re-draw
at another size. The `cut` colour must equal the tile behind it, which is why `tone` switches both;
on navy use `CategoryMark tone="dark"` / `ExamMark onDark`. One orange accent per mark, and a
`muted` mark spends none.

**There is no second icon set for the same job.** `components/site/SkillIcon` was one — a lucide
glyph per onderdeel — and it made the same Lezen a canal house on the homepage and a `BookOpen` in
the portal. It was deleted on 2026-09-02. The full rule, layer by layer, is **COMPONENTS.md
§Icons**; the source is the Claude Design project *Dutch Icon Studio*.

If the vocabulary genuinely cannot say what a page needs, **add to `components/horizon/` and write
the rule down** — a one-off shape in one page is how a design system turns back into an accumulation.

---

## 8. Design rules

**The spec is `docs/design/DESIGN_SYSTEM.md`** ("The Civic Authority");
`docs/design/horizon-element-library.html` is its reference implementation — open it in a browser
before designing a new surface. **When the spec and the code disagree, the spec wins and the code is
the bug.** The history of each surface is `docs/decisions/design-history.md`.

Six rules that constrain code, not taste:

- **The no-line rule.** A 1px solid border may not be used for sectioning; boundaries come from a
  background colour shift. Selection and focus are an **inset** box-shadow, never a border.
- **Tonal layering, not drop shadows.** Depth is four surface tiers: base → section → card →
  pop-over, plus `--shadow-ambient` (32px blur, no offset, 6%) on a floating card.
- **One sun disc per composition.** The orange is a pointer; two orange discs in one view is the
  fastest way to make this palette look cheap.
- **No illustrations, mascots or line art.** All decorative imagery is built from the four CSS
  primitives. Functional icons stay lucide — the ban is on *drawn imagery*, not on affordances.
- **No new hue for a status.** Correct/passed is clay (`secondary`), wrong is `--color-error`, and an
  icon carries the meaning for anyone who cannot separate the two. The greens were removed from every
  live surface once already; `/admin`'s answer key is the one documented exception.
- **Scale a skyline by dropping houses, never by shrinking every part** — and a house stays roughly
  as wide as it is tall. Every header therefore needs **two counts behind one breakpoint**;
  `HorizonBanner` owns that pair, which is the reason to reach for it.

Anti-generic guardrails:

- **Colours:** brand tokens from `app/globals.css` only. Primary `#002b6d`, accent `#fe762c`, orange
  text `#a24000`. Never default Tailwind indigo/blue. `text-warning` is `yellow-500` and is
  unreadable on its own tint — use `#a24000` on `#fcecdd`.
- **A tint of a brand colour is a literal `rgba()`.** Not `color-mix()` (the screenshot browser,
  Chromium 101, doesn't support it and renders the element solid) and not `bg-primary/10` (renders
  fully opaque in the admin bundle). And check a token before using it as a light background:
  `--color-primary-container` is a mid-navy.
- **Typography:** `--font-headline` (Manrope) for headings, `--font-body` (Public Sans) for body.
  Tight tracking on large headings, 1.7 line-height on body.
- **Animation:** `transform` and `opacity` only. **Never `transition-all`.** Spring easing
  `cubic-bezier(0.22, 1, 0.36, 1)`, always with a `prefers-reduced-motion` escape.
- **No emoji anywhere in the UI**, including the site chrome — it is a live test. Checkmarks, crosses
  and arrows are lucide `Check` / `X` / `ArrowRight`.
- **Every clickable element needs hover, focus-visible and active.**
- **`--nav-h` is the public header's height, in one place.** Note the Tailwind trap:
  `h-[calc(var(--nav-h)-1px)]` emits nothing — the spaces around the minus must be underscores.
- **The logo has two definitions and a generator — never a third.** `components/site/LogoMark.tsx`
  and `MARK` in `scripts/build-icons.mjs`; change both in one commit and run `npm run build:icons`.
- **Every forward arrow carries `.rtl-flip`.** Anything annotating a fixed raster must pin its
  placement LTR and let only the text follow the locale.

---

## 9. Content rules

- **DUO reference material is copyright.** `resources/exam-references/A2/` holds the official practice
  exams, which carry an explicit no-reproduction notice. **Use them for format only** — length,
  register, question style, pane layout. Every item we ship is written from scratch. `.gitignore`
  excludes all of `resources/` except `resources/images/`.
- **Every number in a guide or a blog post comes from `SEO/facts.md`**, with its source URL and
  consulted-on date. If it is not in that file, it does not ship. **§9 is an explicit do-not-publish
  list** — chiefly the "18 van de 25" pass norm and the "500 punten" threshold, which every
  competitor states and none can source. DUO publishes no raw cut-off; saying so is the wedge.
- **Blog posts never target practice-exam keywords** — those belong to `/oefenen/[skill]` and
  `/oefenexamen/[level]/[skill]`. One query, one owning page.
- **Write for an A2 reader**: sentences averaging ≤15 words, `je` not `u`. See `SEO/voice.md`.
- **Read `SEO/README.md` before writing any post.** The blog is data in `data/blog-posts.ts`; guides
  are one file per guide in `data/guides/`, and `status: 'reviewed'` is the only state that publishes.
- **De ingesproken uitleg van een les is een `.txt` in de repo**, niet een prompt:
  `scripts/lesson-content/narration/<slug>.txt`, met `[[id | extra uitleg]]`-markers die via de
  ElevenLabs-alignment tijdstippen worden. De docent kan dan nakijken wát er gezegd wordt, en een
  diff is de enige vorm waarin dat herhaalbaar is. Elke rij gaat als `pending` de database in en de
  speler zegt dat. **Alle 28 lessen van blok B van A2 Lezen hebben er een**; het meelezen komt uit
  `lesson_narration.word_times`, nooit uit `script`. De plaatjes van die lessen staan in
  `data/lesson-visuals.ts` en de cues `vis-1 … vis-n` wijzen naar hun stappen —
  `tests-unit/narration-cues.test.ts` bewaakt dat zo'n cue een stap heeft die bestaat.
- **Een luisterfragment van een les is óók een `.txt` in de repo**:
  `scripts/lesson-content/fragments/<lesslug>-<n>.txt`, geschreven door
  `generate-lesson-audio.mjs --export` vóór er één cent aan TTS is uitgegeven. Zelfde reden als bij
  de narratie: de docent moet kúnnen nakijken wát er gezegd wordt. **De bron is de lespayload**
  (`generated/<level>-<onderdeel>/<slug>.json`); het `.txt` is de leesbare afdruk, met de casting in
  de kop. `audio.audio_url` is **nullable en dat is bedoeld** — de les wordt geschreven vóór de
  TTS-run, en de speler zegt "nog niet ingesproken" in plaats van een 404 te tonen.
- **Where content lives:** the A2/B1/KNM exam items are in Supabase, authored in `/admin` and seeded
  by `scripts/*-content/`; the 20 static taster items are `data/free-practice.ts`; the B1 taster
  derives from B1 Lezen exam 1; taster audio is committed mp3s in `public/audio/free-practice/`.
- **TTS voices come from `data/tts-voices.json` — never hardcode a voice ID.** Import via
  `lib/tts-voices.ts`. **The voice must match the speaker's gender**, established by the script's
  names and address forms; casting is per item and the generator throws on an uncast speaker rather
  than guessing. Speaker A and B are always different voices. Don't add a fifth voice without the
  owner's approval.
- **i18n on every feature:** a new user-facing string goes into `messages/nl.json`, `en.json` **and**
  `ar.json`. Exceptions: exam items (always Dutch) and lesson body text. **`grep` the locale file
  before adding a key** — duplicate JSON keys don't error, `JSON.parse` silently keeps the last one.
- Pricing is always a concrete € number, never "from X". Payment trust badges near every checkout
  CTA. Meta descriptions unique and 140–160 characters. Never a `<br>` inside an `<h1>` that splits a
  sentence. Never show a score before the e-mail step on the public funnel — and **the skip link
  stays** unless the owner says otherwise.

---

## 10. Verification — required after every change

1. `npx tsc --noEmit`
2. `PATH="/opt/homebrew/bin:$PATH" npx next build` — the **only** thing that compiles the auth-gated
   `(admin)` routes. Run it whenever you touch admin.
3. **UI changes:** `node check-ui.mjs http://localhost:3001/<path> <label>` → mobile (390) + desktop
   (1440) full-page shots in `temporary_screenshots/`. **Read both**, fix what you find, re-run.
   For `(app)` and `(admin)` use **`check-ui-auth.mjs`** with a cookie file — `check-ui.mjs` can only
   ever photograph the login page there:
   ```bash
   node check-ui-auth.mjs http://localhost:3001/nl/admin/exams/2 label /path/to/cookie.txt \
     'button[aria-label="Stimulus bewerken"]'    # optional: click before the shot
   ```
   The cookie file is one line, `sb-127-auth-token=base64-<base64 of the session JSON>`; mint it with
   `tests/helpers/session.mjs` against the local stack. The optional selector is how a drawer gets
   into the picture at all.
4. **Schema changes:** query the table afterwards to confirm it landed.
5. **Deploys:** curl the live URL.

**Report the actual output. Don't declare done without running these.**

### Handing over a multi-step build — the walkthrough video

**Ask first, at the start.** The recording costs about a minute and then takes over the screen by
launching QuickTime, so it is opt-in and the question belongs in the *first* message of a task that
looks like it will end in one — not at the end, and never by simply recording. No answer means no
recording.

When the owner has said yes, and the work changed something a person looks at and took more than one
step, record the walkthrough and open it in QuickTime:

```bash
npm run walkthrough portaal-overzicht          # records, converts to MP4, opens QuickTime
node scripts/walkthrough/record.mjs --list      # the flows that exist
```

Flows live in `scripts/walkthrough/flows/` (committed, one per surface); the recordings land in
`temporary_walkthroughs/` (gitignored). It is built on Playwright's own overlay API —
`screencast.showChapter()` for the narration cards, `showActions()` for the click highlights — and
an ffmpeg pass to H.264, **which is mandatory: Playwright writes WebM and QuickTime cannot open
it**. The `/walkthrough` skill (`.claude/skills/walkthrough/`) is the full brief, including when
*not* to record.


Two suites, different questions:

```bash
npm run test:unit                                   # vitest — pure logic, ~1s, must stay green
PATH="/opt/homebrew/bin:$PATH" npm run test:e2e     # playwright — browser, needs the local stack
```

`tests-unit/` covers logic that needs no browser (pricing, rubrics, entitlements, the dialogue
parser, the skills invariants). Add a case here whenever you fix a logic bug. `tests/` is five
Playwright files, each asking one question: `public.spec.js` (the onderdelen are visible, the funnel
works, prices are concrete), `free-practice.spec.js` (feedback per question, the score withheld, the
skip link), `seo.spec.js`, `portal.spec.js` (entitlement), `admin.spec.js` (the allowlist, and that
every credit-spending route 401s).

- **Auth in e2e is real, not mocked**, and the cookie is chunked into `.0`/`.1` — Chromium drops a
  cookie over ~4 KB, so an unchunked one silently runs the whole suite anonymous.
- **Assert structure and promises, not wording.** A suite that fails on a reworded heading is a suite
  people learn to ignore.
- **Some `tests/portal.spec.js` cases are currently red and pre-existing** — they still expect the
  portal to redirect a guest, which it deliberately stopped doing. Check against a clean tree before
  blaming your change.
- **A stale Turbopack CSS chunk is a real failure mode.** A fix can be on disk and not on the page.
  `curl` the compiled chunk and grep for your class before concluding the CSS is wrong; if it is
  stale, `rm -rf .next/dev` and restart the dev server.

---

## 11. Working agreements

- **Investigation vs action.** Asked to *investigate / check / look into / diagnose* → report
  findings, change nothing, wait for approval.
- **Scope control.** Don't create files, pages or migrations beyond what was asked. Multi-file or
  schema-touching work that wasn't scoped: stop and confirm first.
- **Learning loop.** Append an entry to `LEARNINGS.md` after **every session with a change**, before
  ending the session. Re-read it at the start of every session.

```
## [DATE] — [short title]
**Changed:** one sentence, with file paths.
**Outcome:** SUCCESS or FAILURE
**What worked / went wrong:** concrete.
**Lesson:** the generalizable rule.
```

Log failed attempts separately — a fix that took three tries is three entries.

---

## 12. What we are building next

**The roadmap is `docs/MILESTONES.html`** (M0–M6: technisch fundament → architectuur → TOFU-gidsen →
KNM-consolidatie → taalgidsen & B1 → CRO → video & kanalen). M0 and M1 are done; M2 is underway — the
pillar gids is live, the tijdlijn tool is built, and the hub is a three-fase route.

The funnel shift behind it: ~80% of the ±284k/mo "inburgering" search volume is informational, and
the site was BOFU-only. The strategy adds TOFU/MOFU authority content that converts via
gids → gratis proefexamen → module.

Next up: the six remaining M2 spokes (start each from `SEO/facts.md` §10), the EN top-3, the
diagnostic quiz inside the tijdlijn nodes, and the `.ics` export.

**Still open, with the detail in `docs/decisions/open-items.md`:**

- **De seeder mag `review_status` van een bestaande rij niet meer overschrijven** —
  `upsertKeepingReview()` in `seed.mjs`. Dit is er op 09-09 bij gekomen nadat één re-seed van
  a2:lezen 51 vrijgegeven lessen en 36 vrijgegeven concepten stil terugzette op `pending`, waarmee
  de hele cursus uit het portaal verdween. Een nieuwe rij krijgt nog steeds `pending`.
- **`d1-advertentie` en `d5-regels` staan op `pending`** — de twee Lezen-lessen die geschreven
  waren maar nooit geseed. Ze wachten op review; de cursus is nu 53 lessen, waarvan 51 vrijgegeven.
- **De 76 nieuwe lessen zijn door Marieke nagekeken en vrijgegeven** (08-09) — alleen in de
  **lokale** stack. `checked_by` en `reviewed_by` staan op `'Marieke'`; de 51 Lezen-lessen dragen
  nog `'lokale review'` uit de eerste run. **Productie heeft deze drie cursussen niet**: er is nooit
  `seed.mjs --production` gedraaid. Dat is een aparte, naar buiten gerichte stap.
- **Blok B van de drie nieuwe cursussen heeft nog geen ingesproken uitleg en geen lesplaatje.**
  `data/lesson-visuals.ts` dekt alleen blok B van A2 Lezen; `narration/` idem. Geen van beide is een
  gat in de les — de geschreven uitleg *is* de les — maar het verschil tussen de cursussen is
  zichtbaar.
- **B1 Luisteren has no content and no verified format** — ten unpublished exams, all-NULL counts.
- **The eleven B1 rubrics and KNM's `speaking_react` rubric are drafts**, marked in their
  `system_prompt`. Rewrite them in `/admin/rubrics` before a grade counts.
- **`/api/generate-question-audio`, `generate-wordcard-audio` and `admin/generate-lesson-audio` have
  no admin guard** — reachable by anyone who knows the path, and each spends ElevenLabs credits.
  `requireAdmin()` in `lib/admin/guard.ts` is how a route handler checks the allowlist.
- **`notFound()` inside a `[locale]/…/[slug]` route returns HTTP 200** — a soft 404, project-wide.
- **Marketing/legal copy still says KNM or "Professioneel Pakket"** in `betaling-gelukt` and parts of
  the legal pages. These are factual claims about the product and a real person, so they need the
  owner's wording, not a search-and-replace.
- **The KNM service key was exposed to browsers before the fork** and must be rotated.
- `submit-results` never writes `exam_number` despite `UNIQUE(email, exam_number)`;
  `exam_results` and `exam_submissions` coexist unreconciled.
