import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, BookText, Check, Clock, Layers, ListChecks, Lock, RotateCcw } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ownsKnm } from '@/lib/entitlements';
import { emptyLevelledProgress, fetchPortalProgress, fetchPublishedExamNumbers } from '@/lib/portal-progress';
import { FEATURES } from '@/lib/features';
import { KNM, KNM_THEMES, formatCount, isFreeKnmExam } from '@/data/skills';
import SkillIcon from '@/components/site/SkillIcon';
import AppShell from '../../components/AppShell';
import ExamListStyles from '../_components/ExamListStyles';
import { fetchPortalMenu } from '@/lib/portal-menu';

/**
 * KNM's ten oefenexamens inside the portal — the level-less twin of
 * `dashboard/[level]/[skill]`.
 *
 * A static route, so `/dashboard/knm` is not read as `/dashboard/[level]` with level "knm".
 * (`next.config.ts` redirects `/dashboard/<taalonderdeel>` to its A2 path; that rule names the
 * four slugs explicitly, so `knm` falls through to this page rather than being rewritten.)
 *
 * It carries two things the levelled page does not, and they are the reason KNM is a module
 * rather than just a set of exams: the seven lesson modules and the woordkaarten. Both are
 * gated behind their feature flags, so an environment with the flags off shows the exams alone
 * rather than two links to nothing.
 */
type Props = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
  title: 'KNM oefenexamens | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

export default async function KnmExamsPage({ params }: Props) {
  const { locale } = await params;

  const t = await getTranslations('portal');
  const tSkills = await getTranslations('skills');
  const tKnm = await getTranslations('knm');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  /** Browsable anonymously; the wall is the oefenexamen itself. See `dashboard/page.tsx`. */
  const isGuest = !user;
  const meta = user?.user_metadata ?? {};

  const owns = ownsKnm(meta);
  const [progress, published] = await Promise.all([
    user ? fetchPortalProgress(user.id) : Promise.resolve(emptyLevelledProgress()),
    fetchPublishedExamNumbers(),
  ]);

  const p = progress.knm;
  const pub = published.knm;

  const menu = await fetchPortalMenu();

  return (
    <AppShell
      locale={locale}
      email={user?.email ?? ''}
      avatarUrl={String(meta.avatar_url ?? meta.picture ?? '')}
      active="overview-module"
      activeGroup="knm"
      menu={menu}
      isGuest={isGuest}
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
              <SkillIcon skill="knm" size="lg" />
              <div className="min-w-0">
                <h1
                  className="font-headline font-extrabold text-on-surface"
                  style={{ fontSize: 'clamp(1.5rem,3.2vw,1.95rem)', letterSpacing: '-0.03em' }}
                >
                  {tSkills('knm.name')}
                </h1>
                <p className="text-sm text-on-surface-variant mt-1" style={{ lineHeight: 1.65 }}>
                  {tSkills('knm.tagline')}
                </p>
              </div>
            </div>

            <dl className="stat-row mt-5">
              <div>
                <dt>{t('stat_exams')}</dt>
                <dd>{t('stat_exams_value', { done: p.examsDone, total: KNM.examCount })}</dd>
              </div>
              <div>
                <dt>{t('stat_items')}</dt>
                <dd>{formatCount(KNM.itemCount)}</dd>
              </div>
              <div>
                <dt>{t('stat_duration')}</dt>
                <dd>{t('stat_duration_value', { minutes: formatCount(KNM.durationMinutes) })}</dd>
              </div>
              <div>
                <dt>{t('stat_average')}</dt>
                <dd>{p.averagePct != null ? `${p.averagePct}%` : '—'}</dd>
              </div>
            </dl>
          </header>

          {/* ── The study surfaces that come with the module ── */}
          {(FEATURES.leren || FEATURES.woordkaarten) && (
            <div className="grid sm:grid-cols-2 gap-2.5 mb-7">
              {FEATURES.leren && (
                <a href={`/${locale}/leren`} className="knm-side no-underline">
                  <span className="knm-side-icon"><BookText size={18} strokeWidth={1.9} /></span>
                  <span className="min-w-0">
                    <span className="knm-side-title">{tKnm('leren_title')}</span>
                    <span className="knm-side-sub">{tKnm('sections_count', { count: KNM_THEMES.length })}</span>
                  </span>
                  <ArrowRight size={16} strokeWidth={2.2} className="ml-auto flex-shrink-0" aria-hidden />
                </a>
              )}
              {FEATURES.woordkaarten && (
                <a href={`/${locale}/dashboard/woordkaarten`} className="knm-side no-underline">
                  <span className="knm-side-icon"><Layers size={18} strokeWidth={1.9} /></span>
                  <span className="min-w-0">
                    <span className="knm-side-title">{tKnm('woorden_title')}</span>
                    <span className="knm-side-sub">{tKnm('woorden_lede')}</span>
                  </span>
                  <ArrowRight size={16} strokeWidth={2.2} className="ml-auto flex-shrink-0" aria-hidden />
                </a>
              )}
            </div>
          )}

          <ol className="flex flex-col gap-2.5">
            {Array.from({ length: KNM.examCount }, (_, i) => i + 1).map(n => {
              const done = p.exams[n];
              const isPublished = pub.has(n);
              const free = isFreeKnmExam(n);
              // See the same branch in `dashboard/[level]/[skill]` — a guest opens nothing.
              const openable = isPublished && !isGuest && (free || owns);

              const href = openable
                ? `/${locale}/oefenexamen/knm/${n}`
                : isGuest && isPublished
                  ? `/${locale}/register?next=/oefenexamen/knm/${n}`
                : isPublished
                  // The module id is the bare slug — KNM has no level to prefix it with.
                  ? `/${locale}/dashboard/pakketten?onderdeel=knm&vanaf=oefenexamen-${n}`
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
                            {formatCount(KNM.itemCount)}
                            <Clock size={12} strokeWidth={2} className="inline-block ml-2.5 mr-1 -mt-px" />
                            {t('stat_duration_value', { minutes: formatCount(KNM.durationMinutes) })}
                          </>
                        )}
                      </span>
                    </span>

                    <span className="exam-action" aria-hidden="true">
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
      <style>{`
        .knm-side { display:flex; align-items:center; gap:12px; padding:13px 15px; background:#fff; border:1.5px solid var(--color-surface-container-high); border-radius:14px; box-shadow:var(--shadow-card); transition:transform .2s cubic-bezier(0.22,1,0.36,1), box-shadow .2s ease, border-color .2s ease; }
        .knm-side:hover { transform:translateY(-2px); border-color:#b8cef5; box-shadow:0 8px 22px rgba(0,43,109,0.11); }
        .knm-side:focus-visible { outline:2px solid var(--color-secondary-container); outline-offset:2px; }
        .knm-side-icon { display:flex; align-items:center; justify-content:center; flex-shrink:0; width:34px; height:34px; border-radius:11px; background:rgba(0,43,109,0.06); color:var(--color-primary); }
        .knm-side-title { display:block; font-family:var(--font-headline); font-size:0.9rem; font-weight:700; color:var(--color-on-surface); letter-spacing:-0.01em; }
        .knm-side-sub { display:block; font-size:0.74rem; color:var(--color-outline); margin-top:1px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        @media (prefers-reduced-motion: reduce) { .knm-side { transition:none; } .knm-side:hover { transform:none; } }
      `}</style>
    </AppShell>
  );
}
