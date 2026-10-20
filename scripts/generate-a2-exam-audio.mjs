/**
 * De gesproken examenonderdelen die DUO bij A2 voorleest en die wij nog niet hadden.
 *
 * ## Wat er wordt ingesproken
 * - **Spreken**, opdrachten met plaatjes (`describe`, `choose`, `cover_all`): DUO leest de hele
 *   opdrachtkaart voor — situatie, vraag, en dan de plaatjesregel ("Gebruik het plaatje." /
 *   "Kies één van de plaatjes." / "Vertel iets over alle plaatjes."). Bij de `react`-opdrachten
 *   leest de verteller eerst de situatie, en daarna spreekt de persoon zijn eigen opname
 *   (bewaard als `task-<id>/speaker.mp3`).
 *
 * Alles wat de verteller zegt is één stem op één snelheid: die van de geluidstest. Elke tekst
 * eindigt op een leesteken, anders zakt de intonatie aan het eind niet.
 * - **Luisteren**: per stimulus de situatie uit `stimuli.intro` (`situation_audio_url`), en per
 *   vraag de vraag en elk antwoord (`questions.prompt_audio_url`, `question_options.audio_url`) —
 *   DUO leest die voor nadat het fragment is afgelopen.
 *
 * ## Eerst de tekst, dan pas de stem
 * `--export` schrijft per examen een `.txt` naar `scripts/exam-content/a2-audio/` zonder één cent
 * aan TTS uit te geven: de docent moet kunnen nakijken wát er gezegd wordt. De plaatjesregel van
 * Spreken staat in `PICTURE_RULE` hieronder en in `SpeakingTask.tsx` — houd die twee gelijk.
 *
 *   node scripts/generate-a2-exam-audio.mjs --export                 # alleen de .txt's
 *   node scripts/generate-a2-exam-audio.mjs spreken                  # lokaal genereren
 *   node scripts/generate-a2-exam-audio.mjs luisteren --exam 1       # één examen
 *   node scripts/generate-a2-exam-audio.mjs --production             # het gehoste project
 *
 * Hervatbaar: wat al een url heeft wordt overgeslagen, tenzij `--force`.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  ROOT, AUDIO_BUCKET, NARRATOR_KEY,
  loadEnv, isLocalUrl, createDb, createStorage, createTts,
} from './a2-content/lib.mjs';

const args = process.argv.slice(2);
const flag = name => args.includes(`--${name}`);
const opt = name => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : null; };

const EXPORT = flag('export');
const PRODUCTION = flag('production');
const FORCE = flag('force');
const ONLY_EXAM = opt('exam') ? Number(opt('exam')) : null;
const SKILLS = ['spreken', 'luisteren'].filter(s => args.includes(s));
const RUN_SKILLS = SKILLS.length ? SKILLS : ['spreken', 'luisteren'];

/** Gelijk aan `PICTURE_RULE` in components/exam/SpeakingTask.tsx. */
export const PICTURE_RULE = {
  describe: 'Gebruik het plaatje.',
  choose: 'Kies één van de plaatjes.',
  cover_all: 'Vertel iets over alle plaatjes.',
};

/**
 * Staat de regel al in de opdracht ("Kies één plaatje en vertel waarom."), dan zegt de stem hem
 * niet nog eens. Op het scherm staat hij wel altijd, als eigen regel — zo ziet DUO's kaart eruit.
 */
const ALREADY_SAID = {
  describe: /gebruik\b.*\bplaatje/i,
  choose: /\bkies\b/i,
  cover_all: /\balle\b.*\bplaatjes\b/i,
};

const stripHtml = html => (html ?? '')
  .replace(/<br\s*\/?>/gi, ' ')
  .replace(/<\/(p|li|div)>/gi, ' ')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')
  .trim();

const ensureStop = t => (/[.!?]$/.test(t) ? t : `${t}.`);

export function spokenTaskScript(task) {
  const base = ensureStop((task.prompt_script ?? '').trim() || stripHtml(task.prompt_html));
  const rule = PICTURE_RULE[task.image_usage];
  if (!rule || ALREADY_SAID[task.image_usage].test(base)) return base;
  return `${base} ${rule}`;
}

const env = loadEnv({ production: PRODUCTION });
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_KEY = env.SUPABASE_SERVICE_KEY ?? '';
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_KEY ontbreken.');
  process.exit(1);
}
const IS_LOCAL = isLocalUrl(SUPABASE_URL);
if (!IS_LOCAL && !PRODUCTION) {
  console.error(`WEIGERD: ${SUPABASE_URL} is niet lokaal. Geef --production als dat de bedoeling is.`);
  process.exit(1);
}
if (PRODUCTION && IS_LOCAL) {
  console.error('--production gegeven maar de url is lokaal.');
  process.exit(1);
}
console.log(`→ ${SUPABASE_URL}${EXPORT ? ' (alleen export)' : ''}`);

