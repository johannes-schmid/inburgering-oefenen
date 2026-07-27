import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

// Ensure output directory exists
const outDir = path.join(__dirname, 'temporary_screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Auto-increment filename
const existing = fs.readdirSync(outDir).filter(f => f.startsWith('screenshot-') && f.endsWith('.png'));
const nums = existing.map(f => parseInt(f.replace('screenshot-', '').replace('.png', '').split('-')[0])).filter(n => !isNaN(n));
const next = nums.length ? Math.max(...nums) + 1 : 1;
const filename = label ? `screenshot-${next}-${label}.png` : `screenshot-${next}.png`;
const outPath = path.join(outDir, filename);

// Try puppeteer
let puppeteerAvailable = false;
try {
  execSync('node -e "require(\'puppeteer\')"', { stdio: 'ignore' });
  puppeteerAvailable = true;
} catch {}

if (puppeteerAvailable) {
  const script = `
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('${url}', { waitUntil: 'networkidle2', timeout: 15000 });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: '${outPath.replace(/\\/g, '\\\\')}', fullPage: true });
  await browser.close();
  console.log('Screenshot saved: ${filename}');
})().catch(e => { console.error(e); process.exit(1); });
`;
  try {
    execSync(`node -e "${script.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, { stdio: 'inherit' });
  } catch {
    console.error('Puppeteer screenshot failed');
    process.exit(1);
  }
} else {
  // Fallback: use screencapture (macOS) via open
  console.log(`Puppeteer not found. Opening ${url} in browser instead.`);
  console.log(`Install puppeteer: npm install puppeteer`);
  spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
}
