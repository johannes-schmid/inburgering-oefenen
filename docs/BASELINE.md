# Nulmeting — 19 augustus 2026

The measured starting point for the M0–M6 plan in `docs/MILESTONES.html`. **Every milestone from
M1 onward reports against this file** ("meten voor veranderen", spelregel 5).

Two halves, and the difference matters:

- **§1–§4 are measured facts**, read off the code and the running site on 2026-08-19 (commit
  `9f2c3c4` plus the M0 changes). They are reproducible — §6 says how.
- **§5 is Search Console and GA4 and is empty**, because the property has never been verified and
  no API credentials exist. **The blanks are marked `— niet gemeten —`, not `0`.** A zero is a
  measurement; an empty row is the absence of one, and six months from now nobody will remember
  which this was. Same convention `exam_formats` uses for unverified numbers.

---

## 1. What is indexable

56 URLs in `sitemap.xml`, all returning 200 (verified by fetching every one).

| Surface | URLs | In sitemap | Indexable | Note |
|---|---|---|---|---|
| Homepage | 3 (nl/en/ar) | yes | yes | |
| `/oefenen` picker | 3 | **yes, new in M0** | yes | funnel entry point |
| `/oefenen/[skill]` tasters | 6 (lezen, luisteren × 3) | **yes, new in M0** | yes | Schrijven/Spreken have no taster: `noindex`, redirect to the picker |
| `/oefenexamen/a2/[skill]` | 12 | yes | yes | the BOFU/SEO surface |
| `/oefenexamen/b1/[skill]` | 12 | no | **no** (`robots: index:false`) | 40 empty slots; joins the index when the docent publishes |
| `/premium` | 3 | yes | yes | Arabic slug `الباقة-المميزة` |
| `/docent` | 3 | yes | yes | `en` = `/teacher`, `ar` = `المعلمة` |
| `/contact` | 3 | yes | yes | Arabic slug `تواصل-معنا` — **404'd until M0**, see §4 |
| Legal (privacy, voorwaarden, terugbetaling) | 9 | yes | yes | `terugbetalingsbeleid` added in M0 |
| `/blog` + posts | 18 | yes | yes | 5 posts; per-locale, gated on `hasTranslation()` |
| `/oefenvragen` | — | no | n/a | `FEATURES.oefenvragen` off, redirects. Earmarked for free KNM quizzes in M3 |
| `/proefexamen` | — | — | — | **deleted in M0**, 301 → `/oefenen` |
| `/dashboard`, `/admin`, auth | — | no | no | disallowed in `robots.txt` |

`robots.txt` (static, `public/robots.txt`) allows everything except the auth/portal/admin paths, and
explicitly allows GPTBot, ChatGPT-User, PerplexityBot, ClaudeBot, anthropic-ai, Googlebot-Extended
and Bingbot. `llms.txt` exists at the repo root.

## 2. On-page, per public NL page

Measured 2026-08-19. Description lengths are the count `tests/seo.spec.js` asserts (140–160).

| Path | Title | Desc. len |
|---|---|---|
| `/nl` | Inburgeringsexamen A2 oefenen — gratis oefenexamens | 146 |
| `/nl/oefenen` | Gratis oefenen — 10 oefenvragen inburgering A2 \| Inburgering Oefenen | 145 |
| `/nl/oefenen/lezen` | Gratis Lezen oefenen — 10 oefenvragen A2 met uitleg | 154 |
| `/nl/oefenen/luisteren` | Gratis Luisteren oefenen — 10 oefenvragen A2 met uitleg | 158 |
| `/nl/oefenexamen/a2/lezen` | Lezen A2 oefenen — 10 oefenexamens van een NT2-docent | 144 |
| `/nl/oefenexamen/a2/luisteren` | Luisteren A2 oefenen — 10 oefenexamens van een NT2-docent | 148 |
| `/nl/oefenexamen/a2/schrijven` | Schrijven A2 oefenen — 10 oefenexamens van een NT2-docent | 148 |
| `/nl/oefenexamen/a2/spreken` | Spreken A2 oefenen — 10 oefenexamens van een NT2-docent | 146 |
| `/nl/premium` | Modules — oefen het inburgeringsexamen A2 vanaf €9,95 per maand | 156 |
| `/nl/docent` | Marieke Schipper — gecertificeerde NT2-docent | 156 |
| `/nl/contact` | Contact — Inburgering Oefenen | 156 |
| `/nl/blog` | Blog over het inburgeringsexamen A2 | 147 |

