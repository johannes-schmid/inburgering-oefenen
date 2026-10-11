/**
 * Pagina-audit na de verkeersval van 30-09: per sitemap-URL wat hij deed vóór, tussen en na de
 * twee vallen, naast wat er op de pagina staat. Het resultaat is een **voorstel** per URL —
 * keep / improve / merge / noindex — dat de eigenaar beoordeelt. Dit script verandert niets aan
 * de site.
 *
 *   GSC_SA_JSON="$(cat pad/naar/sleutel.json)" node scripts/seo-agent/page-audit.mjs [origin]
 *
 * `origin` is waar de pagina's gelezen worden (standaard http://localhost:3001, dus de inhoud
 * zoals hij in deze werkkopie staat). De zoekcijfers komen altijd van de productie-property.
 *
 * Drie vensters, gekozen op de dagcijfers in `seo-agent/data/history/`:
 *   A  13-08 t/m 04-09  vóór de eerste val (de normale stand)
 *   B  17-09 t/m 29-09  het herstel tussen de twee vallen
 *   C  30-09 t/m nu     na de val tijdens de spam-update
 */
import { google } from 'googleapis';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ORIGIN = process.argv[2] ?? 'http://localhost:3001';
const PROPERTY = 'sc-domain:inburgeringoefenen.nl';
const PROD = 'https://inburgeringoefenen.nl';
const TODAY = new Date().toISOString().slice(0, 10);
const LAG = new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10);
const WINDOWS = {
  A: ['2026-08-13', '2026-09-04'],
  B: ['2026-09-17', '2026-09-29'],
  C: ['2026-09-30', LAG],
};

function client() {
  const raw = process.env.GSC_SA_JSON;
  if (!raw) throw new Error('GSC_SA_JSON ontbreekt — zie de kop van dit bestand');
  const creds = JSON.parse(raw);
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  return google.searchconsole({ version: 'v1', auth });
}

async function pages(gsc, [startDate, endDate]) {
  const out = new Map();
  let startRow = 0;
  for (;;) {
    const { data } = await gsc.searchanalytics.query({
      siteUrl: PROPERTY,
      requestBody: { startDate, endDate, dimensions: ['page'], rowLimit: 25000, startRow, dataState: 'all', type: 'web' },
    });
    const rows = data.rows ?? [];
    for (const r of rows) out.set(new URL(r.keys[0]).pathname, { clicks: r.clicks, impressions: r.impressions, position: r.position });
    if (rows.length < 25000) break;
    startRow += 25000;
  }
  return out;
}

async function sitemapPaths() {
  const xml = await (await fetch(`${ORIGIN}/sitemap.xml`)).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => decodeURI(new URL(m[1]).pathname));
}

/** De hoofdtekst van een pagina, zonder chrome. Ruw maar genoeg om te tellen en te vergelijken. */
async function pageFacts(path) {
  const res = await fetch(`${ORIGIN}${encodeURI(path)}`);
  const html = await res.text();
  const main = (html.match(/<main[\s\S]*?<\/main>/) ?? [html])[0]
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ');
  const text = main.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ').trim();
  const words = text ? text.split(' ').length : 0;
  return {
    status: res.status,
    noindex: /<meta[^>]+name="robots"[^>]+noindex/i.test(html),
    words,
    emDashPer1k: words ? +((text.match(/—/g)?.length ?? 0) / words * 1000).toFixed(1) : 0,
    docentNotes: (html.match(/class="docent-note"/g) ?? []).length,
    machineTranslated: /translated_note|automatisch vertaald|machine-translated|machine translation|ترجمة آلية/i.test(html),
    article: /"@type":"(Article|BlogPosting)"/.test(html),
    text,
  };
}

function shingles(text, n = 5) {
  const w = text.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, ' ').split(/\s+/).filter(Boolean);
  const set = new Set();
  for (let i = 0; i + n <= w.length; i++) set.add(w.slice(i, i + n).join(' '));
  return set;
}

