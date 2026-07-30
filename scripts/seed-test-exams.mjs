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
const CONTAINER = 'supabase_db_inburgering-oefenen';
const BUCKET = 'question-audio';

const args = process.argv.slice(2);
const NO_AUDIO = args.includes('--no-audio');
// Audio is the expensive part (26 ElevenLabs generations for Luisteren + Spreken). Existing objects
// are reused unless --force-audio, so re-seeding after a content edit costs nothing.
const FORCE_AUDIO = args.includes('--force-audio');
const command = args.find(a => !a.startsWith('--')) ?? 'all';

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

const env = { ...readEnv('.env.local'), ...readEnv('.env.development.local') };
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_KEY = env.SUPABASE_SERVICE_KEY ?? '';

// The whole point of the guard: this content must never reach a real candidate.
if (!/^https?:\/\/(127\.0\.0\.1|localhost)[:/]/.test(SUPABASE_URL)) {
  console.error(
    `REFUSING TO RUN.\n\n` +
      `  NEXT_PUBLIC_SUPABASE_URL = ${SUPABASE_URL || '(unset)'}\n\n` +
      `This script seeds placeholder exam content that is not written by the docent. It only runs\n` +
      `against the local stack (127.0.0.1). Nothing here may reach production.`
  );
  process.exit(1);
}

/* ── sql helper ──────────────────────────────────────────────────────────── */

function sql(text, { quiet = true } = {}) {
  const res = spawnSync(
    'docker',
    ['exec', '-i', CONTAINER, 'psql', '-U', 'postgres', '-d', 'postgres', ...(quiet ? ['-q'] : []), '-v', 'ON_ERROR_STOP=1'],
    { input: text, encoding: 'utf8' }
  );
  if (res.status !== 0) {
    throw new Error(`psql failed:\n${res.stderr || res.stdout}`);
  }
  return res.stdout;
}

/**
 * One scalar back from psql.
 *
 * `-q` matters: without it psql writes the command tag ("INSERT 0 1") to stdout alongside the
 * RETURNING value, so `Number(...)` on the result is NaN and the id silently becomes garbage that
 * only surfaces two statements later as "column nan does not exist".
 */
function scalar(query) {
  const out = spawnSync(
    'docker',
    ['exec', '-i', CONTAINER, 'psql', '-U', 'postgres', '-d', 'postgres', '-q', '-tAc', query],
    { encoding: 'utf8' }
  );
  if (out.status !== 0) throw new Error(out.stderr || out.stdout);
  return out.stdout.trim().split('\n')[0].trim();
}

const q = v => (v == null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);
const jsonb = v => `${q(JSON.stringify(v))}::jsonb`;

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

