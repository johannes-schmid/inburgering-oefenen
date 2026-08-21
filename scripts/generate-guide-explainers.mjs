#!/usr/bin/env node
/**
 * Explainer diagrams for the kennisgidsen, via OpenAI `gpt-image-2`.
 *
 * ```
 * node scripts/generate-guide-explainers.mjs --list
 * node scripts/generate-guide-explainers.mjs wat-is-inburgeren
 * node scripts/generate-guide-explainers.mjs all
 * ```
 *
 * ## The prompt is the provenance, which is why it lives in git
 * These are the only images on the site that cannot be re-found — a Pexels photo has an id and a
 * URL, a generated one has nothing but the words that made it. `scripts/fetch-guide-images.mjs`
 * records *which* Pexels result was picked so a re-run cannot silently swap a photo under a page
 * the docent already approved; this file is the same discipline for generated art. Without it,
 * adding a fourth diagram in six months means guessing at the house style and getting a set that
 * no longer matches.
 *
 * Output is **not** deterministic — `gpt-image-2` has no seed parameter — so a re-run produces a
 * different drawing from the same prompt. Treat a regeneration as new artwork needing a look, not
 * as a rebuild. Files are written to a scratch directory and copied into `public/images/guides/`
 * by hand for exactly that reason.
 *
 * ## Every diagram is generated text-free, and that is not a style choice
 * A guide ships in nl/en/ar and the Arabic one renders RTL. Text drawn into a raster cannot be
 * translated, cannot mirror, is invisible to a screen reader and cannot be selected. The labels
 * are therefore HTML — `figure()` / `figureSplit()` in `data/guides/kit.ts`. The STYLE block
 * below states that as a prohibition because the model will otherwise add signage unasked.
 *
 * ## Two findings worth keeping
 *  - **State the forbidden as well as the wanted.** The first "brief" attempt came back with solid
 *    fills, 3D pedestals and drop shadows — plausible on its own, obviously a different product
 *    beside the other two. Naming `FORBIDDEN` explicitly fixed it in one retry.
 *  - **WebP is several times *smaller* than PNG here**, the reverse of the photo heroes (see
 *    `GuideHeroImage.hasWebp`). Flat line art is what WebP is good at. Never ship these as JPEG:
 *    it rings along every stroke.
 */
import fs from 'node:fs';
import path from 'node:path';

const OUT = process.env.EXPLAINER_OUT || 'temporary_screenshots/explainers';

/* Read the key off .env.local by hand. `source .env.local` does not survive this file — one of
   the values there breaks shell parsing — so every script that needs it greps its own line. */
