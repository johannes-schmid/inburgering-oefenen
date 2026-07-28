#!/usr/bin/env node
/**
 * Generates the listening audio for the free 10-question taster.
 *
 * Reads the `stimulusScript` of every Luisteren item in data/free-practice.ts and renders
 * the whole scene in a single ElevenLabs v3 text-to-dialogue call — one voice per speaker,
 * delivery tags per turn — then loudness-normalises it and writes one mp3 per item to
 * public/audio/free-practice/.
 *
 * The taster audio is committed as a static asset — it is top-of-funnel content that must
 * load for anonymous visitors without a DB or Storage round-trip. Paid exam audio goes to
 * the Supabase `question-audio` bucket instead (see app/api/generate-question-audio).
 *
 *   node scripts/generate-free-practice-audio.mjs           # only missing files
 *   node scripts/generate-free-practice-audio.mjs --force   # regenerate everything
 *   node scripts/generate-free-practice-audio.mjs lu-3      # one item
 *
 * Requires ELEVEN_LAPS_API_KEY in .env.local and ffmpeg on PATH.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public', 'audio', 'free-practice');

/* ── env ─────────────────────────────────────────────────────────────────── */
function readEnvLocal() {
  const file = path.join(ROOT, '.env.local');
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs.readFileSync(file, 'utf8')
      .split('\n')
      .filter(l => l.trim() && !l.trim().startsWith('#') && l.includes('='))
      .map(l => {
        const i = l.indexOf('=');
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
      })
  );
}

const env = { ...readEnvLocal(), ...process.env };
const API_KEY = env.ELEVEN_LAPS_API_KEY;
if (!API_KEY) {
  console.error('Missing ELEVEN_LAPS_API_KEY (looked in .env.local and the environment).');
  process.exit(1);
}

/* ── voices ──────────────────────────────────────────────────────────────── */
// IDs come from data/tts-voices.json — the single source of truth for every TTS surface.
const VOICE_LIBRARY = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'data', 'tts-voices.json'), 'utf8')
);

// Casting is per item, never a blanket "A = female, B = male": the voice has to match the
// speaker's gender as the script establishes it. Where the script names or addresses the
// speaker the casting is forced; where it leaves them open (a desk clerk, an announcer) the
// choice is ours, and we spread it so the ten items do not all sound like the same two
// people. Speaker A and B must always differ.
//
// The comment on each line records what forces the choice, so the next person editing an
// item knows whether they are free to recast it.
const CASTING = {
  'lu-1':  { A: 'woman_older', B: 'woman_young' },  // B = "Sara Yilmaz" → female. A open.
  'lu-2':  { A: 'woman_young', B: 'man_young'   },  // B = "Peter" → male. A open.
  'lu-3':  { A: 'woman_older', B: null          },  // shop announcement, one speaker. Open.
  'lu-4':  { A: 'woman_young', B: 'man_older'   },  // B = "Meneer El Amrani" → male. A = teacher, open.
  'lu-5':  { A: 'man_older',   B: 'woman_young' },  // library desk, both open.
  'lu-6':  { A: 'man_older',   B: null          },  // station announcement, one speaker. Open.
  'lu-7':  { A: 'man_young',   B: 'woman_older' },  // B = "mevrouw De Wit" → female. A open.
  'lu-8':  { A: 'woman_older', B: 'man_young'   },  // gemeente, both open.
  'lu-9':  { A: 'man_older',   B: 'woman_young' },  // A addresses B as "mevrouw" → B female. A open.
  'lu-10': { A: 'woman_older', B: 'man_young'   },  // B = "Youssef" → male. A open.
};

function castFor(itemId) {
  const cast = CASTING[itemId];
  if (!cast) {
    throw new Error(`No casting for ${itemId}. Add it to CASTING — a voice must be chosen ` +
      `deliberately per speaker, so the gender matches the script.`);
  }
  return cast;
}

function voiceIdFor(itemId, speaker) {
  const key = castFor(itemId)[speaker];
  if (!key) throw new Error(`${itemId}: speaker ${speaker} appears in the script but is not cast.`);
  const voice = VOICE_LIBRARY[key];
  if (!voice) throw new Error(`${itemId}: unknown voice key "${key}" in CASTING.`);
  return voice.id;
}
// Eleven v3 via /v1/text-to-dialogue: the whole scene is ONE generation, so the model times
// the turns itself. That is why there is no ffmpeg turn gap and no previous_text chaining
// here any more — both were per-call workarounds that v3 makes redundant.
const MODEL_ID = 'eleven_v3';
const DIALOGUE_ENDPOINT = 'https://api.elevenlabs.io/v1/text-to-dialogue';

