import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, Check, Lock, Clock, ListChecks, RotateCcw } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ownsModule } from '@/lib/entitlements';
import { emptyLevelledProgress, fetchPortalProgress, fetchPublishedExamNumbers } from '@/lib/portal-progress';
import { formatCount, getSkillAtLevel, isFreeExam, isLevel, levelLabel } from '@/data/skills';
import CriterionProgress from '@/components/exam/CriterionProgress';
import { fetchCriterionSeries } from '@/lib/criterion-progress';
import { fetchCourse } from '@/lib/lessons/lessons-server';
import { fetchConcepts, fetchMastery, fetchTeachersForCourse } from '@/lib/lessons/concepts-server';
import { readiness } from '@/lib/lessons/readiness';
import PortalHero from '../../_components/PortalHero';
import StrengthWeakness, { type SwRow } from '../../_components/StrengthWeakness';
import { blockProgress, courseProgressPct, coursePath, lessonPath, nextLesson } from '@/lib/lessons/lessons';
import { HorizonBand } from '@/components/horizon';
import AppShell from '../../../components/AppShell';
import ExamListStyles from '../../_components/ExamListStyles';
import { fetchPortalMenu } from '@/lib/portal-menu';

type Props = { params: Promise<{ locale: string; level: string; skill: string }> };

