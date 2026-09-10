/**
 * Spreekt de luisterfragmenten en de naspreek-voorbeelden van een cursus in.
 *
 *   node scripts/lesson-content/generate-lesson-audio.mjs a2:luisteren --export
 *   node scripts/lesson-content/generate-lesson-audio.mjs a2:luisteren --only d1
 *   node scripts/lesson-content/generate-lesson-audio.mjs a2:luisteren --only d1 --dry
 *   node scripts/lesson-content/generate-lesson-audio.mjs a2:spreken --production
 *
 * ── WAAROM DIT EEN SCRIPT IS EN GEEN ROUTE ───────────────────────────────────
 * Dezelfde reden als bij `generate-narration.mjs`: `/api/admin/generate-lesson-audio` heeft
 * **geen admin-guard** (CLAUDE.md §12) en spendeert ElevenLabs-credits. Die gebruiken zou het
 * gat vergroten in plaats van het te omzeilen. Dit loopt lokaal met de service key, zoals elk
 * ander contentscript hier.
 *
 * ── HET SCRIPT STAAT ALS `.txt` IN DE REPO ───────────────────────────────────
 * `--export` schrijft elk fragment als los tekstbestand naar `fragments/<lesslug>-<n>.txt`,
 * vóór er één cent aan TTS is uitgegeven. Dat is de regel uit CLAUDE.md §9: de docent moet
 * kúnnen nakijken wát er gezegd wordt, en een diff op een tekstbestand is de enige vorm waarin
 * dat nakijken herhaalbaar is. De bron blijft de lespayload — het `.txt` is de leesbare
 * afdruk, en bij een verschil is de payload wat er is ingesproken.
 *
 * ── WAT ER INGESPROKEN WORDT ─────────────────────────────────────────────────
 * Twee soorten items, en ze klinken anders omdat ze iets anders doen:
 *
 *   `audio`      een luisterfragment. Eén of twee sprekers, via `/v1/text-to-dialogue` met
 *                `eleven_v3`, zodat het model de wisselingen zelf timet. De casting komt uit
 *                `payload.voice_cast` en wordt hier nooit geraden — een verkeerd gecaste stem
 *                is een hoorbare contentfout die je niet uit de mp3 kunt repareren.
 *   `naspreken`  het voorbeeld dat de cursist nazegt. Eén stem, `eleven_multilingual_v2`, en
 *                **langzamer** (0.85): dit is de enige audio in het systeem die is bedoeld om
 *                te imiteren, niet om te begrijpen. Op natuurlijk tempo is een klank die je
 *                nog niet kent niet na te doen.
 *
 * Beide gaan door `loudnorm` naar −20 LUFS, gemeten op DUO's eigen audio, zodat een les niet
 * harder staat dan het oefenexamen ernaast. Dat kan hier wél en in een serverless functie niet:
 * er is een ffmpeg op deze machine.
 *
 * ── HET PAD IS VAST, DE URL GAAT IN DE PAYLOAD ───────────────────────────────
 * `leren-audio/fragment/<level>-<onderdeel>/<lesslug>-<n>.mp3`, geen hash: een tweede run houdt
 * dezelfde URL, want die staat in de database. Een nieuw pad per run zou de oude audio laten
 * rondslingeren en de payload naar een bestand laten wijzen dat niemand meer opruimt.
 *
 * De URL wordt in twee plekken bijgewerkt en dat is bewust:
 *   1. het gegenereerde bestand in `generated/`, want dat is het gecommitte artefact — na een
 *      run staat in git wélke audio bij welke les hoort;
 *   2. de rij in `lesson_items`, als de les al geseed is. Staat hij er nog niet, dan pikt de
 *      volgende `seed.mjs` de URL uit `generated/` op. Andersom werkt niet: seeden ná de
 *      TTS-run zou de URL overschrijven met null.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT, VOICES, createDb, createStorage, loadEnv, createTts, validateCast,
  mp3DurationSeconds, haveFfmpeg,
} from '../a2-content/lib.mjs';
import { coursePlan, parseTarget, BUILT } from './plan.mjs';

const GEN_DIR = path.join(ROOT, 'scripts', 'lesson-content', 'generated');
const FRAGMENT_DIR = path.join(ROOT, 'scripts', 'lesson-content', 'fragments');
const BUCKET = 'leren-audio';

/* De stem van een naspreek-voorbeeld. Dezelfde als de ingesproken uitleg: het is dezelfde
   docent die het voordoet, en twee stemmen in één les zou suggereren dat er twee mensen aan
   het woord zijn. */
