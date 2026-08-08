/**
 * The A2 dataset, and the shape checks that run before any network call.
 *
 * Every rule checked here is one that `exam_publish_issues()` would otherwise catch *after* the
 * content is already written and the audio already paid for. Catching them in memory turns a
 * half-seeded exam into a list of line numbers.
 *
 * The numbers are not invented here — they mirror `exam_formats` and `exam_task_rules` at A2, which
 * are the standard the docent's work is measured against. If one of those tables changes, change
 * the constants below in the same commit (the same rule `data/skills.ts` follows).
 */
import { LEZEN_EXAMS } from './lezen.mjs';
import { LUISTEREN_EXAMS } from './luisteren.mjs';
import { SCHRIJVEN_EXAMS } from './schrijven.mjs';
import { SPREKEN_EXAMS } from './spreken.mjs';
import { validateCast } from './lib.mjs';

export { LEZEN_EXAMS, LUISTEREN_EXAMS, SCHRIJVEN_EXAMS, SPREKEN_EXAMS };

export const EXAM_COUNT = 10;

/** Mirrors `exam_formats` for (a2, skill). */
export const FORMAT = {
  lezen: {
    itemCount: 25,
    durationSeconds: 3900,
    questionsPerStimulus: [1, 3],
    options: [3, 4],
    stimulusCount: null,
  },
  luisteren: {
    itemCount: 25,
    durationSeconds: 2700,
    questionsPerStimulus: [2, 3],
    options: [3, 4],
    stimulusCount: 10,
    // 25–45 s, corrected against the DUO reference on 2026-08-08 — see data/skills.ts.
    audioSeconds: [25, 45],
  },
  schrijven: { itemCount: 4, durationSeconds: 2400 },
  spreken: { itemCount: 16, durationSeconds: 2100, partCount: 4, itemsPerPart: 4 },
};

/** Mirrors `exam_task_rules` for (a2, schrijven|spreken). */
export const TASK_RULES = {
  email: { min: 1, max: 2, bullets: [2, 4] },
  short_text: { min: 1, max: 1, minSentences: 3 },
  form: { min: 1, max: 1 },
  picture_note: { min: 0, max: 1, minSentences: 3 },
};

/** Image count per Spreken category — a hard publish error when it does not match. */
export const SPREKEN_IMAGES = { react: 1, describe: 1, choose: 2, cover_all: 3 };

/** `sections.slug` for (a2, skill). A slug that is not here resolves to NULL and warns. */
export const SECTION_SLUGS = {
  lezen: ['advertentie', 'brief', 'formulier-lezen', 'folder', 'regels', 'artikel'],
  luisteren: ['gesprek', 'mededeling', 'telefoongesprek', 'instructie'],
};

/* ── validation ──────────────────────────────────────────────────────────── */

