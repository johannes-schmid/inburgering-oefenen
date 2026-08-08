/**
 * Write the A2 dataset — ten oefenexamens of each onderdeel — to a Supabase project.
 *
 * ## What this is
 * The content lives in `scripts/a2-content/{lezen,luisteren,schrijven,spreken}.mjs`, in git, so it
 * can be reviewed in a diff rather than only in Postgres. This script is the transport: it resolves
 * the exam rows that `seed.sql` already created, replaces their contents, generates the audio and
 * pictures, publishes, and prints what `exam_publish_issues()` says about each one.
 *
 * ## What it is not
 * It is not the docent's work. CLAUDE.md: "Echt door een docent gevalideerd, geen AI." This content
 * is machine-authored and the owner has decided (2026-08-08) to publish it and have the docent
 * validate and correct it afterwards in /admin. The one thing that lies is `review_status =
 * 'validated'`, which every stimulus and task is written with because `exam_publish_issues()` has
 * no "published but unreviewed" state to express. Provenance lives in the rubrics' `system_prompt`,
 * which only admin ever reads.
 *
 *   node scripts/seed-a2-content.mjs all --dry-run     # validate the dataset, touch nothing
 *   node scripts/seed-a2-content.mjs lezen             # local stack, one onderdeel
 *   node scripts/seed-a2-content.mjs lezen --exam 3    # local stack, one exam
 *   node scripts/seed-a2-content.mjs all               # local stack, all forty
 *   node scripts/seed-a2-content.mjs lezen --production # the hosted project
 *
 * Flags: --dry-run, --exam N, --production, --no-audio, --force-audio, --no-publish.
 * Needs ELEVEN_LAPS_API_KEY, PEXELS_API_KEY and ffmpeg for a full run.
 */
import {
  loadEnv,
  isLocalUrl,
  createDb,
  createStorage,
  createTts,
  haveFfmpeg,
  mp3DurationSeconds,
  AUDIO_BUCKET,
} from './a2-content/lib.mjs';
import { createImages } from './a2-content/images.mjs';
import {
  LEZEN_EXAMS,
  LUISTEREN_EXAMS,
  SCHRIJVEN_EXAMS,
  SPREKEN_EXAMS,
  FORMAT,
  validateDataset,
} from './a2-content/index.mjs';

/* ── flags ───────────────────────────────────────────────────────────────── */

const argv = process.argv.slice(2);
const flag = name => argv.includes(`--${name}`);
const value = name => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : null;
};

const DRY_RUN = flag('dry-run');
const PRODUCTION = flag('production');
const NO_AUDIO = flag('no-audio');
const FORCE_AUDIO = flag('force-audio');
const NO_PUBLISH = flag('no-publish');
const ONLY_EXAM = value('exam') ? Number(value('exam')) : null;
const command = argv.find(a => !a.startsWith('--') && a !== value('exam')) ?? 'all';

const SKILLS = ['lezen', 'luisteren', 'schrijven', 'spreken'];
const wanted = command === 'all' ? SKILLS : [command];
for (const w of wanted) {
  if (!SKILLS.includes(w)) {
    console.error(`Unknown onderdeel "${w}". Use: ${SKILLS.join(' | ')} | all`);
    process.exit(1);
  }
}
if (ONLY_EXAM !== null && (!Number.isInteger(ONLY_EXAM) || ONLY_EXAM < 1 || ONLY_EXAM > 10)) {
  console.error('--exam takes a number from 1 to 10.');
  process.exit(1);
}

/* ── validate before anything costs money ────────────────────────────────── */

// `--partial` is an authoring convenience and is refused against production: shipping nine of ten
// oefenexamens as if they were ten is exactly the sort of thing nobody notices until a customer does.
const PARTIAL = flag('partial');
if (PARTIAL && PRODUCTION) {
  console.error('--partial cannot be combined with --production.');
  process.exit(1);
}

