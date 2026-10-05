#!/usr/bin/env node
/**
 * De vrijdagavondrun: alle bronnen naar seo-agent/data/<ISO-week>/*.json.
 *
 *   node scripts/seo-agent/collect.mjs                 # deze week, alle bronnen
 *   node scripts/seo-agent/collect.mjs --week 2026-W41 # een andere weekmap
 *   node scripts/seo-agent/collect.mjs --only gsc,health
 *   node scripts/seo-agent/collect.mjs --backfill      # 16 maanden GSC-dagtotalen, eenmalig
 *   node scripts/seo-agent/collect.mjs --force-geo     # GEO ook in een oneven week
 *
 * Een bron zonder sleutel schrijft `{ skipped }` en de run gaat door; de agent leest dat als
 * "onbekend", nooit als nul. Deterministisch en zonder oordeel — het oordeel is de zaterdagrun.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { isoWeek, isEvenWeek } from './lib/dates.mjs';
import { readConfig, writeSnapshot, SEO_DIR } from './lib/io.mjs';
import { collectGsc, backfillGsc } from './gsc.mjs';
import { collectBing } from './bing.mjs';
import { collectPosthog } from './posthog.mjs';
import { collectHealth } from './health.mjs';
import { collectCompetitors } from './competitors.mjs';
import { collectGeo } from './geo.mjs';

const args = process.argv.slice(2);
const flag = name => { const i = args.indexOf(`--${name}`); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : null; };

const config = readConfig();
const week = typeof flag('week') === 'string' ? flag('week') : isoWeek();
const only = typeof flag('only') === 'string' ? flag('only').split(',') : null;
const geoDue = isEvenWeek(week) || flag('force-geo') === true;

const SOURCES = {
  gsc: () => collectGsc(config),
  bing: () => collectBing(config),
  posthog: () => collectPosthog(config),
  health: () => collectHealth(config),
  competitors: () => collectCompetitors(config, { week }),
  geo: () => (geoDue ? collectGeo(config) : Promise.resolve({ skipped: `oneven week (${week}); GEO draait in even weken` })),
};

if (flag('backfill') === true) {
  const dir = join(SEO_DIR, 'data', 'history');
  mkdirSync(dir, { recursive: true });
  const data = await backfillGsc(config);
  writeFileSync(join(dir, `gsc-daily-${new Date().toISOString().slice(0, 10)}.json`), JSON.stringify(data, null, 2) + '\n');
  console.log('backfill → seo-agent/data/history');
}

const summary = {};
for (const [name, run] of Object.entries(SOURCES)) {
  if (only && !only.includes(name)) continue;
  const t0 = Date.now();
  try {
    const payload = await run();
    writeSnapshot(week, name, payload);
    summary[name] = payload.skipped ? `skipped: ${payload.skipped}` : `ok (${Math.round((Date.now() - t0) / 1000)}s)`;
  } catch (err) {
    writeSnapshot(week, name, { error: err.message });
    summary[name] = `error: ${err.message}`;
  }
  console.log(`${name.padEnd(12)} ${summary[name]}`);
}
writeSnapshot(week, 'index', { sources: summary, geo_due: geoDue });
