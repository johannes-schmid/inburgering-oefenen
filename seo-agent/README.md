# De SEO/GEO-lus

Twee lagen, één logboek. Vrijdagavond haalt een GitHub Action de data op; zaterdagochtend leest
een Claude-routine die data en doet voorstellen; de eigenaar beoordeelt bij de koffie.

```
vrijdag 23:00   .github/workflows/seo-collect.yml → scripts/seo-agent/collect.mjs
                → seo-agent/data/<ISO-week>/{gsc,bing,posthog,health,competitors,geo,index}.json  (commit op main)
zaterdag 06:00  routine "SEO weekly"  = /seo-weekly   → seo-agent/reports/<week>.md, seo-agent/ledger.json, ≤3 PR's, mail
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
docent gevalideerd, geen AI" — een agent die kopij schrijft, maakt de belofte stuk. Inhoud die
anders moet is een **brief** in `seo-agent/briefs/` voor Marieke.

## KPI's

| Fase | Noordster | Ondersteunend |
|---|---|---|
| verkeer (nu) | non-brand organische clicks, 28 dagen, beide sites | vertoningen, query's in top-20, pagina's met clicks, geïndexeerde pagina's |
| GEO | aandeel GEO-prompts waarin een van beide domeinen wordt geciteerd | wie wél wordt geciteerd (top 5) |
| conversie | taster → registratie → betaald, per landingspagina (PostHog) | gids → taster, e-mailcapture |
| lus | oordeel-ratio: worked / beoordeeld | PR's samengevoegd / geopend |

## Zaterdag, voor de eigenaar

1. Open de mail of `seo-agent/reports/<week>.md` op de `claude/seo-<week>-report`-branch.
2. Lees de ledger-oordelen: wat van vijf weken geleden heeft gewerkt?
3. Beoordeel de PR's. Sluiten mag; schrijf dan waarom in de PR, de maandrun leest dat.
4. Een brief in `seo-agent/briefs/` is voor Marieke, niet voor de agent.

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