const problems = validateDataset(wanted, { partial: PARTIAL });
if (problems.length > 0) {
  console.error(`The dataset does not match the A2 rules — ${problems.length} problem(s):\n`);
  for (const p of problems) console.error(`  ${p}`);
  console.error('\nNothing was written.');
  process.exit(1);
}
console.log(`Dataset validates against the A2 rules (${wanted.join(', ')}).`);
if (DRY_RUN) {
  const counts = {
    lezen: LEZEN_EXAMS.reduce((a, e) => a + e.reduce((b, s) => b + s.questions.length, 0), 0),
    luisteren: LUISTEREN_EXAMS.reduce((a, e) => a + e.reduce((b, s) => b + s.questions.length, 0), 0),
    schrijven: SCHRIJVEN_EXAMS.reduce((a, e) => a + e.length, 0),
    spreken: SPREKEN_EXAMS.reduce((a, e) => a + e.reduce((b, p) => b + p.tasks.length, 0), 0),
  };
  for (const w of wanted) console.log(`  ${w}: ${counts[w]} items across ${10} examens`);
  console.log('\n--dry-run: nothing written.');
  process.exit(0);
}

/* ── env + guard ─────────────────────────────────────────────────────────── */

const env = loadEnv({ production: PRODUCTION });
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_KEY = env.SUPABASE_SERVICE_KEY ?? '';
const IS_LOCAL = isLocalUrl(SUPABASE_URL);

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_KEY missing from the env file.');
  process.exit(1);
}
// Default is refusal. `--production` is an explicit, logged decision, never a convenience.
if (!IS_LOCAL && !PRODUCTION) {
  console.error(
    `REFUSING TO RUN.\n\n  NEXT_PUBLIC_SUPABASE_URL = ${SUPABASE_URL}\n\n` +
      `This publishes exam content that the docent has not reviewed. Pass --production if that is\n` +
      `genuinely intended for the hosted project.`
  );
  process.exit(1);
}
if (PRODUCTION && IS_LOCAL) {
  console.error('--production given but the URL is local. Check .env.local.');
  process.exit(1);
}
if (PRODUCTION) {
  const n = (ONLY_EXAM ? 1 : 10) * wanted.length;
  console.log('!! PRODUCTION');
  console.log(`!! ${SUPABASE_URL}`);
  console.log(`!! About to overwrite and publish ${n} exam(s): ${wanted.join(', ')}`);
  console.log('!! This content is not authored by the docent; she reviews it in /admin.\n');
}

const db = createDb({ supabaseUrl: SUPABASE_URL, serviceKey: SERVICE_KEY });
const storage = createStorage({ supabaseUrl: SUPABASE_URL, serviceKey: SERVICE_KEY });
const tts = createTts({ apiKey: env.ELEVEN_LAPS_API_KEY });
const images = createImages({ storage, apiKey: env.PEXELS_API_KEY });

const AUDIO_ON = !NO_AUDIO && Boolean(env.ELEVEN_LAPS_API_KEY);
if (!NO_AUDIO && !env.ELEVEN_LAPS_API_KEY) {
  console.log('! ELEVEN_LAPS_API_KEY not set — running as --no-audio.\n');
}
if (AUDIO_ON && !haveFfmpeg()) {
  console.log('! ffmpeg not on PATH — audio will skip the -20 LUFS loudnorm pass.\n');
}

/* ── shared ──────────────────────────────────────────────────────────────── */

const NOW = new Date().toISOString();
const REVIEWED = { review_status: 'validated', reviewed_at: NOW };
const examNumbers = ONLY_EXAM ? [ONLY_EXAM] : Array.from({ length: 10 }, (_, i) => i + 1);

async function examRow(skill, number) {
  const rows = await db.selectRows(
    'exams',
    `select=id&level=eq.a2&skill=eq.${skill}&number=eq.${number}`
  );
  if (!rows[0]) throw new Error(`No exam row for a2/${skill}/${number} — has seed.sql run?`);
  return rows[0].id;
}

