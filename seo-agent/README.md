# De SEO/GEO-lus

Twee lagen, één logboek. Vrijdagavond haalt een GitHub Action de data op; zaterdagochtend leest
een Claude-routine die data en doet voorstellen; de eigenaar beoordeelt bij de koffie.

```
vrijdag 23:00   .github/workflows/seo-collect.yml → scripts/seo-agent/collect.mjs
                → seo-agent/data/<ISO-week>/{gsc,bing,posthog,health,competitors,geo,index}.json  (commit op main)
zaterdag 06:00  routine "SEO weekly"  = /seo-weekly   → reports/<week>.md + ledger.json + recommendations.json (op main), ≤3 PR's
                                                     → te lezen op /admin/seo
1e zaterdag     routine "SEO monthly" = /seo-monthly  → seo-agent/briefs/*.md, ≤2 PR's (alleen links/schema)
```

## Waarom een logboek en geen vijftig agents

SEO-wijzigingen tonen zich pas na drie tot zes weken in Search Console. Een agent die elke week
iets verandert maakt het onmogelijk te zien wat werkte. Daarom:

- **`seo-agent/ledger.json`** — elke samengevoegde wijziging is een rij: datum, pagina, wat, hypothese,
  metriek, `window_end`. Na `rules.verdict_after_days` vult de weekrun `worked` / `didnt` /
  `inconclusive` in. Rijen worden nooit verwijderd.
- **Cooldown** — een pagina die binnen `rules.cooldown_days` in het logboek staat krijgt geen
  nieuw voorstel.
- **Rollende vensters van 28 dagen**, altijd tegen de 28 dagen ervoor, met drie dagen
  vertraging (GSC loopt achter). Weekcijfers op deze schaal zijn ruis.

## Cadans

| Ritme | Taak | Uitkomst |
|---|---|---|
| wekelijks | KPI-blok + ledger-oordelen | rapport |
| wekelijks | technische gezondheid (4xx, canonical, noindex, JSON-LD) | één PR als er iets stuk is |
| tweewekelijks (oneven weken) | striking distance, posities 8–15 | ≤ 3 title/description-PR's |
| tweewekelijks (even weken) | GEO: vaste prompts naar ChatGPT, Perplexity, Claude | citatie-aandeel in het rapport |
| maandelijks | decay, kannibalisatie, interne links, concurrentenverschil | briefs + ≤ 2 link-PR's |
| per kwartaal | markt en scope | één alinea |

## Wat een agent mag aanraken

Zie `editable_surfaces` en `protected_paths` in `seo-agent/config.json`. Kort: titels, meta
descriptions, interne links, structured data, sitemap en robots **wel**; de tekst van gidsen en
posts, `SEO/facts.md`, prijzen, vertalingen en alles onder `scripts/` **niet**. De USP is "door een
NT2-docent gemaakt en nagekeken; AI helpt, zij beslist" — een agent die zelf kopij publiceert, maakt
die belofte stuk. Inhoud die anders moet is een **pakket** voor Amber: een aanbeveling met
`owner: "amber"` in `seo-agent/recommendations.json` en een brief in `seo-agent/briefs/`.
`recommendations.json` (de to-dolijst) en `diagnosis.json` (waarom Google ons minder toont) zijn
**Engels**: ze zijn voor de eigenaar en verschijnen op `/admin/seo`.

`/admin/seo` heeft vier tabs. **Pages** is de treemap van elke sitemap-URL: grootte = vraag in
Google, kleur = de bak uit het herstelplaybook (healthy · improve · consolidate · remove · watch),
gestippeld = een geplande nieuwe pagina. De indeling staat in `seo-agent/pages.json` en komt uit
`node scripts/seo-agent/pages.mjs` (sitemap + de nieuwste pagina-audit); pas de regels in dat
script aan, nooit de JSON. **Competitors** leest `seo-agent/competitors-analysis.json`: welke
domeinen Google NL toont voor onze zoekwoorden (Firecrawl-search, `country: nl`) en waarin hun
pagina's van de onze verschillen.

## KPI's

| Fase | Noordster | Ondersteunend |
|---|---|---|
| verkeer (nu) | non-brand organische clicks, 28 dagen, beide sites | vertoningen, query's in top-20, pagina's met clicks, geïndexeerde pagina's |
| GEO | aandeel GEO-prompts waarin een van beide domeinen wordt geciteerd | wie wél wordt geciteerd (top 5) |
| conversie | taster → registratie → betaald, per landingspagina (PostHog) | gids → taster, e-mailcapture |
| lus | oordeel-ratio: worked / beoordeeld | PR's samengevoegd / geopend |

## Zaterdag, voor de eigenaar

1. Open **`/admin/seo`**. Daar staan de stand van zaken, de meting van vrijdag, wat er per persoon
   te doen is (jij, Amber, de agent), de experimenten en de open PR's. Het rapport zelf staat op
   `main` in `seo-agent/reports/<week>.md`; de pagina linkt ernaar.
2. Lees de ledger-oordelen: wat van vijf weken geleden heeft gewerkt?
3. Beoordeel de PR's. Sluiten mag; schrijf dan waarom in de PR, de maandrun leest dat.
4. Ambers werk per week blijft onder `rules.amber_minutes_per_week` (150 minuten); wat niet past
   schuift door. Een brief in `seo-agent/briefs/` is voor haar, niet voor de agent.

## Bronnen en sleutels

| Bron | Sleutel (GitHub-secret) | Zonder sleutel |
|---|---|---|
| Search Console (beide properties) | `GSC_SA_JSON` — de JSON van het serviceaccount, zie `docs/seo/google-api-toegang.md` | `skipped` |
| Bing Webmaster | `BING_API_KEY` | `skipped` |
| PostHog (één project, `$host` splitst) | `POSTHOG_PERSONAL_API_KEY`, optioneel `POSTHOG_PROJECT_ID` | `skipped` |
| Firecrawl `/map` | `FIRECRAWL_API_KEY` (gratis: 1.000 credits/maand, ±10/week nodig) | `skipped` |
| GEO | `OPENAI_API_KEY`, `PERPLEXITY_API_KEY`, `ANTHROPIC_API_KEY` | engine overgeslagen |
| CrUX | `CRUX_API_KEY` | `skipped` |

`health` heeft geen sleutel nodig en draait altijd. Lokaal proefdraaien:
`node scripts/seo-agent/collect.mjs --week 2026-W00 --only health` (en de map daarna weggooien).

Een snapshot met `skipped` of `error` betekent **onbekend**, nooit nul.
