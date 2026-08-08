/**
 * Shared plumbing for the A2 content scripts: env resolution, PostgREST, ElevenLabs, Storage.
 *
 * Extracted from `scripts/seed-test-exams.mjs`, which now imports it. Both scripts write the same
 * tables through the same transport, and the two copies had already started to matter: the seeder
 * grew a `--force-audio` cache and a loudnorm pass that the newer runner would otherwise have had
 * to re-derive from scratch.
 *
 * Everything here is a factory taking a resolved config, because the two callers differ in exactly
 * the ways that are dangerous to hardcode — which env file is authoritative, and whether an
 * existing audio object may be reused.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const AUDIO_BUCKET = 'question-audio';
export const IMAGE_BUCKET = 'question-images';

/* ── env ─────────────────────────────────────────────────────────────────── */

export function readEnvFile(file) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(p, 'utf8')
      .split('\n')
      .filter(l => /^[A-Z0-9_]+=/.test(l.trim()))
      .map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()])
  );
}

/**
 * `.env.development.local` points at 127.0.0.1 and takes precedence in dev by design (CLAUDE.md),
 * so targeting production means deliberately *not* reading it — `.env.local` is the hosted project.
 */
export function loadEnv({ production }) {
  return production
    ? readEnvFile('.env.local')
    : { ...readEnvFile('.env.local'), ...readEnvFile('.env.development.local') };
}

export function isLocalUrl(url) {
  return /^https?:\/\/(127\.0\.0\.1|localhost)[:/]/.test(url ?? '');
}

/* ── PostgREST ───────────────────────────────────────────────────────────── */
/**
 * Every write goes through PostgREST with the service key, for both the local stack and the hosted
 * project. `psql` is not installed on this host and the hosted database password is not in the
 * repo; one transport that works everywhere is worth more than the terser SQL.
 */
export function createDb({ supabaseUrl, serviceKey }) {
  const REST = `${supabaseUrl}/rest/v1`;
  const HEADERS = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };

  async function rest(pathname, init = {}) {
    const res = await fetch(`${REST}/${pathname}`, {
      ...init,
      headers: { ...HEADERS, ...init.headers },
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`${init.method ?? 'GET'} ${pathname} → ${res.status}: ${text.slice(0, 400)}`);
    }
    return text ? JSON.parse(text) : null;
  }

  /** Insert rows and return them, so callers get the generated ids. */
  async function insert(table, rows) {
    const body = Array.isArray(rows) ? rows : [rows];
    if (body.length === 0) return [];
    const out = await rest(table, {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(body),
    });
    return out ?? [];
  }

  async function insertOne(table, row) {
    const [out] = await insert(table, row);
    if (!out?.id) throw new Error(`${table}: insert returned no id`);
    return out.id;
  }

  const patch = (table, filter, values) =>
    rest(`${table}?${filter}`, { method: 'PATCH', body: JSON.stringify(values) });

  const remove = (table, filter) => rest(`${table}?${filter}`, { method: 'DELETE' });

  const selectRows = async (table, query) => (await rest(`${table}?${query}`)) ?? [];

  return { rest, insert, insertOne, patch, remove, selectRows };
}

/* ── storage ─────────────────────────────────────────────────────────────── */

