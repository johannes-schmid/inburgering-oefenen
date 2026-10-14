# Glas-kit — `components/glas/`

De bouwstenen van **Glas v1.0** (`docs/design/DESIGN_SYSTEM.md` §G1–G7). Elk component is een
**port** van een element in `docs/design/glas.html` — dezelfde waarden, dezelfde staten — en niet
opnieuw bedacht. Bij twijfel wint glas.html, en dan de spec; de code is de bug.

Importeren: `import { ExamSlotCard, AnswerRow, … } from '@/components/glas'` (de barrel exporteert
ook `ExamMark` en `CategoryMark`). De voortgang per pagina staat in `docs/design/glas-migratie.md`.

## Hoe de kit in elkaar zit

| Laag | Waar | Wat |
|---|---|---|
| Tokens | onderaan `app/globals.css` | `:root`-variabelen met de namen uit §G2 (`--nacht`, `--mist`, `--goed`, `--r-lg`, `--g-dageraad`…) en `@theme inline`-utilities |
| Componentklassen | `app/glas-components.css` | de CSS van glas.html, elke klasse met voorvoegsel **`g-`**, in `@layer components` |
| React | `components/glas/*.tsx` | één bestand per component; servercomponent tenzij er staat of beweging nodig is |
| Merken | `components/horizon/ExamMark.tsx`, `CategoryMark.tsx` | de enige laag die Glas en de oude oppervlakken delen |

### Tailwind-utilities die erbij kwamen

- Kleuren: `nacht` `diep` `navy` `navy-2` `hemel` `waas` `nevel` `mist` `mist-2` `tegel` `wit` `ink`
  `ink-2` `ink-3` `oranje` `oranje-zacht` `klei` `klei-tint` `goed` `goed-ink` `goed-tint` `fout`
  `fout-tint` → `bg-nacht`, `text-ink-2`, enz.
- Radius: `rounded-g-xs` (8) `rounded-g-sm` (12) `rounded-g-md` (16) `rounded-g-lg` (22)
  `rounded-g-xl` (28); pill = `rounded-full`. **Niet** `rounded-lg`/`rounded-xl`: die zijn van
  shadcn/Civic Authority (4px/8px).
- Schaduw: `shadow-zweef`, `shadow-zweef-d`, `shadow-glas-ring` (de navy inset-ring van "gekozen").
- Easing: `ease-glas` (`cubic-bezier(.23,1,.32,1)`), `ease-glas-io`, `ease-veer`.
- Lettertype: `font-glas-mono` (systeem-mono; Reddit Mono is nog open, §G7).

### Klassen die je direct mag gebruiken

`g-glass` · `g-glass-d` · `g-glass-strong` · `g-field` + `g-f-{variant}` · `g-veil` · `g-mono` ·
`g-tnum` · `g-head` + `g-head-{display|section|1|2|3}` + `g-head-muted` · `g-lead` · `g-btn…` ·
`g-tlink` (tekstlink met groeiende onderstreep) · `g-wrap` (1240px + 16px gutter) · `g-slots` (raster
voor examenkaarten) · `g-stats` (raster voor stat-tegels) · `g-chips` · `g-answers`.
`g-on-dark` / `g-on-field` op een ouder zet koppen, leads en focusringen goed voor die ondergrond.

---

## Materiaal en compositie

### `Field` — glas.html §01 "Kleurvelden", §04
`<Field variant="gracht" veil as="section" className="…">`
- `variant`: `dageraad` (gloed, één per pagina) · `gracht` (koel) · `nevel` (bijna wit, lezen) ·
  `nacht` (donker met gloed) · `nacht-stil` (donker, naast een oranje knop) · `licht` (portaal,
  footer) · `hero` (gloed rechts, tekst links leesbaar).
- `veil`: `true`/`'side'` = mistlaag vanaf de tekstkant (spiegelt in RTL), `'up'` = van onder.
- Zet `g-on-field` (licht) of `g-on-dark` (nacht) op zichzelf, dus koppen erin kleuren mee.
- **Wanneer:** achter elk glas, en als "foto" in heroes en kaartkoppen. Regel 06: tekst op een veld
  krijgt een `veil` of een `GlassCard strong`.

