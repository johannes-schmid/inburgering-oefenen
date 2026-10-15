import type { Level, SkillSlug } from '@/data/skills';
import type { LessonStep, SideBlock, SideItem, SideKind } from '@/components/lessons/GrammarCourseSide';
import { grammarTopic, videoOf } from '@/data/grammar-syllabus';
import { lessonStepSoon } from '@/lib/features';
import { grammarStepPath, isFreeTopic, topicPath, type CourseOutline, type GrammarStep, type TopicLesson } from './grammar';
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
/** De vertaalde woorden voor de rijen; de pagina geeft ze mee, deze module is taalloos. */
export type RowLabels = {
  kinds: Record<SideKind, string>;
  minutes: (n: number) => string;
  exercises: (n: number) => string;
};

/** De opdracht van een les of onderwerp staat op hetzelfde adres, met `?stap=opdracht`. */
export function stepHref(href: string, step: LessonStep): string {
  return step === 'opdracht' ? `${href}?stap=opdracht` : href;
}

export function courseSideBlocks({
  locale, level, skill, owned, blocks, step, outline, open, currentLessonId = null, currentTopicN = null, grammarName, extras = null,
  currentStep = 'uitleg', exerciseCounts = new Map(), rowLabels,
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
  /** Welke stap van de huidige les of het huidige onderwerp in beeld is. */
  currentStep?: LessonStep;
  /** Opgaven per les-id (`fetchExerciseCounts`), voor de opdrachtrij. */
  exerciseCounts?: Map<number, number>;
  rowLabels: RowLabels;
}): SideBlock[] {
  const paywall = (what: string) => `/${locale}/dashboard/pakketten?onderdeel=${level}:${skill}&vanaf=${what}`;
  const lessonHref = (slug: string, free: boolean) =>
    owned || free ? `/${locale}${lessonPath(level, skill, slug)}` : paywall(`leren-${slug}`);

  /**
   * Eén onderwerp of les als twee rijen: eerst de video (of de uitleg), dan de opdracht. Een les
   * zonder opgaven is één uitlegrij. De uitleg telt als gedaan zodra er voortgang op staat — je
   * komt pas aan antwoorden toe als je de uitleg voorbij bent; de opdracht als de les af is.
   */
  const pair = ({ key, label, href, locked, now, started, done, video, minutes, exercises }: {
    key: string; label: string; href: string; locked: boolean; now: boolean; started: boolean; done: boolean;
    video: string | null; minutes: number | null; exercises: number;
  }): SideItem[] => {
    const first: SideItem = {
      key: `${key}-u`,
      kind: video ? 'video' : 'uitleg',
      prefix: rowLabels.kinds[video ? 'video' : 'uitleg'],
      meta: video ?? (minutes ? rowLabels.minutes(minutes) : null),
      code: null,
      label,
      href,
      done: exercises > 0 ? started || done : done,
      now: now && (currentStep === 'uitleg' || exercises === 0),
      locked,
    };
    if (exercises === 0) return [first];
    return [first, {
      key: `${key}-o`,
      kind: 'opdracht',
      prefix: rowLabels.kinds.opdracht,
      meta: rowLabels.exercises(exercises),
      code: null,
      label,
      href: locked ? href : stepHref(href, 'opdracht'),
      done,
      now: now && currentStep === 'opdracht',
      locked,
    }];
  };
  const countOf = (ids: (number | null)[]) =>
    ids.reduce<number>((sum, id) => sum + (id === null ? 0 : exerciseCounts.get(id) ?? 0), 0);

  const topicItems: SideItem[] = step.topics.flatMap(x => {
    const syllabus = grammarTopic(level, skill, x.n);
    const video = syllabus ? videoOf(syllabus) : null;
    return pair({
      key: `t${x.n}`,
      label: x.title,
      href: owned || isFreeTopic(x.n) ? `/${locale}${topicPath(level, skill, x.n)}` : paywall(`grammatica-${x.n}`),
      locked: !owned && !isFreeTopic(x.n),
      now: x.n === currentTopicN,
      started: x.lessons.some(l => l.started || l.done),
      done: x.done,
      video: video?.url ? video.duration : null,
      minutes: null,
      exercises: countOf(x.lessons.map(l => l.id)),
    });
  });
  const extraItems: SideItem[] = (step.extras?.lessons ?? [])
    .filter((l): l is TopicLesson & { id: number } => l.id !== null)
    .flatMap(l => pair({
      key: l.ref,
      label: l.title ?? l.slug,
      href: lessonHref(l.slug, l.is_free),
      locked: !owned && !l.is_free,
      now: l.id === currentLessonId,
      started: !!l.started,
      done: l.done,
      video: null,
      minutes: null,
      exercises: exerciseCounts.get(l.id) ?? 0,
    }));

  return outline.blocks.map(b => {
    const isOpen = b.letter === open;
    const lessons = blocks.find(x => x.letter === b.letter)?.lessons ?? [];
    const items: SideItem[] = !isOpen
      ? []
      : b.letter === 'B'
        ? topicItems
        : b.letter === 'A'
          ? lessons.map((l, i) => ({
              key: `l${l.id}`,
              code: `${b.letter}${i + 1}`,
              label: l.title,
              href: lessonHref(l.slug, l.is_free),
              done: l.progress?.state === 'done',
              now: l.id === currentLessonId,
              locked: !owned && !l.is_free,
            }))
          : lessons.flatMap(l => pair({
              key: `l${l.id}`,
              label: l.title,
              href: lessonHref(l.slug, l.is_free),
              locked: !owned && !l.is_free,
              now: l.id === currentLessonId,
              started: l.progress !== null,
              done: l.progress?.state === 'done',
              video: null,
              minutes: l.minutes,
              exercises: exerciseCounts.get(l.id) ?? 0,
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