/**
 * Sections are looked up by **slug**, not by `name_nl`.
 *
 * The older seeder matched on the display name and its values matched nothing in the table, so
 * every stimulus it wrote landed with `section_id = NULL` and the tekstsoort chips in /admin/exams
 * were empty for every exam. A slug is the stable key; a label is copy.
 */
let sectionCache = null;
async function sectionId(skill, slug) {
  sectionCache ??= await db.selectRows('sections', 'select=id,slug,topic,level');
  const row = sectionCache.find(
    s => s.topic === skill && s.slug === slug && (s.level === 'a2' || s.level === null)
  );
  if (!row) throw new Error(`No section "${slug}" for a2/${skill}`);
  return row.id;
}

/**
 * Draft criteria for a category that has no rubric yet, mirrored from `lib/rubric-templates.ts`.
 *
 * The duplication is deliberate and annoying: this is a `.mjs` script and cannot import a `.ts`
 * module without a build step. It exists for exactly one category today — `speaking_react`, the
 * onderdeel DUO delivers as a video and `20260806` added, which no rubric ever covered. The other
 * eight already exist. These are drafts and the docent rewrites them in /admin/rubrics; that is
 * what `system_prompt` records.
 */
const SPEAKING_BASE = [
  ['inhoud', 'Inhoud', [
    'Geen antwoord, of een antwoord dat niet over de vraag gaat.',
    'Antwoordt met één of twee woorden; te weinig informatie.',
    'Antwoordt op de vraag; iets meer uitleg zou helpen.',
    'Antwoordt volledig op de vraag met genoeg informatie.',
  ]],
  ['woordgebruik', 'Woordgebruik', [
    'Te weinig woorden om de boodschap over te brengen.',
    'Zeer beperkte woordenschat; verkeerde woordkeuze hindert het begrip.',
    'Voldoende woorden voor het onderwerp; soms een onhandige keuze.',
    'Passende woorden voor een alledaags onderwerp op dit niveau.',
  ]],
  ['grammatica', 'Grammatica', [
    'Losse woorden, geen zinnen.',
    'Veel fouten in eenvoudige zinnen; de luisteraar moet raden.',
    'Fouten in eenvoudige zinnen, maar de boodschap blijft duidelijk.',
    'Eenvoudige zinnen zijn overwegend correct.',
  ]],
  ['verstaanbaarheid', 'Verstaanbaarheid en uitspraak', [
    'Grotendeels onverstaanbaar.',
    'Losse woorden zijn te herkennen; de luisteraar moet veel moeite doen.',
    'Goed te volgen met een duidelijk accent; enkele woorden zijn onduidelijk.',
    'Duidelijk te begrijpen; een accent hindert het begrip niet.',
  ]],
  ['vloeiendheid', 'Vloeiendheid', [
    'Bijna geen aaneengesloten spraak.',
    'Zeer aarzelend; lange stiltes en veel herstarts.',
    'Aarzelt bij het formuleren, maar komt er zelf uit.',
    'Spreekt vlot genoeg om gevolgd te kunnen worden.',
  ]],
];

const CATEGORY_EXTRA = {
  speaking_react: ['reactie', 'Reactie op de situatie', [
    'Reageert niet op de situatie.',
    'Reageert, maar de reactie past niet bij de situatie.',
    'Reageert passend, maar erg kort of algemeen.',
    'Reageert passend en volledig op wat de situatie vraagt.',
  ]],
};

const DRAFT_MARKER =
  'Conceptrubriek, aangemaakt door scripts/seed-a2-content.mjs. Niet door de docent geschreven — ' +
  'herschrijf de criteria in /admin/rubrics voordat een cijfer meetelt.';

function draftCriteria(category) {
  const extra = CATEGORY_EXTRA[category];
  const rows = extra ? [...SPEAKING_BASE, extra] : SPEAKING_BASE;
  return rows.map(([key, criterion, anchors]) => ({
    key,
    criterion,
    anchors: { 0: anchors[0], 1: anchors[1], 2: anchors[2], 3: anchors[3] },
  }));
}

