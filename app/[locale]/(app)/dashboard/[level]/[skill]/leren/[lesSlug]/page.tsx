import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { ownsModule } from '@/lib/entitlements';
import { getSkillAtLevel, isLevel, levelLabel, SKILLS } from '@/data/skills';
import { fetchPortalMenu } from '@/lib/portal-menu';
import { closeTrail } from '@/lib/portal-crumbs';
import { LessonProgressScope } from '@/components/lessons/LessonProgressScope';
import LessonStage from '@/components/lessons/LessonStage';
import PortalCrumbs from '../../../../../components/PortalCrumbs';
import { fetchCourse, fetchExerciseCounts, fetchLesson, fetchLessonWords } from '@/lib/lessons/lessons-server';
import { fetchNarration, narrationCueNames } from '@/lib/lessons/narration';
import { stepCount, visualFor } from '@/data/lesson-visuals';
import { conceptPath, exerciseCount, lessonPath } from '@/lib/lessons/lessons';
import { fetchGrammarStep } from '@/lib/lessons/grammar-server';
import { courseOutline, grammarStepPath, topicCode, topicOfLesson, topicPath } from '@/lib/lessons/grammar';
import { courseSideBlocks } from '@/lib/lessons/course-side';
import { courseRowLabels, lessonStreamLabels, stepLabels } from '@/lib/lessons/stream-labels';
import { modulePath } from '@/lib/lessons/sporen';
import { wordsPath } from '@/lib/lessons/words';
import LessonNarration from '@/components/lessons/LessonNarration';
import { NarrationScope } from '@/components/lessons/NarrationScope';
import GrammarTopicView, { type TopicPart } from '@/components/lessons/GrammarTopicView';
import GrammarCourseSide from '@/components/lessons/GrammarCourseSide';
import CourseRoute from '@/components/lessons/CourseRoute';
import type { Category } from '@/components/horizon';
import type { LessonItem } from '@/components/lessons/item-helpers';
import AppShell from '../../../../../components/AppShell';
import '@/app/glas-leerlaag.css';

type Props = {
  params: Promise<{ locale: string; level: string; skill: string; lesSlug: string }>;
  searchParams: Promise<{ stap?: string }>;
};

