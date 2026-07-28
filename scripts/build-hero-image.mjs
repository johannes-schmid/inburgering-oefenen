#!/usr/bin/env node
/**
 * Builds the homepage hero assets from the full-resolution source in
 * resources/images/ into public/images/.
 *
 *   node scripts/build-hero-image.mjs
 *
 * The source is a portrait shot; the hero is a wide band, so we crop a landscape window
 * rather than squashing it. The crop is expressed as a fraction of the source height so it
 * survives a different source resolution.
 *
 * Two outputs, both consumed by the <picture> in app/[locale]/(main)/page.tsx:
 *   hero.webp            — what modern browsers actually load
 *   hero-compressed.jpg  — <img> fallback
 */
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'resources', 'images', 'hero-source.jpg');
const OUT_DIR = path.join(ROOT, 'public', 'images');

// Output geometry — 4:3 rather than a wide 3:2. The hero renders this with
// `object-fit: cover`, so a taller frame gives CSS room to reframe per viewport instead of
// baking one wide crop in. At 3:2 the source is too short to hold both the flag and the
// gable inscription, and the bottom edge lands mid-word on "JULI 1945".
const OUT_WIDTH = 1600;
const OUT_HEIGHT = 1200;

// Where to take the window from, as a fraction of source height. 0.13 keeps the flag near
// the top of frame and the full "HET VERGULDE DUIFKE / JULI 1945" gable inside the bottom.
const CROP_TOP_FRACTION = 0.13;

if (!fs.existsSync(SRC)) {
  console.error(`Missing source image: ${SRC}`);
  process.exit(1);
}

const meta = await sharp(SRC).metadata();
const srcW = meta.width;
const srcH = meta.height;
console.log(`source: ${srcW}×${srcH}`);

// Full source width, height derived from the target aspect ratio.
const cropW = srcW;
const cropH = Math.round(cropW * (OUT_HEIGHT / OUT_WIDTH));
const cropTop = Math.min(Math.round(srcH * CROP_TOP_FRACTION), Math.max(0, srcH - cropH));

if (cropH > srcH) {
  console.error(`Source is too short to crop ${OUT_WIDTH}:${OUT_HEIGHT} at full width.`);
  process.exit(1);
}
console.log(`crop: ${cropW}×${cropH} at y=${cropTop}`);

const base = sharp(SRC)
  .extract({ left: 0, top: cropTop, width: cropW, height: cropH })
  .resize(OUT_WIDTH, OUT_HEIGHT, { fit: 'cover' });

await base.clone().webp({ quality: 82 }).toFile(path.join(OUT_DIR, 'hero.webp'));
await base.clone().jpeg({ quality: 82, progressive: true, mozjpeg: true })
  .toFile(path.join(OUT_DIR, 'hero-compressed.jpg'));

for (const f of ['hero.webp', 'hero-compressed.jpg']) {
  const kb = Math.round(fs.statSync(path.join(OUT_DIR, f)).size / 1024);
  console.log(`✓ ${f}  ${kb} KB`);
}
