/**
 * Backlinks: elke externe pagina die Bing naar inburgeringoefenen.nl ziet linken, met ankertekst en
 * doelpagina. Search Console heeft geen API voor links; Bing Webmaster wel (`GetLinkCounts` geeft
 * de pagina's mét inkomende links, `GetUrlLinks` per pagina de bronnen).
 *
 *   node scripts/seo-agent/collect.mjs --only backlinks
 *
 * Bing ziet lang niet elke link: een lege lijst betekent "Bing kent er geen", niet "er zijn er geen".
 */
import { skipped } from './lib/io.mjs';

const BASE = 'https://ssl.bing.com/webmaster/api.svc/json';
const MAX_TARGETS = 60;

async function get(method, params, key) {
  const qs = Object.entries({ ...params, apikey: key }).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  const res = await fetch(`${BASE}/${method}?${qs}`);
  const json = await res.json().catch(() => null);
  if (!res.ok || json?.ErrorCode) throw new Error(`bing ${method}: ${json?.Message ?? res.status}`);
  return json?.d ?? json;
}

/** De JSON-variant van GetUrlLinks verwacht `link` als JSON-string; val terug op de kale URL. */
async function urlLinks(siteUrl, link, page, key) {
  try {
    return await get('GetUrlLinks', { siteUrl, link: JSON.stringify(link), page }, key);
  } catch {
    return await get('GetUrlLinks', { siteUrl, link, page }, key);
  }
}

export async function fetchBacklinks(siteUrl, key) {
  const targets = [];
  for (let page = 0; page < 10; page++) {
    const d = await get('GetLinkCounts', { siteUrl, page }, key);
    targets.push(...(d?.Links ?? []).map(l => ({ url: l.Url, count: l.Count })));
    if (page + 1 >= (d?.TotalPages ?? 1)) break;
  }
  targets.sort((a, b) => b.count - a.count);

  const links = [];
  const errors = [];
  for (const t of targets.slice(0, MAX_TARGETS)) {
    try {
      for (let page = 0; page < 5; page++) {
        const d = await urlLinks(siteUrl, t.url, page, key);
        links.push(...(d?.Details ?? []).map(x => ({ source: x.Url, anchor: x.AnchorText ?? '', target: t.url })));
        if (page + 1 >= (d?.TotalPages ?? 1)) break;
      }
    } catch (err) {
      errors.push(`${t.url}: ${err.message}`);
    }
  }
  return { targets, links, errors: errors.slice(0, 20) };
}

export async function collectBacklinks(config) {
  const key = process.env.BING_API_KEY;
  if (!key) return skipped('BING_API_KEY ontbreekt');
  return { site_url: config.sites.inburgering.bing_site_url, ...(await fetchBacklinks(config.sites.inburgering.bing_site_url, key)) };
}
