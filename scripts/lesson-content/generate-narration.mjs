/**
 * Spreekt de uitleg van één les in, en zet hem in Storage.
 *
 * Een script en niet de bestaande route: `/api/admin/generate-lesson-audio` heeft **geen
 * admin-guard** (zie CLAUDE.md §12) en spendeert ElevenLabs-credits, dus die gebruiken zou het
 * gat vergroten in plaats van het te omzeilen. Dit loopt lokaal met de service key, zoals elk
 * ander contentscript hier.
 *
 *   node scripts/lesson-content/generate-narration.mjs b1-hoofdzin-woordorde
 *   node scripts/lesson-content/generate-narration.mjs b1-hoofdzin-woordorde --production
 *   node scripts/lesson-content/generate-narration.mjs b1-hoofdzin-woordorde --dry
 *
 * Het script staat als `.txt` naast dit bestand, in `narration/<slug>.txt`. Dat is bewust een
 * bestand in de repo en geen prompt: de docent moet kúnnen nakijken wát er gezegd wordt, en een
 * diff op een tekstbestand is de enige vorm waarin dat nakijken herhaalbaar is.
 *
 * **De rij wordt altijd `pending` geschreven.** De narratie is lescontent, en lescontent gaat
 * niet zonder de docent langs de reviewgate. De speler zegt het tot zij het omzet.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDb, createStorage, loadEnv, VOICES } from '../a2-content/lib.mjs';
import { parseScript, timeCues, wordTimes } from './narration-script.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

/* De stem staat in `data/tts-voices.json` en `lib.mjs` leest hem al; hier alleen de sleutel.
   Nooit een id hardcoderen — dat is de regel, en dit is de tweede plek waar hij zou landen. */
const VOICE_KEY = 'woman_older';

/* multilingual_v2 en niet flash: dit wordt één keer gegenereerd en daarna uit Storage gespeeld,
   dus er is geen latency-budget om kwaliteit tegen weg te ruilen. Snelheid op 0.92 — een uitleg
   die je voor het eerst hoort mag langzamer dan een voorgelezen vraag. */
const MODEL_ID = 'eleven_multilingual_v2';
const VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.75,
  use_speaker_boost: true,
  speed: 0.92,
};
const BUCKET = 'leren-audio';

const args = process.argv.slice(2);
const slug = args.find(a => !a.startsWith('--'));
const production = args.includes('--production');
const dry = args.includes('--dry');

if (!slug) {
  console.error('Geef de lesslug mee, bijv. b1-hoofdzin-woordorde');
  process.exit(1);
}

const env = loadEnv({ production });
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_KEY;
const apiKey = env.ELEVEN_LAPS_API_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL en SUPABASE_SERVICE_KEY ontbreken');
  process.exit(1);
}
if (!apiKey && !dry) {
  console.error('ELEVEN_LAPS_API_KEY ontbreekt — staat in .env.local, niet in .env.development.local');
  process.exit(1);
}

const voice = VOICES[VOICE_KEY];
if (!voice) {
  console.error(`Onbekende stem "${VOICE_KEY}" in data/tts-voices.json`);
  process.exit(1);
}

const raw = readFileSync(join(HERE, 'narration', `${slug}.txt`), 'utf8');
const { text: script, cues: parsedCues } = parseScript(raw);
if (!script) {
  console.error(`narration/${slug}.txt levert geen tekst op`);
  process.exit(1);
}

const db = createDb({ supabaseUrl, serviceKey });
const storage = createStorage({ supabaseUrl, serviceKey });

/* ── 1. De les opzoeken ──────────────────────────────────────────────────── */
const lessons = await db.selectRows('lessons', `slug=eq.${slug}&select=id,title`);
if (lessons.length !== 1) {
  console.error(`Verwachtte één les met slug "${slug}", vond ${lessons.length}`);
  process.exit(1);
}
const lesson = lessons[0];