// stability 0.5 = "Natural". Creative (0.0) is the most tag-responsive but ElevenLabs flags
// it as hallucination-prone, and a hallucinated "negen" → "tien" silently breaks a graded
// item. Robust (1.0) barely responds to the delivery tags at all.
const SETTINGS = { stability: 0.5, use_speaker_boost: true };

// v3 offers no pacing control: no `speed`, and it ignores <break time> tags outright (two
// renders differing only in breaks came back byte-identical). Delivery therefore lands near
// 150 wpm against the ~110 wpm the multilingual_v2 pipeline reached and DUO's 57% speech
// ratio. Accepted deliberately in exchange for natural conversational flow. If it proves too
// fast for A2 candidates, the only remaining lever is POST_ATEMPO below — a pitch-preserving
// ffmpeg time-stretch. Set it to e.g. 0.88 to slow the finished file; null leaves it alone.
const POST_ATEMPO = null;

// Measured off the official DUO listening audio: -20.5 LUFS integrated, very tight 3.7 LU
// range.
const LOUDNESS = { i: -20, tp: -2, lra: 4 };

// Per-turn delivery direction. Tags describe HOW a line is said — they are audio events, not
// words, and v3 does not read them aloud. Rules for editing these:
//   · No sound effects. Ambient noise under an exam stimulus competes with the thing the
//     candidate is being graded on.
//   · Tag goes at the START of a turn, so it colours the whole line instead of interrupting
//     mid-fact.
//   · Never tag around a time, day or name — those must land clean.
//   · Keep them neutral and professional. [interrupting] / [overlapping] are banned in exam
//     content: they attack comprehension, which is exactly what is being tested.
// Index = turn index within the item. Turns with no entry are read plain.
const DELIVERY = {
  'lu-1':  { 0: '[professional]', 2: '[helpful]', 3: '[reassuring]', 4: '[thoughtful]', 5: '[apologetic]', 7: '[pleased]' },
  'lu-2':  { 0: '[friendly]', 1: '[distracted]', 3: '[explaining]', 5: '[slightly frustrated]', 6: '[offering]', 7: '[grateful]' },
  'lu-3':  { 0: '[announcer]' },
  'lu-4':  { 0: '[warm]', 1: '[concerned]', 2: '[reassuring]', 3: '[relieved]', 4: '[thoughtful]', 5: '[asking]', 6: '[helpful]' },
  'lu-5':  { 0: '[helpful]', 1: '[asking]', 2: '[checking]', 4: '[apologetic]', 5: '[disappointed]', 6: '[helpful]' },
  'lu-6':  { 0: '[announcer]' },
  'lu-7':  { 0: '[friendly]', 1: '[curious]', 2: '[explaining]', 3: '[puzzled]', 4: '[explaining]', 5: '[understanding]', 6: '[reassuring]' },
  'lu-8':  { 0: '[professional]', 1: '[polite]', 2: '[helpful]', 3: '[apologetic]', 4: '[helpful]', 5: '[agreeing]', 6: '[reminding]' },
  'lu-9':  { 0: '[professional]', 1: '[uncertain]', 2: '[explaining]', 3: '[checking]', 4: '[emphatic]', 5: '[asking]', 6: '[serious]' },
  'lu-10': { 0: '[friendly]', 1: '[relaxed]', 2: '[regretful]', 3: '[thoughtful]', 4: '[agreeable]', 5: '[pleased]' },
};

/* ── item source ─────────────────────────────────────────────────────────── */
// data/free-practice.ts is TypeScript, so pull the fields out with a light parse rather
// than adding a build step to this one-off script.
function loadListeningItems() {
  const src = fs.readFileSync(path.join(ROOT, 'data', 'free-practice.ts'), 'utf8');
  const items = [];
  const idRe = /id: '(lu-[\w-]+)'/g;
  let m;
  while ((m = idRe.exec(src))) {
    const id = m[1];
    const after = src.slice(m.index);
    const scriptMatch = after.match(/stimulusScript: `([\s\S]*?)`/);
    if (!scriptMatch) {
      console.warn(`  ${id}: no stimulusScript found, skipping`);
      continue;
    }
    items.push({ id, script: scriptMatch[1] });
  }
  return items;
}

function parseLines(script) {
  return script
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => {
      const m = line.match(/^([AB]):\s*(.+)$/);
      if (!m) throw new Error(`Line is not prefixed with "A:" or "B:": ${line}`);
      return { speaker: m[1], text: m[2] };
    });
}

/* ── tts ─────────────────────────────────────────────────────────────────── */
// A stable seed per item, so regenerating one item reproduces its take rather than rolling a
// new one that no longer matches the rest of the set. Deterministic — never Math.random().
function seedFor(itemId) {
  let h = 2166136261;
  for (const ch of itemId) {
    h = (Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0);
  }
  return h % 4294967295;
}

