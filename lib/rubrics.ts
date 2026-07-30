/**
 * Rubrics: which one grades a task, and how criterion scores become a percentage.
 *
 * Shared by the grader (`lib/ai/grade.ts`), the player, the results screen and the admin
 * surfaces. Pure functions and types only — no database access, so it is safe to import from
 * both client and server components.
 *
 * ## How a rubric is keyed
 * `rubrics (skill, task_type, version)` with `UNIQUE (skill, task_type) WHERE active`, so exactly
 * one rubric is live per category. Schrijven maps straight onto `open_tasks.task_type`. Spreken
 * does not: it has a single task_type (`speaking`) but four onderdelen whose image rule changes
 * what a good answer even is — "gebruik steeds het plaatje" is a different task from "gebruik
 * alle plaatjes". So Spreken is keyed by `image_usage`, giving `speaking_describe`,
 * `speaking_choose`, `speaking_cover_all`, `speaking_none`.
 *
 * `rubrics.task_type` is plain `text` with no CHECK constraint, so this convention needs no
 * migration — but it does need to live in one place, which is `rubricCategory()` below. Eight
 * categories cover all 20 open exams.
 */
import type { SkillSlug } from '@/data/skills';

export type RubricSkill = 'schrijven' | 'spreken';
export type ImageUsage = 'none' | 'describe' | 'choose' | 'cover_all';

export type WritingCategory = 'email' | 'short_text' | 'form' | 'picture_note';
export type SpeakingCategory =
  | 'speaking_none'
  | 'speaking_describe'
  | 'speaking_choose'
  | 'speaking_cover_all';
export type RubricCategory = WritingCategory | SpeakingCategory;

/** A criterion the docent authored, with the four anchors that define what 0..3 mean. */
export type RubricCriterion = {
  key: string;
  criterion: string;
  description?: string;
  anchors: Record<'0' | '1' | '2' | '3', string>;
};

export type Rubric = {
  id: number;
  skill: RubricSkill;
  task_type: RubricCategory | string;
  version: number;
  criteria: RubricCriterion[];
  system_prompt: string | null;
  active: boolean;
};

/** One criterion's outcome, from the model or from the docent. */
export type CriterionScore = {
  criterion_key: string;
  score: number;
  feedback: string | null;
  source: 'ai' | 'teacher';
};

export const MAX_CRITERION_SCORE = 3;

export const WRITING_CATEGORIES: WritingCategory[] = [
  'email',
  'short_text',
  'form',
  'picture_note',
];
export const SPEAKING_CATEGORIES: SpeakingCategory[] = [
  'speaking_none',
  'speaking_describe',
  'speaking_choose',
  'speaking_cover_all',
];

export function categoriesForSkill(skill: RubricSkill): RubricCategory[] {
  return skill === 'schrijven' ? WRITING_CATEGORIES : SPEAKING_CATEGORIES;
}

export function isRubricSkill(skill: SkillSlug | string): skill is RubricSkill {
  return skill === 'schrijven' || skill === 'spreken';
}

/**
 * The rubric category for a task. This is the single definition of the Spreken convention
 * documented above — resolve through here, never by concatenating `speaking_` at a call site.
 */
export function rubricCategory(task: {
  task_type: string;
  image_usage?: ImageUsage | null;
}): RubricCategory {
  if (task.task_type !== 'speaking') return task.task_type as WritingCategory;
  return `speaking_${task.image_usage ?? 'none'}` as SpeakingCategory;
}

/** Dutch labels for the admin surfaces. Exam content is always Dutch, so these are not i18n'd. */
export const CATEGORY_LABELS: Record<RubricCategory, string> = {
  email: 'E-mail schrijven',
  short_text: 'Korte tekst schrijven',
  form: 'Formulier invullen',
  picture_note: 'Bericht bij plaatjes',
  speaking_none: 'Spreken — vragen zonder plaatje',
  speaking_describe: 'Spreken — gebruik steeds het plaatje',
  speaking_choose: 'Spreken — kies steeds één plaatje',
  speaking_cover_all: 'Spreken — gebruik alle plaatjes',
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category as RubricCategory] ?? category;
}

