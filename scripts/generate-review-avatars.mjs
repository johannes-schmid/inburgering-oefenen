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
 * Two routes, in this order: **OpenAI directly** (`OPEN_AI_API_KEY`, model `gpt-image-2`) and the
 * Vercel AI Gateway (`AI_GATEWAY_API_KEY`, `openai/gpt-image-2`). Same model either way, so the
 * route is a billing detail and not a content one. Direct is first because the gateway refuses
 * every request — BYOK included — without a positive credit balance of its own.
 */
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import sharp from 'sharp';

const GATEWAY = { url: 'https://ai-gateway.vercel.sh/v1/images/generations', model: 'openai/gpt-image-2', env: 'AI_GATEWAY_API_KEY' };
const OPENAI = { url: 'https://api.openai.com/v1/images/generations', model: 'gpt-image-2', env: 'OPEN_AI_API_KEY' };
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

async function key(name) {
  if (process.env[name]) return process.env[name];
  for (const f of ['.env.local', '.env.development.local', '.env']) {
    try {
      const m = (await readFile(f, 'utf8')).match(new RegExp(`^${name}=(.+)$`, 'm'));
      if (m) return m[1].trim().replace(/^["']|["']$/g, '');
    } catch { /* next file */ }
  }
  return null;
}

const route = await (async () => {
  for (const r of [OPENAI, GATEWAY]) {
    const apiKey = await key(r.env);
    if (apiKey) return { ...r, apiKey };
  }
  throw new Error(`no key: set ${OPENAI.env} or ${GATEWAY.env}`);
})();
console.log(`route: ${route.model} via ${new URL(route.url).host}`);
await mkdir(OUT, { recursive: true });

for (const [i, prompt] of BRIEFS.entries()) {
  const res = await fetch(route.url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${route.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: route.model, prompt, n: 1, size: '1024x1024' }),
  });
  if (!res.ok) throw new Error(`${route.model} ${res.status}: ${await res.text()}`);
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
