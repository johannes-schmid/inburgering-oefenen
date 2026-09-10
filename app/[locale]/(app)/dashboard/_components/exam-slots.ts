import { getTranslations } from 'next-intl/server';
import { isFreeExam, type Level, type LevelledSkill } from '@/data/skills';
import type { SkillProgress } from '@/lib/portal-progress';

/**
 * De tien examenslots van één onderdeel, klaar om te tekenen.
 *
 * Twee schermen tonen dezelfde tien kaartjes — de strook onderaan de onderdeelpagina en het
 * losse overzicht op `/dashboard/[level]/[skill]/oefenexamens` — en de vier redenen dat een slot
 * niet te openen is zijn hier één keer uitgerekend. Twee kopieën van deze afweging is precies hoe
 * de speler en de zijkolom het ooit oneens werden over wie iets bezit.
 *
 * Puur databewerking: geen markup, dus de kaart kan een strook óf een raster zijn zonder dat de
 * regels meeverhuizen.
 */
export type ExamCardView = {
  n: number;
  /** `passed` `sat` `next` `open` `locked` `empty` — vier niet-openbare redenen blijven apart. */
  state: 'passed' | 'sat' | 'next' | 'open' | 'locked' | 'empty';
  /** De kop van het kaartje: de score als je die hebt, anders het nummer met een nul ervoor. */
  cap: string;
  /** Het statuslabel onder die kop, en tegelijk het label van de knop als die geen CTA is. */
  capNote: string;
  title: string;
  href: string | null;
  isNext: boolean;
};

export async function buildExamSlots({
  locale, level, skill, progress, published, isGuest, owns,
}: {
  locale: string;
  level: Level;
  skill: LevelledSkill;
  progress: SkillProgress;
  published: Set<number>;
  isGuest: boolean;
  owns: boolean;
}): Promise<{ cards: ExamCardView[]; factLine: string; nextNumber: number | null }> {
  const t = await getTranslations('portal');

  const slots = Array.from({ length: skill.examCount }, (_, i) => i + 1).map(n => {
    const done = progress.exams[n];
    const free = isFreeExam(level, n);
    const isPublished = published.has(n);
    /* Een gast kan niets openen, ook het gratis slot niet: het account aanmaken ís hier de stap
       die verkocht wordt. */
    const openable = isPublished && !isGuest && (free || owns);
    const href = openable
      ? `/${locale}/oefenexamen/${level}/${skill.slug}/${n}`
      : isGuest && isPublished
        ? `/${locale}/register?next=/oefenexamen/${level}/${skill.slug}/${n}`
        : isPublished
          ? `/${locale}/dashboard/pakketten?onderdeel=${level}:${skill.slug}&vanaf=oefenexamen-${n}`
          : null;
    return { n, done, isPublished, openable, href };
  });

  /** Het eerstvolgende examen dat je nu kunt doen — de enige oranje knop op het scherm. */
  const next = slots.find(s => s.openable && !s.done) ?? null;

  const cards: ExamCardView[] = slots.map(s => {
    const isNext = next?.n === s.n;
    const state: ExamCardView['state'] = s.done
      ? (s.done.passed ? 'passed' : 'sat')
      : !s.isPublished
        ? 'empty'
        : isNext
          ? 'next'
          : s.openable
            ? 'open'
            : 'locked';

    const capNote =
      state === 'passed' ? t('leg_passed')
        : state === 'sat' ? t('leg_not_passed')
          : state === 'empty' ? t('tag_soon')
            : state === 'locked' ? t('exam_card_in_package')
              : t('exam_card_available');

    return {
      n: s.n,
      state,
      cap: s.done?.bestPct != null ? `${s.done.bestPct}%` : String(s.n).padStart(2, '0'),
      capNote,
      /* "Examen 04", niet "Oefenexamen 4": in een kaartje van ~150px is de korte naam met een nul
         ervoor het enige dat op één regel past, en de kop van het paneel zegt al dat het
         oefenexamens zijn. */
      title: t('exam_card_title', { number: String(s.n).padStart(2, '0') }),
      href: s.href,
      isNext,
    };
  });

  /* Wat een examen inhoudt, uit `data/skills.ts`. Een NULL-telling betekent ongeverifieerd, dus
     dan staat er niets — nooit een 0 of een gok (§3). */
  const factLine = [
    skill.itemCount != null ? t('exam_card_items', { n: skill.itemCount }) : null,
    skill.durationMinutes != null ? t('exam_card_minutes', { n: skill.durationMinutes }) : null,
  ].filter(Boolean).join(' · ');

  return { cards, factLine, nextNumber: next?.n ?? null };
}