Every page: one `<h1>`, per-locale canonical, `hreflang` for nl/en/ar + `x-default`.

## 3. Structured data after M0

`node scripts/check-schema.mjs http://localhost:3001` re-verifies all of this: every block parses,
every `@id` reference resolves, and no `@id` is defined twice with different content.

| Path | Types |
|---|---|
| `/nl` | WebSite, EducationalOrganization, ItemList (the four onderdelen, by reference), FAQPage (6 Q) |
| `/nl/premium` | **Product, AggregateOffer, 5 × Offer** (4 modules + bundle), UnitPriceSpecification, BreadcrumbList |
| `/nl/oefenen` | CollectionPage, ItemList, BreadcrumbList |
| `/nl/oefenen/[skill]` | Quiz, AlignmentObject, BreadcrumbList |
| `/nl/oefenexamen/a2/[skill]` | Course, CourseInstance, ItemList (10 slots), BreadcrumbList |
| `/nl/docent` | ProfilePage, Person, EducationalOccupationalCredential, BreadcrumbList |
| `/nl/oefenexamen/b1/[skill]` | **none, deliberately** — the page is `noindex` |
| `/nl/blog`, `/nl/blog/[slug]` | Blog, ItemList / BlogPosting, BreadcrumbList, FAQPage |

No `aggregateRating` and no `review` anywhere, and the validator fails the build if one appears:
the product has no customers yet, and fabricated social proof was already removed once.

## 4. Bugs found while measuring, and fixed in M0

Recorded because a baseline that hides what was broken cannot explain a later improvement.

1. **The Arabic contact page was unreachable.** `next.config.ts` 301s `/ar/contact` to
   `/ar/تواصل-معنا`, but `i18n/routing.ts` had no per-locale mapping for `/contact`, so the target
   matched no route: every footer link for Arabic visitors ended on a 404, and the sitemap
   advertised the same dead URL. Fixed by adding the mapping.
2. **`/oefenen` and both tasters were missing from the sitemap** — the entry point of the funnel.
3. **`/premium` had no structured data at all**, the one commercial page on the site.
4. **`#organization` was defined twice with different names** — "KNM Oefenvragen" on `/docent`,
   "Inburgering Oefenen" on the homepage — and `#teacher` twice with different descriptions.
5. **The privacy policy said the site uses no analytical or tracking cookies.** It loads Google
   Analytics, Microsoft Clarity (session recording) and the Meta pixel. §2 also described only an
   e-mail address and a score, omitting accounts, payments, written answers and voice recordings.

## 5. Search Console & GA4 — §5b MEASURED, the rest still open

**Ownership is already verified — do not repeat it.** The property
`inburgeringoefenen.nl` was added on **29 July 2026** and reads "You are a verified owner"; it had
already logged 1.16k crawl requests over the preceding 90 days, and Google Analytics is associated.
It is a **Domain property** (Search Console shows it without a scheme), so it covers the apex, `www`
and every subdomain over both protocols — which is more than a URL-prefix property would.

**Consequence: `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` is not needed.** A Domain property is verified
by DNS TXT record, not by a meta tag. The `verification` block in `app/[locale]/layout.tsx` renders
nothing while the variable is unset, which is the correct and permanent state here. It is kept only
as a fallback for the day someone adds a *URL-prefix* property or loses DNS access — **leave the
variable unset rather than inventing a value for it.**

**§5b (queries) and the crawl figures in §5c are filled in as of 19-08-2026.** Still to read out:
§5a (per page), the indexing counts in §5c, and all of GA4 (§5d–§5e).

The work left:

1. Search Console → **Sitemaps** → confirm `https://inburgeringoefenen.nl/sitemap.xml` is submitted
   and shows 56 discovered URLs; submit it if it is absent. Do this first — §5c reports it.