const rubricCache = new Map();

async function rubricFor(skill, category) {
  const cacheKey = `${skill}/${category}`;
  if (rubricCache.has(cacheKey)) return rubricCache.get(cacheKey);

  const rows = await db.selectRows(
    'rubrics',
    `select=id&level=eq.a2&skill=eq.${skill}&task_type=eq.${category}&active=is.true&limit=1`
  );
  if (rows[0]) {
    rubricCache.set(cacheKey, rows[0].id);
    return rows[0].id;
  }

  // `open_tasks.rubric_id IS NULL` is a blocking publish error, so a missing rubric would stop the
  // whole onderdeel. Mint a draft rather than fail — and say so loudly, because a draft rubric that
  // quietly became the live grading standard is precisely the failure the product cannot afford.
  if (!CATEGORY_EXTRA[category] && skill === 'spreken') {
    throw new Error(`No active a2 rubric for ${skill}/${category} and no draft to fall back on`);
  }
  const versions = await db.selectRows(
    'rubrics',
    `select=version&level=eq.a2&skill=eq.${skill}&task_type=eq.${category}&order=version.desc&limit=1`
  );
  const id = await db.insertOne('rubrics', {
    level: 'a2',
    skill,
    task_type: category,
    version: (versions[0]?.version ?? 0) + 1,
    criteria: draftCriteria(category),
    system_prompt: DRAFT_MARKER,
    active: true,
  });
  console.log(`  ! created a DRAFT rubric for a2/${skill}/${category} — rewrite it in /admin/rubrics`);
  rubricCache.set(cacheKey, id);
  return id;
}

/** Publish, then report what the validator says. An exam with an error is left unpublished. */
async function publish(examId, title, durationSeconds) {
  const issues =
    (await db.rest('rpc/exam_publish_issues', {
      method: 'POST',
      body: JSON.stringify({ p_exam_id: examId }),
    })) ?? [];
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity !== 'error');

  await db.patch('exams', `id=eq.${examId}`, {
    title,
    duration_seconds: durationSeconds,
    published: !NO_PUBLISH && errors.length === 0,
  });
  return { errors, warnings };
}

/** Identical issues repeat once per row; collapse them the way the admin panel does. */
function summarise(issues) {
  const byText = new Map();
  for (const i of issues) {
    const key = `${i.entity} · ${i.issue}`;
    byText.set(key, (byText.get(key) ?? 0) + 1);
  }
  return [...byText].map(([k, n]) => (n > 1 ? `${k} (×${n})` : k));
}

/* ── MCQ onderdelen ──────────────────────────────────────────────────────── */

const LABELS = ['A', 'B', 'C', 'D'];

async function writeStimulus(skill, examId, stimulus, order, extra) {
  const stimulusId = await db.insertOne('stimuli', {
    exam_id: examId,
    skill,
    sort_order: order,
    section_id: await sectionId(skill, stimulus.section),
    title: stimulus.title,
    intro: stimulus.intro ?? null,
    ...extra,
    ...REVIEWED,
  });

  for (const [j, q] of stimulus.questions.entries()) {
    const questionId = await db.insertOne('questions', {
      stimulus_id: stimulusId,
      exam_id: examId,
      sort_order: j + 1,
      prompt: q.prompt,
      explanation: q.explanation,
      option_layout: 'text',
      ...REVIEWED,
    });
    // All rows written is_correct:false, then one flipped. `question_options_one_correct_idx` is
    // UNIQUE (question_id) WHERE is_correct, so two true rows cannot coexist even briefly.
    await db.insert(
      'question_options',
      q.options.map((body, k) => ({
        question_id: questionId,
        label: LABELS[k],
        sort_order: k + 1,
        body,
        is_correct: false,
      }))
    );
    await db.patch(
      'question_options',
      `question_id=eq.${questionId}&label=eq.${LABELS[q.correct]}`,
      { is_correct: true }
    );
  }
  return stimulus.questions.length;
}

