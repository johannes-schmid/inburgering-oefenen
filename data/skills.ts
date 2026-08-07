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
 * **B1 is unverified and its counts are `null` on purpose.** Nobody has done for B1 what was
 * done for A2, and `SEO/facts.md` forbids publishing an unsourced number. `null` means "we do
 * not know", renders as an em dash, and makes `exam_publish_issues()` skip its count check
 * rather than blocking the docent on a guess. Fill these in only by counting them off DUO's
 * B1 practice exams — and update `exam_formats` in the database in the same commit.
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
  // UNVERIFIED — see the header. Do not fill these in from memory or from a competitor.
  b1: {
    lezen:     { itemCount: null, durationMinutes: null, examCount: 10 },
    luisteren: { itemCount: null, durationMinutes: null, examCount: 10 },
    schrijven: { itemCount: null, durationMinutes: null, examCount: 10 },
    spreken:   { itemCount: null, durationMinutes: null, examCount: 10 },
  },
};

const NO_RULES: SkillRules = {
  stimulusCount: null, questionsPerStimulus: null, options: null, audioSeconds: null,
};

/**
 * Mirrors the rule columns on `exam_formats`.
 *
 * Only A2 Luisteren is worked out: 25 questions over 10 fragments, 2–3 questions each,
 * 3 or 4 options, 40–50 seconds of audio. A2 Lezen carries the option range only, because
 * that one rule was already hardcoded in the publish validator and moving it here is not a
 * new claim. Everything else stays `null` until someone works the shape out against DUO's
 * material the way A2 Luisteren was — a number invented here silently becomes the standard
 * the docent's work is measured against.
 */
const RULES: Record<Level, Record<SkillSlug, SkillRules>> = {
  a2: {
    lezen:     { ...NO_RULES, options: [3, 4] },
    luisteren: { stimulusCount: 10, questionsPerStimulus: [2, 3], options: [3, 4], audioSeconds: [40, 50] },
    schrijven: NO_RULES,
    spreken:   NO_RULES,
  },
  b1: { lezen: NO_RULES, luisteren: NO_RULES, schrijven: NO_RULES, spreken: NO_RULES },
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

/** `[2, 3]` → `'2–3'`, `[3, 3]` → `'3'`, `null` → `'—'`. En dash, not a hyphen. */
export function formatRange(range: [number, number] | null): string {
  if (range === null) return '—';
  const [lo, hi] = range;
  return lo === hi ? String(lo) : `${lo}–${hi}`;
}
