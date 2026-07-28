/**
 * Fetches one hero image per blog post from Pexels and writes it to public/images/blog/.
 *
 * Run once per new post:  node scripts/fetch-blog-images.mjs [slug]
 * Needs PEXELS_API_KEY in .env.local. Attribution is appended to resources/images/CREDITS.md.
 *
 * Images are committed rather than hotlinked: next.config.ts declares no images.remotePatterns,
 * and an external hero would be a render-blocking third-party request on an SEO page.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, appendFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT_DIR = path.join(ROOT, 'public/images/blog');
const CREDITS = path.join(ROOT, 'resources/images/CREDITS.md');

// One search query per post slug. Chosen to match the article's subject, not just its keyword —
// a generic "study" stock photo adds nothing.
const QUERIES = {
  'inburgeringsexamen-a2-uitleg': 'woman studying language books table',
  'lezen-examen-inburgering-a2': 'person reading document laptop desk',
  'luisteren-examen-inburgering-a2': 'person wearing headphones laptop listening',
  'inburgeringsexamen-zakken-herkansen': 'person reading letter kitchen table',
  'taalniveaus-a1-a2-b1-nederlands': 'teacher explaining whiteboard adult student',
};

function apiKey() {
  const env = readFileSync(path.join(ROOT, '.env.local'), 'utf8');
  const m = env.match(/^PEXELS_API_KEY=(.+)$/m);
  if (!m) throw new Error('PEXELS_API_KEY not found in .env.local');
  return m[1].trim();
}

const KEY = apiKey();
const only = process.argv[2];
mkdirSync(OUT_DIR, { recursive: true });

for (const [slug, query] of Object.entries(QUERIES)) {
  if (only && slug !== only) continue;
  const dest = path.join(OUT_DIR, `${slug}.jpg`);

  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
    { headers: { Authorization: KEY } },
  );
  if (!res.ok) throw new Error(`Pexels ${res.status} for "${query}": ${await res.text()}`);
  const { photos } = await res.json();
  if (!photos?.length) throw new Error(`No Pexels result for "${query}"`);

  const photo = photos[0];
  const buf = Buffer.from(await (await fetch(photo.src.large2x ?? photo.src.large)).arrayBuffer());
  writeFileSync(dest, buf);

  // Resize + recompress to a 1200x630 OG-shaped hero, target < 150 KB.
  const sharp = (await import('sharp')).default;
  await sharp(buf)
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 76, mozjpeg: true })
    .toFile(dest);

  const kb = Math.round(Buffer.byteLength(readFileSync(dest)) / 1024);
  console.log(`${slug}.jpg  ${kb} KB  ${kb < 150 ? 'OK' : 'TOO BIG — lower quality'}  ← ${photo.photographer}`);

  if (existsSync(CREDITS)) {
    appendFileSync(CREDITS, `\n- \`public/images/blog/${slug}.jpg\` — Photo by ${photo.photographer} on Pexels (${photo.url})\n`);
  }
}
