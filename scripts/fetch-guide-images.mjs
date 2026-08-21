/**
 * Fetches one hero photo per kennisgids from Pexels and writes it to public/images/guides/.
 *
 * Run once per new guide:  node scripts/fetch-guide-images.mjs [slug]
 * Needs PEXELS_API_KEY in .env.local. Attribution is appended to resources/images/CREDITS.md.
 *
 * Shaped after `fetch-blog-images.mjs`, with three deliberate differences:
 *
 *  - **The crop is 1800×760, not 1200×630.** A guide hero is full-bleed behind the H1, so it is
 *    stretched to the viewport width; an OG-shaped 1200px image visibly softens on a 1440 screen.
 *  - **`PICK` records which of the first few results was chosen**, because result 1 is regularly a
 *    close-up that has nothing left once the navy scrim covers the left 55%. The index is data, so
 *    a re-run cannot silently swap the picture under a page the docent has already checked — the
 *    same reason `scripts/a2-content/images.lock.json` exists.
 *  - **A `.webp` is written beside the `.jpg`.** The hero is the page's largest paint; the article
 *    body below it is text, so this is the one image on the page worth two encodes.
 *
 * The photo is only ever half visible: the scrim in `GuideArticle` runs opaque navy to clear from
 * left to right, exactly like the homepage hero. So the queries look for a subject that survives
 * being cropped to its right-hand side, and for something *specific* to the guide — a generic
 * "study" stock photo adds nothing.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT_DIR = path.join(ROOT, 'public/images/guides');
const CREDITS = path.join(ROOT, 'resources/images/CREDITS.md');

/** slug → [search query, which result to take (0-based)] */
const PICK = {
  /* Result 3, not 0: the first canal shots are dense brickwork and foliage edge to edge, which
     encodes past the 200 KB hero budget even at q56. This one is water and sky on the right. */
  'inburgering-stappenplan': ['amsterdam canal houses bicycle sunny', 3],
  'moet-ik-inburgeren': ['hands opening envelope letter table', 0],
  /* A fork in a path, not a signpost: every signpost result carried *readable words* — "TOILET /
     AFHAAL", "Victoria Lines Trail" — and a hero with legible text that means nothing to do with
     the article reads as a mistake. The blank sign beside the split path says the same thing and
     says nothing else. */
  'welke-wet-en-welke-route': ['forked path two ways forest', 1],
  /* Result 2: result 0 is a calculator shot cropped so tight that the hero shows four keys. A hero
     is 1800×760 of a 4000px photo, so a close-up subject arrives closer still. */
  'wat-kost-inburgeren': ['euro banknotes coins calculator desk', 2],
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
const sharp = (await import('sharp')).default;

for (const [slug, [query, index]] of Object.entries(PICK)) {
  if (only && slug !== only) continue;

  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=8&orientation=landscape`,
    { headers: { Authorization: KEY } },
  );
  if (!res.ok) throw new Error(`Pexels ${res.status} for "${query}": ${await res.text()}`);
  const { photos } = await res.json();
  const photo = photos?.[index];
  if (!photo) throw new Error(`No Pexels result ${index} for "${query}"`);

  const buf = Buffer.from(await (await fetch(photo.src.original + '?auto=compress&w=2400')).arrayBuffer());
  const jpg = path.join(OUT_DIR, `${slug}.jpg`);
  const webp = path.join(OUT_DIR, `${slug}.webp`);

  const kb = f => Math.round(Buffer.byteLength(readFileSync(f)) / 1024);

  /* Quality is stepped down until the file fits, rather than fixed: a busy photo (canal houses,
     bicycles, brickwork) encodes three to four times larger than a clean studio shot at the same
     quality, and this is the hero — a 400 KB LCP image undoes the preload it sits behind. The
     budget is 200 KB; the floor is q44, below which the sky bands visibly. Foliage-heavy heroes
     land near the ceiling even so — the alternative is a smaller image, and the hero is stretched
     to the full viewport width where softness shows. */
  const encode = async (dest, q) => {
    const img = sharp(buf).resize(1800, 760, { fit: 'cover', position: 'centre' });
    await (dest.endsWith('.webp') ? img.webp({ quality: q }) : img.jpeg({ quality: q, mozjpeg: true }))
      .toFile(dest);
  };
  for (const dest of [jpg, webp]) {
    let q = 74;
    await encode(dest, q);
    while (kb(dest) > 200 && q > 44) { q -= 6; await encode(dest, q); }
    if (kb(dest) > 200) console.log(`  ! ${path.basename(dest)} is ${kb(dest)} KB at q${q}`);
  }

  /* WebP is not automatically smaller. On a foliage-dense photo (fir trees, canal brickwork) it
     came back 30–50% *larger* than mozjpeg at the same visual quality, so serving it through the
     `<source>` would cost the reader bandwidth to look at the same picture. If it loses, it is
     deleted and the guide sets `hasWebp: false` — the `<picture>` then has one candidate. */
  let webpKept = true;
  if (kb(webp) >= kb(jpg)) {
    rmSync(webp);
    webpKept = false;
  }
  console.log(
    `${slug}  jpg ${kb(jpg)} KB${webpKept ? ` / webp ${kb(webp)} KB` : '  (webp dropped: bigger than the jpg → hasWebp: false)'}` +
    `  ← ${photo.photographer} — ${photo.url}`,
  );

  /* The credit line is *replaced*, not appended. Re-running this script while choosing a photo is
     the normal case, and an append-only credits file then ends up naming three photographers for
     one file — which is worse than no attribution, because it is confidently wrong. */
  if (existsSync(CREDITS)) {
    const line = `- \`public/images/guides/${slug}.${webpKept ? '{jpg,webp}' : 'jpg'}\` — Photo by ${photo.photographer} on Pexels (${photo.url})`;
    const doc = readFileSync(CREDITS, 'utf8');
    const re = new RegExp(`^- \`public/images/guides/${slug}\\..*$`, 'm');
    writeFileSync(CREDITS, re.test(doc) ? doc.replace(re, line) : `${doc.replace(/\n+$/, '')}\n${line}\n`);
  }
}