const db = createDb({ supabaseUrl: SUPABASE_URL, serviceKey: SERVICE_KEY });
const storage = createStorage({ supabaseUrl: SUPABASE_URL, serviceKey: SERVICE_KEY });
const tts = EXPORT ? null : createTts({ apiKey: env.ELEVEN_LAPS_API_KEY });
if (!EXPORT && !env.ELEVEN_LAPS_API_KEY) {
  console.error('ELEVEN_LAPS_API_KEY ontbreekt.');
  process.exit(1);
}

const EXPORT_DIR = path.join(ROOT, 'scripts', 'exam-content', 'a2-audio');
/** De stem en snelheid van de geluidstest (`public/audio/exam/geluidstest.mp3`): één verteller. */
const NARRATOR_SPEED = 1.0;
/** Staat in elke url die deze versie schreef, zodat een herhaalde run hem overslaat. */
const VERSION = 'v=verteller1';
const stamp = () => `?${VERSION}&t=${Date.now()}`;
let chars = 0;
let made = 0;

async function exams(skill) {
  const filter = `level=eq.a2&skill=eq.${skill}&number=gt.0${ONLY_EXAM ? `&number=eq.${ONLY_EXAM}` : ''}`;
  return db.selectRows('exams', `select=id,number&${filter}&order=number`);
}

async function speak(text, voice, speed) {
  chars += text.length;
  if (EXPORT) return null;
  made++;
  return tts.narratorAudio(text, voice, speed);
}

/** Rond een gesprekstaak af met 0,6 s stilte tussen verteller en spreker. */
function concatMp3(first, second) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'a2-audio-'));
  const a = path.join(dir, 'a.mp3'), b = path.join(dir, 'b.mp3'), out = path.join(dir, 'out.mp3');
  fs.writeFileSync(a, first);
  fs.writeFileSync(b, second);
  execFileSync('ffmpeg', [
    '-loglevel', 'error', '-y', '-i', a, '-i', b,
    '-filter_complex',
    '[0:a]aresample=44100,aformat=channel_layouts=mono[a];' +
    'anullsrc=r=44100:cl=mono,atrim=duration=0.6[gap];' +
    '[1:a]aresample=44100,aformat=channel_layouts=mono[b];' +
    '[a][gap][b]concat=n=3:v=0:a=1[out]',
    '-map', '[out]', '-codec:a', 'libmp3lame', '-b:a', '128k', out,
  ]);
  const buf = fs.readFileSync(out);
  fs.rmSync(dir, { recursive: true, force: true });
  return buf;
}

async function runSpreken() {
  for (const exam of await exams('spreken')) {
    const tasks = await db.selectRows(
      'open_tasks',
      `select=id,sort_order,image_usage,prompt_html,prompt_script,prompt_voice,prompt_audio_url&exam_id=eq.${exam.id}&order=sort_order`,
    );
    const lines = [`# A2 Spreken — oefenexamen ${exam.number}`, `# verteller: ${NARRATOR_KEY}, snelheid ${NARRATOR_SPEED} (zelfde als de geluidstest)`, ''];
    for (const t of tasks) {
      const done = (t.prompt_audio_url ?? '').includes(VERSION) && !FORCE;

      if (t.image_usage === 'react') {
        // DUO: eerst leest de verteller de situatie, dan spreekt de persoon in de video. De
        // spreker houdt zijn eigen (bij het geslacht passende) opname; alleen de situatie komt erbij.
        const situation = ensureStop(stripHtml(t.prompt_html));
        lines.push(`[opdracht ${t.sort_order} · react · verteller, dan spreker]`, situation, `— spreker: ${(t.prompt_script ?? '').trim()}`, '');
        if (EXPORT) { chars += situation.length; continue; }
        if (done || !t.prompt_audio_url) continue;
        const speakerPath = `task-${t.id}/speaker.mp3`;
        let speakerUrl = await storage.existing(AUDIO_BUCKET, speakerPath);
        if (!speakerUrl) {
          const res = await fetch(t.prompt_audio_url);
          if (!res.ok) throw new Error(`spreker-opname ${t.id}: ${res.status}`);
          speakerUrl = await storage.upload(AUDIO_BUCKET, speakerPath, Buffer.from(await res.arrayBuffer()), 'audio/mpeg');
        }
        const speaker = Buffer.from(await (await fetch(speakerUrl)).arrayBuffer());
        const intro = await speak(situation, NARRATOR_KEY, NARRATOR_SPEED);
        const url = await storage.upload(AUDIO_BUCKET, `task-${t.id}/prompt.mp3`, concatMp3(intro, speaker), 'audio/mpeg');
        await db.patch('open_tasks', `id=eq.${t.id}`, { prompt_audio_url: url + stamp() });
        process.stdout.write('r');
        continue;
      }

      if (!PICTURE_RULE[t.image_usage]) continue;
      const script = spokenTaskScript(t);
      lines.push(`[opdracht ${t.sort_order} · ${t.image_usage} · verteller]`, script, '');
      if (EXPORT) { chars += script.length; continue; }
      if (done) continue;
      const buf = await speak(script, NARRATOR_KEY, NARRATOR_SPEED);
      const url = await storage.upload(AUDIO_BUCKET, `task-${t.id}/prompt.mp3`, buf, 'audio/mpeg');
      // `prompt_voice` kent alleen de vier spreekstemmen; null betekent hier: de verteller.
      await db.patch('open_tasks', `id=eq.${t.id}`, {
        prompt_audio_url: url + stamp(), prompt_script: script, prompt_voice: null,
      });
      process.stdout.write('.');
    }
    if (EXPORT) write(`spreken-${String(exam.number).padStart(2, '0')}.txt`, lines);
    else console.log(` spreken ${exam.number}`);
  }
}

