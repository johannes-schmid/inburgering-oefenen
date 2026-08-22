/**
 * The B1 dataset, and the shape checks that run before any network call.
 *
 * Mirrors `scripts/a2-content/index.mjs` in purpose and in discipline: every rule checked here
 * is one `exam_publish_issues()` would otherwise catch *after* the content was written and the
 * audio and pictures already paid for. Catching them in memory turns a half-seeded exam into a
 * list of line numbers.
 *
 * The numbers are not invented here. They mirror `exam_formats` and `exam_task_rules` at B1 as
 * set by `supabase/migrations/20260821090000_b1_exam_structure.sql`, and `RULES` / `TASK_RULES`
 * in `data/skills.ts`. Those four mirrors must change in one commit — the rule CLAUDE.md sets.
 *
 * ## Three onderdelen, not four
 * **Luisteren is absent on purpose, not unfinished.** There is no B1 Luisteren reference
 * material, so `exam_formats(b1, luisteren)` is still all-NULL and its ten exam slots stay
 * empty and unpublished. A generated B1 Luisteren exam would be a guess at DUO's format wearing
 * a published exam's clothes.
 *
 * ## What B1 changes about the shapes
 *   - Lezen is six long teksten (400–600 woorden, numbered alinea's) with 35 vragen over them.
 *   - Schrijven is twelve opdrachten, eight of which are `sentence_completion` — a part-written
 *     e-mail or bericht whose sentence is left open. The given text lives in `greeting` and
 *     `closing`, which is what `WritingTask` already renders around the textarea.
 *   - Spreken is **two** delen of eight, and `image_usage` varies *per opgave* rather than per
 *     deel as it does at A2. DUO's B1 deel 1 mixes plaatje-less opgaven with ones that show a
 *     picture and speak to the candidate; the delen differ in spreektijd, not in picture rule.
 */
import { LEZEN_EXAMS } from './lezen.mjs';
import { SCHRIJVEN_EXAMS } from './schrijven.mjs';
import { SPREKEN_EXAMS } from './spreken.mjs';

export { LEZEN_EXAMS, SCHRIJVEN_EXAMS, SPREKEN_EXAMS };

export * from './rules.mjs';
import {
  EXAM_COUNT, FORMAT, TASK_RULES, LONG_CATEGORIES, SPREKEN_IMAGES, SPREKEN_QUOTA,
  SECTION_SLUGS, SKILLS,
} from './rules.mjs';

/**
 * Set by `validateDataset` for the duration of one call. A module-level flag rather than a
 * parameter threaded through five functions, and safe because validation is synchronous.
 */
let SKIP_EMPTY = false;

/* ── lezen ───────────────────────────────────────────────────────────────── */

function words(html) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function checkLezen(problems) {
  const f = FORMAT.lezen;
  if (LEZEN_EXAMS.length !== EXAM_COUNT) {
    problems.push(`lezen: ${LEZEN_EXAMS.length} exams, expected ${EXAM_COUNT}`);
  }

  LEZEN_EXAMS.forEach((stimuli, ei) => {
    const where = `lezen ${ei + 1}`;
    if (SKIP_EMPTY && stimuli.length === 0) return;
    const total = stimuli.reduce((a, s) => a + s.questions.length, 0);

    if (total !== f.itemCount) problems.push(`${where}: ${total} vragen, expected ${f.itemCount}`);
    if (stimuli.length !== f.stimulusCount) {
      problems.push(`${where}: ${stimuli.length} teksten, expected ${f.stimulusCount}`);
    }

    const seenTitles = new Set();
    stimuli.forEach((s, si) => {
      const at = `${where} · tekst ${si + 1} (${s.title ?? 'zonder titel'})`;
      if (!s.title) problems.push(`${at}: no title`);
      if (seenTitles.has(s.title)) problems.push(`${at}: duplicate title within the exam`);
      seenTitles.add(s.title);

      if (!s.section) problems.push(`${at}: no section slug`);
      else if (!SECTION_SLUGS.includes(s.section)) {
        problems.push(`${at}: unknown section slug "${s.section}"`);
      }

      if (!s.intro) problems.push(`${at}: no intro — DUO always says where the tekst comes from`);
      if (!s.body_html) problems.push(`${at}: no body_html`);
      else {
        const n = words(s.body_html);
        const [lo, hi] = f.words;
        if (n < lo || n > hi) problems.push(`${at}: ${n} woorden — target ${lo}–${hi} at B1`);
      }

      const [qMin, qMax] = f.questionsPerStimulus;
      if (s.questions.length < qMin || s.questions.length > qMax) {
        problems.push(`${at}: ${s.questions.length} vragen, rule is ${qMin}–${qMax}`);
      }

      s.questions.forEach((q, qi) => {
        const qat = `${at} · vraag ${qi + 1}`;
        if (!q.prompt) problems.push(`${qat}: no prompt`);
        if (!q.explanation) problems.push(`${qat}: no explanation`);
        const [oMin, oMax] = f.options;
        if (q.options.length < oMin || q.options.length > oMax) {
          problems.push(`${qat}: ${q.options.length} opties, rule is ${oMin}–${oMax}`);
        }
        if (new Set(q.options).size !== q.options.length) problems.push(`${qat}: duplicate option text`);
        if (q.options.some(o => !o || !o.trim())) problems.push(`${qat}: an empty option`);
        if (typeof q.correct !== 'number' || q.correct < 0 || q.correct >= q.options.length) {
          problems.push(`${qat}: correct=${q.correct} is out of range`);
        }
      });
    });

    // A key that is always A, or never D, is guessable without reading. DUO's own exams spread
    // the answer across the options; a generator left alone will not.
    const counts = {};
    for (const s of stimuli) for (const q of s.questions) counts[q.correct] = (counts[q.correct] ?? 0) + 1;
    const worst = Math.max(...Object.values(counts));
    if (worst > total * 0.5) {
      problems.push(`${where}: ${worst} of ${total} answers share one position — spread the key`);
    }
  });
}

