import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
export const SEO_DIR = join(ROOT, 'seo-agent');

export function readConfig() {
  return JSON.parse(readFileSync(join(SEO_DIR, 'config.json'), 'utf8'));
}

export function weekDir(week) {
  const dir = join(SEO_DIR, 'data', week);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function writeSnapshot(week, name, payload) {
  const file = join(weekDir(week), `${name}.json`);
  writeFileSync(file, JSON.stringify({ week, generated_at: new Date().toISOString(), ...payload }, null, 2) + '\n');
  return file;
}

export function readSnapshot(week, name) {
  const file = join(SEO_DIR, 'data', week, `${name}.json`);
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
}

/** De vorige week waarvoor een snapshot van `name` bestaat, of null. */
export function previousSnapshot(week, name) {
  const dataDir = join(SEO_DIR, 'data');
  if (!existsSync(dataDir)) return null;
  const weeks = readdirSync(dataDir).filter(w => /^\d{4}-W\d{2}$/.test(w) && w < week).sort().reverse();
  for (const w of weeks) {
    const snap = readSnapshot(w, name);
    if (snap && !snap.skipped) return snap;
  }
  return null;
}

export function skipped(reason) {
  return { skipped: reason };
}

export async function fetchJson(url, init = {}, label = url) {
  const res = await fetch(url, init);
  const text = await res.text();
  if (!res.ok) throw new Error(`${label} → ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

/** Hooguit `limit` taken tegelijk; PostHog staat er drie toe, een eigen site vijf. */
export async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

export function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return null; }
}