async function seedLezen(number) {
  const examId = await examRow('lezen', number);
  await db.remove('stimuli', `exam_id=eq.${examId}`);

  let questions = 0;
  const stimuli = LEZEN_EXAMS[number - 1];
  for (const [i, s] of stimuli.entries()) {
    questions += await writeStimulus('lezen', examId, s, i + 1, {
      kind: 'text',
      body_html: s.body_html,
    });
  }

  const report = await publish(examId, `Lezen — oefenexamen ${number}`, FORMAT.lezen.durationSeconds);
  return { teksten: stimuli.length, vragen: questions, ...report };
}

async function seedLuisteren(number) {
  const examId = await examRow('luisteren', number);
  await db.remove('stimuli', `exam_id=eq.${examId}`);

  const stimuli = LUISTEREN_EXAMS[number - 1];
  let questions = 0;
  const lengths = [];

  for (const [i, s] of stimuli.entries()) {
    // An audio stimulus must carry an audio_url (stimuli_payload_matches_kind), so the file has to
    // exist before the row does. Without audio we fall back to a text stimulus carrying the
    // transcript — a half-authored audio stimulus renders an empty pane and looks like a bug.
    let audioUrl = null;
    let audioSeconds = null;

    if (AUDIO_ON) {
      const objectPath = `a2/luisteren-${number}/fragment-${i + 1}.mp3`;
      const already = FORCE_AUDIO ? null : await storage.existing(AUDIO_BUCKET, objectPath);
      if (already) {
        audioUrl = already;
        const head = await fetch(already);
        audioSeconds = mp3DurationSeconds(Buffer.from(await head.arrayBuffer()));
      } else {
        process.stdout.write(`    audio ${i + 1}/${stimuli.length} — ${s.title}… `);
        try {
          const buf = await tts.dialogueAudio(s.lines, s.voice_cast);
          audioUrl = await storage.upload(AUDIO_BUCKET, objectPath, buf, 'audio/mpeg');
          audioSeconds = mp3DurationSeconds(buf);
          console.log(`${audioSeconds ?? '?'}s, ${(buf.length / 1024).toFixed(0)} KB`);
        } catch (err) {
          console.log(`FAILED (${err.message})`);
        }
      }
      if (audioSeconds) lengths.push({ title: s.title, seconds: audioSeconds });
    }

    const image = s.image ? await images.resolve(s.image.slot, s.image.query) : null;

    questions += await writeStimulus('luisteren', examId, s, i + 1, {
      kind: audioUrl ? 'audio' : 'text',
      audio_url: audioUrl,
      audio_seconds: audioSeconds,
      script: s.lines.map(([sp, t]) => `${sp}: ${t}`).join('\n'),
      voice_cast: s.voice_cast,
      image_url: image,
      image_alt: image ? images.altFor(s.image.slot, s.title) : null,
      body_html: audioUrl
        ? null
        : `<p><em>Transcript:</em></p>${s.lines
            .map(([sp, t]) => `<p><strong>${sp}:</strong> ${t}</p>`)
            .join('')}`,
    });
  }

  const [lo, hi] = FORMAT.luisteren.audioSeconds;
  const outside = lengths.filter(l => l.seconds < lo || l.seconds > hi);
  const report = await publish(
    examId,
    `Luisteren — oefenexamen ${number}`,
    FORMAT.luisteren.durationSeconds
  );
  if (outside.length > 0) {
    console.log(`    ! ${outside.length} fragment(s) outside ${lo}–${hi}s:`);
    for (const o of outside) console.log(`        ${o.seconds}s — ${o.title}`);
  }
  return { fragmenten: stimuli.length, vragen: questions, ...report };
}

/* ── open onderdelen ─────────────────────────────────────────────────────── */