2. Fill §5a–§5c from **Prestaties** (Pagina's, then Zoektermen) and **Indexering → Pagina's**.
3. Fill §5d–§5e from GA4 `G-S2REC7DCXZ`.
4. **Record the exact date range you used** in each heading below. A table without its range cannot
   be compared with next month's.
5. Change this section's heading once the tables are filled, so a filled table is never read as an
   unmeasured one.

Data should be available immediately rather than after a wait: the property predates this baseline
by three weeks, and Google logs impressions independently of verification, so up to 16 months of
history is normally visible. If a report is genuinely empty, write "empty as of 19-08-2026" — that is
a finding about visibility, not a missing measurement.

### 5a. GSC — per page (Prestaties → Pagina's) — NOT YET READ

Use the **same 28-07 – 17-08-2026 range as §5b**, not a 28-day window, or the two sections cannot
be reconciled. The Pagina's tab was not captured.

| Page | Clicks | Impressions | CTR | Avg. position |
|---|---|---|---|---|
| `/nl` | — niet gemeten — | — niet gemeten — | — niet gemeten — | — niet gemeten — |
| `/nl/oefenen` | — niet gemeten — | — niet gemeten — | — niet gemeten — | — niet gemeten — |
| `/nl/oefenen/lezen` | — niet gemeten — | — niet gemeten — | — niet gemeten — | — niet gemeten — |
| `/nl/oefenen/luisteren` | — niet gemeten — | — niet gemeten — | — niet gemeten — | — niet gemeten — |
| `/nl/oefenexamen/a2/lezen` | — niet gemeten — | — niet gemeten — | — niet gemeten — | — niet gemeten — |
| `/nl/oefenexamen/a2/luisteren` | — niet gemeten — | — niet gemeten — | — niet gemeten — | — niet gemeten — |
| `/nl/oefenexamen/a2/schrijven` | — niet gemeten — | — niet gemeten — | — niet gemeten — | — niet gemeten — |
| `/nl/oefenexamen/a2/spreken` | — niet gemeten — | — niet gemeten — | — niet gemeten — | — niet gemeten — |
| `/nl/premium` | — niet gemeten — | — niet gemeten — | — niet gemeten — | — niet gemeten — |
| `/nl/docent` | — niet gemeten — | — niet gemeten — | — niet gemeten — | — niet gemeten — |
| `/nl/blog` + posts | — niet gemeten — | — niet gemeten — | — niet gemeten — | — niet gemeten — |

### 5b. GSC — queries — MEASURED 2026-08-19

**Range: 28-07-2026 – 17-08-2026 (21 days).** The "3 months" selector was active, but the property
was created on 29-07-2026 and holds no data before 28-07, so this is the **entire recorded life of
the site**, not a quarter. Do not compare a later 3-month reading against it as though the windows
matched — next month's comparison must re-cut this range or state the difference.

| Metric | Value |
|---|---|
| Total clicks | **17** |
| Total impressions | **1.34k** |
| Average CTR | **1.3%** |
| Average position | **25.4** |

Average position 25.4 is page three. The site is visible to Google and effectively invisible to
searchers — which is the premise the whole M1–M5 plan rests on, now measured rather than assumed.

Top 47 queries, as read off the Prestaties → Zoektermen tab (these 47 account for ~360 of the ~1340
impressions; the tail is not recorded here):

| # | Query | Clicks | Impr. | CTR | Position |
|---|---|---|---|---|---|
| 1 | oefenen examen a2 | 1 | 12 | 8.3% | 29.8 |
| 2 | a2 schrijven oefenen | 1 | 1 | 100% | 16.0 |
| 3 | lezen a2 | 1 | 1 | 100% | 23.0 |
| 4 | inburgeringsexamen oefenen | 0 | 25 | 0% | 49.8 |
| 5 | taalniveau a2 | 0 | 20 | 0% | 56.5 |
| 6 | inburgering oefenen | 0 | 16 | 0% | 29.9 |
| 7 | a2 schrijven | 0 | 16 | 0% | 42.8 |
| 8 | b1 a2 | 0 | 15 | 0% | 38.9 |
| 9 | a2 taalniveau | 0 | 14 | 0% | 61.2 |
| 10 | inburgering examen oefenen | 0 | 14 | 0% | 62.1 |
| 11 | a2 niveau | 0 | 14 | 0% | 73.0 |
| 12 | spreken examen a2 oefenen | 0 | 11 | 0% | 33.4 |
| 13 | nederlands a2 niveau | 0 | 10 | 0% | 27.1 |
| 14 | a2 niveau nederlands | 0 | 10 | 0% | 30.6 |
| 15 | a2 level | 0 | 10 | 0% | 33.6 |
| 16 | spreekvaardigheid oefenen | 0 | 10 | 0% | 46.1 |
| 17 | a2 nederlands | 0 | 9 | 0% | 29.1 |
| 18 | inburgering a2 oefenen | 0 | 8 | 0% | 25.0 |
| 19 | a2 nederlands niveau | 0 | 8 | 0% | 35.8 |
| 20 | inburgering examen oefenen lezen a2 | 0 | 8 | 0% | 39.8 |
| 21 | inburgeren examens oefenen | 0 | 8 | 0% | 68.9 |
| 22 | oefenexamen a2 | 0 | 7 | 0% | 29.9 |
| 23 | inburgering examen oefenen a2 | 0 | 7 | 0% | 33.7 |
| 24 | a2 lezen oefenen | 0 | 6 | 0% | 23.3 |
| 25 | a2 examen oefenen | 0 | 6 | 0% | 23.8 |
| 26 | lezen examen a2 | 0 | 6 | 0% | 27.7 |
| 27 | oefeningen abn spreken | 0 | 6 | 0% | 47.3 |
| 28 | oefening inburgering examen | 0 | 6 | 0% | 53.2 |
| 29 | inburgering practice exam | 0 | 6 | 0% | 70.3 |
| 30 | nederlands a2 | 0 | 5 | 0% | 31.6 |
| 31 | herkansen examen | 0 | 5 | 0% | 46.2 |
| 32 | inburgeringscursus vragen | 0 | 5 | 0% | 68.4 |
| 33 | **a2 spreken oefenen** | 0 | 4 | 0% | **10.5** |
| 34 | nt2 luisteren oefenen | 0 | 4 | 0% | 24.5 |
| 35 | spreken examen | 0 | 4 | 0% | 25.8 |
| 36 | inburgering examen oefenen luisteren a2 | 0 | 4 | 0% | 32.0 |
| 37 | oefenen examen a2 luisteren | 0 | 4 | 0% | 32.0 |
| 38 | examen a2 oefenen | 0 | 4 | 0% | 39.3 |
| 39 | inburgering practice exam a2 | 0 | 4 | 0% | 60.0 |
| 40 | dutch a2 exam sample pdf | 0 | 4 | 0% | 71.8 |
| 41 | taalniveaus uitleg | 0 | 4 | 0% | 88.3 |
| 42 | taalniveaus uitgelegd | 0 | 4 | 0% | 89.5 |
| 43 | **spreken a2 oefenen** | 0 | 3 | 0% | **12.7** |
| 44 | inburgering oefenen a2 | 0 | 3 | 0% | 21.0 |
| 45 | inburgeringsexamen spreken | 0 | 3 | 0% | 24.0 |
| 46 | what happens if i fail the inburgering exam? | 0 | 3 | 0% | 24.7 |
| 47 | schrijven a2 | 0 | 3 | 0% | 31.3 |

#### What this list says — read before planning M2

1. **The deck's central claim is confirmed, from our own data.** Practically every query here is
   BOFU ("oefenen", "oefenexamen", "examen a2"). The informational demand M2 targets is *already
   reaching the site* and ranking nowhere: `taalniveau a2` (20 impr., pos 56.5), `a2 taalniveau`
   (14, 61.2), `a2 niveau` (14, 73.0), `b1 a2` (15, 38.9), `taalniveaus uitleg` / `uitgelegd`
   (4 + 4, pos 88 and 90), `herkansen examen` (5, 46.2), `inburgeringscursus vragen` (5, 68.4).
   Google is testing this site for those queries against pages that do not answer them.
2. **`a2 of b1` has a real proxy already: `b1 a2`, 15 impressions at position 38.9.** That is the
   M2 spoke ranked #3 on the kansenlijst, and it now has a measured starting position.
3. **The head terms are absent entirely.** `inburgering` (40.5k/mo) and `mijn inburgering`
   (135k/mo) do not appear anywhere in the query list — not "position 90", *absent*. The honest
   baseline for those is **no visibility**, and any later position at all is an improvement.
4. **The two best positions on the whole list are Spreken, and both get zero clicks:**
   `a2 spreken oefenen` at **10.5** and `spreken a2 oefenen` at **12.7**. Page one is one or two
   places away. That is the cheapest ranking win available and it belongs to a page that already
   exists — worth a title/description pass in M5 long before any new content.
5. **English demand is already arriving**: `inburgering practice exam` (6), `inburgering practice
   exam a2` (4), `dutch a2 exam sample pdf` (4), `what happens if i fail the inburgering exam?` (3).
   Four English queries in a 21-day window with no English content promoted at all. M4's English
   funnel has evidence behind it, not just a persona.
6. **CTR is 1.3% because position is 25.4** — nothing here suggests a snippet problem. Do not spend
   M5 on CTR work while the average position is on page three.

### 5c. GSC — Indexering (Pagina's → Geïndexeerd)

| Metric | Value |
|---|---|
| Indexed | — niet gemeten — |
| Not indexed (with reasons) | — niet gemeten — |
| Sitemap URLs submitted / read | 56 / — niet gemeten — |
| Crawl requests, last 90 days | **1.16k** (Settings → Crawl stats, read 19-08-2026) |
| robots.txt status | **All files are valid** (Settings, 19-08-2026) |

### 5d. GA4 (property `G-S2REC7DCXZ`) — last 28 days, organic only

Reports → Acquisition → Traffic acquisition, filter `Session default channel group = Organic Search`.

| Metric | Value |
|---|---|
| Organic sessions | — niet gemeten — |
| Organic users | — niet gemeten — |
| Engagement rate | — niet gemeten — |
| Sessions per page (top 10) | — niet gemeten — |

### 5e. Funnel conversions (GA4 events)

`lib/analytics.ts` sends to GA4 only, with `ab_variant` on every event.

Read them in GA4 under Reports → Engagement → Events, or Explore for a funnel. The event names
are the `track()` call sites in the repo, not invented for this table:

| Funnel step | GA4 event | Value |
|---|---|---|
| Taster started | `free_practice_started` | — niet gemeten — |
| Taster finished | `free_practice_finished` | — niet gemeten — |
| E-mail step submitted | `email_captured` | — niet gemeten — |
| Pricing page seen | `pricing_page_viewed` | — niet gemeten — |
| Login started | `login_initiated` | — niet gemeten — |
| Paid exam started | `exam_started` | — niet gemeten — |
| Paid exam finished | `exam_finished` | — niet gemeten — |
| Payment succeeded | `payment_success_viewed` | — niet gemeten — |

Every event also carries `ab_variant` (`lib/analytics.ts` adds it to all of them), so each row can be
split by variant. **There is no `registration` event** — `login_initiated` is the nearest signal, and
registration itself is only observable in Supabase. Worth adding one in M5, when this funnel becomes
the reported KPI.

**M5's KPIs are gids → taster, taster → registratie, registratie → betaald.** The last three exist
as events today; the first cannot exist until the guides do.

## 6. How to refresh this

Monthly, as M5 requires. §1–§4 are reproducible from the repo; §5 is manual until credentials exist.

```bash
PATH="/opt/homebrew/bin:$PATH" npm run dev            # port 3001
node scripts/check-schema.mjs http://localhost:3001   # §3
curl -s localhost:3001/sitemap.xml | grep -c '<loc>'  # §1 count

# §1: every sitemap URL must return 200
curl -s localhost:3001/sitemap.xml | grep -oE '<loc>[^<]+</loc>' | sed 's/<[^>]*>//g' \
  | sed 's|https://inburgeringoefenen.nl||' \
  | while read p; do c=$(curl -s -o /dev/null -w '%{http_code}' --get "http://localhost:3001$p"); \
      [ "$c" != 200 ] && echo "$c $p"; done
```

Copy this file to `docs/baseline/YYYY-MM.md` before overwriting it, so the series is preserved
rather than replaced — a single always-current file cannot show a trend.
