import { google, type searchconsole_v1 } from 'googleapis';
import type { BingDay, GscDay } from './seo-model';

/**
 * Live cijfers voor `/admin/seo`, naast de snapshot van vrijdag.
 *
 * De snapshot loopt tot drie dagen vóór vrijdag, dus op maandag is hij al tien dagen oud. Search
 * Console geeft met `dataState: 'all'` ook de verse dagen tot en met vandaag; die zijn voorlopig en
 * de pagina zegt dat. Zelfde serviceaccount als `/admin/doelen` (`GA4_SA_JSON` of `GSC_SA_JSON`),
 * met de scope voor Search Console. Zonder sleutel of bij een fout: `null`, en de pagina valt terug
 * op de snapshot — onbekend, nooit nul.
 *
 * Een half uur in het geheugen van de functie: de pagina is alleen voor de eigenaar, en Search
 * Console ververst zelf ook niet vaker dan een paar keer per dag.
 */

const SITE = 'sc-domain:inburgeringoefenen.nl';
const BRAND = 'inburgering ?oefenen|inburgeringoefenen';
const TTL = 30 * 60_000;
/** De eerste dag met data; de backfill van 05-10 begint hier. */
const FIRST_DAY = '2026-07-28';

type Totals = { clicks: number; impressions: number; position: number | null };
export type PageRow = { page: string; impressions: number; clicks: number; position: number };

export type LiveGsc = {
  fetchedAt: string;
  daily: GscDay[];
  windows: { current: { start: string; end: string }; previous: { start: string; end: string } };
  totals: { current: Totals; previous: Totals };
  nonBrand: { current: Totals; previous: Totals };
  pages: { baseline: PageRow[]; recent: PageRow[]; recentWindow: { start: string; end: string } };
};

export type LiveBing = { fetchedAt: string; inburgering: BingDay[] | null; knm: BingDay[] | null };

let gscCache: { at: number; key: string; value: LiveGsc | { error: string } } | null = null;
let bingCache: { at: number; value: LiveBing | null } | null = null;

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: string, n: number) => {
  const x = new Date(`${d}T00:00:00Z`);
  x.setUTCDate(x.getUTCDate() + n);
  return ymd(x);
};

function creds(): { client_email: string; private_key: string } | null {
  const raw = process.env.GSC_SA_JSON ?? process.env.GA4_SA_JSON;
  if (!raw) return null;
  return JSON.parse(raw.trim().replace(/^'([\s\S]*)'$/, '$1'));
}

/**
 * Dagreeks, twee vensters van 28 dagen tot en met vandaag (met en zonder merknaam) en de pagina's
 * in de nulmeting tegen de laatste twee weken. `baseline` komt uit `seo-agent/diagnosis.json`.
 */
export async function fetchLiveGsc(baseline: { start: string; end: string }, now = new Date()): Promise<LiveGsc | { error: string } | null> {
  const key = `${baseline.start}:${baseline.end}`;
  if (gscCache && gscCache.key === key && Date.now() - gscCache.at < TTL) return gscCache.value;

  let c: ReturnType<typeof creds>;
  try {
    c = creds();
  } catch {
    return { error: 'GSC_SA_JSON / GA4_SA_JSON is not valid JSON' };
  }
  if (!c) return null;

  const auth = new google.auth.JWT({ email: c.client_email, key: c.private_key, scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });
  const sc = google.searchconsole({ version: 'v1', auth });
  type Body = Pick<searchconsole_v1.Schema$SearchAnalyticsQueryRequest, 'startDate' | 'endDate' | 'dimensions' | 'dimensionFilterGroups'>;
  const query = async (body: Body) => (await sc.searchanalytics.query({
    siteUrl: SITE,
    requestBody: { rowLimit: 25000, dataState: 'all', type: 'web', ...body },
  })).data.rows ?? [];

  const today = ymd(now);
  const current = { start: addDays(today, -27), end: today };
  const previous = { start: addDays(today, -55), end: addDays(today, -28) };
  const recentWindow = { start: addDays(today, -15), end: addDays(today, -2) };
  const nonBrand: searchconsole_v1.Schema$ApiDimensionFilterGroup[] = [{ filters: [{ dimension: 'query', operator: 'excludingRegex', expression: BRAND }] }];
  const total = (rows: { clicks?: number | null; impressions?: number | null; position?: number | null }[]): Totals => ({
    clicks: rows[0]?.clicks ?? 0,
    impressions: rows[0]?.impressions ?? 0,
    position: rows[0]?.position ?? null,
  });
  const pages = (rows: { keys?: string[] | null; clicks?: number | null; impressions?: number | null; position?: number | null }[]): PageRow[] =>
    rows.map(r => ({ page: r.keys![0], clicks: r.clicks ?? 0, impressions: r.impressions ?? 0, position: r.position ?? 0 }));

  try {
    const [daily, cur, prev, nbCur, nbPrev, base, recent] = await Promise.all([
      query({ startDate: FIRST_DAY, endDate: today, dimensions: ['date'] }),
      query({ startDate: current.start, endDate: current.end }),
      query({ startDate: previous.start, endDate: previous.end }),
      query({ startDate: current.start, endDate: current.end, dimensionFilterGroups: nonBrand }),
      query({ startDate: previous.start, endDate: previous.end, dimensionFilterGroups: nonBrand }),
      query({ startDate: baseline.start, endDate: baseline.end, dimensions: ['page'] }),
      query({ startDate: recentWindow.start, endDate: recentWindow.end, dimensions: ['page'] }),
    ]);
    const value: LiveGsc = {
      fetchedAt: new Date().toISOString(),
      daily: daily.map(r => ({ date: r.keys![0], clicks: r.clicks ?? 0, impressions: r.impressions ?? 0 })),
      windows: { current, previous },
      totals: { current: total(cur), previous: total(prev) },
      nonBrand: { current: total(nbCur), previous: total(nbPrev) },
      pages: { baseline: pages(base), recent: pages(recent), recentWindow },
    };
    gscCache = { at: Date.now(), key, value };
    return value;
  } catch (e) {
    const value = { error: e instanceof Error ? e.message.slice(0, 160) : 'Search Console request failed' };
    gscCache = { at: Date.now(), key, value };
    return value;
  }
}

/** Bing loopt niet achter; met `BING_API_KEY` haalt de pagina hem live, anders blijft de snapshot staan. */
export async function fetchLiveBing(): Promise<LiveBing | null> {
  const key = process.env.BING_API_KEY;
  if (!key) return null;
  if (bingCache && Date.now() - bingCache.at < TTL) return bingCache.value;
  const call = async (site: string) => {
    try {
      const res = await fetch(
        `https://ssl.bing.com/webmaster/api.svc/json/GetRankAndTrafficStats?siteUrl=${encodeURIComponent(site)}&apikey=${key}`,
        { cache: 'no-store' },
      );
      if (!res.ok) return null;
      return ((await res.json()) as { d?: BingDay[] }).d ?? null;
    } catch {
      return null;
    }
  };
  const [inburgering, knm] = await Promise.all([call('https://inburgeringoefenen.nl/'), call('https://knmoefenen.nl/')]);
  const value = inburgering || knm ? { fetchedAt: new Date().toISOString(), inburgering, knm } : null;
  bingCache = { at: Date.now(), value };
  return value;
}
