# Glas-migratie — tracker

Elke `page.tsx` onder `app/[locale]/` (90 stuks, geteld op 2026-10-14), per oppervlak. Een scherm
is **in Glas of oud, nooit gemengd** (`docs/design/DESIGN_SYSTEM.md` regel voor de migratieperiode).
Bouw met `components/glas/` — zie `docs/design/glas-kit.md`.

**Status:** `oud` (nog Civic Authority) · `bezig` · `Glas` (herbouwd, tsc + build groen) ·
`geverifieerd` (mobiel 390 + desktop 1440 bekeken, reduced-motion gecontroleerd, i18n nl/en/ar).

Zet bij `bezig` je agentnaam in de kolom Agent, zodat twee agents niet hetzelfde scherm pakken.
Gedeelde onderdelen (layout, nav, zijbalk) staan onderaan in een eigen tabel.

## Gedeelde lagen

| Onderdeel | Bestand | Agent | Status | Notities |
|---|---|---|---|---|
| Tokens | `app/globals.css` (onderaan) | fundament | Glas | §G2, toegevoegd naast Civic Authority |
| Componentklassen | `app/glas-components.css` | fundament | Glas | `g-*` |
| Kit | `components/glas/` | fundament | Glas | zie glas-kit.md |
| Track-merk | `components/horizon/ExamMark.tsx` | fundament | Glas | label + trede, gedeeld met oude schermen |
| Categoriemerk | `components/horizon/CategoryMark.tsx` | fundament | Glas | Phosphor fill, gedeeld met oude schermen |
| Footer | `components/Footer.tsx` | fundament | Glas | F1 licht glas; de homepage-CTA erboven verwachtte nog een navy footer |
| Laadlogo | `components/glas/LogoLoader.tsx` | fundament | Glas | `components/BrandLoader.tsx` nog niet vervangen |
| Publieke nav | `components/Nav.tsx` |  | oud | glas-pill (glas.html §08 "Navigatie") |
| Portaal-zijbalk + mobiele tabs | `app/[locale]/(app)/components/PortalSidebar.tsx` e.a. |  | oud | glas.html §09b |
| Speler-schil | `components/exam/ExamShell.tsx` e.a. |  | oud | glas.html §10 |

## Publiek — `(main)`

| Route | Bestand | Agent | Status | Notities |
|---|---|---|---|---|
| `/blog/[slug]` | `app/[locale]/(main)/blog/[slug]/page.tsx` |  | oud |  |
| `/blog` | `app/[locale]/(main)/blog/page.tsx` |  | oud |  |
| `/contact` | `app/[locale]/(main)/contact/page.tsx` |  | oud |  |
| `/docent` | `app/[locale]/(main)/docent/page.tsx` |  | oud |  |
| `/gebruiksvoorwaarden` | `app/[locale]/(main)/gebruiksvoorwaarden/page.tsx` |  | oud |  |
| `/gidsen` | `app/[locale]/(main)/gidsen/page.tsx` |  | oud |  |
| `/inburgering/[slug]` | `app/[locale]/(main)/inburgering/[slug]/page.tsx` |  | oud |  |
| `/inburgering` | `app/[locale]/(main)/inburgering/page.tsx` |  | oud |  |
| `/inburgering/tools/tijdlijn` | `app/[locale]/(main)/inburgering/tools/tijdlijn/page.tsx` |  | oud |  |
| `/knm/[thema]` | `app/[locale]/(main)/knm/[thema]/page.tsx` |  | oud |  |
| `/knm` | `app/[locale]/(main)/knm/page.tsx` |  | oud |  |
| `/knm/woordenlijst` | `app/[locale]/(main)/knm/woordenlijst/page.tsx` |  | oud |  |
| `/oefenexamen/[level]/[skill]` | `app/[locale]/(main)/oefenexamen/[level]/[skill]/page.tsx` |  | oud |  |
| `/oefenexamen/[level]` | `app/[locale]/(main)/oefenexamen/[level]/page.tsx` |  | oud |  |
| `/oefenexamen/knm` | `app/[locale]/(main)/oefenexamen/knm/page.tsx` |  | oud |  |
| `/oefenvragen/[slug]` | `app/[locale]/(main)/oefenvragen/[slug]/page.tsx` |  | oud |  |
| `/oefenvragen` | `app/[locale]/(main)/oefenvragen/page.tsx` |  | oud |  |
| `/` | `app/[locale]/(main)/page.tsx` |  | oud |  |
| `/platform` | `app/[locale]/(main)/platform/page.tsx` |  | oud |  |
| `/premium` | `app/[locale]/(main)/premium/page.tsx` |  | oud |  |
| `/privacybeleid` | `app/[locale]/(main)/privacybeleid/page.tsx` |  | oud |  |
| `/redactie` | `app/[locale]/(main)/redactie/page.tsx` |  | oud |  |
| `/taalexamens/[slug]` | `app/[locale]/(main)/taalexamens/[slug]/page.tsx` |  | oud |  |
| `/taalexamens/grammatica` | `app/[locale]/(main)/taalexamens/grammatica/page.tsx` |  | oud |  |
| `/taalexamens` | `app/[locale]/(main)/taalexamens/page.tsx` |  | oud |  |
| `/taalexamens/woordenlijst` | `app/[locale]/(main)/taalexamens/woordenlijst/page.tsx` |  | oud |  |
| `/terugbetalingsbeleid` | `app/[locale]/(main)/terugbetalingsbeleid/page.tsx` |  | oud |  |
| `/uitschrijven` | `app/[locale]/(main)/uitschrijven/page.tsx` |  | oud |  |

