#!/usr/bin/env node
/**
 * check-ui.mjs, but with a session cookie — for the portal and admin surfaces.
 *
 * `check-ui.mjs` can only ever photograph the login page for anything under `(app)` or `(admin)`,
 * because those routes redirect an anonymous visitor. This takes a cookie file, so those pages can
 * actually be reviewed at both widths before a change is called done.
 *
 *   node check-ui-auth.mjs <url> <label> <cookie-file> [click-selector]
 *
 * The cookie file holds one line, `name=value`. Mint one against the local stack with the auth
 * admin API and base64-encode the session JSON — see CLAUDE.md, "Verifying the portal needs a
 * session". The optional selector is clicked before the shot, which is how a drawer or an inline
 * editor gets photographed at all.
 *
 * Same caveat as check-ui.mjs: puppeteer 13.7 bundles Chromium 101 (2022), which predates the
 * standalone `translate` property Tailwind v4 emits. A layout bug seen here may be the browser
 * rather than the page.
 */
import puppeteer from 'puppeteer';
import fs from 'node:fs';

const [url, label, cookieFile, clickSelector] = process.argv.slice(2);
if (!url || !label || !cookieFile) {
  console.error('Usage: node check-ui-auth.mjs <url> <label> <cookie-file> [click-selector]');
  process.exit(1);
}

const raw = fs.readFileSync(cookieFile, 'utf8').trim();
const eq = raw.indexOf('=');
const name = raw.slice(0, eq);
const value = raw.slice(eq + 1);
const domain = new URL(url).hostname;

/**
 * Chromium rejects a cookie over ~4 KB with "Invalid cookie fields", and a Supabase session that
 * carries any real user_metadata goes past it. `@supabase/ssr` splits the token into `.0`, `.1`
 * chunks for exactly this reason and reassembles them on read, so the harness has to write the
 * same shape — a single oversized cookie silently fails and you photograph the login page.
 */
const CHUNK = 3180;
const cookies =
  value.length <= CHUNK
    ? [{ name, value }]
    : Array.from({ length: Math.ceil(value.length / CHUNK) }, (_, i) => ({
        name: `${name}.${i}`,
        value: value.slice(i * CHUNK, (i + 1) * CHUNK),
      }));

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

for (const [width, height, tag] of [[390, 844, 'mobile'], [1440, 900, 'desktop']]) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  await page.setCookie(...cookies.map(c => ({ ...c, domain, path: '/' })));
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
  await new Promise(r => setTimeout(r, 800));

  // Comma-separated selectors are clicked in order, because reaching a drawer often takes two
  // steps — switch to the Spreken tab, *then* open the first row. One click could only ever
  // photograph the default tab.
  for (const sel of (clickSelector ? clickSelector.split(',') : []).map(s => s.trim()).filter(Boolean)) {
    const clicked = await page.evaluate(s => {
      const el = document.querySelector(s);
      if (el) { el.click(); return true; }
      return false;
    }, sel);
    // Reported rather than silently skipped: a shot of the page *without* the drawer open looks
    // fine and proves nothing about the thing being reviewed.
    console.log(`${tag}: clicked ${sel} → ${clicked}`);
    await new Promise(r => setTimeout(r, 1200));
  }

  const out = `temporary_screenshots/auth-${label}-${tag}.png`;
  await page.screenshot({ path: out, fullPage: true });
  console.log('Saved:', out);
}

await browser.close();
