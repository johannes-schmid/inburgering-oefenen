/**
 * Seed exam 1 of each skill with TEST content, on the local stack only.
 *
 * ## What this is, and what it is not
 * This makes the four onderdelen clickable end to end — the MCQ player, the writing and speaking
 * renderers, the grader, the docent's inbox and the eval page — without waiting for authored
 * content. It is **not** exam material. CLAUDE.md: "No AI-generated exam content. Every item is
 * written or reviewed by a certified NT2 docent," and `supabase/seed.sql` deliberately holds no
 * items so that placeholders can never be mistaken for the docent's work.
 *
 * Three guards keep that true:
 *   1. It refuses to run against anything but 127.0.0.1 — production cannot be seeded by accident.
 *   2. Every exam title carries the TESTDATA marker, visible in admin and in the player.
 *   3. `teardown` removes all of it, including the draft rubrics.
 *
 *   node scripts/seed-test-exams.mjs            # all four skills
 *   node scripts/seed-test-exams.mjs lezen      # one skill: lezen|luisteren|schrijven|spreken
 *   node scripts/seed-test-exams.mjs --no-audio # skip ElevenLabs (Luisteren/Spreken stay silent)
 *   node scripts/seed-test-exams.mjs teardown   # remove everything this created
 *
 * Needs the local stack up. Audio needs ELEVEN_LAPS_API_KEY and ffmpeg.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  LEZEN,
  LUISTEREN,
  SCHRIJVEN,
  SPREKEN_PARTS,
  TEST_MARKER,
} from './test-exam-content.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUCKET = 'question-audio';

const args = process.argv.slice(2);
const NO_AUDIO = args.includes('--no-audio');
// Audio is the expensive part (26 ElevenLabs generations for Luisteren + Spreken). Existing objects
// are reused unless --force-audio, so re-seeding after a content edit costs nothing.
const FORCE_AUDIO = args.includes('--force-audio');
const command = args.find(a => !a.startsWith('--')) ?? 'all';
/**
 * Write to the **hosted** project instead of the local stack.
 *
 * Off by default and deliberately awkward to reach. The owner authorised production seeding on
 * 2026-07-30 having been told what it means: this content is not written by the docent, and
 * publishing it puts AI-written items in front of candidates on a site whose claim is "echt door een
 * docent gevalideerd, geen AI". She reviews and replaces it afterwards in /admin/opgaven.
 *
 * The one thing here that lies: to satisfy `exam_publish_issues()` every stimulus and task is
 * written `review_status = 'validated'`, which for this content is not yet true. There is no
 * "published but unreviewed" state in the schema.
 */
const PRODUCTION = args.includes('--production');

/* ── env + guard ─────────────────────────────────────────────────────────── */

