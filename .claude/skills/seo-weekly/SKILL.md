---
name: seo-weekly
description: De zaterdagochtendrun van de SEO-lus — leest de snapshots van vrijdag in seo-agent/data, beoordeelt oude ledger-rijen, schrijft seo-agent/reports/<week>.md, opent hooguit drie kleine PR's (titels, descriptions, technische fouten) en mailt de samenvatting. Draait als cloud-routine; met de hand aanroepen kan ook.
---

# SEO weekrun

Je bent de wekelijkse reviewer van de SEO/GEO-lus voor inburgeringoefenen.nl (deze repo) en
knmoefenen.nl (alleen lezen). Je werkt **uitsluitend** op de snapshots in `seo-agent/data/`; je haalt
zelf geen data op en verzint geen getal. Lees eerst `seo-agent/README.md` en `seo-agent/config.json`.

Spreek Engels tegen de eigenaar (het rapport en de mail zijn Engels); commitberichten, PR-titels
en code-opmerkingen zijn Nederlands (CLAUDE.md §11).

## Volgorde

1. **Inlezen.** Bepaal de huidige ISO-week (`node -e "import('./scripts/seo-agent/lib/dates.mjs').then(m=>console.log(m.isoWeek()))"`).
   Lees `seo-agent/data/<week>/index.json` en de zes snapshots, plus die van de vorige week met data.
   Een snapshot met `skipped` of `error` is **onbekend**, nooit nul — zeg dat in het rapport en
   sla die sectie over. Lees `seo-agent/ledger.json`, `SEO/keywords.md` (de kaart bovenaan) en
   `SEO/used-keywords.md`.

2. **Ledger-review.** Voor elke rij met `verdict: null` en `window_end` ≤ vandaag: vergelijk in
   `gsc.json` het huidige venster met het vorige voor `page` (en `metric`). Vul `worked`,
   `didnt` of `inconclusive` in (inconclusive bij < 50 vertoningen in beide vensters) en zet
   `verdict_note` met de getallen erbij. Nooit een rij verwijderen.

3. **KPI-blok**, beide sites, huidig vs vorig venster van 28 dagen:
   - clicks, impressions, CTR, positie — totaal én non-brand (`non_brand` in gsc.json)
   - aantal query's met positie ≤ 20; aantal pagina's met ≥ 1 click
   - indexering: `health.json` → `status_counts`, aantal `problems`, `orphans`
   - Bing: clicks/impressions uit `GetRankAndTrafficStats` als die er zijn
   - funnel uit `posthog.json`: per `$host` taster → e-mail → signup → checkout → betaald, en
     de top-10 landingspagina's met organisch verkeer
   - in een even week: `geo.json` → `citation_share` per domein en `top_cited` (wie wél wordt
     geciteerd)
   Elke regel in dit blok verwijst naar het snapshotbestand waar het getal vandaan komt.

3a. **Instortingscheck, vóór alles anders in het rapport.** Een venster van 28 dagen middelt een
   val weg: de W41-run noemde de val van 30-09 "laag-rankende long-tail die wegvalt". Lees de
   dagcijfers (`gsc.json → daily` en `seo-agent/data/history/gsc-daily-*.json`). Zijn de
   vertoningen op een dag **meer dan 70% lager** dan het gemiddelde van de zeven dagen ervoor,
   of ligt het weekgemiddelde meer dan 70% onder dat van de week ervoor, dan opent het rapport
   met een rode regel: de datum, de getallen, de Google-updates die op dat moment liepen
   (Search Status Dashboard) en de deploys in dat venster (`git log`). Vergelijk met Bing: valt
   Bing niet mee, dan ligt het aan Google en niet aan de site.

4. **Technische gezondheid.** Alles in `health.json → problems` met status ≠ 200, `noindex in
   sitemap`, `canonical wijkt af` of `ongeldig JSON-LD` is een fout en krijgt **één** PR,
   buiten de cap en buiten de cooldown. Te lange titels/descriptions zijn geen fout maar input
   voor stap 5. Een 404 op knmoefenen.nl komt alleen in het rapport (die repo is niet van jou).

