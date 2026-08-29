import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ownsKnm, ownsModule, planFromMetadata } from '@/lib/entitlements';
import { emptyLevelledProgress, fetchPortalProgress, fetchPublishedExamNumbers } from '@/lib/portal-progress';
import {
  DEFAULT_LEVEL,
  KNM,
  LEVELS,
  SKILLS,
  formatCount,
  levelLabel,
} from '@/data/skills';
import { totalExamsForLevel } from '@/lib/pricing';
import SkillIcon from '@/components/site/SkillIcon';
import AppShell from '../components/AppShell';
import ExamSegments, { segmentState, type SegmentState } from './components/ExamSegments';
import ModuleSkillGrid from './_components/ModuleSkillGrid';
import { fetchPortalMenu } from '@/lib/portal-menu';

export const metadata: Metadata = {
  title: 'Mijn oefenportaal | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

/**
 * The portal overview: the four exam onderdelen, ten oefenexamens behind each.
 *
 * Rewritten from KNM's shape, which was a single client page holding every view in `useState`
 * — the URL never changed, so a skill was not linkable and the back button left the portal.
 * This is a server component per CLAUDE.md's rule for new portal surfaces, and each onderdeel
 * is a real route at `/dashboard/[skill]`.
 *
 * Leren and woordkaarten are gone from the portal. `lib/features.ts` already flagged them off,
 * so the nav was pointing at two surfaces with no A2 content behind them.
 */
export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('portal');
  const tSkills = await getTranslations('skills');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  /**
   * An anonymous visitor browses the portal rather than being bounced to /login.
   *
   * The wall is one step further in — at the oefenexamen itself, which redirects to
   * /register. Sending them away from the catalogue was asking for the account before they
   * had seen what the account is for; the free taster's CTA now lands here.
   */
  const isGuest = !user;
  const userMeta = user?.user_metadata ?? {};

  const plan = planFromMetadata(userMeta);
  const hasPaidPlan = plan !== 'free';
  const [progress, published] = await Promise.all([
    user ? fetchPortalProgress(user.id) : Promise.resolve(emptyLevelledProgress()),
    fetchPublishedExamNumbers(),
  ]);

  const segmentLabels: Record<SegmentState, string> = {
    passed: t('seg_passed'),
    sat: t('seg_sat'),
    available: t('seg_available'),
    locked: t('seg_locked'),
    unpublished: t('seg_unpublished'),
  };

  /**
   * Which levels get a section on the overview.
   *
   * A2 is always shown — it is the product. A second level appears only once it has
   * something in it: published exams, a sitting the candidate has already done, or a module
   * they have bought. Rendering an empty B1 section by default would advertise forty
   * "Binnenkort" slots to every A2 candidate, which is the same dead-end the leren and
   * woordkaarten nav entries were removed for.
   */
  const visibleLevels = LEVELS.filter(level => {
    if (level === DEFAULT_LEVEL) return true;
    const anyPublished = SKILLS.some(s => published[level][s.slug].size > 0);
    const anySat = SKILLS.some(s => progress[level][s.slug].examsDone > 0);
    const anyOwned = SKILLS.some(s => ownsModule(userMeta, level, s.slug));
    return anyPublished || anySat || anyOwned;
  });

  const totalExams = visibleLevels.reduce((n, l) => n + totalExamsForLevel(l), 0);
  const totalDone = visibleLevels.reduce(
    (n, l) => n + SKILLS.reduce((m, s) => m + progress[l][s.slug].examsDone, 0),
    0,
  );
  const knmProgress = progress.knm;
  const meta = userMeta;
  const firstName = String(meta.full_name ?? meta.name ?? '').trim().split(' ')[0];

  const menu = await fetchPortalMenu();

  return (
    <AppShell
      locale={locale}
      email={user?.email ?? ''}
      isGuest={isGuest}
      avatarUrl={String(meta.avatar_url ?? meta.picture ?? '')}
      active="overview"
      menu={menu}
    >
      <div className="px-5 py-7 sm:px-8 sm:py-10">
        <div className="max-w-5xl mx-auto">

          <header className="mb-8">
            <p
              className="text-xs font-extrabold uppercase mb-2"
              style={{ color: 'var(--color-secondary)', letterSpacing: '0.14em' }}
            >
              {t('eyebrow')}
            </p>
            <h1
              className="font-headline font-extrabold text-on-surface mb-2"
              style={{ fontSize: 'clamp(1.55rem,3.4vw,2.05rem)', letterSpacing: '-0.03em', textWrap: 'balance' }}
            >
              {firstName ? t('greeting_named', { name: firstName }) : t('greeting')}
            </h1>
            <p className="text-sm sm:text-[0.95rem] text-on-surface-variant" style={{ lineHeight: 1.7 }}>
              {t('overview_intro', { done: totalDone, total: totalExams })}
            </p>
          </header>

          {visibleLevels.map(level => (
          <section key={level} className={level === visibleLevels[0] ? '' : 'mt-10'}>
            {/* The heading is suppressed when only one level is on offer: "Niveau A2" above
                the sole grid is a label for a distinction the candidate cannot yet make. */}
            {visibleLevels.length > 1 && (
              <header className="mb-4">
                {/* The heading is the way into the level's own overview. On a phone it is the
                    only way — the module rail is desktop-only — so this link is not a
                    convenience, it is the mobile route to `/dashboard/[level]`. */}
                <a href={`/${locale}/dashboard/${level}`} className="no-underline group inline-flex items-center gap-1.5">
                  <h2
                    className="font-headline font-extrabold text-on-surface group-hover:underline"
                    style={{ fontSize: '1.15rem', letterSpacing: '-0.02em' }}
                  >
                    {t('level_section', { level: levelLabel(level) })}
                  </h2>
                  <ArrowRight size={15} strokeWidth={2.4} className="text-outline" aria-hidden />
                </a>
                <p className="text-xs text-outline mt-0.5">
                  {t('level_section_sub', { level: levelLabel(level) })}
                </p>
              </header>
            )}
          <ModuleSkillGrid
            locale={locale}
            level={level}
            progress={progress[level]}
            published={published}
            hasPaidPlan={hasPaidPlan}
          />
          </section>
          ))}


          {/* ── KNM ──────────────────────────────────────────────────────────
              Its own section rather than a fifth card inside a level's grid, because it is
              not a card *of* that level: the grid above says "the four onderdelen of A2", and
              a KNM tile in it would make that heading false and put KNM in a bundle that does
              not include it. Shown whenever it has content, a sitting, or a purchase — the
              same test the second level passes. */}
          {(published.knm.size > 0 || knmProgress.examsDone > 0 || ownsKnm(userMeta)) && (
            <section className="mt-10">
              <header className="mb-4">
                <h2
                  className="font-headline font-extrabold text-on-surface"
                  style={{ fontSize: '1.15rem', letterSpacing: '-0.02em' }}
                >
                  {t('knm_section')}
                </h2>
                <p className="text-xs text-outline mt-0.5">{t('knm_section_sub')}</p>
              </header>

              <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
                <a href={`/${locale}/dashboard/knm`} className="skill-card no-underline flex flex-col">
                  <div className="flex items-start gap-3 mb-4">
                    <SkillIcon skill="knm" size="md" />
                    <div className="min-w-0 flex-1">
                      <h2
                        className="font-headline font-extrabold text-on-surface"
                        style={{ fontSize: '1.075rem', letterSpacing: '-0.015em' }}
                      >
                        {tSkills('knm.name')}
                      </h2>
                      <p className="text-xs text-outline mt-0.5">
                        {t('card_meta', {
                          items: formatCount(KNM.itemCount),
                          minutes: formatCount(KNM.durationMinutes),
                        })}
                      </p>
                    </div>
                    <span className="skill-card-arrow" aria-hidden="true">
                      <ArrowRight size={17} strokeWidth={2.2} />
                    </span>
                  </div>

                  <p className="text-[0.82rem] text-on-surface-variant mb-5" style={{ lineHeight: 1.6 }}>
                    {tSkills('knm.tagline')}
                  </p>

                  <div className="mt-auto">
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-xs font-bold text-on-surface-variant">
                        {t('card_progress', { done: knmProgress.examsDone, total: KNM.examCount })}
                      </span>
                      {knmProgress.averagePct != null && (
                        <span
                          className="text-xs font-extrabold"
                          style={{ color: 'var(--color-primary)', fontVariantNumeric: 'tabular-nums' }}
                        >
                          {t('card_average', { pct: knmProgress.averagePct })}
                        </span>
                      )}
                    </div>

                    <ExamSegments
                      count={KNM.examCount}
                      states={Array.from({ length: KNM.examCount }, (_, i) =>
                        segmentState(i + 1, knmProgress, published.knm, hasPaidPlan),
                      )}
                      labels={segmentLabels}
                    />

                    <p className="text-xs mt-3 flex items-center gap-1.5" style={{ color: 'var(--color-outline)' }}>
                      {knmProgress.examsDone === 0 && published.knm.size === 0 ? (
                        <>
                          <Lock size={12} strokeWidth={2} />
                          {t('card_none_published')}
                        </>
                      ) : knmProgress.examsDone === 0 ? (
                        t('card_cta_start')
                      ) : knmProgress.examsDone >= KNM.examCount ? (
                        t('card_cta_all_done')
                      ) : (
                        t('card_cta_continue', { number: knmProgress.nextExamNumber })
                      )}
                    </p>
                  </div>
                </a>
              </div>
            </section>
          )}

          {/* A guest is sold the account, not the modules: the paid pitch below is the wrong
              next step for someone who cannot yet open the free exam. */}
          {!hasPaidPlan && (
            <aside className="upsell mt-8">
              <div className="min-w-0">
                <h2 className="font-headline font-extrabold text-white" style={{ fontSize: '1.05rem', letterSpacing: '-0.015em' }}>
                  {isGuest ? t('guest_upsell_title') : t('upsell_title')}
                </h2>
                <p className="text-[0.85rem] mt-1" style={{ color: 'rgba(255,255,255,0.72)', lineHeight: 1.65 }}>
                  {isGuest ? t('guest_upsell_body') : t('upsell_body', { total: totalExams })}
                </p>
              </div>
              <a
                href={isGuest ? `/${locale}/register?next=/dashboard` : `/${locale}/dashboard/pakketten?vanaf=portaal`}
                className="upsell-cta no-underline"
              >
                {isGuest ? t('guest_create_account') : t('upsell_cta')}
                <ArrowRight size={16} strokeWidth={2.4} />
              </a>
            </aside>
          )}
        </div>
      </div>

      <style>{`
        /* No 1.5px border (§2, the no-line rule): the card is white on a tonal page background, which
           is what makes it read as elevated, plus the ambient shadow of §4. */
        .skill-card { background:var(--color-surface-container-lowest); border-radius:18px; padding:20px; box-shadow:var(--shadow-ambient); transition:transform .22s cubic-bezier(0.22,1,0.36,1), box-shadow .22s ease; }
        .skill-card:hover { transform:translateY(-3px); box-shadow:0 10px 30px rgba(0,43,109,0.13),0 2px 6px rgba(0,43,109,0.07); }
        .skill-card:focus-visible { outline:2px solid var(--color-secondary-container); outline-offset:3px; }
        .skill-card:active { transform:translateY(-1px); }
        .skill-card-arrow { display:flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:9px; flex-shrink:0; background:rgba(0,43,109,0.06); color:var(--color-primary); transition:background .2s ease, color .2s ease; }
        .skill-card:hover .skill-card-arrow { background:var(--color-secondary-container); color:#fff; }
        .upsell { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:16px; padding:20px 22px; border-radius:18px; background:var(--gradient-brand); box-shadow:0 10px 30px rgba(0,27,78,0.22); }
        .upsell-cta { display:inline-flex; align-items:center; gap:8px; padding:11px 18px; border-radius:12px; font-size:0.85rem; font-weight:800; color:#fff; background:var(--gradient-btn-orange); box-shadow:var(--shadow-btn-orange); transition:transform .2s cubic-bezier(0.22,1,0.36,1), box-shadow .2s ease; }
        .upsell-cta:hover { transform:translateY(-2px); box-shadow:var(--shadow-btn-orange-hover); }
        .upsell-cta:focus-visible { outline:2px solid #fff; outline-offset:2px; }
        @media (prefers-reduced-motion: reduce) {
          .skill-card, .skill-card-arrow, .upsell-cta { transition:none; }
          .skill-card:hover, .upsell-cta:hover { transform:none; }
        }
      `}</style>
    </AppShell>
  );
}