function readEnv(file) {
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

// `.env.development.local` points at 127.0.0.1 and takes precedence in dev by design, so targeting
// production means deliberately *not* reading it — `.env.local` is the hosted project (CLAUDE.md).
const env = PRODUCTION
  ? readEnv('.env.local')
  : { ...readEnv('.env.local'), ...readEnv('.env.development.local') };
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_KEY = env.SUPABASE_SERVICE_KEY ?? '';

const IS_LOCAL = /^https?:\/\/(127\.0\.0\.1|localhost)[:/]/.test(SUPABASE_URL);

// Default is still refusal. `--production` is an explicit, logged decision, never a convenience.
if (!IS_LOCAL && !PRODUCTION) {
  console.error(
    `REFUSING TO RUN.\n\n` +
      `  NEXT_PUBLIC_SUPABASE_URL = ${SUPABASE_URL || '(unset)'}\n\n` +
      `This seeds exam content that is not written by the docent. Pass --production if that is\n` +
      `genuinely intended for the hosted project.`
  );
  process.exit(1);
}
if (PRODUCTION && IS_LOCAL) {
  console.error('--production given but the URL is local. Check .env.local.');
  process.exit(1);
}
if (PRODUCTION) {
  console.log('!! PRODUCTION SEED');
  console.log(`!! ${SUPABASE_URL}`);
  console.log('!! Content is not authored by the docent; she reviews it in /admin/opgaven.');
  console.log('');
}

/* ── data layer: PostgREST ────────────────────────────────────────────────── */
/**
 * Every write goes through PostgREST with the service key, for both the local stack and the hosted
 * project.
 *
 * It used to shell out to `docker exec … psql`, which is fine locally and impossible against
 * production — `psql` is not installed on this host and the hosted database password is not in the
 * repo. One transport that works everywhere is worth more than the terser SQL.
 */
const REST = `${SUPABASE_URL}/rest/v1`;
const HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

async function rest(path, init = {}) {
  const res = await fetch(`${REST}/${path}`, { ...init, headers: { ...HEADERS, ...init.headers } });
  const text = await res.text();
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path} → ${res.status}: ${text.slice(0, 400)}`);
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

/** Insert one row and return its id. */
async function insertOne(table, row) {
  const [out] = await insert(table, row);
  if (!out?.id) throw new Error(`${table}: insert returned no id`);
  return out.id;
}

async function patch(table, filter, values) {
  return rest(`${table}?${filter}`, { method: 'PATCH', body: JSON.stringify(values) });
}

async function remove(table, filter) {
  return rest(`${table}?${filter}`, { method: 'DELETE' });
}

async function selectRows(table, query) {
  return (await rest(`${table}?${query}`)) ?? [];
}

/* ── rubrics ─────────────────────────────────────────────────────────────── */
/**
 * Draft criteria, duplicated from `lib/rubric-templates.ts`.
 *
 * The duplication is deliberate and annoying: this is a `.mjs` script and cannot import a `.ts`
 * module without a build step. Kept short on purpose — the point is a rubric that exists so the
 * publish gate passes and grading can run, not a rubric anyone should keep. `/admin/rubrics` is
 * where the real ones get written, and `teardown` deletes these.
 */
const DRAFT_CRITERIA = {
  writing: [
    ['inhoud', 'Inhoud en volledigheid', [
      'Reageert niet op de opdracht.',
      'Behandelt een deel van de gevraagde punten.',
      'Behandelt bijna alle gevraagde punten.',
      'Behandelt alle gevraagde punten duidelijk.',
    ]],
    ['woordgebruik', 'Woordgebruik', [
      'Te weinig woorden om de boodschap over te brengen.',
      'Zeer beperkte woordenschat; verkeerde woordkeuze hindert het begrip.',
      'Voldoende woorden; soms een onhandige keuze.',
      'Passende woorden voor een alledaags onderwerp op A2-niveau.',
    ]],
    ['grammatica', 'Grammatica en spelling', [
      'Zoveel fouten dat de tekst niet te volgen is.',
      'Veel fouten; de lezer moet vaak raden.',
      'Fouten in eenvoudige zinnen, maar de boodschap blijft duidelijk.',
      'Eenvoudige zinnen zijn overwegend correct.',
    ]],
    ['samenhang', 'Samenhang', [
      'Losse woorden zonder verband.',
      'Losse zinnen zonder verbindingswoorden.',
      'Eenvoudige verbindingswoorden, soms verkeerd.',
      'Zinnen logisch verbonden met eenvoudige verbindingswoorden.',
    ]],
  ],
  speaking: [
    ['inhoud', 'Inhoud', [
      'Geen antwoord, of niet over de vraag.',
      'Antwoordt met een of twee woorden.',
      'Antwoordt op de vraag; meer uitleg zou helpen.',
      'Antwoordt volledig met genoeg informatie.',
    ]],
    ['woordgebruik', 'Woordgebruik', [
      'Te weinig woorden om de boodschap over te brengen.',
      'Zeer beperkte woordenschat.',
      'Voldoende woorden; soms een onhandige keuze.',
      'Passende woorden voor een alledaags onderwerp op A2-niveau.',
    ]],
    ['grammatica', 'Grammatica', [
      'Losse woorden, geen zinnen.',
      'Veel fouten; de luisteraar moet raden.',
      'Fouten in eenvoudige zinnen, maar duidelijk.',
      'Eenvoudige zinnen overwegend correct.',
    ]],
    ['verstaanbaarheid', 'Verstaanbaarheid en uitspraak', [
      'Grotendeels onverstaanbaar.',
      'Losse woorden herkenbaar; veel moeite nodig.',
      'Goed te volgen met een duidelijk accent.',
      'Duidelijk te begrijpen; accent hindert niet.',
    ]],
    ['vloeiendheid', 'Vloeiendheid', [
      'Bijna geen aaneengesloten spraak.',
      'Zeer aarzelend; lange stiltes.',
      'Aarzelt, maar komt er zelf uit.',
      'Spreekt vlot genoeg om te volgen.',
    ]],
  ],
};

const CATEGORIES = [
  ['schrijven', 'email', 'writing'],
  ['schrijven', 'short_text', 'writing'],
  ['schrijven', 'form', 'writing'],
  ['schrijven', 'picture_note', 'writing'],
  ['spreken', 'speaking_none', 'speaking'],
  ['spreken', 'speaking_describe', 'speaking'],
  ['spreken', 'speaking_choose', 'speaking'],
  ['spreken', 'speaking_cover_all', 'speaking'],
];

const SYSTEM_PROMPT_MARKER = `[${TEST_MARKER}] Conceptrubriek, niet door de docent geschreven.`;

function criteriaJson(kind) {
  return DRAFT_CRITERIA[kind].map(([key, criterion, anchors]) => ({
    key,
    criterion,
    anchors: { '0': anchors[0], '1': anchors[1], '2': anchors[2], '3': anchors[3] },
  }));
}

async function ensureRubrics() {
  let made = 0;
  for (const [skill, category, kind] of CATEGORIES) {
    const active = await selectRows(
      'rubrics',
      `select=id&skill=eq.${skill}&task_type=eq.${category}&active=is.true&limit=1`
    );
    if (active.length > 0) continue;

    const versions = await selectRows(
      'rubrics',
      `select=version&skill=eq.${skill}&task_type=eq.${category}&order=version.desc&limit=1`
    );
    const version = (versions[0]?.version ?? 0) + 1;

    await insert('rubrics', {
      skill,
      task_type: category,
      version,
      criteria: criteriaJson(kind),
      system_prompt: SYSTEM_PROMPT_MARKER,
      active: true,
    });
    made++;
  }
  return made;
}

/* ── audio ───────────────────────────────────────────────────────────────── */

const VOICES = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'tts-voices.json'), 'utf8'));
const DIALOGUE_ENDPOINT = 'https://api.elevenlabs.io/v1/text-to-dialogue';
const TTS_ENDPOINT = 'https://api.elevenlabs.io/v1/text-to-speech';
const LOUDNESS = { i: -20, tp: -2, lra: 4 };

function haveFfmpeg() {
  const r = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
  return r.status === 0;
}
const FFMPEG = haveFfmpeg();

/** Two-pass loudnorm to −20 LUFS, matching the taster pipeline. Skipped (loudly) without ffmpeg. */
function loudnorm(buf) {
  if (!FFMPEG) return buf;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seed-audio-'));
  const src = path.join(dir, 'in.mp3');
  const out = path.join(dir, 'out.mp3');
  fs.writeFileSync(src, buf);
  try {
    const probe = spawnSync(
      'ffmpeg',
      ['-i', src, '-af', `loudnorm=I=${LOUDNESS.i}:TP=${LOUDNESS.tp}:LRA=${LOUDNESS.lra}:print_format=json`, '-f', 'null', '-'],
      { encoding: 'utf8' }
    );
    const m = /\{[^{}]*"input_i"[\s\S]*?\}/.exec(probe.stderr || '');
    const stats = m ? JSON.parse(m[0]) : null;
    const filter = stats
      ? `loudnorm=I=${LOUDNESS.i}:TP=${LOUDNESS.tp}:LRA=${LOUDNESS.lra}:measured_I=${stats.input_i}:measured_TP=${stats.input_tp}:measured_LRA=${stats.input_lra}:measured_thresh=${stats.input_thresh}:offset=${stats.target_offset}:linear=true`
      : `loudnorm=I=${LOUDNESS.i}:TP=${LOUDNESS.tp}:LRA=${LOUDNESS.lra}`;
    execFileSync('ffmpeg', ['-y', '-i', src, '-af', filter, '-c:a', 'libmp3lame', '-b:a', '128k', out], {
      stdio: 'ignore',
    });
    return fs.readFileSync(out);
  } catch {
    return buf;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

async function dialogueAudio(lines, cast) {
  const inputs = lines.map(([speaker, text]) => ({
    text,
    voice_id: VOICES[cast[speaker] ?? 'woman_young'].id,
  }));
  const res = await fetch(DIALOGUE_ENDPOINT, {
    method: 'POST',
    headers: { 'xi-api-key': env.ELEVEN_LAPS_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inputs,
      model_id: 'eleven_v3',
      settings: { stability: 0.5, use_speaker_boost: true },
      apply_text_normalization: 'on',
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return loudnorm(Buffer.from(await res.arrayBuffer()));
}

/** Single narrator, for a Spreken prompt. NARRATOR in lib/tts-voices.ts is woman_young. */
async function narratorAudio(text) {
  const res = await fetch(`${TTS_ENDPOINT}/${VOICES.woman_young.id}`, {
    method: 'POST',
    headers: { 'xi-api-key': env.ELEVEN_LAPS_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.45, similarity_boost: 0.75, use_speaker_boost: true, speed: 0.9 },
      apply_text_normalization: 'on',
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return loudnorm(Buffer.from(await res.arrayBuffer()));
}

/** Public URL of an already-uploaded object, or null. */
async function existingAudio(objectPath) {
  if (FORCE_AUDIO) return null;
  const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectPath}`;
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok ? url : null;
  } catch {
    return null;
  }
}

