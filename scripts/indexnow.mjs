#!/usr/bin/env node
/**
 * IndexNow: meldt nieuwe of gewijzigde URL's bij Bing (en via hen Yandex, Seznam, Naver).
 *
 *   node scripts/indexnow.mjs --new --state <bestand>   # alleen URL's die nieuw zijn in de sitemap
 *   node scripts/indexnow.mjs --all                      # de hele sitemap, eenmalig
 *   node scripts/indexnow.mjs /nl/gidsen/x /nl/blog/y    # met de hand, na een echte wijziging
 *   ... --dry-run                                        # tonen, niets versturen
 *
 * De sleutel is publiek: hij staat als `public/<KEY>.txt` in de root, en dat bestand is het bewijs
 * dat we de host bezitten. Hij is dus geen geheim en staat hier gewoon in de code.
 *
 * Waarom niet elke deploy de hele sitemap: IndexNow is bedoeld voor gewijzigde URL's, en wie steeds
 * alles opnieuw stuurt krijgt 429 of wordt genegeerd. De sitemap heeft geen `<lastmod>`, dus
 * "nieuw in de sitemap" is het enige wijzigingssignaal dat we zonder meer hebben. Zonder
 * state-bestand legt `--new` alleen een nulmeting vast en verstuurt niets — een verlopen cache
 * mag nooit stil tot een volledige herindienst leiden.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const HOST = 'inburgeringoefenen.nl';
const ORIGIN = `https://${HOST}`;
const KEY = 'ac4ba7bff5fd6a412d4731314edbb869';
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_PER_REQUEST = 10_000;

const args = process.argv.slice(2);
const has = name => args.includes(`--${name}`);
const value = name => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : null; };
const statePath = value('state');
const dryRun = has('dry-run');
const manual = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--state');

async function sitemapUrls() {
  const res = await fetch(`${ORIGIN}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap: HTTP ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
}

async function submit(urls) {
  if (urls.length === 0) { console.log('Niets te melden.'); return; }
  for (let i = 0; i < urls.length; i += MAX_PER_REQUEST) {
    const urlList = urls.slice(i, i + MAX_PER_REQUEST);
    if (dryRun) { console.log(`[dry-run] ${urlList.length} URL's:\n${urlList.join('\n')}`); continue; }
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `${ORIGIN}/${KEY}.txt`, urlList }),
    });
    console.log(`IndexNow: HTTP ${res.status} voor ${urlList.length} URL's`);
    if (res.status !== 200 && res.status !== 202) {
      throw new Error(`IndexNow weigerde (${res.status}): ${await res.text()}`);
    }
  }
}

async function main() {
  const keyFile = await fetch(`${ORIGIN}/${KEY}.txt`);
  if (!keyFile.ok || (await keyFile.text()).trim() !== KEY) {
    const msg = `Sleutelbestand ${ORIGIN}/${KEY}.txt staat niet (correct) live`;
    if (!dryRun) throw new Error(msg);
    console.warn(`[dry-run] ${msg}`);
  }

  if (manual.length > 0) {
    await submit(manual.map(u => (u.startsWith('http') ? u : `${ORIGIN}${u.startsWith('/') ? '' : '/'}${u}`)));
    return;
  }

  const current = await sitemapUrls();
  if (has('all')) {
    await submit(current);
  } else if (has('new')) {
    if (!statePath) throw new Error('--new vraagt --state <bestand>');
    if (!existsSync(statePath)) {
      console.log(`Geen state: nulmeting van ${current.length} URL's vastgelegd, niets verstuurd.`);
    } else {
      const seen = new Set(JSON.parse(readFileSync(statePath, 'utf8')));
      await submit(current.filter(u => !seen.has(u)));
    }
  } else {
    throw new Error('Geef --all, --new --state <bestand>, of één of meer URL\'s');
  }

  if (statePath && !dryRun) writeFileSync(statePath, JSON.stringify(current, null, 2));
}

main().catch(err => { console.error(err.message); process.exit(1); });
