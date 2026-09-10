# The study portal and the admin surfaces

The four portal screens, the leerlaag, the sidebar, the single content surface in /admin, and auth.

> Moved out of `CLAUDE.md` on 2026-09-02, unchanged. It is the reasoning behind decisions
> that are already made — read it when a task touches this area, not every session.
> The rules that must hold at all times live in `CLAUDE.md`; this file is why they hold.


### De taster eindigt op één kaart, en het portaal is zonder account te bekijken (2026-08-29)

Overgenomen van knmoefenen.nl, opdracht van de eigenaar. De taster liep op een aparte
e-mailpoort gevolgd door een pagina van vijf blokken (score, per tekstsoort, foute antwoorden,
upsell, knoppen); de uitleg per vraag is tijdens de sessie al gegeven, dus die blokken duwden
de enige actie waarvoor het scherm bestaat drie schermen naar beneden.

- **Eén resultaatkaart, met de slaagkansmeter ernaast.** `SlaagkansGauge` in
  `FreePracticeEngine.tsx` tekent twee bogen op één halve cirkel: oranje is nu, bleek is wat
  oefenen kan halen — het *gat* tussen de bogen is de pitch. `projectSlaagkans` in
  `lib/practice-result.ts` is die projectie: verankerd op de behaalde score, afgetopt op 92, en
  het is nadrukkelijk **geen DUO-norm** (`SEO/facts.md` §9). De copy blijft voorwaardelijk
  ("kan naar"), nooit voorspellend.
- **De score staat achter een blur, niet buiten de DOM.** `.fp-locked` draagt blur,
  `pointer-events:none`, `user-select:none` én `aria-hidden`/`inert`. Alle vier horen erbij: een
  visueel geblurd getal dat een screenreader nog voorleest is niet achtergehouden. De e2e-test
  assert daarom op dat mechanisme; `not.toContainText('%')` slaagde na deze wijziging voor de
  verkeerde reden. **De skip-link blijft** (beslissing eigenaar, ongewijzigd).
- **De platformkaart verschijnt pas na het onthullen.** Hij is de uitgang; hem naast een
  geblurde uitslag zetten vraagt de bezoeker te vertrekken vóór hij heeft gezien waarvoor hij kwam.
- **Het portaal is anoniem te bekijken en de muur staat bij het oefenexamen.**
  `/dashboard`, `/dashboard/[level]/[skill]` en `/dashboard/knm` renderen voor een gast met
  `emptyLevelledProgress()`; de twee spelerroutes redirecten naar **`/register?next=…`** in
  plaats van `/login`. **Een gast kan niets openen, ook het gratis examen niet** — het account
  aanmaken *is* wat hier verkocht wordt, en een gratis examen dat zonder account opent laat
  niets over om je voor aan te melden. `AppShell`/`PlatformSidebar` hadden de `isGuest`-stand al
  uit de KNM-fork, dus er is geen tweede chrome bijgekomen.
- **`.eq('level', null)` blijft de val**: gastprogressie komt uit `emptyLevelledProgress()`,
  niet uit een query op een niet-bestaande gebruiker.

**`components/horizon/ExamMark.tsx` is the A2/B1/KNM/ONA mark, and it is deliberately not a
`CategoryMark`.** The two answer different questions: a track is *the thing you buy and sit an exam
in*, an onderdeel is *what is inside it*. The tile carries that difference — a track is the
inverted navy tile, an onderdeel the light one — so a dashboard row reads as "four priced modules,
each with practice inside" without a heading saying so.

A2 and B1 are one drawing at two heights: the same three-step stair, with a different step lit.
Side by side that says *one level higher* before the label is read. The steps are **not** a claim
about how much Dutch a level is — no such number exists and `SEO/facts.md` §9 forbids inventing
one.

**History (2026-09-02).** `LevelMark` came first and drew the levels as an arc gauge, on the
argument that a ring with "A2" set inside it differs from "B1" only by two characters. The argument
was right and the gauge fixed it, but it left the catalogue row with four marks from three
families: a gauge for A2/B1, the KNM colonnade, and — for ONA — the *gidsen bridge*, which named
the wrong thing entirely. The Dutch Icon Studio's §04b set solves the same problem across all four
at once, including the greyed `muted` state for a track that is announced and not built, so
`LevelMark` was deleted rather than kept beside it. Same 72×72 grid; pass `size`, never re-draw.

### De leerlaag: concepten, lessen en de weg terug van een fout antwoord (2026-08-27)

Het portaal kon één ding — examens maken. Wie A2 Lezen examen 3 verprutste wist dát het fout
ging en niet wát hij moest leren. **M-L1 zet daar een cursus naast**, en de motor is generiek:
`20260828100000_lesson_layer.sql` plus `lib/lessons/`. A2 Lezen is de eerste gevulde cursus
(51 lessen, 558 items, 126 woorden, 31 concepten); M-L2 t/m M-L5 vullen de rest.

**Drie assen, en ze niet door elkaar halen is het hele ontwerp:**