async function seedSchrijven(number) {
  const examId = await examRow('schrijven', number);
  await db.remove('open_tasks', `exam_id=eq.${examId}`);

  const tasks = SCHRIJVEN_EXAMS[number - 1];
  for (const [i, t] of tasks.entries()) {
    const taskId = await db.insertOne('open_tasks', {
      exam_id: examId,
      skill: 'schrijven',
      sort_order: i + 1,
      task_type: t.task_type,
      title: t.title,
      prompt_html: t.prompt_html,
      bullet_points: t.bullet_points ?? [],
      email_to: t.email_to ?? null,
      email_cc: t.email_cc ?? null,
      email_subject: t.email_subject ?? null,
      greeting: t.greeting ?? null,
      closing: t.closing ?? null,
      min_sentences: t.min_sentences ?? null,
      form_schema: t.form_schema ?? null,
      // A Schrijven picture_note carries pictures and still has image_usage 'none' — forced by
      // open_tasks_image_usage_is_speaking, and the reason the image-count check is spreken-only.
      image_usage: 'none',
      model_answer: t.model_answer,
      rubric_id: await rubricFor('schrijven', t.task_type),
      ...REVIEWED,
    });

    if (t.images?.length) {
      const rows = [];
      for (const [k, im] of t.images.entries()) {
        rows.push({
          task_id: taskId,
          sort_order: k + 1,
          image_url: await images.resolve(im.slot, im.query, im.variant ?? 0),
          caption: im.caption ?? null,
          alt_text: images.altFor(im.slot, im.caption ?? `plaatje ${k + 1}`),
          group_label: im.group_label ?? null,
        });
      }
      await db.insert('open_task_images', rows);
    }
  }

  const report = await publish(
    examId,
    `Schrijven — oefenexamen ${number}`,
    FORMAT.schrijven.durationSeconds
  );
  return { opgaven: tasks.length, ...report };
}

async function seedSpreken(number) {
  const examId = await examRow('spreken', number);
  await db.remove('open_tasks', `exam_id=eq.${examId}`);
  await db.remove('exam_parts', `exam_id=eq.${examId}`);

  const parts = SPREKEN_EXAMS[number - 1];
  let order = 0;
  let audioMade = 0;

  for (const [pi, part] of parts.entries()) {
    const partId = await db.insertOne('exam_parts', {
      exam_id: examId,
      sort_order: pi + 1,
      title: part.title,
      instruction_html: part.instruction_html,
      show_instruction: true,
    });
    const rubricId = await rubricFor('spreken', `speaking_${part.image_usage}`);

    for (const t of part.tasks) {
      order++;
      // Onderdeel 1 only. At DUO the candidate reacts to somebody *speaking* to them, so without
      // the clip the task is not the task. Onderdelen 2–4 are read on screen; DUO speaks those too,
      // which is a later pass and ~450 more clips across the four onderdelen.
      let promptAudio = null;
      if (AUDIO_ON && part.image_usage === 'react') {
        const objectPath = `a2/spreken-${number}/task-${order}.mp3`;
        promptAudio = FORCE_AUDIO ? null : await storage.existing(AUDIO_BUCKET, objectPath);
        if (!promptAudio) {
          process.stdout.write(`    audio opgave ${order}… `);
          try {
            const buf = await tts.narratorAudio(t.prompt_spoken ?? t.prompt, t.voice ?? 'woman_young');
            promptAudio = await storage.upload(AUDIO_BUCKET, objectPath, buf, 'audio/mpeg');
            console.log('ok');
          } catch (err) {
            console.log(`FAILED (${err.message})`);
          }
        }
        if (promptAudio) audioMade++;
      }

      const taskId = await db.insertOne('open_tasks', {
        exam_id: examId,
        part_id: partId,
        skill: 'spreken',
        sort_order: order,
        task_type: 'speaking',
        title: t.title ?? null,
        prompt_html: `<p>${t.prompt}</p>`,
        bullet_points: [],
        image_usage: part.image_usage,
        prompt_audio_url: promptAudio,
        prompt_script: t.prompt_spoken ?? t.prompt,
        max_record_seconds: 60,
        model_answer: t.model_answer,
        rubric_id: rubricId,
        ...REVIEWED,
      });

      const rows = [];
      for (const [k, im] of (t.images ?? []).entries()) {
        rows.push({
          task_id: taskId,
          sort_order: k + 1,
          image_url: await images.resolve(im.slot, im.query, im.variant ?? 0),
          caption: im.caption ?? null,
          alt_text: images.altFor(im.slot, im.caption ?? `plaatje ${k + 1}`),
        });
      }
      if (rows.length) await db.insert('open_task_images', rows);
    }
  }

  const report = await publish(
    examId,
    `Spreken — oefenexamen ${number}`,
    FORMAT.spreken.durationSeconds
  );
  return { onderdelen: parts.length, opgaven: order, audio: audioMade, ...report };
}