export const metadata: Metadata = {
  title: 'Oefenexamens | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

/**
 * The ten oefenexamens of one onderdeel, inside the portal.
 *
 * This is the logged-in twin of the public `(main)/oefenexamen/[skill]` overview. They are not
 * duplicates by accident: the public page is the SEO and funnel surface and must render for
 * anonymous visitors, while this one shows scores, attempt counts and lock state, all of which
 * require a session.
 *
 * A slot has three reasons it may not be openable, and they are deliberately distinct in the
 * UI: no content authored yet, or paid-plan-only, or already passed (still re-sittable). A
 * single "locked" state for all three tells the candidate nothing.
 */
export default async function SkillExamsPage({ params }: Props) {
  const { locale, level: rawLevel, skill: slug } = await params;
  if (!isLevel(rawLevel)) notFound();
  const level = rawLevel;
  const skill = getSkillAtLevel(level, slug);
  if (!skill) notFound();

  const t = await getTranslations('portal');
  const tSkills = await getTranslations('skills');
  const tLessons = await getTranslations('lessons');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  /** Browsable anonymously; the wall is the oefenexamen itself. See `dashboard/page.tsx`. */
  const isGuest = !user;
  const meta = user?.user_metadata ?? {};

  // Per-onderdeel ownership, not "has any paid plan". The dashboard overview already read it this
  // way, so the two screens disagreed: the card said the module was owned and its ten slots all
  // showed locked.
  const ownsThisSkill = ownsModule(meta, level, skill.slug);
  const [progress, published] = await Promise.all([
    user ? fetchPortalProgress(user.id) : Promise.resolve(emptyLevelledProgress()),
    fetchPublishedExamNumbers(),
  ]);

  const p = progress[level][skill.slug];
  const pub = published[level][skill.slug];
  const isRubric = skill.scoring === 'open';

  // Only the two rubric skills have criteria to chart. `fetchCriterionSeries` returns [] until the
  // candidate has a graded answer, and CriterionProgress renders nothing for an empty series — so
  // this is quiet rather than an empty-state box on a page the candidate has just opened.
  const criterionSeries = isRubric && user
    ? await fetchCriterionSeries(user.id, skill.slug as 'schrijven' | 'spreken')
    : [];

  const menu = await fetchPortalMenu();

  // De lescursus van dit onderdeel. Een leeg resultaat betekent dat de docent nog niets heeft
  // vrijgegeven; dan komt er geen kaart in plaats van een kaart die naar een 404 wijst.
  const blocks = await fetchCourse(level, skill.slug, user?.id ?? null);
  const hasCourse = blocks.some(b => b.lessons.length > 0);
  const coursePct = hasCourse ? courseProgressPct(blocks) : 0;
  const courseNext = hasCourse ? nextLesson(blocks) : null;
  const lessonsDone = blocks.reduce((n, b) => n + blockProgress(b).done, 0);
  const lessonsTotal = blocks.reduce((n, b) => n + b.lessons.length, 0);

  /**
   * Examenklaar: één getal uit de twee assen die dit scherm draagt.
   *
   * Zie `lib/lessons/readiness.ts` — het is ONS getal, geen slaagkans, en de kop zegt dat
   * erbij. Het staat hier omdat dit de pagina is waar de kandidaat beslist of hij nog een les
   * doet of het examen aandurft.
   */
  const r = readiness({
    lessonsDone,
    lessonsTotal,
    examsDone: p.examsDone,
    examCount: skill.examCount,
    averagePct: p.averagePct,
  });

  /**
   * Sterk & zwak, per concept van dit onderdeel.
   *
   * Alleen concepten die in dít onderdeel voorkomen (`fetchConcepts` filtert op
   * `concept_onderdelen`), want "signaalwoorden" beheersen in Lezen zegt niets over Schrijven
   * — daar moet je ze maken. Zes rijen: de zwakste eerst, dan wat nog geen data heeft, zodat
   * de kaart iets zegt in plaats van dertig regels te zijn.
   */
  const concepts = user ? await fetchConcepts(level, skill.slug) : [];
  const mastery = await fetchMastery(user?.id ?? null, concepts.map(c => c.id));
  const teachers = await fetchTeachersForCourse(level, skill.slug, concepts.map(c => c.id));
  /**
   * De vier lessen ná de eerstvolgende — de kaart vertelt dan niet alleen waar je verdergaat maar
   * ook wat eraan komt. Zonder dit stond er onder "ga verder bij" een half lege kaart naast een
   * volle kaart met sterk & zwak, en dat leest als iets dat nog niet af is.
   */
  const upcoming = blocks
    .flatMap(b => b.lessons.map(l => ({ ...l, letter: b.letter })))
    .filter(l => l.progress?.state !== 'done')
    .slice(1, 5);

  const swRows: SwRow[] = concepts
    .map(c => ({
      concept: c,
      mastery: mastery.get(c.id) ?? null,
      lessonHref: teachers.has(c.id) ? lessonPath(level, skill.slug, teachers.get(c.id)!.slug) : null,
    }))
    .sort((a, b) => (a.mastery?.mastery_pct ?? 101) - (b.mastery?.mastery_pct ?? 101))
    .slice(0, 6);

  return (
    <AppShell
      locale={locale}
      email={user?.email ?? ''}
      avatarUrl={String(meta.avatar_url ?? meta.picture ?? '')}
      active={skill.slug}
      activeGroup={level}
      menu={menu}
      isGuest={isGuest}
    >
      <div className="px-5 py-7 sm:px-8 sm:py-10">
        <div className="max-w-5xl mx-auto">

          <PortalHero
            back={{ href: `/${locale}/dashboard/${level}`, label: t('level_section', { level: levelLabel(level) }) }}
            kicker={`${levelLabel(level)} · ${t('kicker_onderdeel')}`}
            title={tSkills(`${skill.key}.name`)}
            lede={tSkills(`${skill.key}.tagline`)}
            seed={skill.slug.length}
            ring={{
              pct: r.pct,
              label: t('readiness_label'),
              note: t('readiness_note'),
              aria: r.pct === null ? t('readiness_unknown_aria') : t('readiness_aria', { pct: r.pct }),
            }}
            tiles={[
              {
                label: t('stat_exams'),
                value: t('stat_exams_value', { done: p.examsDone, total: skill.examCount }),
                sub: p.averagePct != null ? t('card_average', { pct: p.averagePct }) : undefined,
              },
              {
                label: t('stat_items'),
                value: formatCount(skill.itemCount),
                sub: t('stat_duration_value', { minutes: formatCount(skill.durationMinutes) }),
              },
            ]}
          />

          {isRubric && <p className="rubric-note mb-5">{t('rubric_note')}</p>}

          {/* De cursus, boven de examens.
              Bewust in deze volgorde: leren gaat aan toetsen vooraf, en wie hier komt om
              examen 4 te maken vindt de examenlijst er direct onder. De voortgang staat op
              deze kaart en niet in de portaalchrome — dat paneel draagt één as (de tien
              examens), per de beslissing van de eigenaar van 27-08. */}
          <div className="grid gap-4 sm:gap-5 lg:grid-cols-2 mb-7 items-stretch">
          {hasCourse && (
            <a href={`/${locale}${coursePath(level, skill.slug)}`} className="course-card">
              <span className="cc-top">
                <span className="mini-label" style={{ margin: 0 }}>{tLessons('card_head')}</span>
                <span className="cc-pct">{coursePct}%</span>
              </span>
              <span className="cc-line">
                {tLessons('course_progress', { done: lessonsDone, total: lessonsTotal })}
              </span>
              <HorizonBand progress={coursePct} rounded height={6} />
              {courseNext && (
                <span className="cc-next">
                  <span className="cb-letter">{courseNext.block.letter}</span>
                  <span className="min-w-0">
                    <span className="block text-[0.7rem] font-bold uppercase tracking-wider text-on-surface-variant">
                      {tLessons('continue')}
                    </span>
                    <span className="block font-extrabold text-on-surface truncate">
                      {courseNext.lesson.title}
                    </span>
                  </span>
                  <ArrowRight size={17} strokeWidth={2.5} className="ms-auto shrink-0 text-secondary rtl-flip" />
                </span>
              )}
              {upcoming.length > 0 && (
                <span className="cc-list">
                  {upcoming.map(u => (
                    <span key={u.slug} className="cc-row">
                      <span className="cc-dot" aria-hidden />
                      <span className="cc-nm">{u.title}</span>
                      {u.minutes != null && <span className="cc-min">{t('minutes', { n: u.minutes })}</span>}
                    </span>
                  ))}
                </span>
              )}
            </a>
          )}

          {/* Sterk & zwak staat naast de cursus en niet onder de examens: het is het antwoord
              op "wat moet ik nog leren", en dat is dezelfde vraag als de cursuskaart stelt. */}
          <StrengthWeakness locale={locale} rows={swRows} />
          </div>

          {criterionSeries.length > 0 && <CriterionProgress series={criterionSeries} className="mb-6" />}

          <h2 className="mini-head">{t('practice_card_title')}</h2>
          <ol className="flex flex-col gap-2.5">
            {Array.from({ length: skill.examCount }, (_, i) => i + 1).map(n => {
              const done = p.exams[n];
              const isPublished = pub.has(n);
              const free = isFreeExam(level, n);
              // A guest can open nothing, the free slot included: creating the account *is*
              // the step being sold here, and a free exam that opened without one would
              // leave nothing to sign up for.
              const openable = isPublished && !isGuest && (free || ownsThisSkill);

              const href = openable
                ? `/${locale}/oefenexamen/${level}/${skill.slug}/${n}`
                : isGuest && isPublished
                  ? `/${locale}/register?next=/oefenexamen/${level}/${skill.slug}/${n}`
                : isPublished
                  // `onderdeel` carries the full module id, so the picker preselects the
                  // right level's module rather than defaulting to A2's.
                  ? `/${locale}/dashboard/pakketten?onderdeel=${level}:${skill.slug}&vanaf=oefenexamen-${n}`
                  : undefined;

              const Row = href ? 'a' : 'div';

              return (
                <li key={n}>
                  <Row
                    {...(href ? { href } : {})}
                    className={`exam-row no-underline${openable ? '' : ' is-locked'}`}
                  >
                    <span className={`exam-num${done ? (done.passed ? ' passed' : ' sat') : ''}`}>
                      {done?.passed ? <Check size={16} strokeWidth={3} /> : n}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="exam-title">
                        {t('exam_row_title', { number: n })}
                        {free && <span className="badge badge-free">{tSkills('free_badge')}</span>}
                      </span>
                      <span className="exam-sub">
                        {/* A sat exam shows its score even if the slot was later unpublished —
                            "nog niet beschikbaar" under a checkmark contradicts itself. */}
                        {!isPublished && !done ? (
                          t('exam_row_unpublished')
                        ) : done ? (
                          <>
                            {done.bestPct != null
                              ? t('exam_row_best', { pct: done.bestPct })
                              : t('exam_row_awaiting')}
                            {done.attempts > 1 && ` · ${t('exam_row_attempts', { count: done.attempts })}`}
                          </>
                        ) : (
                          <>
                            <ListChecks size={12} strokeWidth={2} className="inline-block mr-1 -mt-px" />
                            {formatCount(skill.itemCount)}
                            <Clock size={12} strokeWidth={2} className="inline-block ml-2.5 mr-1 -mt-px" />
                            {t('stat_duration_value', { minutes: formatCount(skill.durationMinutes) })}
                          </>
                        )}
                      </span>
                    </span>

                    <span className="exam-action" aria-hidden="true">
                      {/* No "Binnenkort beschikbaar" label here: the sub-line already says it,
                          and at 390px the two wrapped into each other. */}
                      {!openable ? (
                        <Lock size={16} strokeWidth={2.1} />
                      ) : done ? (
                        <RotateCcw size={16} strokeWidth={2.1} />
                      ) : (
                        <ArrowRight size={16} strokeWidth={2.3} />
                      )}
                    </span>
                  </Row>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <ExamListStyles />
    </AppShell>
  );
}