async function upload(objectPath, buf) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath}`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'audio/mpeg',
      'x-upsert': 'true',
    },
    body: buf,
  });
  if (!res.ok) throw new Error(`upload ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectPath}`;
}

/* ── shared helpers ──────────────────────────────────────────────────────── */

async function examId(skill) {
  const rows = await selectRows('exams', `select=id&skill=eq.${skill}&number=eq.1`);
  if (!rows[0]) throw new Error(`No exam row for ${skill} 1 — seed.sql has not run on this project.`);
  return rows[0].id;
}

/** Section names are looked up once per run and cached; there are 15 of them. */
let sectionCache = null;
async function sectionId(skill, name) {
  sectionCache ??= await selectRows('sections', 'select=id,name_nl,topic');
  return sectionCache.find(s => s.topic === skill && s.name_nl === name)?.id ?? null;
}

/** Deterministic placeholder image. Obviously not real exam art, which is the point. */
const img = (seed, n = 0) => `https://picsum.photos/seed/${seed}-${n}/640/480`;

const SKILL_TITLES = {
  lezen: 'Oefenexamen Lezen 1',
  luisteren: 'Oefenexamen Luisteren 1',
  schrijven: 'Oefenexamen Schrijven 1',
  spreken: 'Oefenexamen Spreken 1',
};

