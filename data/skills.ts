/**
 * The four A2 inburgering exam components.
 *
 * This is the static shape of the product — exam *content* lives in Supabase
 * (`exams` / `questions` / `open_tasks`), but the skill taxonomy itself is fixed by DUO
 * and is safe to hardcode. `itemCount` and `durationMinutes` mirror the real DUO exams.
 */
export type SkillSlug = 'lezen' | 'luisteren' | 'schrijven' | 'spreken';

export type Skill = {
  slug: SkillSlug;
  /** i18n key suffix under the `skills` namespace, e.g. skills.lezen.name */
  key: SkillSlug;
  /** Items in one exam, per the official DUO format */
  itemCount: number;
  durationMinutes: number;
  /** How many practice exams we publish per skill */
  examCount: number;
  /** Auto-scored multiple choice, or an open answer that needs rubric grading */
  scoring: 'mcq' | 'open';
};

export const SKILLS: Skill[] = [
  { slug: 'lezen',      key: 'lezen',      itemCount: 25, durationMinutes: 65, examCount: 10, scoring: 'mcq' },
  { slug: 'luisteren',  key: 'luisteren',  itemCount: 25, durationMinutes: 45, examCount: 10, scoring: 'mcq' },
  { slug: 'schrijven',  key: 'schrijven',  itemCount: 4,  durationMinutes: 40, examCount: 10, scoring: 'open' },
  { slug: 'spreken',    key: 'spreken',    itemCount: 16, durationMinutes: 35, examCount: 10, scoring: 'open' },
];

export const SKILL_SLUGS = SKILLS.map(s => s.slug);

export function getSkill(slug: string): Skill | undefined {
  return SKILLS.find(s => s.slug === slug);
}

/** Exam 1 of every skill is free; the rest sit behind a paid plan. */
export function isFreeExam(examNumber: number): boolean {
  return examNumber === 1;
}
