#!/usr/bin/env node
/**
 * UI check helper — captures desktop + mobile screenshots and displays them.
 * Usage: node check-ui.mjs <url> [label]
 * Example: node check-ui.mjs http://localhost:3000/proefexamen proefexamen
 */
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || 'check';

const outDir = path.join(__dirname, 'temporary_screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const existing = fs.readdirSync(outDir).filter(f => f.endsWith('.png'));
const nums = existing.map(f => parseInt(f.split('-')[1])).filter(n => !isNaN(n));
const next = nums.length ? Math.max(...nums) + 1 : 1;

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
];

const browser = await puppeteer.launch({ args: ['--no-sandbox'] });

for (const vp of viewports) {
  const page = await browser.newPage();
  await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
  // Wait for auth-loading overlay to disappear (up to 3s)
  await page.waitForFunction(
    () => document.getElementById('auth-loading')?.style.display === 'none' || !document.getElementById('auth-loading'),
    { timeout: 3000 }
  ).catch(() => {});
  await new Promise(r => setTimeout(r, 800));
  const filename = `screenshot-${next}-${label}-${vp.name}.png`;
  const outPath = path.join(outDir, filename);
  await page.screenshot({ path: outPath, fullPage: true });
  console.log(`Saved: ${filename}`);
  await page.close();
}

await browser.close();

// Open both screenshots in Preview
const files = fs.readdirSync(outDir)
  .filter(f => f.startsWith(`screenshot-${next}-${label}`))
  .map(f => path.join(outDir, f));
execSync(`open ${files.map(f => `"${f}"`).join(' ')}`);
