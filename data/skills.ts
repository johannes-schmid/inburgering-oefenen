/**
 * The exam taxonomy: four language components, examined at two CEFR levels.
 *
 * This is the static shape of the product — exam *content* lives in Supabase
 * (`exams` / `questions` / `open_tasks`), but the taxonomy itself is fixed by DUO
 * and is safe to hardcode.
 *
 * ## Why identity and format are separate
 *
 * A skill's *identity* (its slug, its icon, whether it is auto-scored or rubric-graded)
 * is the same at every level: Lezen is Lezen. Its *format* — how many items, how many
 * minutes — is a fact about DUO's exam at one specific level, and A2's numbers are not
 * B1's. Folding the two together is what made the original A2-only assumption invisible.
 *
 * `SKILLS` is therefore identity only. Anything that needs a count or a duration must go
 * through `getSkillAtLevel(level, slug)` or `skillsAtLevel(level)` and say which level it
 * means. There is deliberately no default — a silent A2 fallback is the bug this shape exists
 * to prevent.
 *
 * ## Where the numbers come from
 *
 * `durationMinutes` is published by DUO:
 *   https://www.inburgeren.nl/examen-doen/inhoud-taalexamens-a2-b1-b2.jsp
 * and restated in the Examenreglement, Artikel 9:
 *   https://www.inburgeren.nl/images/examenreglement.pdf
 *
 * `itemCount` is NOT published by DUO anywhere. The A2 counts were read off the start screens
 * of DUO's own public practice exams (all 10 online A2 exams, verified 2026-07-28) — see
 * `SEO/facts.md` §1 for the method and the exact wording that is defensible in copy.
 * Do not restate these as an official DUO norm; attribute them to the practice exams.
 *
 * **B1's Lezen, Schrijven and Spreken counts were read off DUO's B1 Openbaar examen booklets
 * on 2026-08-21** (Lezen I and Schrijven I 2022 + 2023, Spreken I 2022–2025). Attribute them
 * to DUO's published practice exams, exactly as for A2 — never to an official DUO norm.
 *
 * **B1 Luisteren is still `null`, and that is not an oversight.** There is no B1 Luisteren
 * reference material, so its shape is genuinely unknown. `null` means "we do not know",
 * renders as an em dash, and makes `exam_publish_issues()` skip its count check rather than
 * blocking the docent on a guess. Fill it in only by counting it off DUO's own material — and
 * update `exam_formats` in the database in the same commit.
 */

/**
 * ## Adding a fifth onderdeel (KNM, ONA, …)
 *
 * **The database needs no migration.** `20260803000000_open_skill_axis.sql` turned the four
 * hardcoded CHECK constraints into foreign keys on a `skills` table, made
 * `questions.stimulus_id` nullable behind a per-onderdeel trigger, and made `exams.level`
 * nullable for onderdelen that are not CEFR-graded. Adding one is:
 *
 *   INSERT INTO skills (slug, name_nl, sort_order, scoring, requires_stimulus, is_levelled)
 *   VALUES ('knm', 'KNM', 50, 'mcq', false, false);
 *
 * plus its `exam_formats` row, its `sections`, its exams and its content. Verified end to end.
 *
 * **The code side is deliberately still four-onderdeel.** That is cheap to change and safe —
 * no data to migrate — so it was left until there is a real decision to ship one. What it takes:
 *
 *   1. `SkillSlug` gains the slug, and `FORMATS` gains a row per level it exists at.
 *   2. `components/site/SkillIcon.tsx` needs an icon for it (lucide, never an emoji).
 *   3. **A non-levelled onderdeel needs `Level | null` plumbing.** `ExamRow.level`,
 *      `ExamMeta.level` and the `Record<Level, …>` keys in `lib/portal-progress.ts` all assume
 *      a level exists, and `fetchExamsForSkill` filters with `.eq('level', …)`, which never
 *      matches NULL. So a non-levelled onderdeel would be invisible rather than wrong — a
 *      quiet failure, but a local one, and this is the list of places to fix.
 *   4. `lib/pricing.ts` prices the bundle as "all modules of a level"; a fifth module makes
 *      "bijna drie van de vier" false. That is a pricing decision, not a code change.
 *   5. `messages/*.json` copy that says "vier onderdelen" — grep before editing, duplicate
 *      JSON keys do not error.
 */