const SAY_VOICE = 'woman_older';
/* Langzamer dan de narratie (0.92) en veel langzamer dan een fragment. Zie de kop. */
const SAY_SPEED = 0.85;

const args = process.argv.slice(2);
const target = args.find(a => !a.startsWith('--'));
const production = args.includes('--production');
const dry = args.includes('--dry');
const exportOnly = args.includes('--export');
const force = args.includes('--force');
const onlyIdx = args.indexOf('--only');
const only = onlyIdx >= 0 ? args[onlyIdx + 1] : null;

if (!target) {
  console.error('Gebruik: node scripts/lesson-content/generate-lesson-audio.mjs a2:luisteren [--export] [--only d1] [--dry] [--production]');
  process.exit(1);
}

const { level, onderdeel } = parseTarget(target);
if (!BUILT.includes(`${level}:${onderdeel}`)) {
  console.error(`${level}:${onderdeel} is niet uitgewerkt. Gebouwd: ${BUILT.join(', ')}`);
  process.exit(1);
}

const dir = path.join(GEN_DIR, `${level}-${onderdeel}`);
const blocks = coursePlan(level, onderdeel);

/* ── 1. verzamelen wat er in te spreken valt ─────────────────────────────── */

/**
 * Elk item met een script, met zijn plek erbij.
 *
 * De index is de plek in `unit.items` en niet een doorlopende teller over de audio-items: hij
 * moet de rij in `lesson_items` kunnen aanwijzen, en daar is `sort_order` de lijstvolgorde.
 */
const jobs = [];
for (const block of blocks) {
  for (const lesson of block.lessons) {
    if (only && !lesson.slug.startsWith(only) && block.letter !== only) continue;
    const file = path.join(dir, `${lesson.slug}.json`);
    if (!fs.existsSync(file)) continue;
    const unit = JSON.parse(fs.readFileSync(file, 'utf8'));
    (unit.items ?? []).forEach((item, index) => {
      if (item.kind !== 'audio' && item.kind !== 'naspreken') return;
      const script = item.payload?.script;
      if (!script?.trim()) return;
      jobs.push({ lesson, file, unit, item, index });
    });
  }
}

if (!jobs.length) {
  console.error(`Geen in te spreken items gevonden in ${dir}${only ? ` (--only ${only})` : ''}.`);
  process.exit(1);
}

/** Het nummer van dit fragment binnen zijn les, 1-gebaseerd. Bepaalt het bestandspad. */
function fragmentNumber(job) {
  const same = jobs.filter(j => j.lesson.slug === job.lesson.slug);
  return same.indexOf(job) + 1;
}

const nameOf = job => `${job.lesson.slug}-${fragmentNumber(job)}`;
const pathOf = job => `fragment/${level}-${onderdeel}/${nameOf(job)}.mp3`;

const audioJobs = jobs.filter(j => j.item.kind === 'audio');
const sayJobs = jobs.filter(j => j.item.kind === 'naspreken');
console.log(`${level}:${onderdeel} — ${jobs.length} items: ` +
            `${audioJobs.length} luisterfragment(en), ${sayJobs.length} naspreek-voorbeeld(en)`);

/* ── 2. de scripts als .txt, vóór er iets wordt betaald ──────────────────── */