export function createStorage({ supabaseUrl, serviceKey }) {
  function publicUrl(bucket, objectPath) {
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${objectPath}`;
  }

  /** Public URL of an already-uploaded object, or null. Used to make runs resumable. */
  async function existing(bucket, objectPath) {
    const url = publicUrl(bucket, objectPath);
    try {
      const res = await fetch(url, { method: 'HEAD' });
      return res.ok ? url : null;
    } catch {
      return null;
    }
  }

  async function upload(bucket, objectPath, buf, contentType) {
    const res = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${objectPath}`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': contentType,
        'x-upsert': 'true',
      },
      body: buf,
    });
    if (!res.ok) throw new Error(`upload ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return publicUrl(bucket, objectPath);
  }

  return { publicUrl, existing, upload };
}

/* ── audio ───────────────────────────────────────────────────────────────── */

export const VOICES = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'data', 'tts-voices.json'), 'utf8')
);
export const VOICE_KEYS = Object.keys(VOICES);

const DIALOGUE_ENDPOINT = 'https://api.elevenlabs.io/v1/text-to-dialogue';
const TTS_ENDPOINT = 'https://api.elevenlabs.io/v1/text-to-speech';
const LOUDNESS = { i: -20, tp: -2, lra: 4 };

export function haveFfmpeg() {
  return spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' }).status === 0;
}

/**
 * Two-pass loudnorm to −20 LUFS, measured off the official DUO audio. Skipped (returning the input
 * untouched) when ffmpeg is missing — a quieter file is better than no file, and `main` says so.
 */
export function loudnorm(buf) {
  if (!haveFfmpeg()) return buf;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'a2-audio-'));
  const src = path.join(dir, 'in.mp3');
  const out = path.join(dir, 'out.mp3');
  fs.writeFileSync(src, buf);
  try {
    const probe = spawnSync(
      'ffmpeg',
      [
        '-i', src,
        '-af', `loudnorm=I=${LOUDNESS.i}:TP=${LOUDNESS.tp}:LRA=${LOUDNESS.lra}:print_format=json`,
        '-f', 'null', '-',
      ],
      { encoding: 'utf8' }
    );
    const m = /\{[^{}]*"input_i"[\s\S]*?\}/.exec(probe.stderr || '');
    const stats = m ? JSON.parse(m[0]) : null;
    const filter = stats
      ? `loudnorm=I=${LOUDNESS.i}:TP=${LOUDNESS.tp}:LRA=${LOUDNESS.lra}:measured_I=${stats.input_i}:measured_TP=${stats.input_tp}:measured_LRA=${stats.input_lra}:measured_thresh=${stats.input_thresh}:offset=${stats.target_offset}:linear=true`
      : `loudnorm=I=${LOUDNESS.i}:TP=${LOUDNESS.tp}:LRA=${LOUDNESS.lra}`;
    execFileSync(
      'ffmpeg',
      ['-y', '-i', src, '-af', filter, '-c:a', 'libmp3lame', '-b:a', '128k', out],
      { stdio: 'ignore' }
    );
    return fs.readFileSync(out);
  } catch {
    return buf;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Duration of an MP3 by counting frame headers — the JS twin of `lib/mp3-duration.ts`.
 *
 * `stimuli.audio_seconds` is validated against `exam_formats.audio_seconds_min/_max`, and the
 * length is not recoverable from a URL later, so it has to be measured at write time.
 */
export function mp3DurationSeconds(buf) {
  const BITRATES_V1_L3 = [
    0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0,
  ];
  const BITRATES_V2_L3 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0];
  const RATES_V1 = [44100, 48000, 32000, 0];
  const RATES_V2 = [22050, 24000, 16000, 0];
  const RATES_V25 = [11025, 12000, 8000, 0];

  let i = 0;
  // Skip an ID3v2 tag; its size is a 4×7-bit synchsafe integer.
  if (buf.length > 10 && buf.toString('latin1', 0, 3) === 'ID3') {
    i = 10 + ((buf[6] & 0x7f) << 21 | (buf[7] & 0x7f) << 14 | (buf[8] & 0x7f) << 7 | (buf[9] & 0x7f));
  }

  let seconds = 0;
  while (i + 4 <= buf.length) {
    if (buf[i] !== 0xff || (buf[i + 1] & 0xe0) !== 0xe0) {
      i++;
      continue;
    }
    const versionBits = (buf[i + 1] >> 3) & 0x03; // 3 = MPEG1, 2 = MPEG2, 0 = MPEG2.5
    const layerBits = (buf[i + 1] >> 1) & 0x03; // 1 = Layer III
    const bitrateIdx = (buf[i + 2] >> 4) & 0x0f;
    const rateIdx = (buf[i + 2] >> 2) & 0x03;
    const padding = (buf[i + 2] >> 1) & 0x01;
    if (versionBits === 1 || layerBits !== 1 || bitrateIdx === 0 || bitrateIdx === 15 || rateIdx === 3) {
      i++;
      continue;
    }
    const isV1 = versionBits === 3;
    const bitrate = (isV1 ? BITRATES_V1_L3 : BITRATES_V2_L3)[bitrateIdx] * 1000;
    const sampleRate = (versionBits === 3 ? RATES_V1 : versionBits === 2 ? RATES_V2 : RATES_V25)[rateIdx];
    if (!bitrate || !sampleRate) {
      i++;
      continue;
    }
    const samples = isV1 ? 1152 : 576;
    const frameLength = Math.floor((samples / 8) * (bitrate / sampleRate)) + padding;
    if (frameLength < 4) {
      i++;
      continue;
    }
    seconds += samples / sampleRate;
    i += frameLength;
  }
  return seconds > 0 ? Math.round(seconds * 100) / 100 : null;
}

export function createTts({ apiKey }) {
  /**
   * A whole scene in one `/v1/text-to-dialogue` call, the way the taster pipeline does it.
   * `lines` is [[speaker, text], …]; `cast` maps every speaker tag to a key of tts-voices.json.
   */
  async function dialogueAudio(lines, cast) {
    const inputs = lines.map(([speaker, text]) => {
      const voiceKey = cast[speaker];
      // Refuse rather than guess: casting is a content decision the script forces, and it is not
      // recoverable from the mp3 afterwards.
      if (!voiceKey) throw new Error(`speaker "${speaker}" is not cast`);
      if (!VOICES[voiceKey]) throw new Error(`unknown voice key "${voiceKey}"`);
      return { text, voice_id: VOICES[voiceKey].id };
    });
    const res = await fetch(DIALOGUE_ENDPOINT, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputs,
        model_id: 'eleven_v3',
        settings: { stability: 0.5, use_speaker_boost: true },
        apply_text_normalization: 'on',
        seed: 20260731,
      }),
    });
    if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return loudnorm(Buffer.from(await res.arrayBuffer()));
  }

  /** Single narrator, for a spoken prompt. NARRATOR in lib/tts-voices.ts is woman_young. */
  async function narratorAudio(text, voiceKey = 'woman_young') {
    const res = await fetch(`${TTS_ENDPOINT}/${VOICES[voiceKey].id}`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.75,
          use_speaker_boost: true,
          speed: 0.9,
        },
        apply_text_normalization: 'on',
      }),
    });
    if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return loudnorm(Buffer.from(await res.arrayBuffer()));
  }

  return { dialogueAudio, narratorAudio };
}

/**
 * Validate a fragment's casting before spending a generation on it.
 *
 * The server twin is `validateCast()` in `lib/tts-dialogue.ts` and the rules are the same: every
 * speaker cast, every voice key known, and no two speakers sharing a voice — two characters in one
 * voice is an immediately audible content bug that no amount of listening back can repair.
 */
export function validateCast(lines, cast) {
  const speakers = [...new Set(lines.map(([s]) => s))];
  const problems = [];
  for (const s of speakers) {
    if (!cast?.[s]) problems.push(`speaker "${s}" is not cast`);
    else if (!VOICES[cast[s]]) problems.push(`speaker "${s}" has unknown voice "${cast[s]}"`);
  }
  if (speakers.length > 1) {
    const used = speakers.map(s => cast?.[s]).filter(Boolean);
    if (new Set(used).size !== used.length) problems.push('two speakers share one voice');
  }
  return problems;
}
