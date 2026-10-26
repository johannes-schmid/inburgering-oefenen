#!/usr/bin/env node
/**
 * De wekelijkse gezondheidsscore: één rij in seo-agent/data/history/health.json.
 *
 *   node scripts/seo-agent/score.mjs                  # de nieuwste snapshot
 *   node scripts/seo-agent/score.mjs --week 2026-W41  # een oudere week (backfill)
 *
 * Draait in de vrijdagrun direct na collect.mjs. De som is dezelfde als op /admin/seo
 * (`lib/admin/seo-score.mjs`), alleen met de snapshot in plaats van live cijfers: Search Console
 * per pagina over de 28 dagen van die snapshot, de gezondheidscheck van die week en de triage uit
 * pages.json. Ontbreekt de Search Console-snapshot, dan rekent hij zonder zichtbaarheid en zegt
 * de rij dat (`gsc: false`) — onbekend, nooit nul.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SEO_DIR, readSnapshot } from './lib/io.mjs';
import { rollup, upsertHistory } from '../../lib/admin/seo-score.mjs';

const args = process.argv.slice(2);
const i = args.indexOf('--week');
const weeks = readdirSync(join(SEO_DIR, 'data')).filter(d => /^\d{4}-W\d{2}$/.test(d)).sort();
const week = i >= 0 ? args[i + 1] : weeks.at(-1);
if (!weeks.includes(week)) throw new Error(`geen snapshot voor ${week}`);

const triage = JSON.parse(readFileSync(join(SEO_DIR, 'pages.json'), 'utf8'));
const gsc = readSnapshot(week, 'gsc')?.sites?.inburgering;
const health = readSnapshot(week, 'health')?.sites?.inburgering;
const toPath = url => decodeURI(url.replace(/^https?:\/\/[^/]+/, '')) || '/';

const gscOk = !!gsc?.current?.page;
const now = new Map((gsc?.current?.page ?? []).map(r => [toPath(r.keys[0]), { impressions: r.impressions, position: r.position }]));
const issues = new Map(Object.entries(health?.problems ?? {}).map(([url, list]) => [toPath(url), list]));

const pages = triage.pages.map(p => ({
  path: p.path,
  section: p.section,
  verdict: p.verdict,
  demand: p.demand,
  now: gscOk ? now.get(p.path) ?? { impressions: 0, position: null } : null,
  issues: issues.get(p.path) ?? [],
}));
const { site, sections } = rollup(pages);

const dir = join(SEO_DIR, 'data', 'history');
mkdirSync(dir, { recursive: true });
const file = join(dir, 'health.json');
const prev = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { rows: [] };
const row = {
  week,
  date: (gsc?.windows?.current?.end ?? new Date().toISOString()).slice(0, 10),
  site,
  sections,
  pages: pages.length,
  gsc: gscOk,
  triage: triage.updated,
};
const out = {
  $comment: 'Geschreven door scripts/seo-agent/score.mjs. Eén rij per week; de som staat in lib/admin/seo-score.mjs.',
  rows: upsertHistory(prev.rows, row),
};
writeFileSync(file, JSON.stringify(out, null, 2) + '\n');
console.log(`${week}: ${site}/100`, sections);
