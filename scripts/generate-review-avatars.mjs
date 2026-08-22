/**
 * The three placeholder avatars on the homepage's social-proof section.
 *
 * `node scripts/generate-review-avatars.mjs` writes public/images/reviews/placeholder-{1,2,3}.webp.
 *
 * **These are pictures of nobody, and the section they sit in says so.** The product has no
 * customers yet; `CLAUDE.md` forbids shipping invented social proof, and the quotes beside these
 * faces are literal placeholders reading "vervang met een echte reactie". When the docent brings
 * back real reactions, the avatars are replaced with real photos (with permission) and **this
 * script is deleted** — it must never become the thing that supplies faces for real quotes.
 *
 * Routed through the Vercel AI Gateway (`AI_GATEWAY_API_KEY`), the same way the B1 authoring run
 * is, so there is no second image key to hold. Model: openai/gpt-image-2.
 */
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import sharp from 'sharp';

const MODEL = 'openai/gpt-image-2';
const OUT = 'public/images/reviews';
const SIZE = 256;

/* Three adults of the age and background this product actually serves — gezinsmigranten sitting
   the inburgeringsexamen — photographed plainly. No stock-photo grin, no office backdrop, nothing
   that reads as a testimonial-page cliché: a placeholder that flatters is harder to replace. */
const BRIEFS = [
  'A natural, warm head-and-shoulders portrait photograph of a woman in her early thirties with light brown skin and dark hair tied back, wearing a simple dark green top, calm neutral expression with a faint smile, looking at the camera, soft even daylight, plain very light grey studio background, shallow depth of field, documentary photography, no text.',
  'A natural, warm head-and-shoulders portrait photograph of a man in his forties with medium brown skin, short black hair and a short beard, wearing a plain navy shirt, calm neutral expression, looking at the camera, soft even daylight, plain very light grey studio background, shallow depth of field, documentary photography, no text.',
  'A natural, warm head-and-shoulders portrait photograph of a woman in her late twenties with dark skin and short curly black hair, wearing a plain rust-coloured blouse, calm neutral expression with a faint smile, looking at the camera, soft even daylight, plain very light grey studio background, shallow depth of field, documentary photography, no text.',
];

async function key() {
  for (const f of ['.env.local', '.env.development.local', '.env']) {
    try {
      const m = (await readFile(f, 'utf8')).match(/^AI_GATEWAY_API_KEY=(.+)$/m);
      if (m) return m[1].trim().replace(/^["']|["']$/g, '');
    } catch { /* next file */ }
  }
  throw new Error('AI_GATEWAY_API_KEY not found in .env.local / .env.development.local / .env');
}

const apiKey = process.env.AI_GATEWAY_API_KEY || await key();
await mkdir(OUT, { recursive: true });

for (const [i, prompt] of BRIEFS.entries()) {
  const res = await fetch('https://ai-gateway.vercel.sh/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, prompt, n: 1, size: '1024x1024' }),
  });
  if (!res.ok) throw new Error(`${MODEL} ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error(`no image in response: ${JSON.stringify(json).slice(0, 400)}`);

  /* 256px square: these are drawn at 40–48px and never larger, so anything bigger is bytes on the
     homepage's critical path for a face nobody will look at twice. */
  const out = `${OUT}/placeholder-${i + 1}.webp`;
  await writeFile(out, await sharp(Buffer.from(b64, 'base64'))
    .resize(SIZE, SIZE, { fit: 'cover', position: 'top' })
    .webp({ quality: 80 })
    .toBuffer());
  console.log(`wrote ${out}`);
}