export type Level = 'a2' | 'b1';

export const LEVELS: Level[] = ['a2', 'b1'];

/** The level a visitor gets when none is named — the product's original and primary offer. */
export const DEFAULT_LEVEL: Level = 'a2';

export function isLevel(x: unknown): x is Level {
  return typeof x === 'string' && (LEVELS as string[]).includes(x);
}

/** `'a2'` → `'A2'`. The URL segment is lowercase; copy always shows it uppercase. */
export function levelLabel(level: Level): string {
  return level.toUpperCase();
}

export type SkillSlug = 'lezen' | 'luisteren' | 'schrijven' | 'spreken';

/** What a skill *is* — the same at every level. */
export type Skill = {
  slug: SkillSlug;
  /** i18n key suffix under the `skills` namespace, e.g. skills.lezen.name */
  key: SkillSlug;
  /** Auto-scored multiple choice, or an open answer that needs rubric grading */
  scoring: 'mcq' | 'open';
  /**
   * Do this onderdeel's questions hang off a shared stimulus?
   *
   * Mirrors `skills.requires_stimulus`. All four are `true`: Lezen and Luisteren share one
   * text or fragment across 2–3 questions, and the open skills use `open_tasks` rather than
   * `questions` at all. `false` is the standalone-question shape (KNM's), which the database
   * accepts — see the note on adding an onderdeel below.
   */
  requiresStimulus: boolean;
  /**
   * Examined per CEFR level, or one exam with no level?
   *
   * Mirrors `skills.is_levelled`. All four are `true`. A `false` onderdeel has
   * `exams.level IS NULL`, which the schema supports but the types below do not yet — see
   * the note on adding an onderdeel.
   */
  isLevelled: boolean;
};

/** What DUO's exam looks like for one skill at one level. */
export type SkillFormat = {
  /** Items in one exam. `null` where DUO's format has not been verified for this level. */
  itemCount: number | null;
  /** `null` where unverified. */
  durationMinutes: number | null;
  /** How many practice exams we publish per skill at this level */
  examCount: number;
};

export type LevelledSkill = Skill & SkillFormat & { level: Level };

/**
 * The authoring rules for one (level, skill) — what an exam has to look like *inside*,
 * beyond its item count.
 *
 * Deliberately separate from `SkillFormat`: those two numbers are read by marketing pages
 * and the dashboard, these are read only by admin. Folding them together would put the
 * docent's authoring rules into the page payload of every public route.
 *
 * Mirrors the matching columns on `exam_formats` — change both in the same commit. `null`
 * means unverified, exactly as it does there, and every consumer must skip the rule rather
 * than substitute a guess: `exam_publish_issues()` does not check what it does not know.
 */
export type SkillRules = {
  /** Fragments (teksten of audio) in one exam. */
  stimulusCount: number | null;
  /** Questions hanging off one fragment. */
  questionsPerStimulus: [number, number] | null;
  /** Answer options per question. */
  options: [number, number] | null;
  /** Length of one audio fragment, in seconds. Meaningless for a non-audio onderdeel. */
  audioSeconds: [number, number] | null;
  /** Onderdelen (`exam_parts`) in one exam. Only Spreken has them. */
  partCount: number | null;
  /** Opgaven in one onderdeel. */
  itemsPerPart: number | null;
};

/**
 * What one *kind* of open opgave looks like. Mirrors a row of `exam_task_rules`.
 *
 * The key is the `rubricCategory()` string from `lib/rubrics.ts` — a Schrijven `task_type`,
 * or `'speaking_' + image_usage` for Spreken. That axis is deliberately reused rather than
 * invented: rubric authoring, grading and structure validation then all key the same way,
 * and a fifth kind of opgave is one row in three places instead of a new concept.
 *
 * Kept as plain strings here so `data/` imports nothing from `lib/`. There is deliberately no
 * label: `task_categories.label_nl` is the one in the database and `CATEGORY_LABELS` in
 * `lib/rubrics.ts` is the one on the client. A third copy here would be a third thing to drift.
 */