- **Een CONCEPT is één leerbaar ding op een niveau** en staat één keer in `concepts`. De
  **uitleg** hoort erbij; de **opgaven niet**. Die hangen aan de les, per onderdeel: Luisteren
  oefent `omdat` op het gehoor, Schrijven laat hem bouwen. `concept_onderdelen` is de
  "KOMT IN …"-rij — een grammaticaconcept staat er vaak vier keer, een `strategie`-concept
  **altijd precies één keer**, en dat laatste is het hele antwoord op "hoe bereid je iemand voor
  die alleen Luisteren doet".
- **Beheersing telt op het CONCEPT, over de onderdelen heen.** Eén rij in
  `user_concept_mastery`, gevoed door elke les die het uitlegt. Receptief en productief worden
  **apart** geteld (`tierBucket`), want "herkent het" en "kan het maken" zijn niet hetzelfde:
  `masteryPct` maximeert receptief-alleen op **50%**, omdat 100% daar zou lezen als "hier ben je
  klaar". Trap 1 telt als productief. **`mastery_pct` is ONS getal en heet zo op het scherm** —
  `SEO/facts.md` §9 verbiedt een onnavolgbare slaagnorm, en een percentage dat als slaagkans
  leest zou datzelfde doen.
- **`question_concepts` / `open_task_concepts` is de remediatie.** Voor KNM liep die weg langs de
  tekstsoort (`lib/leren-links.ts`); voor de taalonderdelen kan dat niet, want "Advertentie" is
  geen leerbaar concept. `/api/lesson-advice` groepeert de foute antwoorden per concept, sorteert
  op hoe vaak ze terugkomen en linkt naar de les die het `teaches`. **Een concept zonder
  vrijgegeven les valt terug op de conceptpagina** in plaats van naar een 404 te wijzen.

**De reviewgate is echt, anders dan bij de A2-examendataset.** De seeder schrijft **alles**
`pending` en er is **geen `--publish`-vlag**: vrijgeven gebeurt per les in `/admin/lessen`, door
een mens, en `reviewed_by` komt uit de sessie en nooit uit een body. Een `pending` les is langs
zijn URL leesbaar (dát maakt reviewen mogelijk) en staat in geen blok, geen menu en geen
voortgang. Geverifieerd: HTTP 200 op de les, 0 keer op de cursuspagina.

**De publicatiegate is een feit over de content, geen vlag.** `hasCourse()` en
`fetchConceptLevels()` vragen of er een `validated` rij bestaat. `FEATURES.leren` is één boolean
en kan niet zeggen "KNM leeft, A2 leeft, B1 nog niet"; een tweede vlag ernaast zou een tweede
schakelaar voor hetzelfde ding zijn. Zelfde koppeling als de `robots`-gate voor B1
(`itemCount !== null`).

### De portaalchrome is weer één zijbalk (29-08)

Het rail+paneel van 27-08 is terug naar **één navy zijbalk met uitklapbare modules**
(beslissing eigenaar, naar de mockup "Studieportaal Navigatie Opties"). `ModuleRail.tsx` en
`ModulePanel.tsx` zijn verwijderd; `PortalSidebar.tsx` en `LearnPanel.tsx` staan ervoor in de
plaats. `AppShell`'s API is ongewijzigd op één optionele prop na.

- **Twee vaste kolommen zeiden op elke pagina twee dingen terwijl er op de meeste maar één te
  zeggen valt.** Op het portaaloverzicht toonde het paneel een module die de bezoeker niet had
  gekozen, en op de profielpagina een module waar hij niet in zat.
- **Een tweede kolom is nu een uitzondering met een reden**, en dat is de opdracht: alleen
  binnen een cursus (`…/[skill]/leren`, één les) en in de conceptenbibliotheek. Daar is "welke
  les / welk concept" een echte tweede as die de hele bezoekduur meegaat. Buiten die routes
  krijgt `AppShell` geen `learn` en is er één kolom.
- **De pagina bouwt het paneel, niet de chrome** — alleen de pagina kent de blokken, de
  voortgang en welk item het huidige is. `coursePanel()` / `conceptsPanel()` in
  `(app)/components/nav.ts` zijn de gedeelde bouwers; de labels komen als argument mee, want
  dat bestand mag geen vertalingen lezen.
- **De blokkenlijst op de lespagina is nu `lg:hidden`.** Op desktop draagt het paneel hem;
  twee keer dezelfde lijst naast elkaar leest als een renderfout. Op een telefoon is er geen
  chrome, en daar staat hij nog steeds ónder de les.
- **De uitklapstaat is `localStorage`, en op de module staan wint van een opgeslagen "dicht"** —
  dezelfde regel en dezelfde reden als bij het KNM-submenu van 25-08: elke portaalpagina is een
  servercomponent, dus de zijbalk hermount bij iedere navigatie.
- **De volgorde is de catalogus (A2, B1, KNM), niet bezit-eerst.** `PortalMenu` splitst op
  bezit; in één zijbalk zou dat KNM tussen A2 en B1 laten springen zodra je KNM koopt. Bezit
  blijft zichtbaar in de rijen zelf — wat niet van jou is staat doffer.
