/**
 * "Wat moet ik nu doen?" — één les en één examen, over de modules heen.
 *
 * Het portaal kon zeggen waar je stond en niet waar je verdergaat. Dit is die ene stap, en
 * hij staat hier en niet in de pagina's omdat het overzicht, de niveaupagina en de
 * onderdeelpagina hem alle drie stellen en drie kopieën ervan binnen een maand uit elkaar
 * lopen — dezelfde reden als voor `lib/admin/nav.ts` en `coursePanel`.
 *
 * Twee regels die uit de bestaande code komen en hier gelden:
 *
 * - **Een onderdeel dat je niet hebt gekocht wordt overgeslagen.** Een volgende stap die naar
 *   het aanbod wijst is een upsell vermomd als advies. Dat is de regel die
 *   `/dashboard/[level]` al toepaste op het volgende examen.
 * - **De volgorde is de catalogus, niet "minst gevorderd".** Een volgende stap die verspringt
 *   zodra je iets afmaakt leest als een gokkast, en DUO's eigen volgorde zit al in het hoofd
 *   van de kandidaat.
 */

import type { Level, LevelledSkill, SkillSlug } from '@/data/skills';
import { skillsAtLevel } from '@/data/skills';
import { ownsModule } from '@/lib/entitlements';
import { fetchCourse } from '@/lib/lessons/lessons-server';
import { lessonPath, nextLesson } from '@/lib/lessons/lessons';
import type { AllPortalProgress, PublishedExamNumbers } from '@/lib/portal-progress';

type Meta = Record<string, unknown>;

export type NextExam = { level: Level; skill: LevelledSkill; number: number };

/** Het laagstgenummerde gepubliceerde examen dat je nog niet gemaakt hebt, in een module van jou. */
export function nextExamFor(
  meta: Meta,
  progress: AllPortalProgress,
  published: PublishedExamNumbers,
  levels: Level[],
): NextExam | null {
  for (const level of levels) {
    for (const skill of skillsAtLevel(level)) {
      if (!ownsModule(meta, level, skill.slug)) continue;
      const p = progress[level][skill.slug];
      const pub = published[level][skill.slug];
      const number = Array.from({ length: skill.examCount }, (_, i) => i + 1)
        .find(n => !p.exams[n] && pub.has(n));
      if (number) return { level, skill, number };
    }
  }
  return null;
}

export type NextLesson = {
  level: Level;
  skill: SkillSlug;
  title: string;
  blockName: string;
  minutes: number | null;
  /** Pad zonder localeprefix. */
  href: string;
};

/**
 * De eerste onafgemaakte les, over de opgegeven modules heen.
 *
 * Eén `fetchCourse` per module tot er één iets oplevert — niet alle modules tegelijk. Een
 * cursus is vier queries, en het overzicht van iemand met twee niveaus zou er anders zestien
 * doen voor één regel tekst.
 */
export async function fetchNextLesson(
  userId: string | null,
  meta: Meta,
  modules: { level: Level; skill: SkillSlug }[],
): Promise<NextLesson | null> {
  for (const m of modules) {
    if (!ownsModule(meta, m.level, m.skill)) continue;
    const blocks = await fetchCourse(m.level, m.skill, userId);
    if (blocks.every(b => b.lessons.length === 0)) continue;
    const next = nextLesson(blocks);
    if (!next) continue;
    return {
      level: m.level,
      skill: m.skill,
      title: next.lesson.title,
      blockName: next.block.name_nl,
      minutes: next.lesson.minutes,
      href: lessonPath(m.level, m.skill, next.lesson.slug),
    };
  }
  return null;
}
