import { getTranslations } from 'next-intl/server';
import { isFreeExamOf, type KnmOnderdeel, type Level, type LevelledSkill } from '@/data/skills';
import type { SkillProgress } from '@/lib/portal-progress';
import { localeHref } from '@/i18n/paths';

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
  /**
   * `null` is KNM — het onderdeel zonder niveau (`exams.level IS NULL`), dat daarom ook geen
   * niveau in zijn URL draagt. Dezelfde afspraak als `isFreeExamOf` en `levelFilter()`: één
   * plek waar die tak leeft, in plaats van een tweede kopie van deze tien slots voor KNM.
   */
  level: Level | null;
  skill: LevelledSkill | KnmOnderdeel;
  progress: SkillProgress;
  published: Set<number>;
  isGuest: boolean;
  owns: boolean;
}): Promise<{ cards: ExamCardView[]; factLine: string; nextNumber: number | null }> {
  const t = await getTranslations('portal');

  /* De basis van elke link: met niveau bij een taalonderdeel, zonder bij KNM. */
  const examBase = level === null ? 'oefenexamen/knm' : `oefenexamen/${level}/${skill.slug}`;
  const moduleId = level === null ? 'knm' : `${level}:${skill.slug}`;

  const slots = Array.from({ length: skill.examCount }, (_, i) => i + 1).map(n => {
    const done = progress.exams[n];
    const free = isFreeExamOf(level, n);
    const isPublished = published.has(n);
    /* Een gast mag het gratis slot wél openen — sinds 21-09 krijgt hij daar de eerste
       `GUEST_PREVIEW_QUESTIONS` vragen en pas daarna de aanmeldkaart, over het examen heen.
       Een betaald slot blijft voor hem dicht: daar is het account niet de stap die verkocht
       wordt maar de rekening. */
    const openable = isPublished && (free || (!isGuest && owns));
    const href = openable
      ? localeHref(locale, `${examBase}/${n}`)
      : isGuest && isPublished
        ? `/${locale}/register?next=/${examBase}/${n}`
        : isPublished
          ? `/${locale}/dashboard/pakketten?onderdeel=${moduleId}&vanaf=oefenexamen-${n}`
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
