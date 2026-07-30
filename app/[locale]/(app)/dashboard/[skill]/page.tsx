import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, Check, Lock, Clock, ListChecks, RotateCcw } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { planFromMetadata } from '@/lib/entitlements';
import { fetchPortalProgress, fetchPublishedExamNumbers } from '@/lib/portal-progress';
import { getSkill, isFreeExam } from '@/data/skills';
import SkillIcon from '@/components/site/SkillIcon';
import AppShell from '../../components/AppShell';

type Props = { params: Promise<{ locale: string; skill: string }> };

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
  const { locale, skill: slug } = await params;
  const skill = getSkill(slug);
  if (!skill) notFound();

  const t = await getTranslations('portal');
  const tSkills = await getTranslations('skills');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/dashboard/${skill.slug}`);

  const plan = planFromMetadata(user.user_metadata);
  const hasPaidPlan = plan !== 'free';
  const [progress, published] = await Promise.all([
    fetchPortalProgress(user.id),
    fetchPublishedExamNumbers(),
  ]);

  const p = progress[skill.slug];
  const pub = published[skill.slug];
  const meta = user.user_metadata ?? {};
  const isRubric = skill.scoring === 'open';

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
                <dd>{skill.itemCount}</dd>
              </div>
              <div>
                <dt>{t('stat_duration')}</dt>
                <dd>{t('stat_duration_value', { minutes: skill.durationMinutes })}</dd>
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

          <ol className="flex flex-col gap-2.5">
            {Array.from({ length: skill.examCount }, (_, i) => i + 1).map(n => {
              const done = p.exams[n];
              const isPublished = pub.has(n);
              const free = isFreeExam(n);
              const openable = isPublished && (free || hasPaidPlan);

              const href = openable
                ? `/${locale}/oefenexamen/${skill.slug}/${n}`
                : isPublished
                  ? `/${locale}/premium?vanaf=oefenexamen-${skill.slug}-${n}`
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
                            {skill.itemCount}
                            <Clock size={12} strokeWidth={2} className="inline-block ml-2.5 mr-1 -mt-px" />
                            {t('stat_duration_value', { minutes: skill.durationMinutes })}
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

      <style>{`
        .stat-row { display:grid; grid-template-columns:repeat(2,1fr); gap:1px; background:var(--color-surface-container-high); border:1px solid var(--color-surface-container-high); border-radius:14px; overflow:hidden; }
        .stat-row > div { background:#fff; padding:12px 14px; }
        .stat-row dt { font-size:0.66rem; font-weight:800; letter-spacing:0.1em; text-transform:uppercase; color:var(--color-outline); }
        .stat-row dd { font-family:var(--font-headline); font-size:1.15rem; font-weight:800; color:var(--color-primary); margin-top:2px; font-variant-numeric:tabular-nums; letter-spacing:-0.02em; }
        @media (min-width:600px) { .stat-row { grid-template-columns:repeat(4,1fr); } }

        .rubric-note { font-size:0.8rem; line-height:1.6; color:var(--color-on-secondary-container); background:rgba(254,118,44,0.09); border-left:3px solid var(--color-secondary-container); border-radius:0 10px 10px 0; padding:10px 14px; }

        .exam-row { display:flex; align-items:center; gap:14px; padding:14px 16px; background:#fff; border:1.5px solid var(--color-surface-container-high); border-radius:14px; box-shadow:var(--shadow-card); transition:transform .2s cubic-bezier(0.22,1,0.36,1), box-shadow .2s ease, border-color .2s ease; }
        a.exam-row:hover { transform:translateY(-2px); border-color:#b8cef5; box-shadow:0 8px 22px rgba(0,43,109,0.11); }
        a.exam-row:focus-visible { outline:2px solid var(--color-secondary-container); outline-offset:2px; }
        a.exam-row:active { transform:translateY(0); }
        .exam-row.is-locked { background:var(--color-surface-container-low); }
        a.exam-row.is-locked:hover { border-color:#fdc9a3; box-shadow:0 8px 22px rgba(254,118,44,0.14); }

        .exam-num { display:flex; align-items:center; justify-content:center; flex-shrink:0; width:34px; height:34px; border-radius:11px; font-family:var(--font-headline); font-size:0.92rem; font-weight:800; font-variant-numeric:tabular-nums; background:rgba(0,43,109,0.06); color:var(--color-primary); }
        .exam-num.passed { background:linear-gradient(180deg,#1d428a,#002b6d); color:#fff; }
        .exam-num.sat { background:linear-gradient(180deg,#fe762c,#d94f00); color:#fff; }

        .exam-title { display:flex; align-items:center; gap:8px; font-family:var(--font-headline); font-size:0.94rem; font-weight:700; color:var(--color-on-surface); letter-spacing:-0.01em; }
        .exam-sub { display:block; font-size:0.76rem; color:var(--color-outline); margin-top:2px; }
        .badge { font-family:var(--font-body); font-size:0.62rem; font-weight:800; letter-spacing:0.06em; text-transform:uppercase; padding:2px 7px; border-radius:6px; }
        .badge-free { background:rgba(0,43,109,0.08); color:var(--color-primary); }
        .exam-action { display:flex; align-items:center; justify-content:center; flex-shrink:0; min-width:34px; height:34px; color:var(--color-primary); }
        .exam-row.is-locked .exam-action { color:var(--color-outline); }
        @media (prefers-reduced-motion: reduce) {
          .exam-row { transition:none; }
          a.exam-row:hover { transform:none; }
        }
      `}</style>
    </AppShell>
  );
}