export const metadata: Metadata = {
  title: 'Les | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

/**
 * Eén les, in de opbouw van het grammaticaonderwerp (eigenaar, 11-10).
 *
 * ── ÉÉN OPBOUW VOOR ELKE LES ─────────────────────────────────────────────────
 * Woorden, examenuitleg, examentraining en toets jezelf zagen er anders uit dan stap 2: een
 * leskaart, een "Deze les"-kaart, een voortgangsbalk en de hele stroom onder elkaar, met het
 * spoorpaneel in de chrome. Nu is het `GrammarTopicView` met één deel: navy kop, de opgaven in
 * één kaart, de uitleg als pop-up en "Hierna" ernaast; in de tweede kolom de niveau- en
 * onderdeelkiezer en de vijf blokken met het blok van deze les open. Een les zonder opgaven
 * toont zijn uitleg in de kaart zelf.
 *
 * "Hierna" blijft binnen het blok (of het onderwerp): aan het eind van een blok gaat hij terug
 * naar de leerroute, niet stil het volgende blok in.
 *
 * ── EEN `pending` LES IS BEREIKBAAR, EN ZEGT DAT ─────────────────────────────
 * `fetchLesson` geeft ook een nog niet nagekeken les terug: precies dát maakt reviewen
 * mogelijk. Hij staat in geen blok, in geen voortgang en in geen menu, en de kop zegt het.
 * Zonder die melding zou de docent niet kunnen zien waar ze naar kijkt.
 */
export default async function LessonPage({ params, searchParams }: Props) {
  const { locale, level: rawLevel, skill: slug, lesSlug } = await params;
  const currentStep = (await searchParams).stap === 'opdracht' ? 'opdracht' : 'uitleg';
  if (!isLevel(rawLevel)) notFound();
  const level = rawLevel;
  const skill = getSkillAtLevel(level, slug);
  if (!skill) notFound();

  const t = await getTranslations('lessons');
  const tSkills = await getTranslations('skills');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=${lessonPath(level, skill.slug, lesSlug)}`);

  const lesson = await fetchLesson(level, skill.slug, lesSlug);
  if (!lesson) notFound();

  const meta = user.user_metadata ?? {};
  const owned = ownsModule(meta, level, skill.slug);
  if (!owned && !lesson.is_free) {
    redirect(`/${locale}/dashboard/pakketten?onderdeel=${level}:${skill.slug}&vanaf=leren-${lesSlug}`);
  }

  const [blocks, wordsByItem, menu, narration, grammar, labels, rowLabels] = await Promise.all([
    fetchCourse(level, skill.slug, user.id),
    fetchLessonWords(lesson.items, user.id),
    fetchPortalMenu(),
    fetchNarration(lesson.id),
    fetchGrammarStep(level, skill.slug, user.id),
    lessonStreamLabels(),
    courseRowLabels(),
  ]);
  const exerciseCounts = await fetchExerciseCounts([...new Set([
    ...blocks.flatMap(b => b.lessons.map(l => l.id)),
    ...grammar.topics.flatMap(x => x.lessons.map(l => l.id)),
    ...(grammar.extras?.lessons ?? []).map(l => l.id),
  ].filter((id): id is number => id !== null))]);
  const tGrammar = await getTranslations('grammar');

  // De woorden op hun item hangen, zodat de renderer één databron heeft. Zie `item-helpers.ts`.
  const items: LessonItem[] = lesson.items.map(item =>
    item.kind === 'woordenlijst'
      ? { ...item, words: wordsByItem.get(item.id) ?? [], userId: user.id, lessonId: lesson.id }
      : item) as LessonItem[];

  /**
   * Staat deze les in stap 2 — in een grammaticaonderwerp of in de extra reeks? Dan is dát
   * zijn plek (oktober 2026): de kolom ernaast toont de onderwerpen, "terug" gaat naar het
   * onderwerp en "hierna" naar de volgende les van dat onderwerp, of anders het volgende
   * onderwerp. De taalregelmodules van `concept_groups` bestaan in deze rol niet meer.
   */
  const gTopic = topicOfLesson(grammar, lesson.id);
  const gExtras = grammar.extras?.lessons.some(l => l.id === lesson.id) ? grammar.extras : null;
  const inGrammar = gTopic !== null || gExtras !== null;
  const gLessons = (gTopic?.lessons ?? gExtras?.lessons ?? []).filter(l => l.id !== null);
  const gIndex = gLessons.findIndex(l => l.id === lesson.id);
  const gNextLesson = gIndex >= 0 ? gLessons[gIndex + 1] ?? null : null;
  const gNextTopic = gTopic ? grammar.topics.find(x => x.n === gTopic.n + 1) ?? null : null;

  /* De blokletter van deze les: blok B als hij in stap 2 hoort, anders het blok waar hij staat. */
  const ownBlock = blocks.find(b => b.lessons.some(l => l.id === lesson.id)) ?? null;
  const openLetter = inGrammar ? 'B' : ownBlock?.letter ?? null;
  const blockLessons = !inGrammar && ownBlock ? ownBlock.lessons : [];
  const atInBlock = blockLessons.findIndex(l => l.id === lesson.id);
  const nextInBlock = atInBlock >= 0 ? blockLessons[atInBlock + 1] ?? null : null;
  const blockHref = ownBlock?.letter === 'A'
    ? wordsPath(level, skill.slug)
    : modulePath(level, skill.slug, 'examentraining', (ownBlock?.letter ?? 'c').toLowerCase());

  /**
   * De cursusroute naast de zijbalk (eigenaar, 15-10): dezelfde vijf blokken als op het
   * grammaticaonderwerp, met het blok van deze les open. Het niveau staat in de zijbalk.
   */
  const outline = courseOutline(blocks, grammar);
  const skillName = tSkills(`${skill.key}.name`);
  const sideBlocks = courseSideBlocks({
    locale, level, skill: skill.slug, owned, blocks, step: grammar, outline,
    open: openLetter, currentLessonId: lesson.id, currentTopicN: gTopic?.n ?? null,
    grammarName: tGrammar('step_label'),
    currentStep, exerciseCounts, rowLabels,
  });
  const sideNav = (
    <CourseRoute
      courseLabel={`${levelLabel(level)} ${skillName}`}
      done={outline.done}
      total={outline.total}
      skills={SKILLS.map(s => ({
        key: s.slug,
        label: tSkills(`${s.key}.short`),
        href: `/${locale}/dashboard/${level}/${s.slug}`,
        on: s.slug === skill.slug,
      }))}
      blocks={sideBlocks}
      examsHref={`/${locale}/dashboard/${level}/${skill.slug}`}
    />
  );

  /**
   * Het lesplaatje van deze les, en hoeveel stappen het heeft.
   *
   * Het aantal stappen is hier nodig en niet in het plaatje zelf: de speler moet de cue
   * `vis-3` een naam kunnen geven, en dat kan alleen wie weet dat er een stap 3 is.
   */
  const visual = visualFor(lesson.slug);

  /* De namen van de delen, voor de "nu:"-regel op de speler. `cards` komt uit het eerste
     uitlegitem, want dat is waar `card-0` en `card-1` in `LessonStream` uit komen. */
  const firstUitleg = lesson.items.find(i => i.kind === 'uitleg');
  const cueNames = narrationCueNames({
    cards: firstUitleg?.kind === 'uitleg' ? firstUitleg.payload.cards.map(c => c.label) : [],
    demoCount: lesson.items.filter(i => i.kind === 'voorbeeld').length,
    visualSteps: visual ? stepCount(visual) : 0,
    labels: {
      rule: t('narration_at_rule'),
      demo: t.raw('narration_at_demo') as string,
      visual: t('narration_at_visual'),
      visualStep: t.raw('narration_at_visual_step') as string,
      exercises: t('narration_at_exercises'),
    },
  });

  const crumbs = (
    <PortalCrumbs
      trail={closeTrail(
        [
          { label: `${levelLabel(level)} ${skillName}`, href: `/${locale}/dashboard/${level}/${skill.slug}` },
          ...(inGrammar
            ? [
                { label: tGrammar('step_label'), href: `/${locale}${grammarStepPath(level, skill.slug)}` },
                gTopic
                  ? { label: `${topicCode(gTopic.n)} · ${gTopic.title}`, href: `/${locale}${topicPath(level, skill.slug, gTopic.n)}` }
                  : { label: gExtras!.title },
              ]
            : ownBlock
              ? [{ label: ownBlock.name_nl, href: `/${locale}${blockHref}` }]
              : []),
        ],
        {
          label: atInBlock >= 0
            ? t('module_place', { n: atInBlock + 1, total: blockLessons.length })
            : lesson.title,
          siblings: blockLessons.length > 0
            ? blockLessons.map((l, i) => ({
                label: `${ownBlock!.letter}${i + 1} · ${l.title}`,
                href: `/${locale}${lessonPath(level, skill.slug, l.slug)}`,
                current: l.id === lesson.id,
                muted: !owned && !l.is_free,
              }))
            : undefined,
        },
      )}
    />
  );

  /* "Hierna": de volgende les van dit blok of onderwerp; aan het eind het volgende onderwerp,
     of terug naar de leerroute van het onderdeel. */
  const next = inGrammar
    ? gNextLesson
      ? { href: `/${locale}${lessonPath(level, skill.slug, gNextLesson.slug)}`, kick: t('next_lesson'), title: gNextLesson.title ?? gNextLesson.slug }
      : gNextTopic
        ? { href: `/${locale}${topicPath(level, skill.slug, gNextTopic.n)}`, kick: tGrammar('next_topic'), title: `${topicCode(gNextTopic.n)} · ${gNextTopic.title}` }
        : { href: `/${locale}/dashboard/${level}/${skill.slug}`, kick: tGrammar('step_done'), title: tGrammar('step_back') }
    : nextInBlock
      ? { href: `/${locale}${lessonPath(level, skill.slug, nextInBlock.slug)}`, kick: t('next_lesson'), title: nextInBlock.title }
      : { href: `/${locale}/dashboard/${level}/${skill.slug}`, kick: t('module_done_head'), title: t('module_back_to_spoor') };

  /**
   * Een woordenles (blok A) is alleen de woorden (eigenaar, 15-10): de titel en de kaartendeck.
   * De uitleg, de voorbeeldkaarten, de leerdoeltekst en de opgaven blijven in de database staan
   * maar niet op dit scherm. Zonder opgaven zet `lesson-answer` de les nooit op `done`; dat doet
   * nu de deck, zodra elk woord gekend is (`lessonWordsDone`).
   */
  const wordCount = items.reduce((n, i) => n + (i.kind === 'woordenlijst' ? i.words?.length ?? 0 : 0), 0);
  const wordsOnly = !inGrammar && ownBlock?.letter === 'A' && wordCount > 0;
  const shownItems = wordsOnly
    ? items.filter(i => i.kind === 'woordenlijst')
    : items;

  const part: TopicPart = {
    ref: lesson.slug,
    lessonId: lesson.id,
    title: lesson.title,
    pending: lesson.review_status !== 'validated',
    items: shownItems,
    visual,
    exercises: wordsOnly ? 0 : exerciseCount(lesson.items),
  };

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
          <div className="gt-mobile-course">
            <GrammarCourseSide
              category={skill.slug as Category}
              courseLabel={`${skillName} · ${levelLabel(level)}`}
              pct={outline.pct}
              line={outline.current
                ? tGrammar('course_line', { done: outline.done, total: outline.total, letter: outline.current })
                : tGrammar('course_line_done', { done: outline.done, total: outline.total })}
              blocks={sideBlocks}
              labels={{ blocksAria: tGrammar('blocks_aria'), nowChip: tGrammar('now_chip') }}
            />
          </div>

          <main className="min-w-0">
          <NarrationScope hasNarration={narration !== null}>
          <LessonProgressScope>
          <GrammarTopicView
            crumbs={crumbs}
            kicker={ownBlock && !inGrammar ? `${ownBlock.letter}${atInBlock + 1} · ${ownBlock.name_nl}` : null}
            category={inGrammar || ownBlock?.letter === 'B' ? 'taalregels' : ownBlock?.letter === 'A' ? 'woorden' : 'examen'}
            title={lesson.title}
            learn={wordsOnly ? '' : lesson.what_you_learn ?? ''}
            links={wordsOnly ? [] : lesson.concepts
              .filter(c => c.name_nl.trim().toLowerCase() !== lesson.title.trim().toLowerCase())
              .map(c => ({ label: c.name_nl, href: `/${locale}${conceptPath(level, c.slug)}` }))}
            video={null}
            before={narration && (
              <div className="gt-narration">
                <LessonNarration
                  layout="hero"
                  audioUrl={narration.audioUrl}
                  durationSeconds={narration.durationSeconds}
                  cues={narration.cues}
                  words={narration.words}
                  cueNames={cueNames}
                  reviewed={narration.reviewStatus === 'validated'}
                  labels={{
                    kicker: t('narration_kicker'),
                    play: t('narration_play'),
                    pause: t('narration_pause'),
                    speed: t('narration_speed'),
                    pendingNote: t('narration_pending'),
                    followLabel: t('narration_follow'),
                    followOn: t('narration_follow_on'),
                    followOff: t('narration_follow_off'),
                    nowAt: t.raw('narration_now_at') as string,
                    back10: t('narration_back10'),
                    fwd10: t('narration_fwd10'),
                    chapters: t('narration_chapters'),
                    wave: t('narration_wave'),
                  }}
                >
                  <LessonStage
                    items={items}
                    visual={visual}
                    cueNames={cueNames}
                    labels={{
                      ruleKick: t('rule_kick'),
                      demoKick: t('demo_kick'),
                      prev: t('stage_prev'),
                      next: t('stage_next'),
                      goto: t.raw('stage_goto') as string,
                      visual: labels.visual,
                    }}
                  />
                </LessonNarration>
              </div>
            )}
            parts={[part]}
            next={{ href: next.href, title: next.title }}
            streamLabels={labels}
            step={currentStep}
            href={`/${locale}${lessonPath(level, skill.slug, lesson.slug)}`}
            labels={{
              partsAria: tGrammar('parts_aria'),
              notWritten: tGrammar('not_written'),
              notWrittenSub: tGrammar('not_written_sub'),
              pending: t('pending_banner'),
              videoPlay: tGrammar('video_play'),
              videoSoon: tGrammar('video_soon'),
              videoSoonSub: tGrammar('video_soon_sub'),
              uitlegHead: labels.learnHead,
              uitlegSub: labels.learnSub,
              nextKick: next.kick,
              ...stepLabels(tGrammar, rowLabels, part.exercises),
            }}
          />
          </LessonProgressScope>
          </NarrationScope>
          </main>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