## Portaal — `(app)`, zonder de speler

| Route | Bestand | Agent | Status | Notities |
|---|---|---|---|---|
| `/betaling-gelukt` | `app/[locale]/(app)/betaling-gelukt/page.tsx` |  | oud |  |
| `/dashboard/[level]/[skill]/grammatica/[n]` | `app/[locale]/(app)/dashboard/[level]/[skill]/grammatica/[n]/page.tsx` |  | oud |  |
| `/dashboard/[level]/[skill]/grammatica` | `app/[locale]/(app)/dashboard/[level]/[skill]/grammatica/page.tsx` |  | oud |  |
| `/dashboard/[level]/[skill]/leren/[lesSlug]` | `app/[locale]/(app)/dashboard/[level]/[skill]/leren/[lesSlug]/page.tsx` |  | oud |  |
| `/dashboard/[level]/[skill]/leren` | `app/[locale]/(app)/dashboard/[level]/[skill]/leren/page.tsx` |  | oud |  |
| `/dashboard/[level]/[skill]/oefenexamens` | `app/[locale]/(app)/dashboard/[level]/[skill]/oefenexamens/page.tsx` |  | oud |  |
| `/dashboard/[level]/[skill]` | `app/[locale]/(app)/dashboard/[level]/[skill]/page.tsx` |  | oud |  |
| `/dashboard/[level]/[skill]/spoor/[spoor]/[module]` | `app/[locale]/(app)/dashboard/[level]/[skill]/spoor/[spoor]/[module]/page.tsx` |  | oud |  |
| `/dashboard/[level]/[skill]/spoor/[spoor]` | `app/[locale]/(app)/dashboard/[level]/[skill]/spoor/[spoor]/page.tsx` |  | oud |  |
| `/dashboard/[level]/[skill]/woorden/[theme]` | `app/[locale]/(app)/dashboard/[level]/[skill]/woorden/[theme]/page.tsx` |  | oud |  |
| `/dashboard/[level]/[skill]/woorden` | `app/[locale]/(app)/dashboard/[level]/[skill]/woorden/page.tsx` |  | oud |  |
| `/dashboard/[level]` | `app/[locale]/(app)/dashboard/[level]/page.tsx` |  | oud |  |
| `/dashboard/[level]/taalregel/[slug]` | `app/[locale]/(app)/dashboard/[level]/taalregel/[slug]/page.tsx` |  | oud |  |
| `/dashboard/analyse` | `app/[locale]/(app)/dashboard/analyse/page.tsx` |  | oud |  |
| `/dashboard/fouten` | `app/[locale]/(app)/dashboard/fouten/page.tsx` |  | oud |  |
| `/dashboard/knm` | `app/[locale]/(app)/dashboard/knm/page.tsx` |  | oud |  |
| `/dashboard/ona/eindgesprek` | `app/[locale]/(app)/dashboard/ona/eindgesprek/page.tsx` |  | oud |  |
| `/dashboard/ona/inleveren` | `app/[locale]/(app)/dashboard/ona/inleveren/page.tsx` |  | oud |  |
| `/dashboard/ona/kaart/[n]` | `app/[locale]/(app)/dashboard/ona/kaart/[n]/page.tsx` |  | oud |  |
| `/dashboard/ona` | `app/[locale]/(app)/dashboard/ona/page.tsx` |  | oud |  |
| `/dashboard/ona/start` | `app/[locale]/(app)/dashboard/ona/start/page.tsx` |  | oud |  |
| `/dashboard` | `app/[locale]/(app)/dashboard/page.tsx` |  | oud |  |
| `/dashboard/pakketten` | `app/[locale]/(app)/dashboard/pakketten/page.tsx` |  | oud |  |
| `/dashboard/profiel` | `app/[locale]/(app)/dashboard/profiel/page.tsx` |  | oud |  |
| `/dashboard/woordkaarten` | `app/[locale]/(app)/dashboard/woordkaarten/page.tsx` |  | oud |  |
| `/leren/[slug]` | `app/[locale]/(app)/leren/[slug]/page.tsx` |  | oud |  |
| `/leren` | `app/[locale]/(app)/leren/page.tsx` |  | oud |  |

