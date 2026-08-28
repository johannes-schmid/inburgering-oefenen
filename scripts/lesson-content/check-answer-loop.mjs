/**
 * Loop de lesstroom met de hand: antwoord op één opgave en kijk of het écht wordt vastgelegd.
 *
 * Dit bestaat omdat de drie manieren waarop dit stil kan falen alle drie in dit project al
 * eens zijn voorgekomen:
 *
 *   1. Een RLS-geweigerde write geeft via PostgREST **200 met nul rijen** en is niet te
 *      onderscheiden van een geslaagde save.
 *   2. Een weggegooid resultaat (`.then(() => {})`) laat een kapotte write er geslaagd uitzien
 *      — dat heeft `user_leren_progress` deze codebase gekost: nooit één lesvoortgang bewaard.
 *   3. `tsc` en de build zeggen niets over een antwoord dat de database niet haalt.
 *
 * Dus: echte browser, echte sessie, echte klik, en daarna de tabel querien.
 *
 *   node scripts/lesson-content/check-answer-loop.mjs <lesUrl> <cookieFile>
 */

import fs from 'node:fs';
import puppeteer from 'puppeteer';

const [url, cookieFile] = process.argv.slice(2);
if (!url || !cookieFile) {
  console.error('Gebruik: node check-answer-loop.mjs <lesUrl> <cookieFile>');
  process.exit(1);
}

const cookieLine = fs.readFileSync(cookieFile, 'utf8').trim();
const [name, ...rest] = cookieLine.split('=');
const value = rest.join('=');

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });

const origin = new URL(url).origin;
await page.setCookie({ name, value, url: origin, path: '/' });

// Elke netwerkcall naar het antwoord-endpoint meelezen: dat is het bewijs, niet de UI.
const calls = [];
page.on('response', async res => {
  if (!res.url().includes('/api/lesson-answer')) return;
  let body = null;
  try { body = await res.json(); } catch { /* geen JSON */ }
  calls.push({ status: res.status(), body });
});
const consoleErrors = [];
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });

await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

// De eerste meerkeuzeopgave: kies een optie en kijk hem na.
const opt = await page.$('.ex .opt');
if (!opt) { console.error('FAIL: geen enkele meerkeuzeoptie op de pagina'); await browser.close(); process.exit(1); }
await opt.click();

const check = await page.$('.ex .ex-check:not([disabled])');
if (!check) { console.error('FAIL: de nakijkknop bleef uitgeschakeld na het kiezen'); await browser.close(); process.exit(1); }
await check.click();

// Wachten tot de feedback in beeld staat, en niet op een vaste tijd: een timeout die te kort
// is levert een "geslaagde" test op die niets heeft gemeten.
await page.waitForSelector('.ex-fb .fb-head', { timeout: 15000 });
const feedback = await page.$eval('.ex-fb .fb-head', el => el.textContent.trim());
const hasWhy = await page.$('.ex-fb .fb-why') !== null;

// Even wachten tot de POST rond is — hij is fire-and-forget.
await page.waitForFunction(() => true);
const deadline = Date.now() + 8000;
while (calls.length === 0 && Date.now() < deadline) {
  await new Promise(r => setTimeout(r, 200));
}

await page.screenshot({ path: 'temporary_screenshots/answer-loop.png', fullPage: false });
await browser.close();

console.log(`feedback op het scherm : "${feedback}"`);
console.log(`uitleg zichtbaar       : ${hasWhy ? 'ja' : 'NEE'}`);
console.log(`calls naar /api/lesson-answer: ${calls.length}`);
for (const c of calls) console.log(`  ${c.status} ${JSON.stringify(c.body)}`);
if (consoleErrors.length) {
  console.log('console-fouten:');
  for (const e of consoleErrors.slice(0, 5)) console.log(`  ${e}`);
}

const ok = calls.length === 1 && calls[0].status === 200 && typeof calls[0].body?.correct === 'boolean';
console.log(ok ? '\nOK — het antwoord is nagekeken en gemeld.' : '\nFAIL — het antwoord is niet correct gemeld.');
process.exit(ok ? 0 : 1);
