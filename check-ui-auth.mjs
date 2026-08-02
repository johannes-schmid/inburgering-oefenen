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

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

for (const [width, height, tag] of [[390, 844, 'mobile'], [1440, 900, 'desktop']]) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  await page.setCookie({ name, value, domain, path: '/' });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
  await new Promise(r => setTimeout(r, 800));

  if (clickSelector) {
    const clicked = await page.evaluate(sel => {
      const el = document.querySelector(sel);
      if (el) { el.click(); return true; }
      return false;
    }, clickSelector);
    // Reported rather than silently skipped: a shot of the page *without* the drawer open looks
    // fine and proves nothing about the thing being reviewed.
    console.log(`${tag}: clicked ${clickSelector} → ${clicked}`);
    await new Promise(r => setTimeout(r, 1500));
  }

  const out = `temporary_screenshots/auth-${label}-${tag}.png`;
  await page.screenshot({ path: out, fullPage: true });
  console.log('Saved:', out);
}

await browser.close();
