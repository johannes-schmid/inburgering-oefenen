/**
 * Bing Webmaster Tools: query- en paginastatistieken plus crawlproblemen, per site.
 * ChatGPT-zoeken leunt op Bing, dus dit is de GEO-kant van de indexering.
 * Eén sleutel per gebruiker (`BING_API_KEY`), geldig voor alle geverifieerde sites.
 */
import { fetchJson, skipped } from './lib/io.mjs';

const BASE = 'https://ssl.bing.com/webmaster/api.svc/json';

async function call(method, siteUrl, key) {
  const url = `${BASE}/${method}?siteUrl=${encodeURIComponent(siteUrl)}&apikey=${key}`;
  const json = await fetchJson(url, {}, `bing ${method}`);
  return json?.d ?? json;
}

export async function collectBing(config) {
  const key = process.env.BING_API_KEY;
  if (!key) return skipped('BING_API_KEY ontbreekt');
  const sites = {};
  for (const [name, site] of Object.entries(config.sites)) {
    const out = { site_url: site.bing_site_url };
    for (const method of ['GetQueryStats', 'GetPageStats', 'GetCrawlIssues', 'GetRankAndTrafficStats']) {
      try {
        out[method] = await call(method, site.bing_site_url, key);
      } catch (err) {
        out[method] = { error: err.message };
      }
    }
    sites[name] = out;
  }
  return { sites };
}