/**
 * The TESTDATA marker exists so nobody mistakes this for authored content *while developing*. In
 * production the owner has sanctioned it for candidates, and a visitor reading "TESTDATA" in an exam
 * title sees a broken product rather than an honest one — so production gets a real title and the
 * provenance lives in the rubric's `system_prompt`, which only admin ever reads.
 */
function markTitle(skill) {
  return PRODUCTION ? SKILL_TITLES[skill] : `${TEST_MARKER} — oefenexamen ${skill} 1`;
}

async function publish(id, skill) {
  await patch('exams', `id=eq.${id}`, { published: true, title: markTitle(skill) });
  // exam_publish_issues() is a SQL function, reachable over PostgREST as an RPC.
  const issues = await rest('rpc/exam_publish_issues', {
    method: 'POST',
    body: JSON.stringify({ p_exam_id: id }),
  });
  return (issues ?? [])
    .filter(i => i.severity === 'error')
    .map(i => `${i.severity} · ${i.entity} · ${i.issue}`);
}

/* ── seeders ─────────────────────────────────────────────────────────────── */

async function seedMcq(skill, stimuli, audioUrls = {}) {
  const id = await examId(skill);
  await remove('stimuli', `exam_id=eq.${id}`);

  let questionCount = 0;

  for (const [i, st] of stimuli.entries()) {
    const sec = st.section ? await sectionId(skill, st.section) : null;
    const isAudio = skill === 'luisteren';
    const audioUrl = audioUrls[i] ?? null;

    // An audio stimulus must carry audio (a CHECK enforces it), so fall back to a text stimulus
    // when --no-audio is used: a half-authored stimulus renders an empty pane and looks like a bug.
    const kind = isAudio && audioUrl ? 'audio' : 'text';
    const body =
      kind === 'text' && isAudio
        ? `<p><em>Transcript:</em></p>` +
          st.lines.map(([sp, t]) => `<p><strong>${sp}:</strong> ${t}</p>`).join('')
        : (st.body_html ?? null);

    const stimulusId = await insertOne('stimuli', {
      exam_id: id,
      skill,
      sort_order: i + 1,
      section_id: sec,
      kind,
      title: st.title,
      body_html: body,
      audio_url: audioUrl,
      script: isAudio ? st.lines.map(([sp, t]) => `${sp}: ${t}`).join('\n') : null,
      voice_cast: st.voice_cast ?? {},
      review_status: 'validated',
      reviewed_at: new Date().toISOString(),
    });

    for (const [j, qq] of st.questions.entries()) {
      const questionId = await insertOne('questions', {
        stimulus_id: stimulusId,
        exam_id: id,
        sort_order: j + 1,
        prompt: qq.prompt,
        explanation: qq.explanation,
        option_layout: 'text',
        review_status: 'validated',
        reviewed_at: new Date().toISOString(),
      });

      const labels = ['A', 'B', 'C', 'D'];
      // Written all-false first, then one flipped: `question_options_one_correct_idx` is
      // UNIQUE (question_id) WHERE is_correct, so two true rows can never coexist even briefly.
      await insert(
        'question_options',
        qq.options.map((bodyText, k) => ({
          question_id: questionId,
          label: labels[k],
          sort_order: k + 1,
          body: bodyText,
          is_correct: false,
        }))
      );
      await patch(
        'question_options',
        `question_id=eq.${questionId}&label=eq.${labels[qq.correct]}`,
        { is_correct: true }
      );
      questionCount++;
    }
  }

  const errors = await publish(id, skill);
  return { stimuli: stimuli.length, questions: questionCount, errors };
}

