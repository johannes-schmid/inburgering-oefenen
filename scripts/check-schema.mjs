#!/usr/bin/env node
/**
 * Validate the JSON-LD this site emits.
 *
 * M0's definition of done says "valideren met de schema.org-validator". That is a browser tool
 * and cannot gate a build, so this checks the things that actually regress here:
 *
 *   1. **Every block parses.** A `</script>` or a stray quote inside any string value silently
 *      truncates the block, and the page still renders fine.
 *   2. **Every `@id` reference resolves** — either to a node defined in the same page's graph, or
 *      to one of the site-wide anchors (`#organization`, `#teacher`, `#website`, a `#course` owned
 *      by the oefenexamen overview). A reference to a node nobody defines is the exact bug the
 *      "one Course per URL" refactor could introduce, and no validator reports it.
 *   3. **No `@id` is defined twice with different content** across the pages checked — the
 *      contradiction that had `#organization` named "KNM Oefenvragen" on one page and
 *      "Inburgering Oefenen" on another.
 *   4. **Per-page expectations**: /premium sells something, B1 stays out of the rich results,
 *      and nothing invents a rating.
 *
 * Usage: node scripts/check-schema.mjs [origin]      (default http://localhost:3001)
 */

const ORIGIN = process.argv[2] ?? 'http://localhost:3001';

/** Site-wide anchors, defined on one page and referenced from others by design. */
const GLOBAL_ID = /#(organization|teacher|website|course)$/;

const PAGES = [
  { path: '/nl',                        expect: ['WebSite', 'EducationalOrganization', 'ItemList', 'FAQPage'] },
  { path: '/nl/premium',                expect: ['Product', 'BreadcrumbList'] },
  /* The two pages the header's four links point at. Both are a `CollectionPage` over an
     `ItemList` — and neither may carry an `Offer`: `/premium` is the only page that states a
     price, so a figure here would be a second, silently stale claim in the SERP. */
  { path: '/nl/platform',               expect: ['CollectionPage', 'ItemList', 'BreadcrumbList'], forbid: ['Offer', 'Product'] },
  { path: '/nl/gidsen',                 expect: ['CollectionPage', 'ItemList', 'BreadcrumbList'], forbid: ['Offer', 'Product'] },
  { path: '/nl/oefenen',                expect: ['CollectionPage', 'BreadcrumbList'] },
  { path: '/nl/oefenen/lezen',          expect: ['Quiz', 'BreadcrumbList'] },
  { path: '/nl/oefenen/luisteren',      expect: ['Quiz', 'BreadcrumbList'] },
  { path: '/nl/oefenexamen/a2/lezen',   expect: ['Course', 'BreadcrumbList'] },
  { path: '/nl/oefenexamen/a2/spreken', expect: ['Course', 'BreadcrumbList'] },
  { path: '/nl/docent',                 expect: ['ProfilePage', 'Person'] },
  // The blog is live and was never covered by this guard.
  { path: '/nl/blog',                   expect: ['Blog', 'ItemList'] },
  { path: '/nl/blog/inburgeringsexamen-a2-uitleg', expect: ['BlogPosting', 'BreadcrumbList'] },
  // The kennisgids hubs (M1). Their ItemList appears only once a guide has been reviewed, so it
  // is deliberately not expected here — an empty section must still validate.
  { path: '/nl/inburgering',            expect: ['CollectionPage', 'BreadcrumbList'] },
  { path: '/nl/knm',                    expect: ['CollectionPage', 'BreadcrumbList'] },
  { path: '/nl/taalexamens',            expect: ['CollectionPage', 'BreadcrumbList'] },
  /* Planned surfaces (`data/planned-surfaces.ts`) carry NO structured data at all — they are
   * noindex until they do something, and rich data on a noindex page contradicts the page's own
   * meta tag. Same rule as the empty B1 overviews and a draft guide. */
  /* The tijdlijn tool. It owns a `WebApplication` node and references `#organization` and
     `#website` by @id; `Article` is forbidden because a tool is not a document, and a stray
     `CollectionPage` would mean the hub's schema was copied onto it. */
  { path: '/nl/inburgering/tools/tijdlijn', expect: ['WebApplication', 'BreadcrumbList'], forbid: ['Article', 'CollectionPage'] },
  { path: '/nl/knm/woordenlijst',       expect: [], forbid: ['Article', 'CollectionPage'] },
  { path: '/nl/taalexamens/woordenlijst', expect: [], forbid: ['Article', 'CollectionPage'] },
  { path: '/nl/taalexamens/grammatica', expect: [], forbid: ['Article', 'CollectionPage'] },
  // The M2 pillar, published 2026-08-19. A reviewed guide carries Article (never BlogPosting —
  // a kennisgids is a maintained reference page) plus its breadcrumbs and FAQ. Any *draft* guide
  // must carry no structured data at all: rich data on a noindex page contradicts the meta tag.
  { path: '/nl/inburgering/inburgering-stappenplan', expect: ['Article', 'BreadcrumbList', 'FAQPage'] },
  // The three M2 spokes, published 2026-08-20. Listed individually rather than trusted to the
  // pillar's row: they are the four menu entries, so a spoke that silently loses its Article node
  // is a header link into a page with no structured data at all.
  { path: '/nl/inburgering/moet-ik-inburgeren',       expect: ['Article', 'BreadcrumbList', 'FAQPage'] },
  { path: '/nl/inburgering/welke-wet-en-welke-route', expect: ['Article', 'BreadcrumbList', 'FAQPage'] },
  { path: '/nl/inburgering/wat-kost-inburgeren',      expect: ['Article', 'BreadcrumbList', 'FAQPage'] },
  /* One article per section, so a route that stops emitting its graph is caught wherever it lives.
     The KNM and Taalexamens detail routes are separate page files from the Inburgering one; a
     guard that only ever visits /inburgering/* would not notice either of them going dark. */
  { path: '/nl/knm/knm-examen',                       expect: ['Article', 'BreadcrumbList', 'FAQPage'] },
  { path: '/nl/knm/instanties',                       expect: ['Article', 'BreadcrumbList', 'FAQPage'] },
  { path: '/nl/taalexamens/taalexamens-a2-b1',        expect: ['Article', 'BreadcrumbList', 'FAQPage'] },
  { path: '/nl/taalexamens/spreken-examen',           expect: ['Article', 'BreadcrumbList', 'FAQPage'] },
  { path: '/nl/inburgering/boete-en-termijn',         expect: ['Article', 'BreadcrumbList', 'FAQPage'] },
  { path: '/nl/inburgering/pvt-map-en-ona',           expect: ['Article', 'BreadcrumbList', 'FAQPage'] },
  { path: '/nl/inburgering/vrijstelling-en-ontheffing', expect: ['Article', 'BreadcrumbList', 'FAQPage'] },
  /* B1 went live 2026-08-23 and this row inverted with it: Lezen now *owns* its `Course` node,
     exactly like A2. Luisteren keeps the old assertion, because its format is unverified
     (`itemCount === null`, `data/skills.ts`), so its overview is still `noindex` — and rich data
     on a page we ask Google to ignore says the opposite of the meta tag beside it. The `robots`
     tag and this row read the same fact; keeping both is what catches one moving without the
     other. */
  { path: '/nl/oefenexamen/b1/lezen',     expect: ['Course', 'BreadcrumbList'] },
  { path: '/nl/oefenexamen/b1/luisteren', expect: [], forbid: ['Course'] },
  // The free B1 taster. Lezen only — see `lib/free-practice-b1.ts`.
  { path: '/nl/oefenen/b1/lezen',         expect: ['Quiz', 'BreadcrumbList'] },
  { path: '/en/premium',                expect: ['Product'] },
  { path: '/ar/premium',                expect: ['Product'] },
];