export type TaskRule = {
  category: string;
  /** Opgaven of this kind in one exam. A quota, not a slot — the order is not fixed. */
  perExam: [number, number] | null;
  /** Pictures on one opgave. Null where the count genuinely varies. */
  imageCount: number | null;
  /** The stated minimum, as in "Schrijf minimaal drie zinnen op." */
  minSentences: number | null;
  /** Bullets in the opdracht. */
  bullets: [number, number] | null;
  /** Recording cap in seconds. */
  recordSeconds: number | null;
};

export const SKILLS: Skill[] = [
  { slug: 'lezen',     key: 'lezen',     scoring: 'mcq',  requiresStimulus: true, isLevelled: true },
  { slug: 'luisteren', key: 'luisteren', scoring: 'mcq',  requiresStimulus: true, isLevelled: true },
  { slug: 'schrijven', key: 'schrijven', scoring: 'open', requiresStimulus: true, isLevelled: true },
  { slug: 'spreken',   key: 'spreken',   scoring: 'open', requiresStimulus: true, isLevelled: true },
];

export const SKILL_SLUGS = SKILLS.map(s => s.slug);

/**
 * Per-level exam formats. Mirrors the `exam_formats` table — change both together, or the
 * publish validator and the marketing copy will disagree about what an exam should contain.
 */
const FORMATS: Record<Level, Record<SkillSlug, SkillFormat>> = {
  a2: {
    lezen:     { itemCount: 25, durationMinutes: 65, examCount: 10 },
    luisteren: { itemCount: 25, durationMinutes: 45, examCount: 10 },
    schrijven: { itemCount: 4,  durationMinutes: 40, examCount: 10 },
    spreken:   { itemCount: 16, durationMinutes: 35, examCount: 10 },
  },
  // Counted off the CvTE/DUO *Openbaar examen* booklets for Lezen I, Schrijven I and
  // Spreken I (2022 + 2023, plus the 2024/2025 Spreken booklets), 2026-08-21 — the same
  // method `SEO/facts.md` §1 records for A2, and attributable the same way: to DUO's
  // published practice exams, never to an official DUO norm.
  //
  // **Luisteren stays null.** There is no B1 Luisteren reference material, so its shape is
  // genuinely unknown. Filling it in for symmetry would invent a standard.
  b1: {
    lezen:     { itemCount: 35,   durationMinutes: 110,  examCount: 10 },
    luisteren: { itemCount: null, durationMinutes: null, examCount: 10 },
    schrijven: { itemCount: 12,   durationMinutes: 100,  examCount: 10 },
    spreken:   { itemCount: 16,   durationMinutes: 30,   examCount: 10 },
  },
};

const NO_RULES: SkillRules = {
  stimulusCount: null, questionsPerStimulus: null, options: null, audioSeconds: null,
  partCount: null, itemsPerPart: null,
};

/**
 * Mirrors the rule columns on `exam_formats`.
 *
 * A2 Luisteren is fully worked out: 25 questions over 10 fragments, 2–3 questions each,
 * 3 or 4 options, 40–50 seconds of audio. A2 Lezen carries the option range and a 1–3
 * questions-per-text range — DUO shares a text across up to three questions, and short
 * texts carry one. Its `stimulusCount` stays `null` on purpose: only 13 of the 25 items
 * were captured, and 13 items is not a count of fragments. A2 Spreken carries its four
 * onderdelen of four opgaven.
 *
 * Everything still `null` stays `null` until someone works the shape out against DUO's
 * material — a number invented here silently becomes the standard the docent's work is
 * measured against.
 */