fs.mkdirSync(FRAGMENT_DIR, { recursive: true });
let written = 0;
for (const job of jobs) {
  const out = path.join(FRAGMENT_DIR, `${nameOf(job)}.txt`);
  const cast = job.item.payload.voice_cast
    ? Object.entries(job.item.payload.voice_cast)
      .map(([tag, key]) => `#   ${tag} = ${key} (${VOICES[key]?.name ?? 'ONBEKEND'})`)
      .join('\n')
    : `#   één stem: ${SAY_VOICE}`;
  const header = [
    `# ${job.lesson.title ?? job.lesson.slug} — ${job.item.kind}`,
    `# les ${job.lesson.slug}, item ${job.index + 1}`,
    '# Casting:',
    cast,
    '#',
    '# Dit bestand is de leesbare afdruk van wat er is ingesproken. De bron is de payload in',
    `# generated/${level}-${onderdeel}/${job.lesson.slug}.json — pas die aan en spreek opnieuw in.`,
    '',
  ].join('\n');
  const body = `${String(job.item.payload.script).trim()}\n`;
  const next = header + body;
  if (!fs.existsSync(out) || fs.readFileSync(out, 'utf8') !== next) {
    fs.writeFileSync(out, next);
    written += 1;
  }
}
console.log(`fragments/  ${written} bestand(en) geschreven of bijgewerkt, ${jobs.length} totaal`);

if (exportOnly) {
  console.log('\n--export: alleen de scripts geschreven, niets ingesproken.');
  process.exit(0);
}

/* ── 3. casting controleren vóór de eerste call ──────────────────────────── */

const castProblems = [];
for (const job of audioJobs) {
  const lines = parseLines(job.item.payload.script);
  const problems = validateCast(lines, job.item.payload.voice_cast ?? {});
  for (const p of problems) castProblems.push(`${nameOf(job)}: ${p}`);
}
if (castProblems.length) {
  console.error(`\n${castProblems.length} castingprobleem(en) — er wordt niets ingesproken:`);
  for (const p of castProblems) console.error(`  - ${p}`);
  process.exit(1);
}

/**
 * `A: … B: …` naar `[[speaker, text], …]`, de vorm die `createTts().dialogueAudio` wil.
 *
 * Bewust een eigen regel-parser en niet die uit `lib/tts-dialogue.ts`: dat is TypeScript en
 * dit een script. De vorm die hier binnenkomt is bovendien strakker dan wat de admin-editor
 * moet slikken — de generator schrijft één spreker per regel, altijd met een tag — dus de
 * inline-tagdetectie die daar nodig is, is hier alleen een manier om iets verkeerd te doen.
 * Een regel zonder tag hoort bij de vorige spreker.
 */
function parseLines(script) {
  const lines = [];
  for (const raw of String(script).split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const m = /^([A-Za-z][A-Za-z0-9_ -]{0,15}):\s*(.*)$/.exec(line);
    if (m) lines.push([m[1].trim(), m[2].trim()]);
    else if (lines.length) lines[lines.length - 1][1] += ` ${line}`;
    else lines.push(['A', line]);
  }
  return lines.filter(([, text]) => text.length > 0);
}

if (dry) {
  console.log('\n--dry: casting is in orde, niets ingesproken.');
  for (const job of jobs) {
    const words = String(job.item.payload.script).split(/\s+/).length;
    console.log(`  ${nameOf(job).padEnd(34)} ${job.item.kind.padEnd(10)} ${words} woorden`);
  }
  process.exit(0);
}

/* ── 4. inspreken en opslaan ─────────────────────────────────────────────── */

const env = loadEnv({ production });
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_KEY;
const apiKey = env.ELEVEN_LAPS_API_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL en SUPABASE_SERVICE_KEY ontbreken');
  process.exit(1);
}
if (!apiKey) {
  console.error('ELEVEN_LAPS_API_KEY ontbreekt — staat in .env.local, niet in .env.development.local');
  process.exit(1);
}

