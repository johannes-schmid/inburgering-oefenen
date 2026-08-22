/**
 * Author the B1 dataset with Claude, and write it to `scripts/b1-content/generated/`.
 *
 * This is the *authoring* half of the B1 pipeline. `scripts/seed-b1-content.mjs` is the
 * transport that puts the result into a Supabase project, generates the audio and the
 * pictures, and publishes. They are separate on purpose: authoring costs model tokens and
 * seeding costs storage and TTS, and a re-run of one should never re-pay for the other.
 *
 *   node scripts/generate-b1-content.mjs plan                 # what would be written, no calls
 *   node scripts/generate-b1-content.mjs lezen --exam 1        # one exam
 *   node scripts/generate-b1-content.mjs schrijven             # one onderdeel, all ten
 *   node scripts/generate-b1-content.mjs all                   # all thirty
 *   node scripts/generate-b1-content.mjs all --check           # validate what is on disk
 *
 * Flags: --exam N, --concurrency N (default 6), --effort low|medium|high|xhigh|max,
 *        --force (ignore the unit cache), --check.
 *
 * ## Resumable, and why that is not a nicety
 * Every unit is cached under `.unit-cache/` (gitignored) the moment it validates, and an exam's
 * committed JSON is written only when all of its units are in. So an interrupted run — a 429, a
 * laptop lid, a rule that turned out to be wrong — resumes at the first unit it does not have
 * instead of re-paying for the sixty it does.
 *
 * ## What this does not decide
 * Not the topics, not the tekstsoorten, not the picture rules, not how the 35 vragen are spread
 * over the six teksten. All of that is `scripts/b1-content/plan.mjs`, in git. Read its header
 * before changing anything here: the plan is what stops thirty exams being one exam thirty times.
 */
import { loadEnv } from './a2-content/lib.mjs';
import { createAuthor, lezenUnit, schrijvenCompletionUnit, schrijvenLongUnit, sprekenUnit } from './b1-content/author.mjs';
import { writeExam, readExam } from './b1-content/dataset.mjs';
import { EXAM_COUNT, SKILLS, FORMAT } from './b1-content/rules.mjs';
import {
  LEZEN_GENRES, LEZEN_TOPICS, LEZEN_SPLITS,
  SCHRIJVEN_COMPLETIONS, SCHRIJVEN_LONG, SPREKEN_PLAN,
} from './b1-content/plan.mjs';

/* ── flags ───────────────────────────────────────────────────────────────── */

const argv = process.argv.slice(2);
const flag = n => argv.includes(`--${n}`);
const value = n => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 ? argv[i + 1] : null;
};

const ONLY_EXAM = value('exam') ? Number(value('exam')) : null;
const CONCURRENCY = Number(value('concurrency') ?? 6);
const EFFORT = value('effort') ?? 'high';
const FORCE = flag('force');
const CHECK = flag('check');
const command = argv.find(a => !a.startsWith('--') && a !== value('exam') && a !== value('concurrency') && a !== value('effort')) ?? 'all';

const wanted = command === 'all' || command === 'plan' ? SKILLS : [command];
for (const w of wanted) {
  if (!SKILLS.includes(w)) {
    console.error(`Unknown onderdeel "${w}". Use: ${SKILLS.join(' | ')} | all | plan`);
    process.exit(1);
  }
}
if (ONLY_EXAM !== null && (!Number.isInteger(ONLY_EXAM) || ONLY_EXAM < 1 || ONLY_EXAM > EXAM_COUNT)) {
  console.error(`--exam takes a number from 1 to ${EXAM_COUNT}.`);
  process.exit(1);
}
const examNumbers = ONLY_EXAM ? [ONLY_EXAM] : Array.from({ length: EXAM_COUNT }, (_, i) => i + 1);

/* ── the units each exam is made of ──────────────────────────────────────── */

/**
 * One exam becomes a list of units, each of which is one model call.
 *
 * Lezen is six calls (one per tekst) rather than one: a single call for a whole exam would have
 * to hold six 500-word texts and 35 questions in one response, which is both near the output
 * ceiling and impossible to retry cheaply — one bad question would re-author the entire exam.
 */
function unitsFor(skill, n) {
  const i = n - 1;
  if (skill === 'lezen') {
    return LEZEN_GENRES.map((g, slot) =>
      lezenUnit({
        examNumber: n,
        slot,
        genre: g.genre,
        section: g.section,
        topic: LEZEN_TOPICS[i][slot],
        questionCount: LEZEN_SPLITS[i][slot],
      })
    );
  }
  if (skill === 'schrijven') {
    return [
      schrijvenCompletionUnit({ examNumber: n, plan: SCHRIJVEN_COMPLETIONS[i] }),
      // One call per long opdracht: four shapes in one call never converged on a retry. See
      // the header of `schrijvenLongUnit`.
      ...SCHRIJVEN_LONG[i].map(([category, subject], index) =>
        schrijvenLongUnit({ examNumber: n, index, category, subject })
      ),
    ];
  }
  return [1, 2].map(deel => sprekenUnit({ examNumber: n, deel, plan: SPREKEN_PLAN[i][deel - 1] }));
}