### `PageField` — glas.html "intro" en `.f-hero`
`<PageField variant="dageraad"><SectionHeading as="h1" size="display" … onField /></PageField>`
- Props: `variant` (standaard `gracht`), `veil` (standaard aan), `as` (`header`), `className`,
  `innerClassName`. Padding 56/48 mobiel, 88/72 vanaf 860px; inhoud in `g-wrap`.
- **Wanneer:** de bovenste kop van elk herbouwd scherm. Vervangt `HorizonHero`, `GradientHero`,
  `HorizonBanner`.

### `GlassCard` — glas.html §04 "Materiaal"
`<GlassCard tone="light|dark" strong as="div">`
- 72% wit + blur 24 + verzadiging 1.5 + witte bovenrand + zweefschaduw; terugval 92% wit.
- `strong` = 86% wit (tekst op het drukke deel van een veld). `tone="dark"` = 8% wit op Nacht/foto.
- **Wanneer:** alleen waar iets óp iets anders ligt (G1 regel 2). **Nooit glas op glas, nooit glas op
  mist of wit** — daar is het een witte kaart (`bg-wit rounded-g-lg`).

### `SectionHeading` — glas.html §02 "Typografie", `.s-head`
`<SectionHeading title="Meer blauw," muted="in zeven tinten." size="section" as="h2" aside="…" />`
- `size`: `display` 96 · `section` 58 · `h1` 48 · `h2` 30 · `h3` 22 (Manrope 700, strakke tracking).
- `muted`: de tweede regel, gewicht 500, `ink-3` (op mist/wit) of `ink-2` met `onField`.
- `onDark`: wit met 55% witte tweede regel. `aside`: alinea rechts ernaast (onder 860px eronder).
- **Geen kicker erboven** en geen `<br>` in een h1.

## Knoppen en keuzes

### `GlasButton` / `glasButton()` — glas.html §06 "Knoppen"
`<GlasButton variant="navy|oranje|ghost|wit|glasd" size="sm|md|lg" icon>` (een `<button>`), of
`<Link className={glasButton({ variant: 'oranje', size: 'lg' })}>`.
- Hoogtes 38/48/56, pill, Manrope 700. Druk `scale(.97)` 160ms; focus = 3px lucht + 2px navy
  (op donker: waas). `disabled`/`aria-disabled` = mist-2, grijs.
- **Oranje is de ene wijzer per view.** `wit` en `glasd` zijn voor donkere vlakken.
- Pijl vooruit: lucide `ArrowRight` met `className="rtl-flip"`.

### `ChoiceTile` + `ChoiceTileGroup` — glas.html §06 "Keuzes"
```tsx
<ChoiceTileGroup label="Niveau">
  <ChoiceTile track="a2" title="Taal A2" sub="4 onderdelen" checked={v==='a2'} onClick={…} />
</ChoiceTileGroup>
```
- `track` toont `ExamMark` 48px; anders `mark` (bijv. een `CategoryMark`). `disabled` = gestippeld.
- Gekozen = wit + navy inset-ring + navy vinkje rechtsboven. Raster 2 kolommen, 1 onder 560px.
- **Wanneer:** één keuze uit een paar die een track of onderdeel is (niveau, module, pakket).

### `TabCounts` — glas.html §06 "Tab en filter" (`.seg2`) · client
`<TabCounts label="Weergave" value={tab} onChange={setTab} items={[{ id:'ex', label:'Oefenexamens', count:10, controls:'panel-ex' }]} />`
- `role="tablist"`; witte duim via Motion `layoutId` (transform, 320ms ease-out).
- Pijltjes/Home/End verplaatsen zonder animatie (G6); reduced-motion springt direct.
- **Wanneer:** twee of drie gelijkwaardige weergaven van hetzelfde (Oefenexamens | Leren).

### `FilterChip` — glas.html §06 (`.fchip`)
`<FilterChip pressed={f==='lezen'} category="lezen" count={10} onClick={…}>Lezen</FilterChip>`
- Met `category`: `CategoryMark` 28px in de chip; zonder: platte chip ("Alles 40").
- Gekozen = wit + navy ring, **geen volle navy pill**. Zet ze in `<div className="g-chips">`.