const RULES: Record<Level, Record<SkillSlug, SkillRules>> = {
  a2: {
    lezen:     { ...NO_RULES, questionsPerStimulus: [1, 3], options: [3, 4] },
    // audioSeconds was 40–50. Corrected to 25–45 on 2026-08-08 against the DUO reference material
    // in `resources/exam-references/A2/Listening/`, where the fragments run roughly 25–40 seconds
    // (70–110 woorden). 40–50 was too long and would have made every authored fragment warn.
    // Mirrors `exam_formats` for (a2, luisteren) — the two must not drift.
    luisteren: { ...NO_RULES, stimulusCount: 10, questionsPerStimulus: [2, 3], options: [3, 4], audioSeconds: [25, 45] },
    schrijven: NO_RULES,
    spreken:   { ...NO_RULES, partCount: 4, itemsPerPart: 4 },
  },
  // Mirrors `exam_formats` for b1 after `20260821090000_b1_exam_structure.sql`.
  // Lezen: 6 teksten, 35 vragen, 4–7 per tekst (2022: 4,6,6,5,7,7 · 2023: 6,5,6,6,7,5),
  // a/b/c with an occasional four-option vraag. Spreken: two delen of eight, not four of
  // four — the delen differ in spreektijd (20 s vs 30 s), which is why the split matters.
  b1: {
    lezen:     { ...NO_RULES, stimulusCount: 6, questionsPerStimulus: [4, 7], options: [3, 4] },
    luisteren: NO_RULES,
    schrijven: NO_RULES,
    spreken:   { ...NO_RULES, partCount: 2, itemsPerPart: 8 },
  },
};

const NO_TASK_RULES: TaskRule[] = [];

/**
 * Mirrors `exam_task_rules`. A2 only — nobody has worked B1's open onderdelen out, and an
 * empty list means "unverified", which the Opbouw panel renders as no expectation at all
 * rather than as an expectation of zero.
 *
 * Schrijven: four opgaven, always exactly one formulier and exactly one korte tekst voor
 * de wijkkrant; the other two are e-mails, or one e-mail and one briefje. Verified across
 * all three DUO A2 oefenexamens. The *order* varies between them, so only the mix is here.
 *
 * Spreken: four onderdelen of four opgaven, 60 seconden opname each, distinguished by how
 * many plaatjes they carry and what the candidate must do with them.
 */
const TASK_RULES: Record<Level, Record<SkillSlug, TaskRule[]>> = {
  a2: {
    lezen: NO_TASK_RULES,
    luisteren: NO_TASK_RULES,
    schrijven: [
      { category: 'email',        perExam: [1, 2], imageCount: null, minSentences: null, bullets: [2, 4], recordSeconds: null },
      { category: 'short_text',   perExam: [1, 1], imageCount: null, minSentences: 3,    bullets: null,   recordSeconds: null },
      { category: 'form',         perExam: [1, 1], imageCount: null, minSentences: null, bullets: null,   recordSeconds: null },
      { category: 'picture_note', perExam: [0, 1], imageCount: null, minSentences: 3,    bullets: null,   recordSeconds: null },
    ],
    spreken: [
      { category: 'speaking_react',     perExam: [4, 4], imageCount: 1, minSentences: null, bullets: null, recordSeconds: 60 },
      { category: 'speaking_describe',  perExam: [4, 4], imageCount: 1, minSentences: null, bullets: null, recordSeconds: 60 },
      { category: 'speaking_choose',    perExam: [4, 4], imageCount: 2, minSentences: null, bullets: null, recordSeconds: 60 },
      { category: 'speaking_cover_all', perExam: [4, 4], imageCount: 3, minSentences: null, bullets: null, recordSeconds: 60 },
    ],
  },
  // Mirrors `exam_task_rules` for b1. Quotas, not a blueprint — DUO orders the four long
  // opdrachten differently every year and draws them from a wider pool than any one exam
  // uses, so the maxima deliberately overlap and `itemCount` is what pins the total to 12.
  //
  // `sentence_completion` is B1's own shape and has no A2 equivalent: a part-written e-mail
  // or bericht whose sentence is left open, finished in two or three lines. It is its own
  // category because the category selects the rubric, and grading a two-line completion
  // against a sollicitatiebrief's anchors returns a confident wrong mark.
  b1: {
    lezen: NO_TASK_RULES, luisteren: NO_TASK_RULES,
    schrijven: [
      { category: 'sentence_completion', perExam: [8, 8], imageCount: null, minSentences: null, bullets: null,   recordSeconds: null },
      { category: 'form',                perExam: [1, 1], imageCount: null, minSentences: null, bullets: null,   recordSeconds: null },
      { category: 'email',               perExam: [0, 2], imageCount: null, minSentences: null, bullets: [4, 6], recordSeconds: null },
      { category: 'letter',              perExam: [0, 2], imageCount: null, minSentences: null, bullets: [4, 6], recordSeconds: null },
      { category: 'picture_report',      perExam: [0, 1], imageCount: 3,    minSentences: null, bullets: [4, 6], recordSeconds: null },
      { category: 'data_text',           perExam: [0, 1], imageCount: null, minSentences: null, bullets: [3, 5], recordSeconds: null },
    ],
    // The recording cap stays 60 s. DUO's 20 s / 30 s spreektijd is the *target* length;
    // cutting a B1 candidate off at 20 s would fail them on our stopwatch, not their Dutch.
    spreken: [
      { category: 'speaking_none',      perExam: [4, 7], imageCount: 0, minSentences: null, bullets: null, recordSeconds: 60 },
      { category: 'speaking_react',     perExam: [2, 4], imageCount: 1, minSentences: null, bullets: null, recordSeconds: 60 },
      { category: 'speaking_describe',  perExam: [1, 3], imageCount: 1, minSentences: null, bullets: null, recordSeconds: 60 },
      { category: 'speaking_choose',    perExam: [1, 3], imageCount: 2, minSentences: null, bullets: null, recordSeconds: 60 },
      { category: 'speaking_cover_all', perExam: [2, 4], imageCount: 3, minSentences: null, bullets: null, recordSeconds: 60 },
    ],
  },
};

