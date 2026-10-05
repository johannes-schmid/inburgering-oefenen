/**
 * Concurrenten via Firecrawl /map: één credit per aanroep, hoeveel URL's er ook terugkomen.
 * De snapshot bewaart de URL-set; het verschil met de vorige week is wat de agent leest
 * (nieuwe pagina's = nieuwe onderwerpen). Geen scrape: inhoud kost credits en is pas nodig
 * als een nieuwe URL interessant blijkt — dat is de maandrun, met de hand gekozen.
 */
import { fetchJson, previousSnapshot, skipped } from './lib/io.mjs';

export async function collectCompetitors(config, { week }) {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) return skipped('FIRECRAWL_API_KEY ontbreekt');
  const prev = previousSnapshot(week, 'competitors');
  const competitors = {};
  for (const domain of config.competitors) {
    try {
      const json = await fetchJson('https://api.firecrawl.dev/v2/map', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: `https://${domain}`, limit: 2000, includeSubdomains: false }),
      }, `firecrawl map ${domain}`);
      const urls = (json.links ?? []).map(l => (typeof l === 'string' ? l : l.url)).filter(Boolean).sort();
      const before = new Set(prev?.competitors?.[domain]?.urls ?? []);
      competitors[domain] = {
        url_count: urls.length,
        new_since_last: prev ? urls.filter(u => !before.has(u)) : [],
        removed_since_last: prev ? [...before].filter(u => !urls.includes(u)) : [],
        urls,
      };
    } catch (err) {
      competitors[domain] = { error: err.message };
    }
  }
  return { compared_to: prev?.week ?? null, competitors };
}