### `SettingsList` + `SettingsRow`, `GlasSwitch`, `GlasCheckbox` — glas.html §06 "Instellingen"
```tsx
<SettingsList>
  <SettingsRow icon={<Bell />} title="Herinnering" sub="Elke maandag" titleId="t-rem"
    control={<GlasSwitch checked={on} onClick={() => setOn(!on)} aria-labelledby="t-rem" />} />
</SettingsList>
```
- Eén mistvlak, rijen gescheiden door een witte binnenlijn. Icoon = lucide in een wit tegeltje.
- `GlasSwitch` (`role="switch"`, 50×30, veer 260ms) en `GlasCheckbox` (`role="checkbox"`, 24px) zijn
  gecontroleerd en presentational; geef altijd een toegankelijke naam.

## Examen en resultaat

### `ExamSlotCard` — glas.html §07 "Examenkaart · ook het slot"
```tsx
<div className="g-slots">
  <ExamSlotCard number={1} state="gratis" numberLabel={t('exam')} pillLabel={t('free')} title={…} sub={…} href={…} />
</div>
```
- `state`: `gratis` · `open` (pijl) · `bezig` (ring met %, `progress` 0–100) · `gehaald` (vinkje,
  groen) · `niet` (kruis) · `pakket` (slot, gedimd) · `nog` (klok, gestippeld, **geen link**).
- **De drie niet-openbare redenen** — `nog` (niet gepubliceerd), `pakket` (niet in je pakket),
  `gehaald` (al gehaald) — zien er bewust verschillend uit. Maak er nooit één "locked" van.
- Eén kaart voor de publieke slotlijst én het portaalraster; alleen `href` verschilt
  (next-intl `Link`, getypte pathnames). Alle tekst via props (i18n). Raster 5 → 2 kolommen.

### `AnswerRow` + `AnswerGroup` — glas.html §07 "Antwoordopties · rij", §15 "Goed/Fout antwoord" · client
```tsx
<AnswerGroup label={t('answer')}>
  <AnswerRow letter="A" state="selected" onSelect={…}>…</AnswerRow>
</AnswerGroup>
```
- `state`: `idle` | `selected` (button `role="radio"`) · `correct` | `wrong` | `dim` (div, nagekeken).
- `correctLabel` ("Juist") en `wrongLabel` ("Jouw antwoord") komen in de tag rechts.
- `reward` op de rij die `correct` wordt: één keer letter-veer + vinkje tekent + lichtstreep + zeven
  vonkjes (~700ms, WAAPI). `wrong` schudt 4px/300ms. Reduced-motion: direct de eindstand.
- Rij-achtergrond is mist: zet ze op **wit** (de vraag staat altijd op wit, §G5).
- De grote "Gehaald"-burst (glas.html §15 "Gehaald") is **niet** in de kit: alleen voor een gehaald
  examen, bouw hem in de uitslag van de speler met Motion.

### `ScoreRing` — glas.html §10 "Uitslag" (`.score2`)
`<ScoreRing results={booleans} caption="84% goed" label="21 van 25 goed" size={176} />`
- Of `correct` + `total` (dan vullen de eerste segmenten). `passPct` standaard 60 (oranje streepje,
  onze oefengrens — **nooit "slaaggrens van DUO"**), `null` voor geen streepje.
- `children` vervangt het midden (bijv. `<b><AnimatedNumber value={21} /></b>`). Servercomponent.

### `PassChanceDial`, `PassChanceLabel`, `PassChanceCard` — glas.html §09 "Slaagkanslabel", `.kans-lg`
- `level`: `0` nog onbekend (gestippeld) · `1` nog niet · `2` bijna · `3` goed · `4` sterk.
- `<PassChanceLabel level={3} word="Goed" sub="3 examens · gem. 78%" size="md|sm" tone="light|glass|dark" />`
- `<PassChanceCard level={3} label="Slaagkans" word="Goed" line="…" scaleLabels={['Nog niet','Bijna','Goed','Sterk']} />`
  — 64px-wijzer in een 84px-cirkel (64 op mobiel), schaal van vier.
- **Wanneer:** de kaart in de kop van de onderdeelpagina (S1 · twee banen), het label in lijsten
  en kaarten. Woorden komen uit i18n; de banden uit de bestaande regels, nooit uit een AI-oordeel.