async function runLuisteren() {
  for (const exam of await exams('luisteren')) {
    const stimuli = await db.selectRows(
      'stimuli',
      `select=id,sort_order,intro,situation_audio_url,questions(id,sort_order,prompt,prompt_audio_url,question_options(id,label,body,audio_url))&exam_id=eq.${exam.id}&order=sort_order`,
    );
    const lines = [`# A2 Luisteren — oefenexamen ${exam.number}`, `# stem: ${NARRATOR_KEY}`, ''];
    for (const s of stimuli) {
      const intro = (s.intro ?? '').trim();
      lines.push(`[tekst ${s.sort_order} · situatie]`, intro || '(geen situatie)', '');
      if (intro && (!s.situation_audio_url || FORCE)) {
        if (EXPORT) chars += intro.length;
        else {
          const buf = await speak(ensureStop(intro), NARRATOR_KEY, NARRATOR_SPEED);
          const url = await storage.upload(AUDIO_BUCKET, `stimulus-${s.id}/situation.mp3`, buf, 'audio/mpeg');
          await db.patch('stimuli', `id=eq.${s.id}`, { situation_audio_url: url + stamp() });
          process.stdout.write('s');
        }
      }
      const questions = [...(s.questions ?? [])].sort((a, b) => a.sort_order - b.sort_order);
      for (const q of questions) {
        const options = [...(q.question_options ?? [])]
          .filter(o => o.body?.trim())
          .sort((a, b) => a.label.localeCompare(b.label));
        lines.push(`[tekst ${s.sort_order} · vraag ${q.sort_order}]`, q.prompt, ...options.map(o => `${o.label}  ${o.body}`), '');
        if (EXPORT) {
          chars += q.prompt.length + options.reduce((n, o) => n + o.body.length, 0);
          continue;
        }
        if (!q.prompt_audio_url || FORCE) {
          const buf = await speak(ensureStop(q.prompt.trim()), NARRATOR_KEY, NARRATOR_SPEED);
          const url = await storage.upload(AUDIO_BUCKET, `${q.id}/question.mp3`, buf, 'audio/mpeg');
          await db.patch('questions', `id=eq.${q.id}`, { prompt_audio_url: url + stamp() });
        }
        for (const o of options) {
          if (o.audio_url && !FORCE) continue;
          const buf = await speak(ensureStop(o.body.trim()), NARRATOR_KEY, NARRATOR_SPEED);
          const url = await storage.upload(AUDIO_BUCKET, `${q.id}/option-${o.id}.mp3`, buf, 'audio/mpeg');
          await db.patch('question_options', `id=eq.${o.id}`, { audio_url: url + stamp() });
        }
        process.stdout.write('.');
      }
    }
    if (EXPORT) write(`luisteren-${String(exam.number).padStart(2, '0')}.txt`, lines);
    else console.log(` luisteren ${exam.number}`);
  }
}

function write(name, lines) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
  fs.writeFileSync(path.join(EXPORT_DIR, name), lines.join('\n'));
}

if (RUN_SKILLS.includes('spreken')) await runSpreken();
if (RUN_SKILLS.includes('luisteren')) await runLuisteren();
console.log(`\n${EXPORT ? 'Te genereren' : 'Gegenereerd'}: ${chars.toLocaleString('nl-NL')} tekens${EXPORT ? '' : `, ${made} opnames`}.`);