async function seedLezen() {
  return seedMcq('lezen', LEZEN);
}

async function seedLuisteren() {
  const audioUrls = {};
  if (!NO_AUDIO && env.ELEVEN_LAPS_API_KEY) {
    for (const [i, s] of LUISTEREN.entries()) {
      const objectPath = `testdata/luisteren-1/stimulus-${i + 1}.mp3`;
      const already = await existingAudio(objectPath);
      if (already) {
        audioUrls[i] = already;
        continue;
      }
      process.stdout.write(`    audio ${i + 1}/${LUISTEREN.length} — ${s.title}… `);
      try {
        const buf = await dialogueAudio(s.lines, s.voice_cast);
        audioUrls[i] = await upload(objectPath, buf);
        console.log(`${(buf.length / 1024).toFixed(0)} KB`);
      } catch (err) {
        console.log(`FAILED (${err.message})`);
      }
    }
  }
  return seedMcq('luisteren', LUISTEREN, audioUrls);
}

async function rubricFor(skill, category) {
  const rows = await selectRows(
    'rubrics',
    `select=id&skill=eq.${skill}&task_type=eq.${category}&active=is.true&limit=1`
  );
  return rows[0]?.id ?? null;
}

async function seedSchrijven() {
  const id = await examId('schrijven');
  await remove('open_tasks', `exam_id=eq.${id}`);

  for (const [i, t] of SCHRIJVEN.entries()) {
    const taskId = await insertOne('open_tasks', {
      exam_id: id,
      skill: 'schrijven',
      sort_order: i + 1,
      task_type: t.task_type,
      title: t.title,
      prompt_html: t.prompt_html,
      bullet_points: t.bullet_points ?? [],
      email_to: t.email_to ?? null,
      email_subject: t.email_subject ?? null,
      greeting: t.greeting ?? null,
      closing: t.closing ?? null,
      min_sentences: t.min_sentences ?? null,
      form_schema: t.form_schema ?? null,
      image_usage: 'none',
      model_answer: t.model_answer ?? null,
      rubric_id: await rubricFor('schrijven', t.task_type),
      review_status: 'validated',
      reviewed_at: new Date().toISOString(),
    });

    if (t.images?.length) {
      await insert(
        'open_task_images',
        t.images.map((im, k) => ({
          task_id: taskId,
          sort_order: k + 1,
          image_url: img(im.seed),
          caption: im.caption ?? null,
          alt_text: im.caption ?? null,
          group_label: im.group_label ?? null,
        }))
      );
    }
  }

  const errors = await publish(id, 'schrijven');
  return { tasks: SCHRIJVEN.length, errors };
}