function jaccard(a, b) {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter || 1);
}

const kind = path => ({ locale: path.split('/')[1] });

/** Waar een oude URL nu op landt — zodat zijn vertoningen bij de pagina horen die hem opvolgde. */
async function finalPath(path) {
  let current = path;
  for (let hop = 0; hop < 4; hop++) {
    const res = await fetch(`${ORIGIN}${encodeURI(current)}`, { redirect: 'manual' });
    const loc = res.headers.get('location');
    if (![301, 307, 308].includes(res.status) || !loc) return current;
    current = decodeURI(new URL(loc, ORIGIN).pathname);
  }
  return current;
}

const add = (a, b) => ({
  clicks: a.clicks + b.clicks,
  impressions: a.impressions + b.impressions,
  position: a.impressions + b.impressions
    ? ((a.position ?? 0) * a.impressions + (b.position ?? 0) * b.impressions) / (a.impressions + b.impressions)
    : null,
});

function verdict(row) {
  const demandBefore = row.A.impressions + row.B.impressions;
  if (row.status !== 200) return ['fix', `HTTP ${row.status}`];
  if (row.noindex) return ['keep', 'staat al op noindex'];
  if (row.locale !== 'nl' && row.article && row.machineTranslated && row.A.clicks + row.B.clicks + row.C.clicks === 0)
    return ['noindex', 'ongereviewde machinevertaling zonder klikken'];
  if (row.dupOf) return ['merge', `${Math.round(row.dupScore * 100)}% overlap met ${row.dupOf}`];
  if (row.article && row.words < 400) return ['improve', `dun: ${row.words} woorden`];
  if (row.article && demandBefore >= 100) return ['improve', `had vraag (${demandBefore} vertoningen in A+B) — eerst verrijken`];
  if (row.article && demandBefore === 0 && row.C.impressions === 0) return ['review', 'nooit vertoond'];
  return ['keep', ''];
}

const csvCell = v => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));