## Speler en tasters — `(app)/oefenexamen` + `(main)/oefenen`

| Route | Bestand | Agent | Status | Notities |
|---|---|---|---|---|
| `/oefenexamen/[level]/[skill]/[number]` | `app/[locale]/(app)/oefenexamen/[level]/[skill]/[number]/page.tsx` |  | oud |  |
| `/oefenexamen/knm/[number]` | `app/[locale]/(app)/oefenexamen/knm/[number]/page.tsx` |  | oud |  |
| `/oefenen/[skill]` | `app/[locale]/(main)/oefenen/[skill]/page.tsx` |  | oud |  |
| `/oefenen/b1/[skill]` | `app/[locale]/(main)/oefenen/b1/[skill]/page.tsx` |  | oud |  |
| `/oefenen/knm` | `app/[locale]/(main)/oefenen/knm/page.tsx` |  | oud |  |
| `/oefenen` | `app/[locale]/(main)/oefenen/page.tsx` |  | oud |  |

## Auth — `(auth)`

| Route | Bestand | Agent | Status | Notities |
|---|---|---|---|---|
| `/activate` | `app/[locale]/(auth)/activate/page.tsx` |  | oud |  |
| `/admin-login` | `app/[locale]/(auth)/admin-login/page.tsx` |  | oud |  |
| `/login` | `app/[locale]/(auth)/login/page.tsx` |  | oud |  |
| `/oauth/consent` | `app/[locale]/(auth)/oauth/consent/page.tsx` |  | oud |  |
| `/register` | `app/[locale]/(auth)/register/page.tsx` |  | oud |  |

## Admin — `(admin)`

`/admin`'s antwoordsleutel mag eigen kleuren houden (§G3).

| Route | Bestand | Agent | Status | Notities |
|---|---|---|---|---|
| `/admin/beoordeling/evals` | `app/[locale]/(admin)/admin/beoordeling/evals/page.tsx` |  | oud |  |
| `/admin/beoordeling` | `app/[locale]/(admin)/admin/beoordeling/page.tsx` |  | oud |  |
| `/admin/doelen` | `app/[locale]/(admin)/admin/doelen/page.tsx` |  | oud |  |
| `/admin/exams/[id]` | `app/[locale]/(admin)/admin/exams/[id]/page.tsx` |  | oud |  |
| `/admin/exams` | `app/[locale]/(admin)/admin/exams/page.tsx` |  | oud |  |
| `/admin/fragmenten/[id]` | `app/[locale]/(admin)/admin/fragmenten/[id]/page.tsx` |  | oud |  |
| `/admin/fragmenten/nieuw` | `app/[locale]/(admin)/admin/fragmenten/nieuw/page.tsx` |  | oud |  |
| `/admin/lessen/[id]` | `app/[locale]/(admin)/admin/lessen/[id]/page.tsx` |  | oud |  |
| `/admin/lessen` | `app/[locale]/(admin)/admin/lessen/page.tsx` |  | oud |  |
| `/admin/opgaven/[id]/edit` | `app/[locale]/(admin)/admin/opgaven/[id]/edit/page.tsx` |  | oud |  |
| `/admin/opgaven/new` | `app/[locale]/(admin)/admin/opgaven/new/page.tsx` |  | oud |  |
| `/admin` | `app/[locale]/(admin)/admin/page.tsx` |  | oud |  |
| `/admin/questions/[id]/edit` | `app/[locale]/(admin)/admin/questions/[id]/edit/page.tsx` |  | oud |  |
| `/admin/questions/new` | `app/[locale]/(admin)/admin/questions/new/page.tsx` |  | oud |  |
| `/admin/questions` | `app/[locale]/(admin)/admin/questions/page.tsx` |  | oud |  |
| `/admin/rubrics/[id]/edit` | `app/[locale]/(admin)/admin/rubrics/[id]/edit/page.tsx` |  | oud |  |
| `/admin/rubrics/new` | `app/[locale]/(admin)/admin/rubrics/new/page.tsx` |  | oud |  |
| `/admin/rubrics` | `app/[locale]/(admin)/admin/rubrics/page.tsx` |  | oud |  |
| `/admin/users` | `app/[locale]/(admin)/admin/users/page.tsx` |  | oud |  |
| `/admin/woorden` | `app/[locale]/(admin)/admin/woorden/page.tsx` |  | oud |  |
| `/admin/woordkaarten/[id]/edit` | `app/[locale]/(admin)/admin/woordkaarten/[id]/edit/page.tsx` |  | oud |  |
| `/admin/woordkaarten/new` | `app/[locale]/(admin)/admin/woordkaarten/new/page.tsx` |  | oud |  |
| `/admin/woordkaarten` | `app/[locale]/(admin)/admin/woordkaarten/page.tsx` |  | oud |  |

