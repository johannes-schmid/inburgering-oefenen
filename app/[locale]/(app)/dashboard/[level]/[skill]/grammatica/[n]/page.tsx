import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { ownsModule } from '@/lib/entitlements';
import { getSkillAtLevel, isLevel, levelLabel } from '@/data/skills';
import { grammarTopic, parseLessonRef, videoOf } from '@/data/grammar-syllabus';
import { visualFor } from '@/data/lesson-visuals';
import { fetchPortalMenu } from '@/lib/portal-menu';
import { closeTrail } from '@/lib/portal-crumbs';
import { fetchCourse, fetchExerciseCounts, fetchLesson, fetchLessonWords } from '@/lib/lessons/lessons-server';
import { fetchGrammarStep } from '@/lib/lessons/grammar-server';
import { courseOutline, isFreeTopic, grammarStepPath, topicCode, topicPath } from '@/lib/lessons/grammar';
import { exerciseCount } from '@/lib/lessons/lessons';
import { courseSideBlocks } from '@/lib/lessons/course-side';
import { courseRowLabels, lessonStreamLabels, stepLabels } from '@/lib/lessons/stream-labels';
import type { LessonItem } from '@/components/lessons/item-helpers';
import GrammarTopicView, { type TopicPart } from '@/components/lessons/GrammarTopicView';
import GrammarCourseSide from '@/components/lessons/GrammarCourseSide';
import CourseRoute from '@/components/lessons/CourseRoute';
import type { Category } from '@/components/horizon';
import AppShell from '../../../../../components/AppShell';
import '@/app/glas-leerlaag.css';
import PortalCrumbs from '../../../../../components/PortalCrumbs';

type Props = {
  params: Promise<{ locale: string; level: string; skill: string; n: string }>;
  searchParams: Promise<{ stap?: string }>;
};