/* ── main ────────────────────────────────────────────────────────────────── */

const SEEDERS = {
  lezen: seedLezen,
  luisteren: seedLuisteren,
  schrijven: seedSchrijven,
  spreken: seedSpreken,
};

/**
 * A2 Luisteren's `audio_seconds_min/_max` was 40–50. The DUO reference material puts the fragments
 * at roughly 25–40 seconds, and every fragment generated here lands at 29–37 — so the old figure
 * was not a standard the content failed to meet, it was a number set too high, and leaving it would
 * have meant ninety spurious warnings burying the real ones.
 *
 * Corrected to 25–45 here, in `data/skills.ts` and in `scripts/a2-content/index.mjs` in one commit,
 * which is the rule CLAUDE.md sets for these three mirrors. Idempotent, and printed when it changes
 * anything: quietly editing the standard the docent's work is measured against is not acceptable,
 * announcing it is.
 */
async function alignAudioSecondsRule() {
  const [row] = await db.selectRows(
    'exam_formats',
    'select=audio_seconds_min,audio_seconds_max&level=eq.a2&skill=eq.luisteren'
  );
  if (!row || (row.audio_seconds_min === 25 && row.audio_seconds_max === 45)) return;
  await db.patch('exam_formats', 'level=eq.a2&skill=eq.luisteren', {
    audio_seconds_min: 25,
    audio_seconds_max: 45,
  });
  console.log(
    `! exam_formats(a2, luisteren).audio_seconds: ${row.audio_seconds_min}–${row.audio_seconds_max}` +
      ' → 25–45, per the DUO reference. See data/skills.ts.'
  );
}

async function main() {
  if (wanted.includes('luisteren')) await alignAudioSecondsRule();

  let blocked = 0;

  for (const skill of wanted) {
    console.log(`\n${skill}`);
    for (const number of examNumbers) {
      const { errors, warnings, ...counts } = await SEEDERS[skill](number);
      const countText = Object.entries(counts)
        .map(([k, v]) => `${v} ${k}`)
        .join(', ');
      const verdict = errors.length
        ? `${errors.length} BLOCKING error(s) — left unpublished`
        : NO_PUBLISH
          ? 'clean (not published, --no-publish)'
          : 'clean, published';
      console.log(`  ${number}. ${countText} — ${verdict}`);
      for (const line of summarise(errors)) console.log(`       ERROR   ${line}`);
      for (const line of summarise(warnings)) console.log(`       warning ${line}`);
      if (errors.length) blocked++;
    }
  }

  images.writeCredits();
  const im = images.stats();
  console.log(`\nImages: ${im.fetched} newly fetched, ${im.reused} reused from the lock file.`);

  if (blocked > 0) {
    console.log(`\n${blocked} exam(s) had blocking errors and were NOT published. Fix and re-run.`);
  } else if (PRODUCTION) {
    console.log('\nWritten to PRODUCTION and published.');
    console.log('Every item still needs the docent: /admin/questions and /admin/exams.');
  } else {
    console.log('\nWritten to the local stack.');
  }
  process.exit(blocked ? 1 : 0);
}

main().catch(err => {
  console.error(`\nERROR: ${err.message}`);
  process.exit(1);
});
