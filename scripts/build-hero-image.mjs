#!/usr/bin/env node
/**
 * Builds the homepage hero assets from the full-resolution source in
 * resources/images/ into public/images/.
 *
 *   node scripts/build-hero-image.mjs
 *
 * Two outputs, both consumed by the <picture> in app/[locale]/(main)/page.tsx:
 *   hero.webp            — what modern browsers actually load
 *   hero-compressed.jpg  — <img> fallback
 *
 * ── Why the crop window is explicit ──────────────────────────────────────────
 * The hero is full-bleed, and the floating question cards sit over its right-centre.
 * If the flag lands under those cards it is invisible, which is most of the point of the
 * photo. So rather than letting `object-position` fight a near-matching aspect ratio, the
 * subject is placed here: RIGHT_TRIM pushes the flag rightward until it clears the cards,
 * and the output aspect matches the band so CSS adds no cropping of its own.
 *
 * Tune RIGHT_TRIM / TOP_TRIM and re-run; nothing else needs to change.
 */
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(ROOT, 'resources', 'images');
const OUT_DIR = path.join(ROOT, 'public', 'images');

const OUT_WIDTH = 1600;
const OUT_HEIGHT = 1200;          // 4:3 — roughly the hero band's aspect at desktop widths
const TARGET_ASPECT = OUT_WIDTH / OUT_HEIGHT;

// Fraction of source width trimmed off the RIGHT edge. Higher = subject further right.
const RIGHT_TRIM = 0.205;
// Fraction of the resulting window's height trimmed off the TOP (empty sky).
const TOP_TRIM = 0.10;

const src = ['hero-source.png', 'hero-source.jpg', 'hero-source.jpeg', 'hero-source.webp']
  .map(f => path.join(SRC_DIR, f))
  .find(fs.existsSync);

if (!src) {
  console.error(`No hero-source.{png,jpg,jpeg,webp} found in ${SRC_DIR}`);
  process.exit(1);
}

const { width: srcW, height: srcH } = await sharp(src).metadata();
console.log(`source: ${path.basename(src)} ${srcW}×${srcH}`);

const winW = Math.round(srcW * (1 - RIGHT_TRIM));
// Height that gives the target aspect for that width, capped at what the source has.
const winH = Math.min(srcH, Math.round(winW / TARGET_ASPECT));
const winTop = Math.min(Math.round(srcH * TOP_TRIM), srcH - winH);

console.log(`window: ${winW}×${winH} at (0, ${winTop})  → aspect ${(winW / winH).toFixed(2)}`);

const base = sharp(src)
  .extract({ left: 0, top: winTop, width: winW, height: winH })
  .resize(OUT_WIDTH, OUT_HEIGHT, { fit: 'cover' });

await base.clone().webp({ quality: 82 }).toFile(path.join(OUT_DIR, 'hero.webp'));
await base.clone().jpeg({ quality: 82, progressive: true, mozjpeg: true })
  .toFile(path.join(OUT_DIR, 'hero-compressed.jpg'));

for (const f of ['hero.webp', 'hero-compressed.jpg']) {
  const kb = Math.round(fs.statSync(path.join(OUT_DIR, f)).size / 1024);
  console.log(`✓ ${f}  ${kb} KB`);
}
