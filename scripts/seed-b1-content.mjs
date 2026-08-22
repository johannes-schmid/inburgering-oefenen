/**
 * Write the B1 dataset — ten oefenexamens of Lezen, Schrijven and Spreken — to a Supabase project.
 *
 * ## What this is
 * The transport half of the B1 pipeline. The content is authored by
 * `scripts/generate-b1-content.mjs` into `scripts/b1-content/generated/`, in git, so it is
 * reviewable in a diff rather than only in Postgres. This script resolves the exam rows that
 * `seed.sql` already created, replaces their contents, fetches the pictures, generates the
 * spoken prompts, publishes, and prints what `exam_publish_issues()` says about each one.
 *
 * ## What it is not
 * It is not the docent's work. CLAUDE.md: "Echt door een docent gevalideerd, geen AI." This
 * content is machine-authored and the owner has decided (2026-08-08, applied to B1 on
 * 2026-08-21) to publish it and have the docent validate and correct it afterwards in /admin.
 * The one field that lies is `review_status = 'validated'`, which every stimulus and task is
 * written with because `exam_publish_issues()` has no "published but unreviewed" state to
 * express. Provenance lives in this header and in the draft rubrics' `system_prompt`.
 *
 * ## Three onderdelen, not four
 * **Luisteren is absent because there is no B1 Luisteren reference material.** Its ten slots
 * stay empty and unpublished, and `exam_formats(b1, luisteren)` stays all-NULL. See the header
 * of `scripts/b1-content/index.mjs`.
 *
 *   node scripts/seed-b1-content.mjs all --dry-run        # validate the dataset, touch nothing
 *   node scripts/seed-b1-content.mjs lezen                # local stack, one onderdeel
 *   node scripts/seed-b1-content.mjs lezen --exam 3       # local stack, one exam
 *   node scripts/seed-b1-content.mjs all                  # local stack, all thirty
 *   node scripts/seed-b1-content.mjs all --production     # the hosted project
 *
 * Flags: --dry-run, --exam N, --production, --partial, --no-audio, --force-audio, --no-publish,
 *        --no-images.
 * Needs ELEVEN_LAPS_API_KEY (Spreken's react prompts) and PEXELS_API_KEY (the plaatjes).
 */
import {
  loadEnv,
  isLocalUrl,
  createDb,
  createStorage,
  createTts,
  haveFfmpeg,
  AUDIO_BUCKET,
} from './a2-content/lib.mjs';
import { createImages } from './a2-content/images.mjs';
import {
  LEZEN_EXAMS,
  SCHRIJVEN_EXAMS,
  SPREKEN_EXAMS,
  FORMAT,
  SKILLS,
  EXAM_COUNT,
  validateDataset,
} from './b1-content/index.mjs';
import { draftCriteria, DRAFT_MARKER } from './b1-content/rubrics.mjs';

const LEVEL = 'b1';

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
const NO_IMAGES = flag('no-images');
const PARTIAL = flag('partial');
const ONLY_EXAM = value('exam') ? Number(value('exam')) : null;
const command = argv.find(a => !a.startsWith('--') && a !== value('exam')) ?? 'all';

const wanted = command === 'all' ? SKILLS : [command];
for (const w of wanted) {
  if (!SKILLS.includes(w)) {
    console.error(`Unknown onderdeel "${w}". Use: ${SKILLS.join(' | ')} | all`);
    console.error('B1 Luisteren has no reference material and is deliberately not seeded.');
    process.exit(1);
  }
}
if (ONLY_EXAM !== null && (!Number.isInteger(ONLY_EXAM) || ONLY_EXAM < 1 || ONLY_EXAM > EXAM_COUNT)) {
  console.error(`--exam takes a number from 1 to ${EXAM_COUNT}.`);
  process.exit(1);
}

/* ── validate before anything costs money ────────────────────────────────── */

// `--partial` is an authoring convenience and is refused against production: shipping nine of
// ten oefenexamens as if they were ten is the sort of thing nobody notices until a customer does.
if (PARTIAL && PRODUCTION) {
  console.error('--partial cannot be combined with --production.');
  process.exit(1);
}

const problems = validateDataset(wanted, { partial: PARTIAL });
if (problems.length > 0) {
  console.error(`The dataset does not match the B1 rules — ${problems.length} problem(s):\n`);
  for (const p of problems.slice(0, 60)) console.error(`  ${p}`);
  if (problems.length > 60) console.error(`  … and ${problems.length - 60} more`);
  console.error('\nNothing was written. Run: node scripts/generate-b1-content.mjs <onderdeel>');
  process.exit(1);
}
console.log(`Dataset validates against the B1 rules (${wanted.join(', ')}).`);
if (DRY_RUN) {
  const counts = {
    lezen: LEZEN_EXAMS.reduce((a, e) => a + e.reduce((b, s) => b + s.questions.length, 0), 0),
    schrijven: SCHRIJVEN_EXAMS.reduce((a, e) => a + e.length, 0),
    spreken: SPREKEN_EXAMS.reduce((a, e) => a + e.reduce((b, p) => b + p.tasks.length, 0), 0),
  };
  for (const w of wanted) console.log(`  ${w}: ${counts[w]} items across ${EXAM_COUNT} examens`);
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
  const n = (ONLY_EXAM ? 1 : EXAM_COUNT) * wanted.length;
  console.log('!! PRODUCTION');
  console.log(`!! ${SUPABASE_URL}`);
  console.log(`!! About to overwrite and publish ${n} B1 exam(s): ${wanted.join(', ')}`);
  console.log('!! This content is not authored by the docent; she reviews it in /admin.\n');
}