async function main() {
  const gsc = client();
  const [A, B, C] = await Promise.all(Object.values(WINDOWS).map(w => pages(gsc, w)));
  const paths = await sitemapPaths();
  const zero = { clicks: 0, impressions: 0, position: null };

  const rows = [];
  for (const path of paths) {
    const facts = await pageFacts(path);
    rows.push({ path, ...kind(path), ...facts, A: A.get(path) ?? zero, B: B.get(path) ?? zero, C: C.get(path) ?? zero });
  }

  const known = new Set(paths);
  const legacy = [];
  for (const p of new Set([...A.keys(), ...B.keys(), ...C.keys()])) {
    if (known.has(p)) continue;
    const to = await finalPath(p);
    const row = { path: p, to: known.has(to) ? to : null, A: A.get(p) ?? zero, B: B.get(p) ?? zero, C: C.get(p) ?? zero };
    legacy.push(row);
    const target = row.to && rows.find(r => r.path === row.to);
    if (target) for (const w of ['A', 'B', 'C']) target[w] = add(target[w], row[w]);
  }
  legacy.sort((x, y) => (y.A.impressions + y.B.impressions) - (x.A.impressions + x.B.impressions));
  const nlArticles = rows.filter(r => r.locale === 'nl' && r.article);
  const sh = new Map(nlArticles.map(r => [r.path, shingles(r.text)]));
  for (const r of nlArticles) {
    for (const o of nlArticles) {
      if (o.path === r.path) continue;
      const score = jaccard(sh.get(r.path), sh.get(o.path));
      const weaker = (r.A.impressions + r.B.impressions) <= (o.A.impressions + o.B.impressions);
      if (score > 0.25 && weaker && score > (r.dupScore ?? 0)) Object.assign(r, { dupOf: o.path, dupScore: score });
    }
  }

  for (const r of rows) [r.verdict, r.reason] = verdict(r);

  const dir = join(process.cwd(), 'seo-agent', 'reports');
  mkdirSync(dir, { recursive: true });
  const head = ['path', 'verdict', 'reason', 'words', 'em_dash_per_1k', 'docent_notes', 'machine_translated',
    'A_clicks', 'A_impr', 'A_pos', 'B_clicks', 'B_impr', 'B_pos', 'C_clicks', 'C_impr', 'C_pos'];
  const fmt = n => (n == null ? '' : +n.toFixed(1));
  const lines = rows.map(r => [r.path, r.verdict, r.reason, r.words, r.emDashPer1k, r.docentNotes, r.machineTranslated,
    r.A.clicks, r.A.impressions, fmt(r.A.position), r.B.clicks, r.B.impressions, fmt(r.B.position),
    r.C.clicks, r.C.impressions, fmt(r.C.position)].map(csvCell).join(','));
  writeFileSync(join(dir, `page-audit-${TODAY}.csv`), [head.join(','), ...lines].join('\n') + '\n');

  const by = v => rows.filter(r => r.verdict === v);
  const sum = (list, w, k) => list.reduce((s, r) => s + r[w][k], 0);
  const table = list => ['| URL | Reden | Woorden | A vert. | B vert. | C vert. |', '|---|---|---|---|---|---|',
    ...list.sort((x, y) => (y.A.impressions + y.B.impressions) - (x.A.impressions + x.B.impressions))
      .map(r => `| \`${r.path}\` | ${r.reason} | ${r.words} | ${r.A.impressions} | ${r.B.impressions} | ${r.C.impressions} |`)].join('\n');

  const md = `# Pagina-audit — ${TODAY}

Voorstel per URL, door \`scripts/seo-agent/page-audit.mjs\`. **De eigenaar beslist; dit script verandert niets.**
Pagina's gelezen van \`${ORIGIN}\`; zoekcijfers van \`${PROPERTY}\`.

| Venster | Periode | Klikken | Vertoningen |
|---|---|---|---|
| A — vóór de eerste val | ${WINDOWS.A.join(' → ')} | ${sum(rows, 'A', 'clicks')} | ${sum(rows, 'A', 'impressions')} |
| B — herstel | ${WINDOWS.B.join(' → ')} | ${sum(rows, 'B', 'clicks')} | ${sum(rows, 'B', 'impressions')} |
| C — na de spam-update | ${WINDOWS.C.join(' → ')} | ${sum(rows, 'C', 'clicks')} | ${sum(rows, 'C', 'impressions')} |

Sitemap-URL's: ${rows.length} · improve ${by('improve').length} · merge ${by('merge').length} · noindex ${by('noindex').length} · review ${by('review').length} · fix ${by('fix').length} · keep ${by('keep').length}

## Improve — eerst verrijken met de docent, in deze volgorde
${table(by('improve'))}

## Merge — te veel overlap met een sterkere pagina
${table(by('merge'))}

## Noindex — ongereviewde machinevertalingen zonder klikken
${table(by('noindex'))}

## Review — nooit vertoond
${table(by('review'))}

${by('fix').length ? `## Fix\n${table(by('fix'))}\n` : ''}
## Oude URL's met vertoningen (niet in de sitemap; hun cijfers tellen mee bij de opvolger)
| URL | Landt op | A vert. | B vert. | C vert. |
|---|---|---|---|---|
${legacy.slice(0, 30).map(r => `| \`${r.path}\` | ${r.to ? `\`${r.to}\`` : '—'} | ${r.A.impressions} | ${r.B.impressions} | ${r.C.impressions} |`).join('\n')}
`;
  writeFileSync(join(dir, `page-audit-${TODAY}.md`), md);
  console.log(`page-audit-${TODAY}: ${rows.length} URL's — improve ${by('improve').length}, merge ${by('merge').length}, noindex ${by('noindex').length}, review ${by('review').length}`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
