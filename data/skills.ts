/**
 * The four A2 inburgering exam components.
 *
 * This is the static shape of the product — exam *content* lives in Supabase
 * (`exams` / `questions` / `open_tasks`), but the skill taxonomy itself is fixed by DUO
 * and is safe to hardcode.
 *
 * `durationMinutes` is published by DUO:
 *   https://www.inburgeren.nl/examen-doen/inhoud-taalexamens-a2-b1-b2.jsp
 * and restated in the Examenreglement, Artikel 9:
 *   https://www.inburgeren.nl/images/examenreglement.pdf
 *
 * `itemCount` is NOT published by DUO anywhere. These counts were read off the start screens
 * of DUO's own public practice exams (all 10 online A2 exams, verified 2026-07-28) — see
 * `SEO/facts.md` §1 for the method and the exact wording that is defensible in copy.
 * Do not restate these as an official DUO norm; attribute them to the practice exams.
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