/** Units → the shape `scripts/b1-content/index.mjs` validates and the seeder writes. */
function assemble(skill, results) {
  if (skill === 'lezen') return results;                 // six stimuli, in order
  // The first unit returns the eight completions as an array; the next four each return one task.
  if (skill === 'schrijven') return [...results[0], ...results.slice(1)];
  return results;                                        // two delen
}

/* ── plan mode ───────────────────────────────────────────────────────────── */

if (command === 'plan') {
  let units = 0;
  for (const skill of wanted) {
    const per = unitsFor(skill, 1).length;
    const n = per * examNumbers.length;
    units += n;
    console.log(`${skill}: ${per} calls per exam × ${examNumbers.length} = ${n}`);
  }
  console.log(`\n${units} model calls in total.`);
  const items =
    (wanted.includes('lezen') ? FORMAT.lezen.itemCount * examNumbers.length : 0) +
    (wanted.includes('schrijven') ? FORMAT.schrijven.itemCount * examNumbers.length : 0) +
    (wanted.includes('spreken') ? FORMAT.spreken.itemCount * examNumbers.length : 0);
  console.log(`${items} items across ${wanted.length * examNumbers.length} exams.`);
  process.exit(0);
}

/* ── check mode ──────────────────────────────────────────────────────────── */

if (CHECK) {
  // Imported lazily: `index.mjs` reads the generated files at import time, so importing it at
  // the top would snapshot the dataset *before* this run wrote anything to it.
  const { validateDataset } = await import('./b1-content/index.mjs');
  const problems = validateDataset(wanted);
  if (problems.length === 0) {
    console.log(`The dataset on disk matches every B1 rule (${wanted.join(', ')}).`);
    process.exit(0);
  }
  console.error(`${problems.length} problem(s):\n`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}

/* ── generate ────────────────────────────────────────────────────────────── */

const env = loadEnv({ production: false });
const apiKey = env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY;
// The gateway is preferred when it is configured: it is already this project's AI provider and
// it bills the Vercel account. `--direct` forces the Anthropic API instead. Either way the model
// is the same, which is what keeps one dataset from being authored by two different models.
const gatewayKey = flag('direct')
  ? null
  : (env.AI_GATEWAY_API_KEY ?? process.env.AI_GATEWAY_API_KEY);
if (!apiKey && !gatewayKey) {
  console.error('Neither AI_GATEWAY_API_KEY nor ANTHROPIC_API_KEY is set.');
  process.exit(1);
}

const author = createAuthor({ apiKey, gatewayKey, effort: EFFORT });

/** Run `jobs` with at most `limit` in flight. Results keep the input order. */
async function pool(jobs, limit) {
  const out = new Array(jobs.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, jobs.length) }, async () => {
    while (next < jobs.length) {
      const i = next++;
      out[i] = await jobs[i]();
    }
  });
  await Promise.all(workers);
  return out;
}

let written = 0;
let failed = 0;

for (const skill of wanted) {
  console.log(`\n${skill}`);
  for (const n of examNumbers) {
    // A complete, still-valid exam is left alone. Re-authoring one costs real money and, more
    // to the point, would silently replace content the docent may already have reviewed.
    if (!FORCE && readExam(skill, n)) {
      console.log(`  ${n}. already on disk — skipping (use --force to re-author)`);
      continue;
    }
    const units = unitsFor(skill, n);
    process.stdout.write(`  ${n}. ${units.length} unit(s)…\n`);
    try {
      const results = await pool(
        units.map(u => async () => {
          const raw = await author.askValidated(u);
          return u.finish ? u.finish(raw) : raw;
        }),
        CONCURRENCY
      );
      writeExam(skill, n, assemble(skill, results));
      written++;
      console.log(`     written`);
    } catch (err) {
      failed++;
      console.error(`     FAILED: ${err.message}`);
    }
  }
}

const s = author.stats();
console.log(
  `\n${s.calls} calls · ${(s.inTokens / 1000).toFixed(0)}k in / ${(s.outTokens / 1000).toFixed(0)}k out ` +
    `· ~$${s.usd.toFixed(2)} at list price.`
);
console.log(`${written} exam(s) written, ${failed} failed.`);

// The whole-dataset check is the one that matters: a unit can be valid on its own and still
// break a per-exam rule (35 vragen in total, the answer-key spread, a duplicate title).
const { validateDataset } = await import('./b1-content/index.mjs');
const problems = validateDataset(wanted, { partial: true });
if (problems.length > 0) {
  console.log(`\n${problems.length} dataset-level problem(s) remain:`);
  for (const p of problems.slice(0, 40)) console.log(`  ${p}`);
  if (problems.length > 40) console.log(`  … and ${problems.length - 40} more`);
}
process.exit(failed > 0 ? 1 : 0);