if (!haveFfmpeg()) {
  /* Geen harde stop: een fragment zonder loudnorm is stiller dan het oefenexamen ernaast, en
     dat is hinderlijk — maar géén fragment is erger. Wel luid zeggen, want anders staat de
     helft van de cursus op een ander volume dan de andere helft zonder dat iemand weet waarom. */
  console.log('LET OP: geen ffmpeg gevonden. De audio wordt NIET genormaliseerd naar -20 LUFS');
  console.log('        en klinkt stiller of harder dan de oefenexamens. Installeer ffmpeg en');
  console.log('        spreek deze fragmenten opnieuw in met --force.');
}

const db = createDb({ supabaseUrl, serviceKey });
const storage = createStorage({ supabaseUrl, serviceKey });
const tts = createTts({ apiKey });

let spoken = 0;
let skipped = 0;
let failed = 0;
/** Welke lesbestanden zijn aangepast — één keer wegschrijven aan het eind, niet per fragment. */
const touched = new Set();

for (const job of jobs) {
  const name = nameOf(job);
  if (job.item.payload.audio_url && !force) {
    skipped += 1;
    console.log(`  – ${name.padEnd(34)} heeft al audio (--force om opnieuw te doen)`);
    continue;
  }

  try {
    const mp3 = job.item.kind === 'audio'
      ? await tts.dialogueAudio(parseLines(job.item.payload.script), job.item.payload.voice_cast)
      : await tts.narratorAudio(String(job.item.payload.script), SAY_VOICE, SAY_SPEED);

    const url = await storage.upload(BUCKET, pathOf(job), mp3, 'audio/mpeg');
    /* Gemeten uit de frameheaders en niet geschat uit bytes of woorden: `mp3DurationSeconds`
       bestaat al voor precies deze vraag, en een geschatte duur zou onder een voortgangsbalk
       gaan liggen liegen. */
    const seconds = Number(mp3DurationSeconds(mp3).toFixed(2));

    job.item.payload.audio_url = url;
    job.item.payload.seconds = seconds;
    touched.add(job.file);

    /* De rij bijwerken als de les al geseed is. `select` op slug en niet op id: het
       gegenereerde bestand kent geen database-id, en dat is precies de scheiding die
       `generated/` bruikbaar maakt als reviewgrens. */
    const lessons = await db.selectRows('lessons', `slug=eq.${job.lesson.slug}&select=id`);
    if (lessons.length === 1) {
      const rows = await db.selectRows('lesson_items',
        `lesson_id=eq.${lessons[0].id}&sort_order=eq.${job.index}&select=id,kind`);
      if (rows.length === 1 && rows[0].kind === job.item.kind) {
        await db.patch('lesson_items', `id=eq.${rows[0].id}`,
          { payload: job.item.payload });
      } else {
        console.log(`     (geen passende rij in lesson_items — seed de cursus opnieuw)`);
      }
    }

    spoken += 1;
    console.log(`  ✓ ${name.padEnd(34)} ${(mp3.length / 1024).toFixed(0)} kB · ${Math.round(seconds)} s`);
  } catch (e) {
    failed += 1;
    console.log(`  ✗ ${name.padEnd(34)} ${e.message}`);
  }
}

for (const file of touched) {
  const job = jobs.find(j => j.file === file);
  fs.writeFileSync(file, `${JSON.stringify(job.unit, null, 2)}\n`);
}

console.log(`\n${spoken} ingesproken, ${skipped} overgeslagen, ${failed} mislukt.`);
console.log(`${touched.size} lesbestand(en) bijgewerkt in generated/${level}-${onderdeel}/.`);
if (spoken) {
  console.log('\nDe fragmenten staan als .txt in scripts/lesson-content/fragments/ — Marieke kijkt');
  console.log('die na. De lessen blijven pending tot zij ze vrijgeeft in /admin/lessen.');
}
if (failed) process.exit(1);
