/**
 * Search Console, per property: twee vensters van 28 dagen (huidig en vorig), per query, per
 * pagina, per query×pagina, per land en per apparaat. Alles onder één sleutel per site.
 *
 * Auth: het serviceaccount uit docs/seo/google-api-toegang.md, als JSON in `GSC_SA_JSON`
 * (de inhoud, niet een pad — zo past hij in een GitHub-secret).
 */
import { google } from 'googleapis';
import { windows } from './lib/dates.mjs';
import { skipped } from './lib/io.mjs';

const DIMENSION_SETS = [
  ['query'],
  ['page'],
  ['query', 'page'],
  ['country'],
  ['device'],
];

function auth() {
  const raw = process.env.GSC_SA_JSON;
  if (!raw) return null;
  const creds = JSON.parse(raw);
  return new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
}

async function query(client, siteUrl, { start, end }, dimensions) {
  const rows = [];
  let startRow = 0;
  for (;;) {
    const { data } = await client.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: start,
        endDate: end,
        dimensions,
        rowLimit: 25000,
        startRow,
        dataState: 'all',
        type: 'web',
      },
    });
    const batch = data.rows ?? [];
    rows.push(...batch.map(r => ({ keys: r.keys, clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position })));
    if (batch.length < 25000) break;
    startRow += 25000;
  }
  return rows;
}

async function daily(client, siteUrl, { start, end }) {
  const { data } = await client.searchanalytics.query({
    siteUrl,
    requestBody: { startDate: start, endDate: end, dimensions: ['date'], rowLimit: 1000, dataState: 'all', type: 'web' },
  });
  return (data.rows ?? []).map(r => ({ date: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position }));
}

function totals(rows) {
  const clicks = rows.reduce((s, r) => s + r.clicks, 0);
  const impressions = rows.reduce((s, r) => s + r.impressions, 0);
  const weighted = rows.reduce((s, r) => s + r.position * r.impressions, 0);
  return { clicks, impressions, ctr: impressions ? clicks / impressions : 0, position: impressions ? weighted / impressions : null };
}

export async function collectGsc(config, { today = new Date() } = {}) {
  const jwt = auth();
  if (!jwt) return skipped('GSC_SA_JSON ontbreekt');
  const client = google.searchconsole({ version: 'v1', auth: jwt });
  const win = windows(today, config.rules.window_days);
  const sites = {};
  for (const [key, site] of Object.entries(config.sites)) {
    try {
      const out = { property: site.gsc_property, windows: win, current: {}, previous: {} };
      for (const dims of DIMENSION_SETS) {
        const name = dims.join('_');
        out.current[name] = await query(client, site.gsc_property, win.current, dims);
        out.previous[name] = await query(client, site.gsc_property, win.previous, dims);
      }
      out.daily = await daily(client, site.gsc_property, { start: win.previous.start, end: win.current.end });
      out.totals = { current: totals(out.current.query), previous: totals(out.previous.query) };
      const brand = new RegExp(site.brand_terms.map(t => t.replace(/\s+/g, '\\s*')).join('|'), 'i');
      out.non_brand = {
        current: totals(out.current.query.filter(r => !brand.test(r.keys[0]))),
        previous: totals(out.previous.query.filter(r => !brand.test(r.keys[0]))),
      };
      sites[key] = out;
    } catch (err) {
      sites[key] = { property: site.gsc_property, error: err.message };
    }
  }
  return { sites };
}

/** Eénmalig: 16 maanden dagtotalen, zodat de geschiedenis van ons is als Google hem weggooit. */
export async function backfillGsc(config, { today = new Date() } = {}) {
  const jwt = auth();
  if (!jwt) return skipped('GSC_SA_JSON ontbreekt');
  const client = google.searchconsole({ version: 'v1', auth: jwt });
  const end = new Date(today); end.setUTCDate(end.getUTCDate() - 3);
  const start = new Date(end); start.setUTCMonth(start.getUTCMonth() - 16);
  const sites = {};
  for (const [key, site] of Object.entries(config.sites)) {
    try {
      sites[key] = await daily(client, site.gsc_property, { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) });
    } catch (err) {
      sites[key] = { error: err.message };
    }
  }
  return { sites };
}