### `StatTile` — glas.html §09 "Stat-tegels" (`.st`)
`<StatTile label="Gemiddelde score" icon={<ChartLine />} value={78} unit="%" delta="+6" viz={…} dark />`
- In `<div className="g-stats">` (4 → 2 kolommen). Eén `dark` per rij. `viz` is een slot voor het
  kleine beeld (lijn, tien vakjes, vijf blokken, zeven dagen — markup staat in glas.html §09).

### `AnimatedNumber` — glas.html §15 "Score telt op" · client
`<AnimatedNumber value={84} suffix="%" locales={locale} format={…} />`
- NumberFlow, 900ms ease-out, tabelcijfers, volgt reduced-motion. Voor scores, dagen tot je examen,
  de prijs in de pakketkiezer.

## Merk en laden

### `ExamMark` — glas.html §05 "Track-merken" (`renderEm`, stijl C + K1)
`<ExamMark track="a2|b1|knm|ona" size={44} onDark muted />` — vlakke navy tegel, label + trede,
één oranje deel. Maten: 120 hero · 88 track-kaart · 64 ticket · 44 modulekaart · 32 zijbalk · **28
minimum**. `onDark` = 12% wit + lichte rand; `muted` = grijze tegel, wit accent.

### `CategoryMark` — glas.html §05 "Categorie-iconen" (`renderCm`, stijl fill)
`<CategoryMark category="lezen" size={44} tone="light|dark" bare />` — Phosphor fill op `#e9eef6`
(glyph 58%). Keys: `lezen luisteren schrijven spreken knm gidsen ona woorden taalregels examen
wonen gezondheid werk` (+ aliassen `grammatica`, `examentraining`).

### `LogoLoader` — glas.html §15 "Logo als laadstaat · opbouw"
`<LogoLoader label="Je examen wordt geladen" fullPage size={72} />`
- De SVG van `LogoMark`; streep groeit, zon veert, 1,9s lus. Zichtbaar pas na 400ms (`delay`).
- Alleen voor het laden van een hele pagina (`loading.tsx`); een knop of kaart krijgt een skelet.
- Eigen reduced-motion-regel: dan een stil, compleet logo.

### `ValidationSeal` — glas.html §07 `.seal`
`<ValidationSeal sub="NT2-gecertificeerd docent">Nagekeken door …</ValidationSeal>` (`glass` op een veld)
- Pil met een schildje in klei-tint en de bewering vet in navy. Vervangt `ValidationChip` op herbouwde schermen.
- **Eén keer per pagina.** Tekst via i18n of uit de database; altijd wie nakeek, nooit "geen AI".
- Niet voor ONA zolang `isOnaReviewed()` onwaar is (dan staat er `ona.draft_notice`).

## Footer

`components/Footer.tsx` is **F1 "licht glas"** (glas.html §13): `Field variant="licht"` met een
`g-glass`-kaart, logo + tagline + de vier track-merken (36px), drie linkkolommen, juridische regel
eronder. Klassen `g-foot*` in `app/glas-components.css`.

## Valkuilen

- **Prefix.** glas.html's korte klassen (`.btn`, `.chip`, `.field`, `.st`, `.opt`, `.ring`) bestaan
  hier niet; gebruik `g-…`. Phosphor's eigen CSS claimt `.ph` — die laden we niet, maar verzin geen
  klasse met die naam.
- **`--ring` is van shadcn.** De Glas-ring heet `--glas-ring` / `shadow-glas-ring`.
- **`mist` vs Tailwinds `mist-*`.** `bg-mist` en `bg-mist-2` zijn van ons; Tailwind 4 heeft een
  eigen `mist-50…950`-palet dat iets anders is.
- **Tinten als `rgba()`**, nooit `color-mix()` of `bg-navy/10` (de screenshotbrowser rendert die vol).
- **Responsieve rasters staan in de CSS** (`g-slots`, `g-tiles`, `g-stats`). Voeg je een eigen
  breakpointklasse toe, controleer in de screenshot dat hij echt gegenereerd is.
- **Nieuw CSS-bestand importeren terwijl de devserver draait:** als het `@import` eerder werd
  opgeslagen dan het bestand, cachet Turbopack de mislukte resolutie ("Can't resolve") tot een
  herstart. Maak het bestand eerst, of gebruik een nieuwe naam.