function checkMcq(skill, exams, problems) {
  const f = FORMAT[skill];
  if (exams.length !== EXAM_COUNT) {
    problems.push(`${skill}: ${exams.length} exams, expected ${EXAM_COUNT}`);
  }

  exams.forEach((stimuli, ei) => {
    const n = ei + 1;
    const where = `${skill} ${n}`;
    const questions = stimuli.reduce((a, s) => a + s.questions.length, 0);

    if (questions !== f.itemCount) {
      problems.push(`${where}: ${questions} vragen, expected ${f.itemCount}`);
    }
    if (f.stimulusCount !== null && stimuli.length !== f.stimulusCount) {
      problems.push(`${where}: ${stimuli.length} fragmenten, expected ${f.stimulusCount}`);
    }

    const seenTitles = new Set();
    stimuli.forEach((s, si) => {
      const at = `${where} · stimulus ${si + 1} (${s.title ?? 'zonder titel'})`;
      if (!s.title) problems.push(`${at}: no title`);
      if (seenTitles.has(s.title)) problems.push(`${at}: duplicate title within the exam`);
      seenTitles.add(s.title);

      if (!s.section) problems.push(`${at}: no section slug`);
      else if (!SECTION_SLUGS[skill].includes(s.section)) {
        problems.push(`${at}: unknown section slug "${s.section}"`);
      }

      const [qMin, qMax] = f.questionsPerStimulus;
      if (s.questions.length < qMin || s.questions.length > qMax) {
        problems.push(`${at}: ${s.questions.length} vragen, rule is ${qMin}–${qMax}`);
      }

      if (skill === 'lezen' && !s.body_html) problems.push(`${at}: no body_html`);
      if (skill === 'luisteren') {
        if (!Array.isArray(s.lines) || s.lines.length === 0) problems.push(`${at}: no lines`);
        else {
          for (const p of validateCast(s.lines, s.voice_cast)) problems.push(`${at}: ${p}`);
          const speakers = new Set(s.lines.map(([sp]) => sp));
          if (speakers.size > 2) problems.push(`${at}: ${speakers.size} speakers, DUO uses 1 or 2`);
          const words = s.lines.reduce((a, [, t]) => a + t.trim().split(/\s+/).length, 0);
          // Measured: eleven_v3 renders these at roughly 200 wpm, so 85–145 woorden lands between
          // about 26 and 44 seconds — inside the 25–45 s rule with room at both ends. The earlier
          // 150 wpm estimate was wrong by a third; this range comes from the generated files.
          if (words < 85 || words > 145) {
            problems.push(`${at}: ${words} words — target 85–145 for a 25–45 s fragment`);
          }
        }
      }

      s.questions.forEach((q, qi) => {
        const qat = `${at} · vraag ${qi + 1}`;
        if (!q.prompt) problems.push(`${qat}: no prompt`);
        if (!q.explanation) problems.push(`${qat}: no explanation`);
        const [oMin, oMax] = f.options;
        if (q.options.length < oMin || q.options.length > oMax) {
          problems.push(`${qat}: ${q.options.length} opties, rule is ${oMin}–${oMax}`);
        }
        if (new Set(q.options).size !== q.options.length) {
          problems.push(`${qat}: duplicate option text`);
        }
        if (q.options.some(o => !o || !o.trim())) problems.push(`${qat}: an empty option`);
        if (typeof q.correct !== 'number' || q.correct < 0 || q.correct >= q.options.length) {
          problems.push(`${qat}: correct=${q.correct} is out of range`);
        }
      });
    });
  });
}

function checkSchrijven(problems) {
  if (SCHRIJVEN_EXAMS.length !== EXAM_COUNT) {
    problems.push(`schrijven: ${SCHRIJVEN_EXAMS.length} exams, expected ${EXAM_COUNT}`);
  }
  SCHRIJVEN_EXAMS.forEach((tasks, ei) => {
    const where = `schrijven ${ei + 1}`;
    if (tasks.length !== FORMAT.schrijven.itemCount) {
      problems.push(`${where}: ${tasks.length} opgaven, expected ${FORMAT.schrijven.itemCount}`);
    }
    const counts = {};
    tasks.forEach((t, ti) => {
      const at = `${where} · opgave ${ti + 1} (${t.task_type})`;
      counts[t.task_type] = (counts[t.task_type] ?? 0) + 1;
      if (!TASK_RULES[t.task_type]) problems.push(`${at}: unknown task_type`);
      if (!t.title) problems.push(`${at}: no title`);
      if (!t.prompt_html) problems.push(`${at}: no prompt_html`);
      if (!t.model_answer) problems.push(`${at}: no model_answer`);

      const rule = TASK_RULES[t.task_type] ?? {};
      if (rule.bullets) {
        const [bMin, bMax] = rule.bullets;
        const n = t.bullet_points?.length ?? 0;
        if (n < bMin || n > bMax) problems.push(`${at}: ${n} bullets, rule is ${bMin}–${bMax}`);
      }
      if (rule.minSentences && t.min_sentences !== rule.minSentences) {
        problems.push(`${at}: min_sentences=${t.min_sentences}, rule is ${rule.minSentences}`);
      }
      if (t.task_type === 'form' && !t.form_schema) problems.push(`${at}: form without form_schema`);
      if (t.task_type === 'picture_note') {
        const n = t.images?.length ?? 0;
        if (n < 2 || n > 3) problems.push(`${at}: ${n} plaatjes, DUO uses 2 or 3`);
      }
      // A CHECK enforces this: only Spreken may carry an image_usage other than 'none'.
      if (t.image_usage && t.image_usage !== 'none') {
        problems.push(`${at}: image_usage must be 'none' on schrijven`);
      }
    });
    for (const [cat, rule] of Object.entries(TASK_RULES)) {
      const n = counts[cat] ?? 0;
      if (n < rule.min || n > rule.max) {
        problems.push(`${where}: ${n}× ${cat}, quota is ${rule.min}–${rule.max}`);
      }
    }
  });
}