export const metadata: Metadata = {
  title: 'Grammatica | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

/**
 * Eén grammaticaonderwerp: blok B, les n van een cursus (opzet eigenaar, oktober 2026).
 *
 * Het onderwerp komt uit `data/grammar-syllabus.ts` en wijst naar één of meer lessen die al in
 * de database staan — meestal in het regelhuis (`RULES_HOME`), soms in het eigen blok B van de
 * cursus, en bij B1 *Herhaling A2* in de A2-cursus. Deze pagina haalt elk van die lessen op
 * via `fetchLesson` op hun eigen (niveau, onderdeel, slug) en zet ze onder elkaar op één
 * pagina: zie `GrammarTopicView`.
 *
 * ── DE POORT IS DEZE CURSUS ──────────────────────────────────────────────────
 * Dezelfde regel als de lespagina: `ownsModule(meta, level, skill)`, waarbij `skill` de cursus
 * is waar je het onderwerp opent en niet het blok waar de les fysiek staat. Onderwerp 1 is
 * gratis met een account, zoals `is_free` dat voor les 1 van een blok is. Een gast gaat naar
 * het inloggen, zoals bij elke les.
 *
 * ── EEN LES DIE ER NOG NIET IS, IS GEEN 404 ──────────────────────────────────
 * De syllabus is ouder dan een deel van zijn lessen. Een verwijzing naar een les die nog niet
 * bestaat rendert "Deze les wordt nog geschreven"; een `pending` les rendert met de banner van
 * de lespagina. Alleen een onderwerpnummer dat niet in de syllabus staat is een 404.
 */
export default async function GrammarTopicPage({ params, searchParams }: Props) {
  const { locale, level: rawLevel, skill: slug, n: rawN } = await params;
  const currentStep = (await searchParams).stap === 'opdracht' ? 'opdracht' : 'uitleg';
  if (!isLevel(rawLevel)) notFound();
  const level = rawLevel;
  const skill = getSkillAtLevel(level, slug);
  if (!skill) notFound();
  const n = Number(rawN);
  const topic = Number.isInteger(n) ? grammarTopic(level, skill.slug, n) : null;
  if (!topic) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=${topicPath(level, skill.slug, n)}`);

  const meta = user.user_metadata ?? {};
  const owned = ownsModule(meta, level, skill.slug);
  if (!owned && !isFreeTopic(n)) {
    redirect(`/${locale}/dashboard/pakketten?onderdeel=${level}:${skill.slug}&vanaf=grammatica-${n}`);
  }

  const t = await getTranslations('grammar');
  const tSkills = await getTranslations('skills');

  const [step, blocks, menu, streamLabels, rowLabels] = await Promise.all([
    fetchGrammarStep(level, skill.slug, user.id),
    fetchCourse(level, skill.slug, user.id),
    fetchPortalMenu(),
    lessonStreamLabels(),
    courseRowLabels(),
  ]);
  const exerciseCounts = await fetchExerciseCounts([
    ...step.topics.flatMap(x => x.lessons.map(l => l.id)),
    ...(step.extras?.lessons ?? []).map(l => l.id),
  ].filter((id): id is number => id !== null));

  const index = step.topics.findIndex(x => x.n === n);

  /* Elke les op zijn eigen adres. Niet via `fetchLesson(level, skill, …)`: die valt wel terug
     op het regelhuis, maar een B1-onderwerp dat naar een A2-les wijst valt daar buiten. */
  const parts: TopicPart[] = await Promise.all(topic.lessons.map(async ref => {
    const { level: lLevel, onderdeel, slug: lSlug } = parseLessonRef(ref);
    const lesson = await fetchLesson(lLevel, onderdeel, lSlug);
    if (!lesson) {
      return { ref, lessonId: null, title: null, pending: false, items: [], visual: null, exercises: 0 };
    }
    const words = await fetchLessonWords(lesson.items, user.id);
    const items = lesson.items.map(item =>
      item.kind === 'woordenlijst' ? { ...item, words: words.get(item.id) ?? [], userId: user.id, lessonId: lesson.id } : item) as LessonItem[];
    return {
      ref,
      lessonId: lesson.id,
      title: lesson.title,
      pending: lesson.review_status !== 'validated',
      items,
      visual: visualFor(lesson.slug),
      exercises: exerciseCount(lesson.items),
    };
  }));

  const video = videoOf(topic);
  const outline = courseOutline(blocks, step);
  const skillName = tSkills(`${skill.key}.name`);

  const itemHref = (topicN: number) =>
    owned || isFreeTopic(topicN)
      ? `/${locale}${topicPath(level, skill.slug, topicN)}`
      : `/${locale}/dashboard/pakketten?onderdeel=${level}:${skill.slug}&vanaf=grammatica-${topicN}`;
  const sideBlocks = courseSideBlocks({
    locale, level, skill: skill.slug, owned, blocks, step, outline,
    open: 'B', currentTopicN: n, grammarName: t('step_label'),
    currentStep, exerciseCounts, rowLabels,
  });
  const exerciseTotal = parts.reduce((sum, p) => sum + p.exercises, 0);

  const following = step.topics[index + 1] ?? null;

  /* ── de cursusroute naast de zijbalk: het onderdeel en de blokken van deze cursus ── */
  const sideNav = (
    <CourseRoute
      courseLabel={`${levelLabel(level)} ${skillName}`}
      done={outline.done}
      total={outline.total}
      blocks={sideBlocks}
      backHref={`/${locale}/dashboard/${level}/${skill.slug}`}
          nextHref={`/${locale}/dashboard/${level}/${skill.slug}`}
    />
  );

  const crumbs = (
    <PortalCrumbs
      trail={closeTrail(
        [
          { label: `${levelLabel(level)} ${skillName}`, href: `/${locale}/dashboard/${level}/${skill.slug}` },
          { label: t('step_label'), href: `/${locale}${grammarStepPath(level, skill.slug)}` },
        ],
        {
          label: t('crumb_topic', { n: index + 1, total: step.topics.length }),
          siblings: step.topics.map(x => ({
            label: `${topicCode(x.n)} · ${x.title}`,
            href: itemHref(x.n),
            current: x.n === n,
            muted: !owned && !isFreeTopic(x.n),
          })),
        },
      )}
    />
  );

  return (
    <AppShell
      locale={locale}
      email={user.email ?? ''}
      avatarUrl={String(meta.avatar_url ?? meta.picture ?? '')}
      active={skill.slug}
      activeGroup={level}
      menu={menu}
      course={sideNav}
    >
      <div className="g-leer gl-shell">
        <div className="gt-page">
          <div className="gt-grid gt-solo">
          {/* Onder de breedte van de tweede kolom blijft de inklapbare cursuskaart staan. */}
          <div className="gt-mobile-course">
            <GrammarCourseSide
              category={skill.slug as Category}
              courseLabel={`${skillName} · ${levelLabel(level)}`}
              pct={outline.pct}
              line={outline.current
                ? t('course_line', { done: outline.done, total: outline.total, letter: outline.current })
                : t('course_line_done', { done: outline.done, total: outline.total })}
              blocks={sideBlocks}
              labels={{ blocksAria: t('blocks_aria'), nowChip: t('now_chip') }}
            />
          </div>

          <main className="min-w-0">
          <GrammarTopicView
            crumbs={crumbs}
            title={topic.title}
            learn={topic.learn}
            examples={topic.examples}
            video={video ? { url: video.url, title: video.title, duration: video.duration } : null}
            parts={parts}
            next={following
              ? { href: itemHref(following.n), title: `${topicCode(following.n)} · ${following.title}` }
              : { href: `/${locale}/dashboard/${level}/${skill.slug}`, title: t('step_back') }}
            streamLabels={streamLabels}
            step={currentStep}
            href={`/${locale}${topicPath(level, skill.slug, n)}`}
            labels={{
              partsAria: t('parts_aria'),
              notWritten: t('not_written'),
              notWrittenSub: t('not_written_sub'),
              pending: t('pending_hero'),
              videoPlay: t('video_play'),
              videoSoon: t('video_soon'),
              videoSoonSub: t('video_soon_sub'),
              uitlegHead: streamLabels.learnHead,
              uitlegSub: streamLabels.learnSub,
              nextKick: following ? t('next_topic') : t('step_done'),
              ...stepLabels(t, rowLabels, exerciseTotal),
            }}
          />
          </main>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