const failures = [];
const defined = new Map();   // @id → JSON of the node, to catch contradictory redefinitions

function walk(node, fn) {
  if (Array.isArray(node)) return node.forEach(n => walk(n, fn));
  if (node && typeof node === 'object') {
    fn(node);
    Object.values(node).forEach(v => walk(v, fn));
  }
}

function extractBlocks(html) {
  const out = [];
  const re = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
}

for (const page of PAGES) {
  const url = `${ORIGIN}${page.path}`;
  let html;
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) { failures.push(`${page.path}: HTTP ${res.status}`); continue; }
    html = await res.text();
  } catch (err) {
    failures.push(`${page.path}: unreachable — ${err.message}`);
    continue;
  }

  const blocks = extractBlocks(html);
  const types = new Set();
  const localIds = new Set();
  const refs = [];

  for (const [i, raw] of blocks.entries()) {
    let data;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      failures.push(`${page.path}: block ${i + 1} is not valid JSON — ${err.message}`);
      continue;
    }
    walk(data, node => {
      if (typeof node['@type'] === 'string') types.add(node['@type']);
      if (node['@id'] && node['@type']) {
        localIds.add(node['@id']);
        const prev = defined.get(node['@id']);
        const json = JSON.stringify(node);
        if (prev && prev.json !== json) {
          failures.push(
            `@id ${node['@id']} is defined differently on ${prev.path} and ${page.path} — ` +
            `one id must mean one node`,
          );
        } else if (!prev) {
          defined.set(node['@id'], { json, path: page.path });
        }
      }
      // A bare {'@id': x} with no other keys is a reference, not a definition.
      if (node['@id'] && Object.keys(node).length === 1) refs.push(node['@id']);
      if (node.aggregateRating || node.review) {
        failures.push(`${page.path}: carries review markup — the product has no real reviews yet`);
      }
    });
  }

  for (const ref of refs) {
    if (localIds.has(ref) || GLOBAL_ID.test(ref)) continue;
    failures.push(`${page.path}: @id reference "${ref}" resolves to no node`);
  }
  for (const want of page.expect) {
    if (!types.has(want)) failures.push(`${page.path}: expected a ${want} node, found [${[...types].join(', ') || 'nothing'}]`);
  }
  for (const no of page.forbid ?? []) {
    if (types.has(no)) failures.push(`${page.path}: must not carry ${no} (this page is noindex)`);
  }

  console.log(`${failures.length ? ' ' : ' '}${page.path.padEnd(30)} ${blocks.length} block(s): ${[...types].join(', ') || '—'}`);
}

// An Offer must state a price and a currency, or it is not an offer.
{
  const res = await fetch(`${ORIGIN}/nl/premium`);
  const html = await res.text();
  for (const raw of extractBlocks(html)) {
    let data; try { data = JSON.parse(raw); } catch { continue; }
    walk(data, node => {
      if (node['@type'] === 'Offer' || node['@type'] === 'AggregateOffer') {
        const hasPrice = node.price ?? node.lowPrice;
        if (!hasPrice) failures.push(`/nl/premium: an ${node['@type']} has no price`);
        if (node.priceCurrency !== 'EUR') failures.push(`/nl/premium: an ${node['@type']} has priceCurrency ${node.priceCurrency}`);
      }
    });
  }
}

console.log('');
if (failures.length) {
  console.error(`FAIL — ${failures.length} problem(s):`);
  for (const f of failures) console.error(`  · ${f}`);
  process.exit(1);
}
console.log('OK — every JSON-LD block parses, every @id resolves, no contradictory redefinitions.');