/**
 * Percentage for one answer: the criteria are equally weighted, each out of 3.
 *
 * Criteria the rubric defines but the grader did not return are counted as **missing, not zero** —
 * they are dropped from the denominator. A dropped criterion is a grading bug and gets flagged
 * upstream; silently scoring it 0 would turn that bug into a candidate failing an exam.
 */
export function pctFromCriteria(
  scores: Pick<CriterionScore, 'criterion_key' | 'score'>[],
  criteria: RubricCriterion[]
): number | null {
  const known = new Set(criteria.map(c => c.key));
  const scored = scores.filter(s => known.has(s.criterion_key));
  if (scored.length === 0) return null;
  const sum = scored.reduce((n, s) => n + s.score, 0);
  return Math.round((100 * sum) / (MAX_CRITERION_SCORE * scored.length));
}

/**
 * Raw points, for showing "13 van 15 punten" beside the percentage.
 *
 * A percentage alone hides how much a single band is worth: on a five-criterion rubric one step is
 * ~7%, which reads as noise until you see it is 1 of 15 points.
 */
export function pointsFromCriteria(
  scores: Pick<CriterionScore, 'criterion_key' | 'score'>[],
  criteria: RubricCriterion[]
): { earned: number; max: number } | null {
  const known = new Set(criteria.map(c => c.key));
  const scored = scores.filter(s => known.has(s.criterion_key));
  if (scored.length === 0) return null;
  return {
    earned: scored.reduce((n, s) => n + s.score, 0),
    max: MAX_CRITERION_SCORE * scored.length,
  };
}

/**
 * Percentage across a whole sitting: the mean of the per-task percentages.
 *
 * Averaging percentages rather than raw points keeps a task with more criteria from silently
 * counting for more of the exam — DUO weights the four Schrijven opdrachten equally.
 * Returns null while any task is still ungraded, so the dashboard can say "wordt beoordeeld"
 * instead of showing a percentage that will move.
 */
export function examPctFromTaskPcts(taskPcts: (number | null)[]): number | null {
  if (taskPcts.length === 0) return null;
  if (taskPcts.some(p => p == null)) return null;
  const sum = (taskPcts as number[]).reduce((n, p) => n + p, 0);
  return Math.round(sum / taskPcts.length);
}

/**
 * Did the candidate pass? The threshold comes from `exams.pass_threshold_pct`.
 *
 * This is **our practice threshold, never DUO's.** DUO publishes no cut-off — the zak-slaaggrens
 * is "een cesuur, vastgesteld door de Minister" (Examenreglement Artikel 10 lid 5). See
 * `SEO/facts.md` §9; the widely repeated "18 van de 25" and "500 punten" are on its
 * do-not-publish list precisely because nobody can source them.
 */
export function isPassing(pct: number | null, passThresholdPct: number): boolean | null {
  if (pct == null) return null;
  return pct >= passThresholdPct;
}

/** Coarse band, shown below Compleet where the criteria themselves are gated. */
export type ScoreBand = 'onvoldoende' | 'bijna' | 'voldoende' | 'goed';

export function scoreBand(pct: number, passThresholdPct: number): ScoreBand {
  if (pct >= 85) return 'goed';
  if (pct >= passThresholdPct) return 'voldoende';
  if (pct >= passThresholdPct - 15) return 'bijna';
  return 'onvoldoende';
}

/**
 * Collapse AI and docent scores into what the candidate sees.
 *
 * The docent's score wins wherever she has entered one. Both rows are kept in the database
 * (`UNIQUE (submission_id, criterion_key, source)`) because that pairing is the eval dataset —
 * but the candidate is shown one number per criterion, and it is hers.
 */
export function effectiveScores(all: CriterionScore[]): CriterionScore[] {
  const byKey = new Map<string, CriterionScore>();
  for (const s of all) {
    const prev = byKey.get(s.criterion_key);
    if (!prev || (s.source === 'teacher' && prev.source === 'ai')) byKey.set(s.criterion_key, s);
  }
  return [...byKey.values()];
}

export function isTeacherReviewed(all: CriterionScore[]): boolean {
  return all.some(s => s.source === 'teacher');
}
