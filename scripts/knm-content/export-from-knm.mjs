/**
 * Export the KNM content from the **knm-website production** Supabase project.
 *
 * The static `data/*.ts` files in knm-website are a snapshot; production is the source of
 * truth (owner's instruction, 2026-08-24). Everything this writes under `generated/` is the
 * input to `seed-knm-content.mjs`, and is committed so the transfer is reviewable in a diff.
 *
 *   node scripts/knm-content/export-from-knm.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, 'generated');
const KNM_ENV = resolve(HERE, '../../../knm-website/.env.local');

function readEnv(path) {
  const out = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (!m) continue;
    // First wins: the hosted values are written above the local overrides in that file.
    if (!(m[1] in out)) out[m[1]] = m[2];
  }
  return out;
}

const env = readEnv(KNM_ENV);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_KEY;
if (!url || !url.startsWith('https://')) throw new Error('knm-website .env.local has no hosted NEXT_PUBLIC_SUPABASE_URL');
if (!key) throw new Error('knm-website .env.local has no SUPABASE_SERVICE_KEY');

async function select(table, cols, order) {
  const rows = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const qs = new URLSearchParams({ select: cols });
    if (order) qs.set('order', order);
    const res = await fetch(`${url}/rest/v1/${table}?${qs}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Range: `${from}-${from + PAGE - 1}`,
      },
    });
    if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`);
    const page = await res.json();
    rows.push(...page);
    if (page.length < PAGE) break;
  }
  return rows;
}

const TABLES = [
  ['questions',     '*', 'id'],
  ['sections',      '*', 'id'],
  ['leren_content', '*', 'theme_id,sort_order'],
  ['word_cards',    '*', 'theme_id,sort_order'],
];

mkdirSync(OUT, { recursive: true });
const summary = {};
for (const [table, cols, order] of TABLES) {
  const rows = await select(table, cols, order);
  writeFileSync(resolve(OUT, `${table}.json`), JSON.stringify(rows, null, 2) + '\n');
  summary[table] = rows.length;
}
console.log(JSON.stringify(summary, null, 2));
