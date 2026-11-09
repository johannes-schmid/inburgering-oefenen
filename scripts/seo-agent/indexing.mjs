/**
 * Indexering: per pagina uit `seo-agent/pages.json` de uitkomst van Search Console URL Inspection
 * ("Submitted and indexed", "Crawled - currently not indexed", ...). Voor de kolom Index en het
 * filter "Not indexed" op `/admin/seo`.
 *
 * Alleen pagina's die geïndexeerd hóren te worden: een pagina met oordeel `remove` gaat bewust uit
 * de index, en "niet geïndexeerd" is daar geen probleem maar het plan. De API staat 2.000 controles
 * per dag per property toe; dit zijn er ruim honderd per week.
 *
 *   node scripts/seo-agent/collect.mjs --only indexing
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { google } from 'googleapis';
import { SEO_DIR, mapLimit, skipped } from './lib/io.mjs';

const ORIGIN = 'https://inburgeringoefenen.nl';

function auth() {
  const raw = process.env.GSC_SA_JSON ?? process.env.GA4_SA_JSON;
  if (!raw) return null;
  const creds = JSON.parse(raw.trim().replace(/^'([\s\S]*)'$/, '$1'));
  return new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
}

export async function collectIndexing(config) {
  const jwt = auth();
  if (!jwt) return skipped('GSC_SA_JSON ontbreekt');
  const property = config.sites.inburgering.gsc_property;
  const triage = JSON.parse(readFileSync(join(SEO_DIR, 'pages.json'), 'utf8'));
  const paths = triage.pages.filter(p => p.verdict !== 'remove').map(p => p.path);
  const sc = google.searchconsole({ version: 'v1', auth: jwt });

  const errors = [];
  const results = await mapLimit(paths, 4, async path => {
    try {
      const { data } = await sc.urlInspection.index.inspect({
        requestBody: { inspectionUrl: encodeURI(`${ORIGIN}${path}`), siteUrl: property },
      });
      const r = data.inspectionResult?.indexStatusResult ?? {};
      return [path, { verdict: r.verdict ?? 'UNKNOWN', coverage: r.coverageState ?? 'Unknown', lastCrawl: r.lastCrawlTime ?? null }];
    } catch (err) {
      errors.push(`${path}: ${err.message}`);
      return null;
    }
  });

  return { property, checked: paths.length, pages: Object.fromEntries(results.filter(Boolean)), errors: errors.slice(0, 20) };
}