const db = createDb({ supabaseUrl: SUPABASE_URL, serviceKey: SERVICE_KEY });
const storage = createStorage({ supabaseUrl: SUPABASE_URL, serviceKey: SERVICE_KEY });
const tts = createTts({ apiKey: env.ELEVEN_LAPS_API_KEY });
const images = createImages({
  storage,
  apiKey: env.PEXELS_API_KEY,
  dryRun: NO_IMAGES,
  level: LEVEL,
});

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
const examNumbers = ONLY_EXAM ? [ONLY_EXAM] : Array.from({ length: EXAM_COUNT }, (_, i) => i + 1);

async function examRow(skill, number) {
  const rows = await db.selectRows(
    'exams',
    `select=id&level=eq.${LEVEL}&skill=eq.${skill}&number=eq.${number}`
  );
  if (!rows[0]) throw new Error(`No exam row for ${LEVEL}/${skill}/${number} — has seed.sql run?`);
  return rows[0].id;
}

/** Sections are looked up by **slug**, never by `name_nl` — see the A2 seeder's note. */
let sectionCache = null;
async function sectionId(skill, slug) {
  sectionCache ??= await db.selectRows('sections', 'select=id,slug,topic,level');
  const row = sectionCache.find(
    s => s.topic === skill && s.slug === slug && (s.level === LEVEL || s.level === null)
  );
  if (!row) throw new Error(`No section "${slug}" for ${LEVEL}/${skill}`);
  return row.id;
}

const rubricCache = new Map();

/**
 * The active B1 rubric for a category, minting a marked draft if there is none.
 *
 * At B1 there is none for any category, so this mints eleven on a first full run. It is not a
 * convenience: `open_tasks.rubric_id IS NULL` is a blocking publish error, so without it the
 * entire level refuses to publish. The anchors come from `b1-content/rubrics.mjs` and describe
 * B1 behaviour — they are deliberately not A2's, because a rubric's anchors define what a score
 * of 2 *means*.
 *
 * `rubrics_one_active_idx` is UNIQUE (level, skill, task_type) WHERE active, so a new version
 * would have to deactivate the old one first — scoped to the level. Nothing here does that: it
 * only ever *creates* a first version, and leaves an existing active rubric alone. Editing one
 * is the docent's job in /admin, which mints version + 1 properly.
 */