function key() {
  const k = process.env.OPEN_AI_API_KEY || process.env.OPENAI_API_KEY;
  if (k) return k;
  const m = fs.readFileSync('.env.local', 'utf8').match(/^OPEN_?AI_API_KEY=(.+)$/m);
  if (!m) throw new Error('No OPEN_AI_API_KEY in the environment or .env.local');
  return m[1].trim().replace(/^["']|["']$/g, '');
}

/** The house style. Identical for every figure — this is what makes the set read as one set. */
const STYLE = `
STYLE — follow exactly:
Flat vector line diagram, editorial infographic. Calm and instructional.
Strict palette, nothing else: navy #002b6d for all strokes, bright orange #fe762c for exactly one
accent element, light grey #c4c6d2 for connecting lines and for anything muted or inactive,
off-white #f8f9fb background.
Uniform thin strokes with rounded caps and joins, like the Lucide icon set. Consistent stroke
weight across every element. Generous white space, balanced composition, wide margins.
Simple geometric human figures where needed: no faces, no skin tones, silhouettes only.
FORBIDDEN: gradients, drop shadows, cast shadows, 3D perspective, isometric views, elliptical
platforms or pedestals under elements, texture, glow, photorealism.
ABSOLUTELY NO TEXT: no letters, words, numbers, dates, labels, captions or signage anywhere in
the image — not on documents, buildings or signs. Any document must show blank or abstract
line-squiggle content only.
`.trim();

const FIGURES = {
  /* → `moet-ik-inburgeren`, under "Wat is inburgeren?". Two inputs, one diploma, one door. */
  'wat-is-inburgeren': {
    file: 'explainer-wat-is-inburgeren',
    size: '1536x1024',
    prompt: `A diagram of two inputs combining into one outcome, left to right.
Two rounded rectangular panels on the left, stacked vertically, outlined in navy: the TOP contains
two overlapping speech-bubble shapes; the BOTTOM contains a classical civic building with a
triangular pediment and four columns.
From each panel a thin grey line curves rightward and the two merge into one line, leading to a
certificate document with a rosette seal — document in navy, rosette in bright orange.
From the document one short grey arrow points to a door standing slightly ajar, in navy.`,
  },

  /* → `moet-ik-inburgeren`, under "Hoe weet ik of het voor mij geldt?". The point of the picture
     is that the reader applies for nothing: it arrives. */
  'duo-stuurt-brief': {
    file: 'explainer-duo-stuurt-brief',
    size: '1536x1024',
    prompt: `A three-step horizontal flow diagram, evenly spaced, connected by two thin light-grey
arrows pointing rightward. Everything drawn as OUTLINES ONLY, no filled shapes.
STEP 1: a municipal building — triangular pediment above four slim columns on a base, with a small
flag on a thin pole above it.
STEP 2: three stacked rounded horizontal slabs suggesting a register, with a magnifying glass
overlapping the lower-right corner.
STEP 3: a house — square body, triangular roof, one window, one door — with a closed envelope in
BRIGHT ORANGE OUTLINE beside it, tilted toward the house, two short grey motion arcs behind it.
The envelope is the only orange element. No platforms or ground shapes; the steps float, vertically
centred, filling the frame horizontally with small side margins.`,
  },

  /* → `moet-ik-inburgeren`, under "Welke wet geldt voor jou?". The whole section turns on one
     date, and a two-column table cannot show a split in time the way a line through one can.
     Crop this one to a horizontal band: the divider is drawn full-height, so `trim` finds ink at
     the top and bottom edges and leaves the drawing floating in a 4:3 box. */
  'twee-wetten': {
    file: 'explainer-twee-wetten',
    size: '1536x1024',
    crop: 'band',
    prompt: `A horizontal timeline split into two halves by one strong vertical dividing line in
bright orange running top to bottom through the centre.
LEFT half, entirely in muted soft grey: three simple human figures walking rightward, and above
them a thin grey horizontal arrow.
RIGHT half, in navy: five simple human figures walking rightward, and above them a slightly
thicker navy horizontal arrow.
A small orange circular marker sits where the divider crosses the horizontal timeline axis.
The image must read instantly as "before this line" versus "after this line".`,
  },

  /* → `welke-wet-en-welke-route`, under "De drie leerroutes". The table gives each route's rules;
     what it cannot show is that these are three *alternatives* reaching three different
     destinations from one shared starting point. That is a shape, so it is a picture. */
  'drie-routes': {
    file: 'explainer-drie-routes',
    size: '1536x1024',
    prompt: `A diagram of one starting point branching into three separate parallel paths, left to
right, each path ending in a different destination. Outlines only, no filled shapes.
On the far LEFT, one small navy circle: the shared start.
From it three thin lines fan out and then run horizontally as three evenly spaced parallel tracks.
TOP track ends in an open book.
MIDDLE track ends in a classical school building with a triangular pediment and columns.
BOTTOM track ends in three small human figures standing together in a group.
The TOP track's line is bright orange for its whole length; the other two tracks are light grey.
All three destination icons are navy outlines.
Leave a clear empty margin on all four sides — no element may touch or cross the frame edge.
The three tracks are clearly separate and never cross. Vertically centred, wide side margins.`,
  },

  /* → `welke-wet-en-welke-route`, under "Afschalen van B1 naar A2". A one-way move through a
     condition. The `yesno-grid` lists the conditions; the picture carries the direction, which is
     the thing readers get wrong — they ask whether they can go back up.
     NOT a band crop: nothing here runs full height, so `trim` finds the real bounding box. Taking
     a band instead cut the standing figure's head off. */
  'afschalen': {
    file: 'explainer-afschalen',
    size: '1536x1024',
    prompt: `A diagram of a one-way downward step, read left to right.
On the LEFT, a short horizontal navy platform line at a HIGH position.
On the RIGHT, a short horizontal navy platform line at a LOWER position, roughly one third of the
frame height below the left one.
Between them, one thick bright orange arrow curving downward from the end of the high line to the
start of the low line, arrowhead clearly pointing to the lower right.
Sitting on the orange arrow's midpoint, a closed padlock in navy outline, small.
Above the high platform, a single simple human figure standing. Above the low platform, the same
figure standing.
There is NO second arrow and no arrow pointing back upward or leftward — the movement is strictly
one way. No steps, no staircase, no ground, no platforms other than the two horizontal lines.`,
  },

  /* → `inburgering-stappenplan`, step 2/3. Three separate things the gemeente does converge into
     one document. A vertical list of steps reads as "then, then, then"; this is the one place in
     the journey where several inputs produce a single artefact, and the funnel says so. */
  'intake-naar-pip': {
    file: 'explainer-intake-naar-pip',
    size: '1536x1024',
    prompt: `A converging diagram: three inputs on the left merging into one output on the right.
Outlines only, no filled shapes, everything navy except one orange element.
LEFT column, three items stacked vertically and evenly spaced:
  TOP — two simple human figures facing each other across a small round table.
  MIDDLE — a rectangular sheet with a pencil lying diagonally across it.
  BOTTOM — a simple house outline beside a single small human figure.
From each item a thin light-grey line curves rightward; the three lines converge smoothly into one
single line at the centre-right.
That line ends at ONE upright document with a folded corner and three abstract squiggle lines of
writing on it, drawn in BRIGHT ORANGE outline — the only orange element in the image.
The convergence must be unmistakable: three in, one out.`,
  },

  /* → `inburgering-stappenplan`, under the examens. What people miss is that the diploma is a
     *set* of separate results collected together, not one big test — so the picture is a
     collection assembling into one object. */
  'wat-moet-je-halen': {
    file: 'explainer-wat-moet-je-halen',
    size: '1536x1024',
    prompt: `A diagram of several separate small items collecting into one single larger item.
Outlines only, no filled shapes.
On the LEFT, six small rounded squares arranged in a neat two-row, three-column grid, each
containing one simple pictogram, all navy: an open book; a pair of headphones; a pencil; a speech
bubble; a classical building with a triangular pediment; two clasped hands.
From the grid, thin light-grey lines gather rightward into one point.
On the RIGHT, one certificate document with a rosette seal at its lower corner — the document in
navy outline, the rosette in BRIGHT ORANGE, the only orange element.
The certificate is noticeably larger than the small squares. Vertically centred, wide margins.`,
  },

  /* → `wat-kost-inburgeren`, under "Kun je niet komen? Zeg op tijd af". The only diagram this
     guide gets, and deliberately so: a text-free picture cannot show a price, so every other
     claim on that page belongs in the `price-list`, where it stays translatable and selectable.
     This one is not a price — it is a *deadline*, which is a shape. Band-cropped like the other
     timeline: the divider runs full height, so `trim` finds ink at both edges. */
  'afzeggen-week': {
    file: 'explainer-afzeggen-week',
    size: '1536x1024',
    crop: 'band',
    prompt: `A horizontal timeline diagram showing a deadline before an event.
One long thin horizontal navy line spans the frame, with a small navy arrowhead at its right end.
Near the RIGHT end of the line, a calendar page pictogram in navy outline — a rectangle with a
small binding strip and two rings along its top edge, its interior blank — sitting ON the line.
Clearly to the LEFT of the calendar, at about two thirds along the line, one strong BRIGHT ORANGE
vertical dividing line crosses the timeline from top to bottom.
The segment of the timeline to the LEFT of the orange divider is drawn as a solid navy line.
The segment BETWEEN the orange divider and the calendar is drawn as a dashed light-grey line.
Above the left segment, a check mark in navy. Above the dashed segment, a cross in muted grey.
No other elements. The image must read as "up to this line, fine; after this line, not".`,
  },

};

async function generate(name) {
  const f = FIGURES[name];
  if (!f) throw new Error(`Unknown figure "${name}". Try --list.`);
  fs.mkdirSync(OUT, { recursive: true });
  const t0 = Date.now();
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-image-2',
      prompt: `${f.prompt}\n\n${STYLE}`,
      size: f.size,
      quality: 'high',
      n: 1,
    }),
  });
  if (!res.ok) {
    console.error(`✗ ${name}: HTTP ${res.status}\n${(await res.text()).slice(0, 500)}`);
    process.exitCode = 1;
    return;
  }
  const d = await res.json();
  const b64 = d.data?.[0]?.b64_json;
  if (!b64) { console.error(`✗ ${name}: no image in the response`); process.exitCode = 1; return; }
  const dest = path.join(OUT, `${f.file}.png`);
  fs.writeFileSync(dest, Buffer.from(b64, 'base64'));
  console.log(
    `✓ ${name} → ${dest}  ${Math.round(fs.statSync(dest).size / 1024)} KB  ` +
    `${Math.round((Date.now() - t0) / 1000)}s${f.crop === 'band' ? '  (crop to a band before use)' : ''}`,
  );
  console.log(`  then: trim → pad → resize 1400 → .webp q90 + .png palette:64 → public/images/guides/`);
}

const args = process.argv.slice(2);
if (!args.length || args[0] === '--list') {
  console.log('Figures:');
  for (const [k, v] of Object.entries(FIGURES)) console.log(`  ${k.padEnd(20)} → ${v.file}`);
  console.log('\nEach run produces NEW artwork — gpt-image-2 has no seed. Look at what comes back.');
} else {
  const names = args[0] === 'all' ? Object.keys(FIGURES) : args;
  for (const n of names) await generate(n);
}