- **`--portal-chrome-w` verandert mee** (256px, 464px met paneel — dezelfde maten en fontgroottes als de adminzijbalk, `w-64` / `text-sm` / `text-[0.8rem]`): de vaste onderbalk van de
  KNM-lespagina leest hem.
- **Backticks kunnen niet in `AppShell`'s `<style>`-blok** — het is een template literal, en een
  CSS-commentaar met `` `on` `` erin gaf een JSX-parsefout twintig regels verderop. Dat is
  precies de val die de 25-08-notitie al beschrijft, en hij is opnieuw ingelopen.

**Wat het paneel NIET draagt.** De lescursus staat niet in de portaalchrome: die draagt één as —
hoe ver je door de tien examens bent (eigenaar, 27-08). Het paneel krijgt alleen een
niveaubrede **Concepten**-rij; de cursus wordt bereikt via een kaart bovenaan de
onderdeelpagina, die zijn eigen voortgang draagt. Acht rijen in 196px is geen navigatie meer.

**`lesson_items` is ÉÉN tabel voor uitleg én opgaven**, op één `sort_order`. Dat is de belofte
van de laag: na de uitleg oefen je meteen, in dezelfde stroom. `kind` discrimineert en de
renderer is een `switch` met een `never`-default, zodat een nieuwe soort een compilefout geeft en
geen leeg blok. `tier` (0/1/2) is een didactisch feit en geen sortering — het is waarom een les
met alleen meerkeuze niets bewijst.

**`lib/lessons/items.ts` is de enige definitie van een geldige opgave**, en de scripts lezen hem
óók: `scripts/lesson-content/load-items.mjs` transpileert dat ene bestand met de `typescript` uit
`node_modules` (er is geen `tsx`) en faalt luid zodra `items.ts` iets anders dan `zod`
importeert. De alternatieven waren twee kopieën van veertien payloadvormen, of een build-tool
erbij.

**De contentpijplijn — `scripts/lesson-content/`:**

```bash
node scripts/lesson-content/generate.mjs plan            # wat er geschreven zou worden
node scripts/lesson-content/generate.mjs a2:lezen        # schrijf ze (hervat uit .unit-cache)
node scripts/lesson-content/generate.mjs a2:lezen --check
node scripts/lesson-content/seed.mjs a2:lezen --dry-run --partial
node scripts/lesson-content/seed.mjs a2:lezen
node scripts/lesson-content/tag-questions.mjs a2:lezen   # question_concepts
node scripts/lesson-content/check-answer-loop.mjs <lesUrl> <cookieFile>
```