function ensureRubrics() {
  let made = 0;
  for (const [skill, category, kind] of CATEGORIES) {
    const existing = scalar(
      `select id from rubrics where skill='${skill}' and task_type='${category}' and active limit 1`
    );
    if (existing) continue;
    const next = scalar(
      `select coalesce(max(version),0)+1 from rubrics where skill='${skill}' and task_type='${category}'`
    );
    sql(`
      insert into rubrics (skill, task_type, version, criteria, system_prompt, active)
      values ('${skill}', '${category}', ${next}, ${jsonb(criteriaJson(kind))},
              ${q(SYSTEM_PROMPT_MARKER)}, true);
    `);
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

function examId(skill) {
  const id = scalar(`select id from exams where skill='${skill}' and number=1`);
  if (!id) throw new Error(`No exam row for ${skill} 1 — run supabase db reset first.`);
  return Number(id);
}

function sectionId(skill, name) {
  const id = scalar(
    `select id from sections where topic='${skill}' and name_nl=${q(name)} limit 1`
  );
  return id ? Number(id) : null;
}

/** Deterministic placeholder image. Obviously not real exam art, which is the point. */
const img = (seed, n = 0) => `https://picsum.photos/seed/${seed}-${n}/640/480`;

function markTitle(skill) {
  return `${TEST_MARKER} — oefenexamen ${skill} 1`;
}

function publish(id, skill) {
  sql(`update exams set published = true, title = ${q(markTitle(skill))} where id = ${id};`);
  const issues = spawnSync(
    'docker',
    ['exec', '-i', CONTAINER, 'psql', '-U', 'postgres', '-d', 'postgres', '-tAc',
     `select severity || ' · ' || entity || ' · ' || issue from exam_publish_issues(${id}) where severity='error'`],
    { encoding: 'utf8' }
  ).stdout.trim();
  return issues ? issues.split('\n') : [];
}

/* ── seeders ─────────────────────────────────────────────────────────────── */

function seedMcq(skill, stimuli, audioUrls = {}) {
  const id = examId(skill);
  sql(`delete from stimuli where exam_id = ${id};`);

  let order = 0;
  let questionCount = 0;

  for (const [i, s] of stimuli.entries()) {
    order++;
    const sec = s.section ? sectionId(skill, s.section) : null;
    const isAudio = skill === 'luisteren';
    const audioUrl = audioUrls[i] ?? null;

    // An audio stimulus must carry audio (a CHECK enforces it), so fall back to a text stimulus
    // when --no-audio is used: a half-authored pane renders empty and looks like a bug.
    const kind = isAudio && audioUrl ? 'audio' : 'text';
    const body =
      kind === 'text' && isAudio
        ? `<p><em>[${TEST_MARKER}] Geen audio gegenereerd. Transcript:</em></p>` +
          s.lines.map(([sp, t]) => `<p><strong>${sp}:</strong> ${t}</p>`).join('')
        : (s.body_html ?? null);

    const script = isAudio ? s.lines.map(([sp, t]) => `${sp}: ${t}`).join('\n') : null;

    const sid = Number(
      scalar(`
        insert into stimuli (exam_id, skill, sort_order, section_id, kind, title, body_html, audio_url,
                             script, voice_cast, review_status, reviewed_at)
        values (${id}, '${skill}', ${order}, ${sec ?? 'NULL'}, '${kind}', ${q(s.title)}, ${q(body)},
                ${q(audioUrl)}, ${q(script)}, ${s.voice_cast ? jsonb(s.voice_cast) : "'{}'::jsonb"},
                'validated', now())
        returning id
      `.replace(/\s+/g, ' '))
    );

    for (const [j, qq] of s.questions.entries()) {
      const qid = Number(
        scalar(`
          insert into questions (stimulus_id, exam_id, sort_order, prompt, explanation,
                                 option_layout, review_status, reviewed_at)
          values (${sid}, ${id}, ${j + 1}, ${q(qq.prompt)}, ${q(qq.explanation)},
                  'text', 'validated', now())
          returning id
        `.replace(/\s+/g, ' '))
      );
      const labels = ['A', 'B', 'C', 'D'];
      const values = qq.options
        .map((body, k) => `(${qid}, '${labels[k]}', ${k + 1}, ${q(body)}, false)`)
        .join(',');
      sql(`insert into question_options (question_id, label, sort_order, body, is_correct) values ${values};`);
      sql(`update question_options set is_correct = true
           where question_id = ${qid} and label = '${labels[qq.correct]}';`);
      questionCount++;
    }
  }

  const errors = publish(id, skill);
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

function rubricFor(skill, category) {
  const id = scalar(
    `select id from rubrics where skill='${skill}' and task_type='${category}' and active limit 1`
  );
  return id ? Number(id) : null;
}

async function seedSchrijven() {
  const id = examId('schrijven');
  sql(`delete from open_tasks where exam_id = ${id};`);

  for (const [i, t] of SCHRIJVEN.entries()) {
    const rid = rubricFor('schrijven', t.task_type);
    const tid = Number(
      scalar(`
        insert into open_tasks (exam_id, skill, sort_order, task_type, title, prompt_html,
                                bullet_points, email_to, email_subject, greeting, closing,
                                min_sentences, form_schema, image_usage, model_answer, rubric_id,
                                review_status, reviewed_at)
        values (${id}, 'schrijven', ${i + 1}, '${t.task_type}', ${q(t.title)}, ${q(t.prompt_html)},
                ${jsonb(t.bullet_points ?? [])}, ${q(t.email_to)}, ${q(t.email_subject)},
                ${q(t.greeting)}, ${q(t.closing)}, ${t.min_sentences ?? 'NULL'},
                ${t.form_schema ? jsonb(t.form_schema) : 'NULL'}, 'none', ${q(t.model_answer)},
                ${rid ?? 'NULL'}, 'validated', now())
        returning id
      `.replace(/\s+/g, ' '))
    );

    for (const [k, im] of (t.images ?? []).entries()) {
      sql(`
        insert into open_task_images (task_id, sort_order, image_url, caption, alt_text, group_label)
        values (${tid}, ${k + 1}, ${q(img(im.seed))}, ${q(im.caption)}, ${q(im.caption)},
                ${q(im.group_label)});
      `);
    }
  }

  const errors = publish(id, 'schrijven');
  return { tasks: SCHRIJVEN.length, errors };
}

async function seedSpreken() {
  const id = examId('spreken');
  sql(`delete from open_tasks where exam_id = ${id}; delete from exam_parts where exam_id = ${id};`);

  let order = 0;
  let audioMade = 0;

  for (const [pi, part] of SPREKEN_PARTS.entries()) {
    const pid = Number(
      scalar(`
        insert into exam_parts (exam_id, sort_order, title, instruction_html, show_instruction)
        values (${id}, ${pi + 1}, ${q(part.title)}, ${q(part.instruction_html)}, true)
        returning id
      `.replace(/\s+/g, ' '))
    );

    const rid = rubricFor('spreken', `speaking_${part.image_usage}`);

    for (const t of part.tasks) {
      order++;
      let promptAudio = null;
      if (!NO_AUDIO && env.ELEVEN_LAPS_API_KEY) {
        const objectPath = `testdata/spreken-1/task-${order}.mp3`;
        promptAudio = await existingAudio(objectPath);
        if (!promptAudio) {
          process.stdout.write(`    audio ${order}/16… `);
          try {
            const buf = await narratorAudio(t.prompt);
            promptAudio = await upload(objectPath, buf);
            console.log('ok');
          } catch (err) {
            console.log(`FAILED (${err.message})`);
          }
        }
        if (promptAudio) audioMade++;
      }

      const tid = Number(
        scalar(`
          insert into open_tasks (exam_id, part_id, skill, sort_order, task_type, prompt_html,
                                  bullet_points, image_usage, prompt_audio_url, prompt_script,
                                  max_record_seconds, rubric_id, review_status, reviewed_at)
          values (${id}, ${pid}, 'spreken', ${order}, 'speaking', ${q(`<p>${t.prompt}</p>`)},
                  '[]'::jsonb, '${part.image_usage}', ${q(promptAudio)}, ${q(t.prompt)}, 60,
                  ${rid ?? 'NULL'}, 'validated', now())
          returning id
        `.replace(/\s+/g, ' '))
      );

      for (let k = 0; k < t.images; k++) {
        sql(`
          insert into open_task_images (task_id, sort_order, image_url, alt_text)
          values (${tid}, ${k + 1}, ${q(img(t.seed, k))}, ${q(`${TEST_MARKER} plaatje ${k + 1}`)});
        `);
      }
    }
  }

  const errors = publish(id, 'spreken');
  return { parts: SPREKEN_PARTS.length, tasks: order, audio: audioMade, errors };
}

/* ── teardown ────────────────────────────────────────────────────────────── */

function teardown() {
  const ids = ['lezen', 'luisteren', 'schrijven', 'spreken'].map(s => examId(s));
  sql(`
    delete from stimuli where exam_id in (${ids.join(',')});
    delete from open_tasks where exam_id in (${ids.join(',')});
    delete from exam_parts where exam_id in (${ids.join(',')});
    delete from rubrics where system_prompt = ${q(SYSTEM_PROMPT_MARKER)};
    update exams set published = (skill in ('lezen','luisteren')), title = null
      where id in (${ids.join(',')});
  `);
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

  const madeRubrics = ensureRubrics();
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

  console.log('\nSeeded as TESTDATA. Not exam material — see the header of this file.');
  console.log('Remove it with: node scripts/seed-test-exams.mjs teardown');
  process.exit(allErrors.length ? 1 : 0);
}

main().catch(err => {
  console.error(`\nERROR: ${err.message}`);
  process.exit(1);
});
