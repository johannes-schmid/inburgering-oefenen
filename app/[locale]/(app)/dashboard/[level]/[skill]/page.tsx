import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, Check, Lock, Clock, ListChecks, RotateCcw } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ownsModule } from '@/lib/entitlements';
import { fetchPortalProgress, fetchPublishedExamNumbers } from '@/lib/portal-progress';
import { formatCount, getSkillAtLevel, isFreeExam, isLevel } from '@/data/skills';
import SkillIcon from '@/components/site/SkillIcon';
import CriterionProgress from '@/components/exam/CriterionProgress';
import { fetchCriterionSeries } from '@/lib/criterion-progress';
import AppShell from '../../../components/AppShell';
import ExamListStyles from '../../_components/ExamListStyles';

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

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/dashboard/${level}/${skill.slug}`);

  // Per-onderdeel ownership, not "has any paid plan". The dashboard overview already read it this
  // way, so the two screens disagreed: the card said the module was owned and its ten slots all
  // showed locked.
  const ownsThisSkill = ownsModule(user.user_metadata, level, skill.slug);
  const [progress, published] = await Promise.all([
    fetchPortalProgress(user.id),
    fetchPublishedExamNumbers(),
  ]);

  const p = progress[level][skill.slug];
  const pub = published[level][skill.slug];
  const meta = user.user_metadata ?? {};
  const isRubric = skill.scoring === 'open';

  // Only the two rubric skills have criteria to chart. `fetchCriterionSeries` returns [] until the
  // candidate has a graded answer, and CriterionProgress renders nothing for an empty series — so
  // this is quiet rather than an empty-state box on a page the candidate has just opened.
  const criterionSeries = isRubric
    ? await fetchCriterionSeries(user.id, skill.slug as 'schrijven' | 'spreken')
    : [];

  return (
    <AppShell
      locale={locale}
      email={user.email ?? ''}
      avatarUrl={String(meta.avatar_url ?? meta.picture ?? '')}
      active={skill.slug}
    >
      <div className="px-5 py-7 sm:px-8 sm:py-10">
        <div className="max-w-3xl mx-auto">

          <header className="mb-7">
            <a
              href={`/${locale}/dashboard`}
              className="text-xs font-bold text-on-surface-variant no-underline hover:underline"
            >
              ← {t('nav_overview')}
            </a>
            <div className="flex items-start gap-3.5 mt-3">
              <SkillIcon skill={skill.slug} size="lg" />
              <div className="min-w-0">
                <h1
                  className="font-headline font-extrabold text-on-surface"
                  style={{ fontSize: 'clamp(1.5rem,3.2vw,1.95rem)', letterSpacing: '-0.03em' }}
                >
                  {tSkills(`${skill.key}.name`)}
                </h1>
                <p className="text-sm text-on-surface-variant mt-1" style={{ lineHeight: 1.65 }}>
                  {tSkills(`${skill.key}.tagline`)}
                </p>
              </div>
            </div>

            <dl className="stat-row mt-5">
              <div>
                <dt>{t('stat_exams')}</dt>
                <dd>{t('stat_exams_value', { done: p.examsDone, total: skill.examCount })}</dd>
              </div>
              <div>
                <dt>{t('stat_items')}</dt>
                <dd>{formatCount(skill.itemCount)}</dd>
              </div>
              <div>
                <dt>{t('stat_duration')}</dt>
                <dd>{t('stat_duration_value', { minutes: formatCount(skill.durationMinutes) })}</dd>
              </div>
              <div>
                <dt>{t('stat_average')}</dt>
                <dd>{p.averagePct != null ? `${p.averagePct}%` : '—'}</dd>
              </div>
            </dl>

            {isRubric && (
              <p className="rubric-note mt-4">{t('rubric_note')}</p>
            )}
          </header>

          {criterionSeries.length > 0 && <CriterionProgress series={criterionSeries} className="mb-6" />}

          <ol className="flex flex-col gap-2.5">
            {Array.from({ length: skill.examCount }, (_, i) => i + 1).map(n => {
              const done = p.exams[n];
              const isPublished = pub.has(n);
              const free = isFreeExam(level, n);
              const openable = isPublished && (free || ownsThisSkill);

              const href = openable
                ? `/${locale}/oefenexamen/${level}/${skill.slug}/${n}`
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