5. **Striking distance — alleen in oneven weken.** Uit `gsc.json → current.query_page` van
   inburgering: positie tussen `rules.striking_distance.position_min` en `position_max`,
   impressions ≥ `min_impressions`, CTR onder het gemiddelde van die positie. Sluit uit: elke
   pagina die in de ledger staat met `date` binnen `rules.cooldown_days`. Voor hooguit
   `rules.weekly_pr_cap` pagina's: herschrijf **alleen** `meta_title` / `meta_description`
   (in `messages/*.json`, `data/blog-posts.ts` of `data/guides/<slug>.ts`), met het zoekwoord
   uit de kaart in `SEO/keywords.md` vooraan, titel ≤ 60 en description 140–160 tekens, in
   alle drie de talen als de sleutel per taal bestaat. Eén PR per pagina, met in de PR-body de
   hypothese en de GSC-getallen, en een nieuwe ledger-rij (`window_end` = datum + 35 dagen).

6. **Rapport.** Schrijf `seo-agent/reports/<week>.md` met: samenvatting in vijf regels, het KPI-blok,
   de ledger-oordelen van deze week, de geopende PR's (link + hypothese), GEO (even weken),
   wat onbekend was en waarom, en één aanbeveling voor de eigenaar die geen PR kan zijn
   (bijvoorbeeld een onderwerp voor Amber). Commit rapport, ledger en `recommendations.json`
   **rechtstreeks op `main`** (`chore(seo): rapport <week>`), géén rapport-PR: de eigenaar leest
   het op `/admin/seo`, en een PR-branch is precies waar de rapporten van W41 en W42 ongelezen
   bleven liggen. Code-wijzigingen (titels, techniek) blijven wél PR's.

6a. **To-dolijst en diagnose — in het Engels** (besluit eigenaar, 26-10; de rest van de repo blijft
   Nederlands). Werk `seo-agent/recommendations.json` bij: dat is de to-dolijst op `/admin/seo`.
   Per taak: `task` (een gebiedende zin), `owner` (`eigenaar` voor wat alleen hij kan, `amber`
   voor nakijken en verrijken, `agent` voor wat als PR komt), `priority` (`now` / `next` /
   `later`), `kind`, `why` mét het getal en de bron, `steps` (de concrete volgende stap, met
   waar je klikt), en `expect` (wat we daarna zien en wanneer). Een taak zonder `expect` is niet
   te toetsen en hoort er niet in. Ids nooit hergebruiken; zet een taak op `done` of `dismissed`
   in plaats van hem te verwijderen. Ambers taken krijgen `minutes`; nooit meer dan
   `rules.amber_minutes_per_week` per week, de rest blijft `open` en schuift door.
   Werk `seo-agent/diagnosis.json` bij als een check verandert of een hypothese getoetst is
   (`checks[].status`, `updated`); de live cijfers rekent de pagina zelf.

7. **Mail.** Stuur met de Gmail-connector de samenvatting (de eerste ~40 regels van het
   rapport, plus de PR-links en de link naar `https://inburgeringoefenen.nl/nl/admin/seo`) naar
   de eigenaar, onderwerp `SEO <week> — <één zin>`. Als Gmail niet beschikbaar is: zet dat als
   item met `owner: "eigenaar"` in `recommendations.json` en ga door.

## Harde regels

- Raak niets in `config.protected_paths` of `protected_fields` aan. Geen tekst in
  `articleHtml`, geen feiten, geen prijzen, geen `translated_note`. Inhoud die herschreven
  moet worden is een **brief** in `seo-agent/briefs/<slug>.md`, nooit kopij.
- Geen zoekwoord claimen dat in `SEO/used-keywords.md` al bij een andere URL hoort.
- Vóór elke push: `npx tsc --noEmit` en `npm run test:unit` groen. `tests-unit/guides.test.ts`
  bewaakt de lengtes; als hij rood wordt, is jouw titel fout, niet de test.
- Hooguit `weekly_pr_cap` inhoudelijke PR's + één technische. Rapport en aanbevelingen gaan op `main`.
- Een getal zonder bronbestand bestaat niet. Een week zonder GSC-data is een rapport dat dat
  zegt, geen rapport met schattingen.
