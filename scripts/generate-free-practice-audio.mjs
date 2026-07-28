#!/usr/bin/env node
/**
 * Generates the listening audio for the free 10-question taster.
 *
 * Reads the `stimulusScript` of every Luisteren item in data/free-practice.ts, renders
 * each speaker line with its own ElevenLabs voice, stitches the lines together with a
 * short pause, and writes one mp3 per item to public/audio/free-practice/.
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
import { execFileSync } from 'node:child_process';

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
// Speaker A is the one who opens the conversation (receptionist, colleague, announcer);
// speaker B is the candidate's counterpart. Two distinct voices so the dialogue is
// followable, which is exactly what the real DUO listening exam tests.
const VOICES = {
  A: 'S2OWP8siwXK4AZRAs2ec',  // female, the voice already used across the platform
  B: 'cjVigY5qzO86Huf0OWal',  // Eric — male, smooth
};
const MODEL_ID = 'eleven_flash_v2_5';
const VOICE_SETTINGS = { stability: 1.0, similarity_boost: 1.0, speed: 0.88 };
const GAP_SECONDS = 0.45;

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
async function tts(text, voiceId) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      language_code: 'nl',
      voice_settings: VOICE_SETTINGS,
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return Buffer.from(await res.arrayBuffer());
}

function stitch(partPaths, outPath, tmpDir) {
  // A silent spacer between turns, so the two speakers do not run into each other.
  const silence = path.join(tmpDir, 'gap.mp3');
  execFileSync('ffmpeg', [
    '-y', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono',
    '-t', String(GAP_SECONDS), '-q:a', '9', silence,
  ], { stdio: 'ignore' });

  const listFile = path.join(tmpDir, 'concat.txt');
  const withGaps = partPaths.flatMap((p, i) => (i === 0 ? [p] : [silence, p]));
  fs.writeFileSync(listFile, withGaps.map(p => `file '${p.replace(/'/g, "'\\''")}'`).join('\n'));

  execFileSync('ffmpeg', [
    '-y', '-f', 'concat', '-safe', '0', '-i', listFile,
    '-c:a', 'libmp3lame', '-q:a', '4', outPath,
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
    const parts = [];
    for (const [i, line] of lines.entries()) {
      const buf = await tts(line.text, VOICES[line.speaker]);
      const partPath = path.join(tmpDir, `${String(i).padStart(2, '0')}.mp3`);
      fs.writeFileSync(partPath, buf);
      parts.push(partPath);
    }
    stitch(parts, outPath, tmpDir);
    const kb = Math.round(fs.statSync(outPath).size / 1024);
    console.log(`✓ ${item.id}  ${lines.length} turns, ${kb} KB`);
    generated++;
  } catch (err) {
    console.error(`✗ ${item.id}  ${err.message}`);
    process.exitCode = 1;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

console.log(`\nDone. ${generated} generated, ${skipped} skipped.`);