function checkSpreken(problems) {
  if (SPREKEN_EXAMS.length !== EXAM_COUNT) {
    problems.push(`spreken: ${SPREKEN_EXAMS.length} exams, expected ${EXAM_COUNT}`);
  }
  SPREKEN_EXAMS.forEach((parts, ei) => {
    const where = `spreken ${ei + 1}`;
    if (parts.length !== FORMAT.spreken.partCount) {
      problems.push(`${where}: ${parts.length} onderdelen, expected ${FORMAT.spreken.partCount}`);
    }
    const usages = parts.map(p => p.image_usage);
    for (const need of Object.keys(SPREKEN_IMAGES)) {
      if (!usages.includes(need)) problems.push(`${where}: no onderdeel with image_usage "${need}"`);
    }
    parts.forEach((p, pi) => {
      const at = `${where} · onderdeel ${pi + 1}`;
      if (!p.title) problems.push(`${at}: no title`);
      if (!p.instruction_html) problems.push(`${at}: no instruction_html`);
      if (p.tasks.length !== FORMAT.spreken.itemsPerPart) {
        problems.push(`${at}: ${p.tasks.length} opgaven, expected ${FORMAT.spreken.itemsPerPart}`);
      }
      const need = SPREKEN_IMAGES[p.image_usage];
      if (need === undefined) problems.push(`${at}: unknown image_usage "${p.image_usage}"`);
      p.tasks.forEach((t, ti) => {
        const tat = `${at} · opgave ${ti + 1}`;
        if (!t.prompt) problems.push(`${tat}: no prompt`);
        if (!t.model_answer) problems.push(`${tat}: no model_answer`);
        const n = t.images?.length ?? 0;
        if (need !== undefined && n !== need) {
          problems.push(`${tat}: ${n} plaatjes, ${p.image_usage} needs exactly ${need}`);
        }
        (t.images ?? []).forEach((im, k) => {
          if (!im.slot) problems.push(`${tat}: plaatje ${k + 1} has no slot key`);
          if (!im.query) problems.push(`${tat}: plaatje ${k + 1} has no query`);
        });
      });
    });
  });
}

/** Every image slot key across the dataset must be unique, or the lock file collapses two items. */
function checkSlotKeys(problems) {
  const seen = new Map();
  const claim = (slot, at) => {
    if (!slot) return;
    if (seen.has(slot)) problems.push(`duplicate image slot "${slot}" — ${seen.get(slot)} and ${at}`);
    else seen.set(slot, at);
  };
  SPREKEN_EXAMS.forEach((parts, ei) =>
    parts.forEach((p, pi) =>
      p.tasks.forEach((t, ti) =>
        (t.images ?? []).forEach((im, k) =>
          claim(im.slot, `spreken ${ei + 1} · onderdeel ${pi + 1} · opgave ${ti + 1} · plaatje ${k + 1}`)
        )
      )
    )
  );
  SCHRIJVEN_EXAMS.forEach((tasks, ei) =>
    tasks.forEach((t, ti) =>
      (t.images ?? []).forEach((im, k) =>
        claim(im.slot, `schrijven ${ei + 1} · opgave ${ti + 1} · plaatje ${k + 1}`)
      )
    )
  );
  LUISTEREN_EXAMS.forEach((stimuli, ei) =>
    stimuli.forEach((s, si) => claim(s.image?.slot, `luisteren ${ei + 1} · fragment ${si + 1}`))
  );
}

/**
 * Returns a list of human-readable problems; empty means the dataset matches every A2 rule.
 *
 * `partial` drops only the "must be ten exams" rule, so a half-written onderdeel can still be
 * seeded and played locally while it is being authored. Every other rule — item counts, option
 * counts, quotas, image counts, casting — still applies, because those are the ones that produce a
 * broken exam rather than a short list of them. A production run must never pass it.
 */
export function validateDataset(
  skills = ['lezen', 'luisteren', 'schrijven', 'spreken'],
  { partial = false } = {}
) {
  const problems = [];
  if (skills.includes('lezen')) checkMcq('lezen', LEZEN_EXAMS, problems);
  if (skills.includes('luisteren')) checkMcq('luisteren', LUISTEREN_EXAMS, problems);
  if (skills.includes('schrijven')) checkSchrijven(problems);
  if (skills.includes('spreken')) checkSpreken(problems);
  checkSlotKeys(problems);
  return partial ? problems.filter(p => !/ exams, expected /.test(p)) : problems;
}
