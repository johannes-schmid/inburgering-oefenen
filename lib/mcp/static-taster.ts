import { getFreePractice, type FreePracticeItem } from '@/data/free-practice';
import type { SkillSlug } from '@/data/skills';

/**
 * De statische A2-taster (`data/free-practice.ts`) heeft geen databaserijen en dus geen `questions.id`.
 * De site gebruikt hem als terugval wanneer examen 1 nog geen tien renderbare vragen heeft; de
 * ChatGPT-app moet hem dan óók kunnen nakijken. Daarom krijgt elk statisch item een negatief,
 * vast id: `-1000 - index` voor Lezen, `-2000 - index` voor Luisteren. Een negatief `questionId`
 * is voor `answers.ts` het sein om in de statische set te kijken in plaats van in de database.
 */
const BASE: Partial<Record<SkillSlug, number>> = { lezen: -1000, luisteren: -2000 };

export function staticKey(skill: SkillSlug, index: number): number | null {
  const base = BASE[skill];
  return base === undefined ? null : base - index;
}

export function staticItem(questionId: number): { skill: SkillSlug; item: FreePracticeItem } | null {
  if (questionId >= 0) return null;
  for (const [skill, base] of Object.entries(BASE) as [SkillSlug, number][]) {
    const index = base - questionId;
    if (index >= 0 && index < 100) {
      const item = getFreePractice(skill)?.items[index];
      return item ? { skill, item } : null;
    }
  }
  return null;
}