console.log(`Les ${lesson.id} — ${lesson.title}`);
console.log(`Stem: ${voice.name} (${voice.id})`);
console.log(`Script: ${script.split(/\s+/).length} woorden, ${script.length} tekens`);
console.log(`Cues:   ${parsedCues.length} — ${parsedCues.map(c => c.id).join(', ')}`);
const withoutNote = parsedCues.filter(c => !c.note && c.id !== 'exercises');
if (withoutNote.length > 0) {
  console.log(`        zonder extra uitleg: ${withoutNote.map(c => c.id).join(', ')}`);
}

if (dry) {
  console.log('\n--dry: niets gegenereerd, niets geschreven.');
  process.exit(0);
}

/* ── 2. Inspreken ────────────────────────────────────────────────────────── */
/* `/with-timestamps` en niet de gewone endpoint: die geeft per teken een starttijd, en dát is
   wat een marker in een tijdstip verandert. Zonder alignment zouden de cues geschat moeten
   worden uit het aantal woorden, en dan loopt de markering na een halve minuut zichtbaar uit. */
const ttsRes = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${voice.id}/with-timestamps`, {
  method: 'POST',
  headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: script,
    model_id: MODEL_ID,
    voice_settings: VOICE_SETTINGS,
    apply_text_normalization: 'on',
  }),
});
if (!ttsRes.ok) {
  console.error(`ElevenLabs ${ttsRes.status}: ${await ttsRes.text()}`);
  process.exit(1);
}
const { audio_base64, alignment } = await ttsRes.json();
const mp3 = Buffer.from(audio_base64, 'base64');
const charTimes = alignment?.character_start_times_seconds;
const cues = timeCues(parsedCues, charTimes);
/* Het meelezen. Uit dezelfde alignment, want een tweede TTS-run voor dezelfde tekst zou een
   andere opname zijn — en dus tijden die niet bij de mp3 in Storage horen. */
const words = wordTimes(script, charTimes);
console.log(`Audio: ${(mp3.length / 1024).toFixed(0)} kB`);
console.log(`Meelezen: ${words.length} woorden met een tijd`);
console.log('Cues op tijd:');
for (const c of cues) console.log(`  ${String(c.at).padStart(6)}s  ${c.id}`);

/* ── 3. Naar Storage ─────────────────────────────────────────────────────── */
/* Vast pad per les, geen hash: een tweede run houdt dezelfde URL, want die staat in de
   database en een nieuw pad per run zou de oude audio laten rondslingeren. */
const audioUrl = await storage.upload(BUCKET, `narratie/${slug}.mp3`, mp3, 'audio/mpeg');

/* ── 4. De rij ───────────────────────────────────────────────────────────── */
/* Duur uit de MP3 zelf: ElevenLabs geeft hem niet terug bij de gewone endpoint, en een
   geschatte duur uit het aantal woorden zou onder de voortgangsbalk gaan staan liegen.
   128 kbit/s constant is wat deze endpoint levert, dus bytes / 16000 = seconden. */
const durationSeconds = Number((mp3.length / 16000).toFixed(2));

const existing = await db.selectRows('lesson_narration', `lesson_id=eq.${lesson.id}&select=id`);

const row = {
  lesson_id: lesson.id,
  script,
  cues,
  word_times: words,
  voice_key: VOICE_KEY,
  audio_url: audioUrl,
  duration_seconds: durationSeconds,
  // Altijd terug naar pending: een gewijzigd script is niet meer wat de docent goedkeurde.
  review_status: 'pending',
  reviewed_by: null,
  reviewed_on: null,
};

if (existing.length > 0) {
  await db.patch('lesson_narration', `id=eq.${existing[0].id}`, row);
  console.log('Rij bijgewerkt, terug op pending.');
} else {
  await db.insert('lesson_narration', [row]);
  console.log('Rij aangemaakt, pending.');
}

console.log(`\n✓ ${audioUrl}`);
console.log(`  ~${Math.round(durationSeconds)} s`);
console.log('\nMarieke moet dit nakijken. Daarna:');
console.log(`  update lesson_narration set review_status='validated', reviewed_by='Marieke',`);
console.log(`         reviewed_on=current_date where lesson_id=${lesson.id};`);