// The v3 dialogue endpoint takes the whole scene at once: one input per turn, each with the
// voice it should be spoken in. Max 10 distinct voices and ~2000 characters per request —
// our longest item is well under both.
async function generateDialogue(itemId, lines) {
  const tags = DELIVERY[itemId] ?? {};
  const inputs = lines.map((line, i) => ({
    text: tags[i] ? `${tags[i]} ${line.text}` : line.text,
    voice_id: voiceIdFor(itemId, line.speaker),
  }));

  const chars = inputs.reduce((n, i) => n + i.text.length, 0);
  if (chars > 2000) {
    throw new Error(`${itemId}: ${chars} characters exceeds the 2000-character dialogue limit.`);
  }

  const res = await fetch(DIALOGUE_ENDPOINT, {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inputs,
      model_id: MODEL_ID,
      settings: SETTINGS,
      // Dutch prices, times and abbreviations (€9,95 / 8:30 / dhr. / t/m) are exactly where
      // "auto" guesses wrong.
      apply_text_normalization: 'on',
      seed: seedFor(itemId),
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return Buffer.from(await res.arrayBuffer());
}

// Two-pass loudnorm: pass 1 measures, pass 2 applies a linear gain. Single-pass loudnorm is
// dynamic and pumps on speech with long pauses — which is most of this material.
function normalizeLoudness(inPath, outPath) {
  // atempo is pitch-preserving, so it slows delivery without the slurring that resampling
  // (or the model's own `speed`) introduces. Off by default — see POST_ATEMPO.
  const filter = `${POST_ATEMPO ? `atempo=${POST_ATEMPO},` : ''}` +
    `loudnorm=I=${LOUDNESS.i}:TP=${LOUDNESS.tp}:LRA=${LOUDNESS.lra}`;
  // loudnorm prints its measurement to stderr, not stdout.
  const probe = spawnSync('ffmpeg', [
    '-hide_banner', '-i', inPath, '-af', `${filter}:print_format=json`, '-f', 'null', '-',
  ], { encoding: 'utf8' });
  const report = `${probe.stderr ?? ''}${probe.stdout ?? ''}`;
  const open = report.lastIndexOf('{');
  const close = report.lastIndexOf('}');
  if (open === -1 || close === -1) {
    throw new Error(`loudnorm measurement failed: ${report.slice(-300)}`);
  }
  const measured = JSON.parse(report.slice(open, close + 1));

  execFileSync('ffmpeg', [
    '-y', '-i', inPath,
    '-af', [
      filter,
      'linear=true',
      `measured_I=${measured.input_i}`,
      `measured_TP=${measured.input_tp}`,
      `measured_LRA=${measured.input_lra}`,
      `measured_thresh=${measured.input_thresh}`,
      `offset=${measured.target_offset}`,
    ].join(':'),
    '-c:a', 'libmp3lame', '-b:a', '128k', '-ar', '44100', '-ac', '1', outPath,
  ], { stdio: 'ignore' });
}

/* ── main ────────────────────────────────────────────────────────────────── */
const args = process.argv.slice(2);
const force = args.includes('--force');
const only = args.filter(a => !a.startsWith('--'));

fs.mkdirSync(OUT_DIR, { recursive: true });

const items = loadListeningItems().filter(it => (only.length ? only.includes(it.id) : true));
if (!items.length) {
  console.error('No matching listening items found.');
  process.exit(1);
}

console.log(`Generating audio for ${items.length} item(s) → public/audio/free-practice/\n`);

let generated = 0;
let skipped = 0;

for (const item of items) {
  const outPath = path.join(OUT_DIR, `${item.id}.mp3`);
  if (fs.existsSync(outPath) && !force) {
    console.log(`· ${item.id}  already exists, skipping (use --force to regenerate)`);
    skipped++;
    continue;
  }

  const lines = parseLines(item.script);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `fp-${item.id}-`));
  try {
    const raw = path.join(tmpDir, 'scene.mp3');
    fs.writeFileSync(raw, await generateDialogue(item.id, lines));
    normalizeLoudness(raw, outPath);

    const kb = Math.round(fs.statSync(outPath).size / 1024);
    const cast = castFor(item.id);
    const castLabel = [...new Set(lines.map(l => l.speaker))]
      .map(s => `${s}=${cast[s]}`).join(' ');
    const tagged = Object.keys(DELIVERY[item.id] ?? {}).length;
    console.log(`✓ ${item.id}  ${lines.length} turns (${tagged} tagged), ${kb} KB  [${castLabel}]`);
    generated++;
  } catch (err) {
    console.error(`✗ ${item.id}  ${err.message}`);
    process.exitCode = 1;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

console.log(`\nDone. ${generated} generated, ${skipped} skipped.`);