## Overig — de catch-all 404 (hoort bij Publiek)

| Route | Bestand | Agent | Status | Notities |
|---|---|---|---|---|
| `/[...rest]` | `app/[locale]/[...rest]/page.tsx` |  | oud |  |

## Feedback eigenaar — homepage in Glas (2026-10-15)

**Uitgevoerd op 15-10**, behalve dat de reviewkolom twee van de drie reviews toont (de kolom moet
even hoog blijven als de docentkaart). Ook gedaan op verzoek: de hero is weer ±900px hoog zoals
vóór Glas, en elke paginakop (`PageField`, `g-readhead`) vervaagt nu in de pagina; tier-banden
lopen in en uit in plaats van op een rand te beginnen. Rode draad: **de pagina is te blokkerig en daardoor niet rustig** — secties
staan als losse vlakken onder elkaar en vloeien niet in elkaar over. Dat is het eerste wat opgelost
moet worden, op de homepage én in de footer.

1. **Hero is te vol.** De regel "gecontroleerd door een NT2-docent" (de validatiechip/het zegel in
   de hero) mag kleiner.
2. **De hero moet overvloeien in de rest van de pagina.** Geen harde onderrand: het veld vervaagt
   naar de pagina-achtergrond, en die achtergrond houdt daarna een vleugje van dezelfde stijl vast.
   Voorbeelden:
   - Settly — `Settly-website/app/(site)/globals.css`: `.globe-glow` (mask
     `linear-gradient(#000 calc(100% - 140px), transparent)`) en `.crossings-hero::before`
     (`linear-gradient(#000 55%, transparent)`).
   - deutschtest üben — `deutsch-test/DESIGN.md` §Elevation (de `.nacht-orb`-bollen achter de hero)
     en `deutsch-test/app/(main)/landing.css`.
3. **Minder blokken.** De tier-wissels tussen secties (`g-sec-tier`) maken een streepjescode;
   overgangen moeten zachter, of er moeten vlakken uit.
4. **Track-kaarten: neem die uit glas.html** (§08 "Track-kaart") — die zijn mooier dan wat nu op
   de homepage staat (`_components/glas/TrackCard`). Vervang ze één-op-één.
5. **"Dit is wat je krijgt" (`vitrine_*`, `FeatureCarousel`) toont oude screenshots** van het
   platform. Vervangen door beelden in de nieuwe Glas-stijl.
6. **De reviewsectie moet gelijk zijn aan die in glas.html** (§08 "Docent, review, vergelijking").
7. **"Eén docent staat achter alles"** (`proofsec_*`) hoort er ook in, in de vorm uit glas.html.
8. **Witte kaarten zijn te kaal.** Probeer bij een deel ervan — bijvoorbeeld "Oefen op de vorm van
   het echte examen" (`dd1_*`) en de andere deep-dives — de glazige melkglas-kaart (`g-glass`).
   Kan ook vanzelf beter worden zodra de achtergrond verandert (punt 2–3); eerst daar kijken.
9. **Footer: zelfde probleem.** Te veel blokken, niets vloeit in elkaar over. De homepage-CTA
   erboven en de footer moeten één overgang worden.