async function rubricFor(skill, category) {
  const cacheKey = `${skill}/${category}`;
  if (rubricCache.has(cacheKey)) return rubricCache.get(cacheKey);

  const rows = await db.selectRows(
    'rubrics',
    `select=id&level=eq.${LEVEL}&skill=eq.${skill}&task_type=eq.${category}&active=is.true&limit=1`
  );
  if (rows[0]) {
    rubricCache.set(cacheKey, rows[0].id);
    return rows[0].id;
  }

  const versions = await db.selectRows(
    'rubrics',
    `select=version&level=eq.${LEVEL}&skill=eq.${skill}&task_type=eq.${category}&order=version.desc&limit=1`
  );
  const id = await db.insertOne('rubrics', {
    level: LEVEL,
    skill,
    task_type: category,
    version: (versions[0]?.version ?? 0) + 1,
    criteria: draftCriteria(skill, category),
    system_prompt: DRAFT_MARKER,
    active: true,
  });
  console.log(`  ! created a DRAFT rubric for ${LEVEL}/${skill}/${category} — rewrite it in /admin/rubrics`);
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

/** Resolve a list of authored image slots to rows for `open_task_images`. */
async function imageRows(taskId, list) {
  const rows = [];
  for (const [k, im] of (list ?? []).entries()) {
    const url = await images.resolve(im.slot, im.query, im.variant ?? 0);
    if (!url) continue; // --no-images
    rows.push({
      task_id: taskId,
      sort_order: k + 1,
      image_url: url,
      caption: im.caption ?? null,
      alt_text: images.altFor(im.slot, im.caption ?? `plaatje ${k + 1}`),
      group_label: im.group_label ?? null,
    });
  }
  return rows;
}

/* ── Lezen ───────────────────────────────────────────────────────────────── */

const LABELS = ['A', 'B', 'C', 'D'];

async function seedLezen(number) {
  const examId = await examRow('lezen', number);
  await db.remove('stimuli', `exam_id=eq.${examId}`);

  const stimuli = LEZEN_EXAMS[number - 1];
  let questions = 0;

  for (const [i, s] of stimuli.entries()) {
    const stimulusId = await db.insertOne('stimuli', {
      exam_id: examId,
      skill: 'lezen',
      sort_order: i + 1,
      section_id: await sectionId('lezen', s.section),
      kind: 'text',
      title: s.title,
      intro: s.intro ?? null,
      body_html: s.body_html,
      ...REVIEWED,
    });

    for (const [j, q] of s.questions.entries()) {
      const questionId = await db.insertOne('questions', {
        stimulus_id: stimulusId,
        exam_id: examId,
        sort_order: j + 1,
        prompt: q.prompt,
        explanation: q.explanation,
        option_layout: 'text',
        ...REVIEWED,
      });
      // All rows written is_correct:false, then one flipped. `question_options_one_correct_idx`
      // is UNIQUE (question_id) WHERE is_correct, so two true rows cannot coexist even briefly.
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
      questions++;
    }
  }

  const report = await publish(examId, `Lezen B1 — oefenexamen ${number}`, FORMAT.lezen.durationSeconds);
  return { teksten: stimuli.length, vragen: questions, ...report };
}

/* ── Schrijven ───────────────────────────────────────────────────────────── */

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
      // For `sentence_completion` these two carry the *given* text either side of the gap, which
      // is what makes the shape what it is. `WritingTask` already renders them around the
      // textarea, so no new field and no new renderer was needed.
      greeting: t.greeting ?? null,
      closing: t.closing ?? null,
      min_sentences: t.min_sentences ?? null,
      form_schema: t.form_schema ?? null,
      // A Schrijven task carrying pictures still has image_usage 'none' — forced by
      // open_tasks_image_usage_is_speaking, and the reason the image-count check is spreken-only.
      image_usage: 'none',
      model_answer: t.model_answer,
      rubric_id: await rubricFor('schrijven', t.task_type),
      ...REVIEWED,
    });

    const rows = await imageRows(taskId, t.images);
    if (rows.length) await db.insert('open_task_images', rows);
  }

  const report = await publish(
    examId,
    `Schrijven B1 — oefenexamen ${number}`,
    FORMAT.schrijven.durationSeconds
  );
  return { opdrachten: tasks.length, ...report };
}

/* ── Spreken ─────────────────────────────────────────────────────────────── */

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

    for (const t of part.tasks) {
      order++;
      // Any opgave that carries a spoken line gets its clip — not `react` only, as at A2.
      // DUO's B1 opgaven regularly have somebody ask the question aloud on a cover_all or
      // choose opgave ("U hoort eerst uw buurvrouw"), and without the clip those opgaven are
      // missing the half that sets up the answer. `prompt_spoken` is therefore the condition,
      // and the authoring plan decides which opgaven have one.
      let promptAudio = null;
      if (AUDIO_ON && t.prompt_spoken?.trim()) {
        const objectPath = `b1/spreken-${number}/task-${order}.mp3`;
        promptAudio = FORCE_AUDIO ? null : await storage.existing(AUDIO_BUCKET, objectPath);
        if (!promptAudio) {
          process.stdout.write(`    audio opgave ${order}… `);
          try {
            const buf = await tts.narratorAudio(t.prompt_spoken, t.voice ?? 'woman_young');
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
        // The prompt is authored as plain text with newlines, the way the candidate reads it.
        prompt_html: t.prompt
          .split(/\n{2,}/)
          .map(block => `<p>${block.replace(/\n/g, '<br>')}</p>`)
          .join(''),
        bullet_points: [],
        image_usage: t.image_usage,
        prompt_audio_url: promptAudio,
        prompt_script: t.prompt_spoken ?? null,
        max_record_seconds: 60,
        model_answer: t.model_answer,
        rubric_id: await rubricFor('spreken', `speaking_${t.image_usage}`),
        ...REVIEWED,
      });

      const rows = await imageRows(taskId, t.images);
      if (rows.length) await db.insert('open_task_images', rows);
    }
  }

  const report = await publish(
    examId,
    `Spreken B1 — oefenexamen ${number}`,
    FORMAT.spreken.durationSeconds
  );
  return { delen: parts.length, opgaven: order, audio: audioMade, ...report };
}

/* ── main ────────────────────────────────────────────────────────────────── */

const SEEDERS = { lezen: seedLezen, schrijven: seedSchrijven, spreken: seedSpreken };

async function main() {
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
    console.log('The eleven B1 rubrics are DRAFTS — rewrite them in /admin/rubrics.');
  } else {
    console.log('\nWritten to the local stack.');
  }
  process.exit(blocked ? 1 : 0);
}

main().catch(err => {
  console.error(`\nERROR: ${err.message}`);
  process.exit(1);
});