export function isSkillSlug(x: unknown): x is SkillSlug {
  return typeof x === 'string' && (SKILL_SLUGS as string[]).includes(x);
}

/** Identity only — no counts. Use `getSkillAtLevel` when you need a number. */
export function getSkill(slug: string): Skill | undefined {
  return SKILLS.find(s => s.slug === slug);
}

export function getFormat(level: Level, slug: SkillSlug): SkillFormat {
  return FORMATS[level][slug];
}

/** Identity + the format for one level. This is what page components want. */
export function getSkillAtLevel(level: Level, slug: string): LevelledSkill | undefined {
  const skill = getSkill(slug);
  if (!skill) return undefined;
  return { ...skill, ...FORMATS[level][skill.slug], level };
}

/** All four skills with one level's formats, in display order. */
export function skillsAtLevel(level: Level): LevelledSkill[] {
  return SKILLS.map(s => ({ ...s, ...FORMATS[level][s.slug], level }));
}

/** Every practice exam at one level. */
export function totalExamsAtLevel(level: Level): number {
  return skillsAtLevel(level).reduce((n, s) => n + s.examCount, 0);
}

/**
 * Is this exam free to sit?
 *
 * Only A2 exam 1 of each skill. B1 has no free exam: the free tier is the funnel into the
 * A2 product, and giving away a B1 exam as well is a pricing decision nobody has made.
 * Mirrored by `exams.is_free` in the database — this function decides what the UI offers,
 * that column decides what the player allows, and they must agree.
 */
export function isFreeExam(level: Level, examNumber: number): boolean {
  return level === 'a2' && examNumber === 1;
}

/**
 * Render a possibly-unverified count.
 *
 * An em dash, never a `0` and never a guess: at B1 the honest answer today is "we have not
 * counted these yet", and a zero would read as a claim that the exam has no questions.
 */
export function formatCount(n: number | null): string {
  return n === null ? '—' : String(n);
}

/** The authoring rules for one (level, skill). See `SkillRules`. */
export function formatRules(level: Level, slug: SkillSlug): SkillRules {
  return RULES[level][slug];
}

/**
 * The per-soort rules for one (level, skill), in display order. Empty means unverified —
 * render no expectation, rather than an expectation of nothing.
 */
export function formatTaskRules(level: Level, slug: SkillSlug): TaskRule[] {
  return TASK_RULES[level][slug];
}

/** `[2, 3]` → `'2–3'`, `[3, 3]` → `'3'`, `null` → `'—'`. En dash, not a hyphen. */
export function formatRange(range: [number, number] | null): string {
  if (range === null) return '—';
  const [lo, hi] = range;
  return lo === hi ? String(lo) : `${lo}–${hi}`;
}
