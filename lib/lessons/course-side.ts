import type { Level, SkillSlug } from '@/data/skills';
import type { SideBlock, SideItem } from '@/components/lessons/GrammarCourseSide';
import { lessonStepSoon } from '@/lib/features';
import { grammarStepPath, isFreeTopic, topicCode, topicPath, type CourseOutline, type GrammarStep, type TopicLesson } from './grammar';
import { lessonPath, type LessonBlock } from './lessons';
import { modulePath } from './sporen';
import { wordsPath } from './words';

/**
 * De vijf blokken van een cursus voor de tweede kolom — gedeeld door het grammaticaonderwerp en
 * de lespagina, zodat beide schermen dezelfde kolom tonen (eigenaar, 11-10).
 *
 * `open` is het blok waar de pagina in staat: dat klapt uit met zijn onderwerpen (B) of zijn
 * lessen (A, C, D, E). Een dicht blok linkt naar zijn ingang: de woordkaarten voor A, de
 * eerstvolgende les van de module voor C–E.
 */
export function courseSideBlocks({
  locale, level, skill, owned, blocks, step, outline, open, currentLessonId = null, currentTopicN = null, grammarName, extras = null,
}: {
  locale: string;
  level: Level;
  skill: SkillSlug;
  owned: boolean;
  blocks: LessonBlock[];
  step: GrammarStep;
  outline: CourseOutline;
  open: string | null;
  currentLessonId?: number | null;
  currentTopicN?: number | null;
  grammarName: string;
  /** Een tweede reeks onder het open blok — de woordkaartthema's onder blok A. */
  extras?: { title: string; items: SideItem[] } | null;
}): SideBlock[] {
  const paywall = (what: string) => `/${locale}/dashboard/pakketten?onderdeel=${level}:${skill}&vanaf=${what}`;
  const lessonHref = (slug: string, free: boolean) =>
    owned || free ? `/${locale}${lessonPath(level, skill, slug)}` : paywall(`leren-${slug}`);

  const topicItems: SideItem[] = step.topics.map(x => ({
    key: `t${x.n}`,
    code: topicCode(x.n),
    label: x.title,
    href: owned || isFreeTopic(x.n) ? `/${locale}${topicPath(level, skill, x.n)}` : paywall(`grammatica-${x.n}`),
    done: x.done,
    now: x.n === currentTopicN,
    locked: !owned && !isFreeTopic(x.n),
  }));
  const extraItems: SideItem[] = (step.extras?.lessons ?? [])
    .filter((l): l is TopicLesson & { id: number } => l.id !== null)
    .map(l => ({
      key: l.ref,
      code: null,
      label: l.title ?? l.slug,
      href: lessonHref(l.slug, l.is_free),
      done: l.done,
      now: l.id === currentLessonId,
      locked: !owned && !l.is_free,
    }));

  return outline.blocks.map(b => {
    const isOpen = b.letter === open;
    const lessons = blocks.find(x => x.letter === b.letter)?.lessons ?? [];
    const items: SideItem[] = !isOpen
      ? []
      : b.letter === 'B'
        ? topicItems
        : lessons.map((l, i) => ({
            key: `l${l.id}`,
            code: `${b.letter}${i + 1}`,
            label: l.title,
            href: lessonHref(l.slug, l.is_free),
            done: l.progress?.state === 'done',
            now: l.id === currentLessonId,
            locked: !owned && !l.is_free,
          }));
    return {
      letter: b.letter,
      name: b.name ?? grammarName,
      done: b.done,
      total: b.total,
      complete: b.complete,
      href: b.letter === 'A'
        ? `/${locale}${wordsPath(level, skill)}`
        : lessonStepSoon(level, b.letter === 'B' ? 'grammatica' : 'strategie')
          ? `/${locale}/dashboard/${level}/${skill}`
          : b.letter === 'B'
            ? `/${locale}${grammarStepPath(level, skill)}`
            : `/${locale}${modulePath(level, skill, 'examentraining', b.letter.toLowerCase())}`,
      open: isOpen,
      items,
      extras: !isOpen
        ? null
        : b.letter === 'B'
          ? step.extras && extraItems.length > 0 ? { title: step.extras.title, items: extraItems } : null
          : extras,
    };
  });
}