/* ── schrijven ───────────────────────────────────────────────────────────── */

function checkSchrijven(problems) {
  if (SCHRIJVEN_EXAMS.length !== EXAM_COUNT) {
    problems.push(`schrijven: ${SCHRIJVEN_EXAMS.length} exams, expected ${EXAM_COUNT}`);
  }
  SCHRIJVEN_EXAMS.forEach((tasks, ei) => {
    const where = `schrijven ${ei + 1}`;
    if (SKIP_EMPTY && tasks.length === 0) return;
    if (tasks.length !== FORMAT.schrijven.itemCount) {
      problems.push(`${where}: ${tasks.length} opdrachten, expected ${FORMAT.schrijven.itemCount}`);
    }

    const counts = {};
    tasks.forEach((t, ti) => {
      const at = `${where} · opdracht ${ti + 1} (${t.task_type})`;
      counts[t.task_type] = (counts[t.task_type] ?? 0) + 1;
      const rule = TASK_RULES[t.task_type];
      if (!rule) {
        problems.push(`${at}: unknown task_type`);
        return;
      }
      if (!t.title) problems.push(`${at}: no title`);
      if (!t.prompt_html) problems.push(`${at}: no prompt_html`);
      if (!t.model_answer) problems.push(`${at}: no model_answer`);

      if (rule.bullets) {
        const [bMin, bMax] = rule.bullets;
        const n = t.bullet_points?.length ?? 0;
        if (n < bMin || n > bMax) problems.push(`${at}: ${n} bullets, rule is ${bMin}–${bMax}`);
      }
      if (rule.images !== undefined) {
        const n = t.images?.length ?? 0;
        if (n !== rule.images) problems.push(`${at}: ${n} plaatjes, rule is exactly ${rule.images}`);
      }

      if (t.task_type === 'form' && !t.form_schema) problems.push(`${at}: form without form_schema`);

      // The whole point of the shape: the candidate finishes a sentence somebody else started,
      // between text that is given. Without both halves it is just a short free-text opdracht.
      if (t.task_type === 'sentence_completion') {
        if (!t.greeting) problems.push(`${at}: no greeting — the given text before the gap`);
        if (!t.closing) problems.push(`${at}: no closing — the given text after the gap`);
        if (t.greeting && !/[…]|\.\.\.$/.test(t.greeting.trim())) {
          problems.push(`${at}: greeting must end in an ellipsis, so the gap is visible`);
        }
        if (t.bullet_points?.length) {
          problems.push(`${at}: sentence_completion takes no bullets — the sentence is the opdracht`);
        }
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
    const long = LONG_CATEGORIES.reduce((a, c) => a + (counts[c] ?? 0), 0);
    if (long !== 4) problems.push(`${where}: ${long} lange opdrachten, expected 4`);
  });
}

/* ── spreken ─────────────────────────────────────────────────────────────── */

function checkSpreken(problems) {
  if (SPREKEN_EXAMS.length !== EXAM_COUNT) {
    problems.push(`spreken: ${SPREKEN_EXAMS.length} exams, expected ${EXAM_COUNT}`);
  }
  SPREKEN_EXAMS.forEach((parts, ei) => {
    const where = `spreken ${ei + 1}`;
    if (SKIP_EMPTY && parts.length === 0) return;
    if (parts.length !== FORMAT.spreken.partCount) {
      problems.push(`${where}: ${parts.length} delen, expected ${FORMAT.spreken.partCount}`);
    }

    const usages = {};
    parts.forEach((p, pi) => {
      const at = `${where} · deel ${pi + 1}`;
      if (!p.title) problems.push(`${at}: no title`);
      if (!p.instruction_html) problems.push(`${at}: no instruction_html`);
      if (p.tasks.length !== FORMAT.spreken.itemsPerPart) {
        problems.push(`${at}: ${p.tasks.length} opgaven, expected ${FORMAT.spreken.itemsPerPart}`);
      }

      p.tasks.forEach((t, ti) => {
        const tat = `${at} · opgave ${ti + 1}`;
        if (!t.title) problems.push(`${tat}: no title`);
        if (!t.prompt) problems.push(`${tat}: no prompt`);
        if (!t.model_answer) problems.push(`${tat}: no model_answer`);

        const need = SPREKEN_IMAGES[t.image_usage];
        if (need === undefined) {
          problems.push(`${tat}: unknown image_usage "${t.image_usage}"`);
          return;
        }
        usages[t.image_usage] = (usages[t.image_usage] ?? 0) + 1;

        const n = t.images?.length ?? 0;
        if (n !== need) {
          problems.push(`${tat}: ${n} plaatjes, ${t.image_usage} needs exactly ${need}`);
        }
        (t.images ?? []).forEach((im, k) => {
          if (!im.slot) problems.push(`${tat}: plaatje ${k + 1} has no slot key`);
          if (!im.query) problems.push(`${tat}: plaatje ${k + 1} has no query`);
        });

        // `react` is defined by somebody addressing the candidate, so it must carry a spoken
        // line. Any other shape *may* carry one: DUO's B1 opgaven regularly end "U hoort eerst
        // uw buurvrouw" on a cover_all or choose opgave. So this is a one-way rule, not an
        // exclusivity — and the seeder generates audio for whatever has a line, not for react only.
        if (t.image_usage === 'react' && !t.prompt_spoken) {
          problems.push(`${tat}: react without prompt_spoken`);
        }
        if (t.prompt_spoken && !t.voice) problems.push(`${tat}: prompt_spoken without a voice`);
      });
    });

    for (const [usage, [lo, hi]] of Object.entries(SPREKEN_QUOTA)) {
      const n = usages[usage] ?? 0;
      if (n < lo || n > hi) problems.push(`${where}: ${n}× ${usage}, quota is ${lo}–${hi}`);
    }
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
          claim(im.slot, `spreken ${ei + 1} · deel ${pi + 1} · opgave ${ti + 1} · plaatje ${k + 1}`)
        )
      )
    )
  );
  SCHRIJVEN_EXAMS.forEach((tasks, ei) =>
    tasks.forEach((t, ti) =>
      (t.images ?? []).forEach((im, k) =>
        claim(im.slot, `schrijven ${ei + 1} · opdracht ${ti + 1} · plaatje ${k + 1}`)
      )
    )
  );
}

/**
 * Returns a list of human-readable problems; empty means the dataset matches every B1 rule.
 *
 * `partial` drops only the "must be ten exams" rule, so a half-written onderdeel can still be
 * seeded and played locally while it is being authored. Every other rule still applies, and a
 * production run must never pass it — nine of ten oefenexamens shipped as ten is exactly the
 * sort of thing nobody notices until a customer does.
 */
/**
 * `\uXXXX` left as literal text anywhere in an exam.
 *
 * The model sometimes double-escapes non-ASCII, so a parsed string ends up holding the six
 * characters `\u00f6` instead of `ö`. It hits exactly what Dutch exam content is full of — €, é,
 * ó, ö, ë, ï, ê, the en dash — and it is invisible to every other check here: the JSON is valid,
 * the counts are right, and in a diff it looks like one odd word. 152 occurrences were repaired on
 * 2026-08-21 after a candidate-facing "teamco\u00f6rdinator" turned up in a screenshot.
 *
 * `author.mjs` now repairs it at parse time. This is the second line of defence, on the committed
 * files, because that repair only helps content authored *after* it existed.
 */
function checkEscapes(problems) {
  const scan = (label, value) => {
    const hits = JSON.stringify(value).match(/\\\\u[0-9a-fA-F]{4}/g) ?? [];
    if (hits.length > 0) {
      problems.push(`${label}: ${hits.length}× letterlijke \\uXXXX in de tekst (bijv. ${hits[0]})`);
    }
  };
  LEZEN_EXAMS.forEach((e, i) => e.length && scan(`lezen ${i + 1}`, e));
  SCHRIJVEN_EXAMS.forEach((e, i) => e.length && scan(`schrijven ${i + 1}`, e));
  SPREKEN_EXAMS.forEach((e, i) => e.length && scan(`spreken ${i + 1}`, e));
}

export function validateDataset(skills = SKILLS, { partial = false } = {}) {
  // `partial` means "an onderdeel is still being authored", so an exam with *nothing* in it is
  // absent rather than broken and is skipped outright. Reporting every rule against an empty
  // array buries the one exam that is actually half-written under sixty lines about nine that
  // have not been started — which is the opposite of what the flag is for.
  SKIP_EMPTY = partial;
  const problems = [];
  if (skills.includes('lezen')) checkLezen(problems);
  if (skills.includes('schrijven')) checkSchrijven(problems);
  if (skills.includes('spreken')) checkSpreken(problems);
  checkSlotKeys(problems);
  checkEscapes(problems);
  return partial ? problems.filter(p => !/ exams, expected /.test(p)) : problems;
}