- **De syllabus is met de hand vastgelegd**: `concepts-a2.mjs` (31 concepten, uit **TaalCompleet
  A2**'s onderwerpenlijst — vorm wel, inhoud nooit; de PDF's horen in `resources/`) en `plan.mjs`
  (blokken, lessen, woordthema's, strategieconcepten). Het model schrijft alleen het Nederlands
  voor een slot dat het krijgt. Vraag het dertig keer om "een grammaticales" en je krijgt dertig
  varianten op één les.
- **Het JSON-schema wordt PER LESSOORT samengesteld** (`KINDS_PER_LESSON` in `author.mjs`), en
  dat begon als omweg om een API-limiet (max 24 optionele velden) en is de scherpste regel
  geworden: een grammaticales kán geen `leestekst` bevatten, een examentraining geen `voorbeeld`.
- **Samengestelde payloadvelden zijn stringlijsten met `||`**, geen geneste objecten: met
  objecten binnen de item-array weigert de API het schema ("too complex").
  `normalisePayloads()` zet ze terug en is **idempotent**, want hij loopt ook over `generated/`.
- **`answer_order` bestaat omdat `answer` twee vormen had.** Eén string bij `gap_choice`, een
  lijst bij `woordorde`; het model liet het veld dan weg en dat kostte een extra call per les.
- **De Vercel AI Gateway weigert `output_config.format` sinds 2026-08-27** en neemt in plaats
  daarvan één tool met `input_schema` + `tool_choice`. Die tak zit in
  `scripts/b1-content/author.mjs` (`viaTool`) en repareert ook de B1-pijplijn, die er stil op
  stuk lag. **Verwijder hem niet omdat de directe route werkt** — op 27-08 was die zonder
  krediet en de gateway zonder `output_config`, tegelijk.
- **`--partial` seeds een cursus waarvan lessen ontbreken**, somt ze op, en wordt **geweigerd met
  `--production`**: een halve cursus gaat niet live.
- **Een woord staat één keer per onderdeel.** Twee thema's die hetzelfde woord opvoeren geven
  anders "ON CONFLICT DO UPDATE command cannot affect row a second time"; de seeder dedupliceert
  en zegt wat hij laat vallen.
- **`ON CONFLICT` kan geen DEFERRABLE constraint als arbiter.** `lesson_items_sort_key` is
  deferrable, dus de seeder verwijdert de items van een les en schrijft ze opnieuw. Dat mag
  hier: aan een lesitem hangt geen kandidaatantwoord, anders dan bij `question_options`, waar een
  delete `user_question_results.chosen_option_id` op NULL zet.

**Nakijken gebeurt twee keer, en dat is opzet.** De lesstroom kijkt lokaal na met dezelfde pure
functies (`matchesTyped`) zodat de feedback direct staat; `/api/lesson-answer` kijkt opnieuw na
en **dát** getal gaat de database in. Niet uit angst voor fraude — het antwoordmodel is publiek
leesbaar, net als `question_options.is_correct` — maar omdat een zelfgerapporteerd cijfer geen
cijfer is. De client stuurt nooit of het goed was, welke trap het was, of welk concept eraan
hangt.

**`open_zin` wordt bewust NIET rubriek-beoordeeld.** Dat kost een modelcall per oefenzin, en de
Schrijven-rubrieken bestaan om een héle opgave te beoordelen. De cursist krijgt een
voorbeeldantwoord plus checklist en vergelijkt zelf; er is dus geen "fout". `model_answer` mág
hier de client bereiken — anders dan `open_tasks.model_answer`, dat een beoordelingssleutel is.

**Drie toestanden op een conceptspoor, en ze moeten verschillen:** vinkje (les + bezit), slot
(les, niet bezeten → link naar het aanbod), streepje (**nog geen les** → geen link, geen slot).
Een slot bij "niet gebouwd" belooft dat betalen het oplevert. Zelfde discipline als de drie
niet-openbare examenslots.

**In het Arabisch blijft de lesinhoud LTR.** De chrome spiegelt, de Nederlandse zinnen niet:
rechts uitgelijnd zet bidi de slotpunt vooraan (".Ik blijf thuis omdat ik ziek ben"). Dezelfde
les als `.guide-figure-split`. En een `box-shadow: inset` heeft geen logische variant, dus elke
accentrail wordt onder `[dir="rtl"]` expliciet gespiegeld.

**Nog open in deze laag:** `d1-advertentie` en `d5-regels` ontbreken (beide API-budgetten op), en
`tag-questions.mjs` is nog niet echt gedraaid — zeven koppelingen staan met de hand om de lus te
bewijzen. **De hele laag staat nog alleen op de lokale stack**; de migratie is niet op productie
toegepast.

### Het portaal is vier schermen, en de leerlaag zit er in (29-08)

`/dashboard` → `/dashboard/[level]` → `/dashboard/[level]/[skill]` → de les. Vier vragen, elk op
één scherm: *wat heb ik?* · *waar sta ik op dit niveau?* · *ben ik klaar voor dit examen?* ·
*wat moet ik nu leren?*

- **Het overzicht toont MODULES, niet onderdelen.** Het toonde per niveau de vier onderdelen —
  twaalf kaarten voor iemand met twee niveaus en KNM, en geen ervan wist iets van de leerlaag.
  Nu is het A2 · B1 · KNM · ONA met per module twee meters (leren, oefenen), en daaronder drie
  vervolgstappen. De volgorde is **de catalogus, niet bezit-eerst** — zelfde regel als
  `PortalMenu`, anders springt KNM tussen A2 en B1 zodra je KNM koopt. Drie toestanden en ze
  moeten verschillen: van jou (link, volle kleur), te koop (doffer, met de prijs), **niet
  gebouwd (geen link, "binnenkort", nooit een slot)**.
- **`lib/lessons/readiness.ts` is "examenklaar", en het is ONS getal.** De twee helften — lessen
  en examens — wegen even zwaar; een cursus zonder examens komt niet boven **50** ("gelezen is
  niet bewezen") en de oefenhelft is *dekking maal kwaliteit*, want drie examens op 80% is niet
  hetzelfde als tien op 24%. Twee randen zijn gepind in `tests-unit/readiness.test.ts`: een
  gemaakt maar nog niet nagekeken open examen is **geen 0** (dat toont een nakijkwachtrij als een
  onvoldoende), en een onderdeel zonder cijfer valt uit de deler van het niveaugemiddelde (anders
  presenteert onze roadmap zich als de voortgang van de kandidaat). Het heet op elk scherm
  *examenklaar* met de zin "onze inschatting … geen voorspelling van je DUO-uitslag" ernaast —
  `SEO/facts.md` §9, dezelfde discipline als `masteryPct`.
- **`ReadinessRing` rendert `null` als een streepje, niet als 0%.** "Wij weten er niets van" is
  iets anders dan "je staat op nul". Zelfde regel als `formatCount` en de nulmeting.
- **Een zwak concept wordt alleen gemeld bij een onderdeel waar je iets gedaan hebt.** Beheersing
  telt op het *concept*, over de onderdelen heen — dat is het ontwerp — maar "Zwak: signaalwoorden"
  bij Spreken waar de kandidaat nooit een opgave deed verwijt hem iets wat hij daar nooit
  probeerde.
- **`StrengthWeakness` tekent vier vakjes, geen balk.** Een balk van 31% leest als een meting op
  de procent nauwkeurig terwijl het getal uit een handvol antwoorden komt. Nul vakjes + "geen data"
  is **niet** zwak en kleurt niet oranje.
- **`lib/portal-next.ts` is "wat nu?" op één plek.** Drie schermen stellen die vraag. Een module
  die je niet hebt wordt overgeslagen — een volgende stap die naar het aanbod wijst is een upsell
  vermomd als advies. `fetchNextLesson` doet één `fetchCourse` per module tot er één iets oplevert,
  niet alle modules tegelijk.
- **`fetchTeachersForCourse` is de bulkvorm van `fetchTeachingLessons`.** Per concept zou de
  onderdeelpagina dertig round-trips doen voor één kaart. Let op de `level`-tak: `.eq(…, null)`
  matcht niets in PostgREST — de val die KNM steeds opnieuw zet.
- **`.mini-head` en `.panel` staan in `globals.css`**, niet in drie `<style>`-blokken. En:
  **Turbopack serveerde opnieuw een verouderde CSS-chunk** — de regels stonden op schijf en niet in
  de chunk, en een newline toevoegen hielp niet. Alleen een herstart van de dev-server. Zelfde val
  als de 22-08-notitie.
- **`PortalHero` is de kop van élk portaalscherm**, en hij bestaat omdat de eerste versie van dit
  werk vier witte kaarten op grijs was — geen enkel element uit `components/horizon/`, wat de harde
  regel bovenaan dit document verbiedt en waardoor het ingelogde deel als een ander product las dan
  de pagina waar de bezoeker vandaan kwam. Navy paneel, `HorizonBanner` (lage skyline, geen zon:
  de rechterflank draagt de tegels), oranje band als onderrand, en daarin kicker · titel · lede ·
  tegels · de examenklaar-ring. **De onderrand moet ruimer zijn dan de skyline hoog is** — anders
  loopt de lede door de daken, wat §7.3 verbiedt.
- **De modulekaart is `SkylineTopper` + het merkteken over de straatlijn**, op alle drie de
  schermen en identiek aan `SkillCard` op de homepage. `ExamMark` voor de vier tracks (A2, B1, KNM, ONA — die laatste `muted`),
  `CategoryMark` voor de onderdelen. Tint en `seed` per index: vier kaarten zijn vier straten in één stad,
  en variatie komt **nooit** uit een nieuwe kleur (§7.3). `locked` (de neutrale ramp) is de
  niet-gebouwd-toestand, en die kaart draagt één zin in plaats van twee lege meters.
- **`.next` kan een verouderde CSS-chunk over meerdere herstarts vasthouden.** Nieuwe regels in
  `globals.css` bereikten de pagina niet en de chunk-hash bleef gelijk na `kill` + opnieuw starten;
  alleen `rm -rf .next` hielp. De oudere notitie hierover zegt "herstart de dev-server" — dat is
  niet genoeg.
- **De lespagina was al het gevraagde scherm** (links het pad via `coursePanel`, rechts de les);
  alleen de paneelkop was de *blok*naam en heet nu naar de cursus — een blokletter als kop noemde
  de lijst naar één van zijn eigen secties.
- **Bezit is per module, ook voor de verkooppitch.** `planFromMetadata(meta) !== 'free'` is
  onwaar voor iemand die één module kocht, dus die kreeg de upsell onder zijn eigen modules.

**Lokaal opzetten om dit met content te bekijken** (de leerlaagmigratie staat nog steeds niet op
productie): pas `20260828100000_lesson_layer.sql` toe met `psql` — **nooit `supabase db reset`**,
dat wist de scriptseeds — en draai `node scripts/lesson-content/seed.mjs a2:lezen --partial`.
Alles komt `pending` binnen en is dus onzichtbaar; voor een lokale review zet je `lessons` en
`concepts` met de hand op `validated`. Op productie hoort dat per les in `/admin/lessen`.

---

## The four surfaces — never mix their layouts

| Surface | Route group | Layout | Audience |
|---|---|---|---|
| **Homepage / marketing** | `app/[locale]/(main)/` | public `Nav` + `Footer` | anonymous, SEO |
| **Platform** | `app/[locale]/(app)/` | `PlatformSidebar` + mobile tabs, no public nav | paying users |
| **Auth** | `app/[locale]/(auth)/` | minimal shell | login/register/activate |
| **Admin** | `app/[locale]/(admin)/` | admin shell, `admin_users` allowlist guard | internal only |

**`/admin/questions` is the single content surface.** It lists `questions` *and* `open_tasks`
together — skill as tabs, the row's shape as a column — because the split between those two tables
is a database fact and the docent thinks in "de items van examen 3". `/admin/opgaven` and a
short-lived `/admin/content` were the same list twice and are gone; the per-item routes they owned
(`opgaven/[id]/edit`, `opgaven/new`) stay and are reached from the drawer's "Volledige editor".
`/admin/leren` is deleted too — `FEATURES.leren` is off, so it authored content nothing could
display. Woordkaarten stays.

**The level is in the admin navigation, not in a filter on the page.** `lib/admin/nav.ts` is the
single definition of the admin sidebar — the desktop shell and the mobile drawer had already drifted
apart, so both render `_components/AdminNav.tsx`. Sections marked `levelled` (Examens, Vragen &
opdrachten, Rubrieken) get an A2/B1 sub-menu and their pages read `?niveau=` through
`levelFromSearch()`, which falls back to A2 on anything unrecognised. That makes a level linkable
and reload-proof, which the old `useState` dropdown was not. **Beoordelen is deliberately not
levelled** — it is a queue of what is waiting, and splitting the inbox by level hides work.

**Items are written in `/admin/questions` and only assigned in `/admin/exams`** (owner's decision,
2026-08-07). Two screens able to create the same rows meant two places to break the same
constraints, and the exam builder's question is "is examen 3 complete?", not "what does this
fragment say?".

- **A fragment is edited on its own page: `/admin/fragmenten/[id]`, `…/nieuw?niveau=&onderdeel=`.**
  Two thirds authoring, one third live candidate preview. It replaced a right-hand drawer, which
  could show about a fifth of a fragment at a time and edited its questions on a different screen
  from the text they are about. Clicking a fragment row anywhere lands here — there is exactly one
  fragment editor, the same rule already applied to questions and options.
  - **One draft, one save.** The fragment *and every one of its questions* live in
    `FragmentEditor`'s state and are written by a single "Opslaan". That is what makes the preview
    honest: it renders the draft, not the database. Write order is load-bearing — fragment first
    (a new one has no id, and `questions.stimulus_id` is NOT NULL), then **park reordered questions
    at negative `sort_order`**, then the questions, then deletions.
  - **`questions_stimulus_sort_key` is `DEFERRABLE INITIALLY DEFERRED`, and that does not help
    here.** Deferral applies inside one transaction; PostgREST runs every request in its own, so
    swapping questions 1 and 2 fails on the first UPDATE. The parking pass compares against the
    **database's** order (`savedOrder`), never the draft's — the draft is renumbered the moment she
    clicks the arrow, so comparing to it parks nothing and the bug comes straight back.
  - **`lib/admin/question-write.ts` holds every rule about writing a question**: options reconciled
    by label (a delete cascades `user_question_results.chosen_option_id` to NULL), every row
    upserted `is_correct: false` first (the correct one flipped after, or the unique partial index
    trips), and `exam_id` never sent. `QuestionForm` and the fragment page both call it.
  - **`_components/StimulusEditor.tsx` is the fragment's own fields** — kind, tekstsoort, intro,
    body, script, voice casting, audio generation, length, review status. Pass `value`/`onChange`
    for controlled mode (the page); leave them off and it keeps its own state and save button.
  - **The tekstsoort's colour is on the page**, as a chip and a rail, from `categoryColors()` over
    the (level, skill)'s full section list in `sort_order` — the same list `ExamBuilder` passes.
    Colours are assigned *per list*, so a different list is a different colour and the two screens
    would disagree.
  - **Magic fill sits on each question, not on the page**, and sends `stimulusText` from the
    **draft** — the fragment may be unsaved, or saved with the old text, and reading the row would
    then write a question about a fragment that no longer says that. `/api/admin/suggest-item`
    prefers `stimulusText` over `stimulusId` for exactly that reason and caps it at 8k chars;
    `QuestionForm` sends only the id and still reads the saved row.
  - **The answer key is labelled.** A bare radio beside a text field reads as decoration, so the
    column has a "Juist" header, the chosen row is tinted green with a check, and the collapsed
    card says "juist: B" or "geen juist antwoord".
  - **The preview renders the player's own components** (`StimulusPaneLive`, `McqQuestion`), never
    lookalikes. `StimulusPaneLive` is the un-memoised export: the memoised one compares `stimulus.id`
    only, and a draft's id never changes while its text does, so the preview would paint once and
    freeze. It always shows feedback (Oefenmodus) and records nothing.
- **The tekstsoort is a column everywhere it matters.** `ContentRow.sectionName` carries it into
  the grid (a question inherits its fragment's; an open task has its own), and the exam list shows
  a chip row per card — "gesprek 3 · mededeling 3 · telefoongesprek 2" — so "is examen 3 the right
  shape?" is answerable without opening it. An uncategorised fragment is shown as **geen** in the
  brand orange rather than omitted; it is the gap most worth seeing. Note `text-warning` resolves
  to `yellow-500` and is unreadable on its own 10% tint — use `#a24000` on `#fcecdd`.
- **`/admin/questions` is the ReUI `DataGrid`** (same shape as `UsersTable`): sortable columns, a
  pencil per row, exam/status filter popovers, an "alleen onvolledig" toggle and pagination, with
  **the fragment as a parent row with its questions nested underneath** (built by hand — the ReUI
  grid's expand hook renders a custom panel, not tree rows) and the existing `ContentSheet` drawer
  on row click. A fragment stays listed even when the filters hide all of its questions: "which
  fragment has nothing on it yet" is exactly what the screen is for. Clicking a fragment row
  navigates to `/admin/fragmenten/[id]`; `?onderdeel=` opens a tab. The exam builder links to the
  same page rather than editing in place.
- **`ExamBuilder` is assignment-only**: Opbouw, the publish gate, the backlog pull-in, an ordered
  read-only fragment list with the ⇄ move control, and the per-exam "genereer ontbrekende audio"
  batch. No create, no inline editor, no delete.

**Items are authored in a backlog and then assigned to an exam.** `exams.number = 0` is the
per-(level, skill) **backlog**: a holding area for items that do not belong to an oefenexamen yet.
It exists because `questions.exam_id` and `stimuli.exam_id` are both NOT NULL, so there was nowhere
for an unassigned item to live and every authoring path started *inside* an exam — writing an item
and filling a slot were the same action.

- **`lib/admin/backlog.ts` is the only place the number 0 means anything** (client-safe: labels and
  the constant). The queries are in `backlog-server.ts`. Anything that *lists or counts* the ten real
  exams must skip it — `exams_real` is the view for that; resolving an exam by id can treat it as an
  exam, because it is one.
- **A backlog can never be published or free**, enforced by `exams_backlog_never_published`. A
  published exam 0 would show up in the funnel as an eleventh oefenexamen full of drafts.
- **Assignment is one UPDATE of `stimuli.exam_id`.** The exam builder's "Uit de backlog" panel pulls
  items in; the ⇄ control on each stimulus and open task moves them anywhere, including back.
- **`stimuli_sync_questions` cascades that UPDATE to the questions.** Without it — and it did not
  exist before 2026-08-04 — moving a stimulus left its questions pointing at the *old* exam:
  `questions_sync_exam_id` is a trigger on **questions** (`UPDATE OF stimulus_id`) and nothing
  watched `stimuli.exam_id`. A stimulus and its questions are one unit; a Lezen text shared by three
  questions cannot be split across two exams.
- **Moving out of a published exam warns rather than refuses** (owner's decision, 2026-08-04), naming
  how many recorded answers are attached. That count is read on the **service key**:
  `user_question_results` has one policy, `auth.uid() = user_id`, and no admin SELECT — so the
  docent's own session sees zero rows and the warning silently never fires. Same trap as `rubrics`.

**Images are edited in the drawer, and uploaded to our own bucket.** `/api/admin/upload-image`
takes a file off the docent's disk *or* a remote URL, re-encodes to WebP at ≤1600px and stores it in
`question-images`. Everything goes through it — uploads, pasted URLs and Pexels picks — because an
exam item pointing at a third-party CDN breaks silently months later with nobody having touched it.
`OptionImagePicker` is the one picker, shared by the drawer and the full editors.

The drawer may edit an option's `image_urls`, the image stimulus and `open_task_images`, because none
of that inserts or deletes an option row. Adding, removing or re-labelling options stays in the full
editor: deleting a `question_options` row cascades `user_question_results.chosen_option_id` to NULL
and erases what past candidates picked. `/api/upload-pexels-image` and `/api/upload-wordcard-image`
now require an admin too — both were reachable by anyone who knew the path, and both fetch an
arbitrary URL from our infrastructure into a public bucket.

**Rule:** needs the sidebar → `(app)`. Needs the public nav → `(main)`. Auth → `(auth)`.
Internal content management → `(admin)`.
`/admin-login` lives in `(auth)`, not `(admin)`, to avoid a redirect loop.
Admin routes are **not** in `i18n/routing.ts` and need no translations.

---

## Authentication — Google only, one component

`components/auth/AuthPanel.tsx` is the **only** place that calls Supabase Auth. Three pages are
thin shells around it: `/login`, `/register` and `/admin-login` (the last lives in `(auth)`, not
`(admin)`, or the admin layout's redirect would loop).

- **Google is the only method**, for users and admins alike. The Microsoft (`azure`) button that
  came across from KNM was never configured on this Supabase project — it rendered and failed on
  click — and is gone. There is deliberately **no e-mail + wachtwoord**, hence no password-reset
  flow to maintain. Adding one means editing one component.
- **`?next=` is honoured but validated.** `safeNext()` in `AuthPanel` and `safePath()` in
  `app/auth/callback/route.ts` both accept only same-site absolute paths. `/auth/callback` sets a
  session cookie, so an unvalidated `next` there is an open redirect that hands over a session.
- **Admin access is not a separate credential.** Anyone signs in with the same Google account;
  the `(admin)` layout then checks the `admin_users` allowlist and bounces with `?error=not_admin`.
  The login page therefore cannot distinguish "wrong account" from "not an admin", and shouldn't.
- **`?error=` is read on the server** and passed in as `initialError`. Reading it from
  `window.location` in an effect rendered the card once without the message.
- **`next.config.ts` has no `env:` block, deliberately.** It used to map
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` from the service key — the leak recorded below — and even the
  corrected version silently overrode a correctly-set `NEXT_PUBLIC_SUPABASE_URL` with `undefined`
  wherever only the non-public name was defined. Set the `NEXT_PUBLIC_*` names directly.

### Google OAuth setup (per environment)
Supabase → Authentication → Providers → Google needs a client ID/secret from Google Cloud, and
the Google client needs **`https://<project-ref>.supabase.co/auth/v1/callback`** as an authorised
redirect URI — the Supabase URL, not ours. Then in Supabase → Authentication → URL Configuration
set **Site URL** to the environment's origin and add `<origin>/auth/callback` to Redirect URLs.
Local dev uses `config.toml`'s `[auth.external.google]` block with the same credentials and
`http://127.0.0.1:3001` as the site URL.

---

## The study portal — real routes, four onderdelen

Rebuilt 2026-07-30 around the product's actual shape: **four onderdelen, ten oefenexamens
behind each.** The KNM SPA is gone — `/dashboard` was one client page holding every view in
`useState`, so the URL never changed, a skill was not linkable and back left the portal.

| Route | What it is |
|---|---|
| `(app)/dashboard/page.tsx` | overview — four skill cards, ten-segment progress strip each |
| `(app)/dashboard/[level]/[skill]/page.tsx` | the ten oefenexamens of one onderdeel |
| `(app)/dashboard/profiel/page.tsx` | account + per-onderdeel totals |
| `(app)/oefenexamen/[level]/[skill]/[number]` | the player (`components/exam/ExamShell.tsx`) |

All are **server components**. `AppShell` (sidebar + mobile tab bar) is wrapped per page rather
than by the layout, because the player needs the same chrome from a different route segment.
The portal chrome CSS lives in `AppShell` **only** — it used to be duplicated there and in
`dashboard/page.tsx`, and the two had already drifted.

- **Progress reads `exam_attempts`, keyed by (skill, exam_number)** — see
  `lib/portal-progress.ts`. KNM keyed it `exam_${number}` with no skill, so Lezen 1 /
  Luisteren 1 / Schrijven 1 / Spreken 1 all wrote to `exam_1` and overwrote each other. It
  reads attempts rather than the `exam_results` view because that view exposes only the *latest*
  attempt, so a worse retake would lower the card.
- **Leren and woordkaarten are out of the portal.** `lib/features.ts` already flagged them off;
  the nav was advertising two dead ends. The old `dashboard/components/*View.tsx` files are
  still on disk but nothing routes to them — delete them once the decision is final.
- `/dashboard/analyse` and `/dashboard/fouten` still exist and are still KNM-shaped (flat
  question pool, topic mastery). Nothing links to them. They are the next thing to rebuild or
  remove.
- A slot has **three distinct not-openable reasons** — unpublished, paid-plan-only, already
  passed — and they must stay visually distinct. One "locked" state for all three tells the
  candidate nothing.
- **Verifying the portal needs a session.** `check-ui.mjs` cannot: every page redirects to
  `/login`. Mint a local user via the auth admin API and hand-write the `sb-127-auth-token`
  cookie (`base64-` + base64 of the session JSON).

---


## De leerlaag is per module ingedeeld, niet per cursus (02-09)

De cursus stond in één lange lijst van vijf blokken, met dezelfde lijst nog eens in een tweede
kolom naast elke les (`coursePanel`) en nóg eens als `block-nav` op mobiel. Dat is eraf
(beslissing eigenaar): elke stap van de leerroute heeft nu een **modulerooster** in exact de vorm
van de woordkaarten, en een module heeft zijn eigen scherm.

- `/dashboard/[level]/[skill]/spoor/grammatica` — 5 modules uit `concept_groups`
- `/dashboard/[level]/[skill]/spoor/examentraining` — 3 modules uit `lesson_blocks` C, D en E
- `/dashboard/[level]/[skill]/spoor/[spoor]/[module]` — de lessen, de voortgang, en twee uitgangen

**Beide module-assen komen uit de database.** Voor Grammatica is dat `concept_groups`, de as
waarop de docent haar concepten al had geordend. Voor Examentraining bestaat die as niet —
`strategie`-concepten hebben geen `group_id` — dus daar zijn de blokken zelf de modules. Een
even opdeling van blok C (11 lessen) in "aanpak" en "tekstsoorten" is overwogen en afgewezen:
die splitsing zou van ons zijn en niet van haar.

**Waarom `/spoor/` en niet `/leren/`.** `/leren/[lesSlug]` bezet dat segment al. Zie
`lib/lessons/sporen.ts`.

**Wat er van `/leren` over is** is de inhoudsopgave, en de enige unieke inhoud is blok A: die zes
lessen heten precies zoals de zes woordkaartenthema's en zijn de uitlegkant van dezelfde stof.
Ze zitten daarom in geen spoor, en `/leren` is de enige plek waar ze staan.

Ze hebben één ronde onder het woordkaartenraster gestaan en zijn er op 02-09 weer af gehaald
(beslissing eigenaar): met zes themakaarten die precies dezelfde zes namen dragen las de lijst
als hetzelfde ding twee keer. Als ze ooit naast de woorden moeten komen is de plek één regel
*binnen* een thema-deck, niet een lijst ernaast.