async function seedSpreken() {
  const id = await examId('spreken');
  await remove('open_tasks', `exam_id=eq.${id}`);
  await remove('exam_parts', `exam_id=eq.${id}`);

  let order = 0;
  let audioMade = 0;

  for (const [pi, part] of SPREKEN_PARTS.entries()) {
    const partId = await insertOne('exam_parts', {
      exam_id: id,
      sort_order: pi + 1,
      title: part.title,
      instruction_html: part.instruction_html,
      show_instruction: true,
    });

    const rubricId = await rubricFor('spreken', `speaking_${part.image_usage}`);

    for (const t of part.tasks) {
      order++;
      let promptAudio = null;
      if (!NO_AUDIO && env.ELEVEN_LAPS_API_KEY) {
        const objectPath = `testdata/spreken-1/task-${order}.mp3`;
        promptAudio = await existingAudio(objectPath);
        if (!promptAudio) {
          process.stdout.write(`    audio ${order}/16… `);
          try {
            promptAudio = await upload(objectPath, await narratorAudio(t.prompt));
            console.log('ok');
          } catch (err) {
            console.log(`FAILED (${err.message})`);
          }
        }
        if (promptAudio) audioMade++;
      }

      const taskId = await insertOne('open_tasks', {
        exam_id: id,
        part_id: partId,
        skill: 'spreken',
        sort_order: order,
        task_type: 'speaking',
        prompt_html: `<p>${t.prompt}</p>`,
        bullet_points: [],
        image_usage: part.image_usage,
        prompt_audio_url: promptAudio,
        prompt_script: t.prompt,
        max_record_seconds: 60,
        rubric_id: rubricId,
        review_status: 'validated',
        reviewed_at: new Date().toISOString(),
      });

      if (t.images > 0) {
        await insert(
          'open_task_images',
          Array.from({ length: t.images }, (_, k) => ({
            task_id: taskId,
            sort_order: k + 1,
            image_url: img(t.seed, k),
            alt_text: `plaatje ${k + 1}`,
          }))
        );
      }
    }
  }

  const errors = await publish(id, 'spreken');
  return { parts: SPREKEN_PARTS.length, tasks: order, audio: audioMade, errors };
}

/* ── teardown ────────────────────────────────────────────────────────────── */

async function teardown() {
  if (PRODUCTION) {
    console.error('Refusing to tear down production. Remove content through /admin instead.');
    process.exit(1);
  }
  const ids = [];
  for (const s of ['lezen', 'luisteren', 'schrijven', 'spreken']) ids.push(await examId(s));
  const inList = `in.(${ids.join(',')})`;
  await remove('stimuli', `exam_id=${inList}`);
  await remove('open_tasks', `exam_id=${inList}`);
  await remove('exam_parts', `exam_id=${inList}`);
  await remove('rubrics', `system_prompt=eq.${encodeURIComponent(SYSTEM_PROMPT_MARKER)}`);
  await patch('exams', `id=${inList}`, { published: false, title: null });
  console.log('Removed the test stimuli, questions, tasks, parts and draft rubrics.');
  console.log('Audio objects under question-audio/testdata/ are left; they are harmless and free.');
}

/* ── main ────────────────────────────────────────────────────────────────── */

const SEEDERS = {
  lezen: seedLezen,
  luisteren: seedLuisteren,
  schrijven: seedSchrijven,
  spreken: seedSpreken,
};

async function main() {
  if (command === 'teardown') return teardown();

  const wanted = command === 'all' ? Object.keys(SEEDERS) : [command];
  for (const w of wanted) {
    if (!SEEDERS[w]) {
      console.error(`Unknown skill "${w}". Use: lezen | luisteren | schrijven | spreken | teardown`);
      process.exit(1);
    }
  }

  if (!NO_AUDIO && !env.ELEVEN_LAPS_API_KEY) {
    console.log('! ELEVEN_LAPS_API_KEY not set — running as --no-audio.\n');
  }
  if (!NO_AUDIO && !FFMPEG) {
    console.log('! ffmpeg not on PATH — audio will skip the -20 LUFS loudnorm pass.\n');
  }

  const madeRubrics = await ensureRubrics();
  if (madeRubrics > 0) {
    console.log(`Created ${madeRubrics} DRAFT rubric(s) so the publish gate passes.`);
    console.log('  These are placeholders, not the docent\'s criteria. Rewrite them in');
    console.log('  /admin/rubrics before any of this is treated as a real grade.\n');
  }

  const allErrors = [];
  for (const w of wanted) {
    console.log(`${w}:`);
    const result = await SEEDERS[w]();
    const { errors, ...counts } = result;
    console.log(
      `  ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}` +
        (errors.length ? ` — ${errors.length} publish error(s)` : ' — publish gate clean')
    );
    for (const e of errors) {
      console.log(`    ${e}`);
      allErrors.push(`${w}: ${e}`);
    }
  }

  if (PRODUCTION) {
    console.log('\nSeeded to PRODUCTION and published.');
    console.log('Marieke still has to review every item — /admin/opgaven and /admin/questions.');
    console.log('The rubrics are drafts: rewrite them in /admin/rubrics before a grade counts.');
  } else {
    console.log('\nSeeded as TESTDATA. Not exam material — see the header of this file.');
    console.log('Remove it with: node scripts/seed-test-exams.mjs teardown');
  }
  process.exit(allErrors.length ? 1 : 0);
}

main().catch(err => {
  console.error(`\nERROR: ${err.message}`);
  process.exit(1);
});
