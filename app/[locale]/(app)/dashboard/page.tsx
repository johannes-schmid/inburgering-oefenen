import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { planFromMetadata } from '@/lib/entitlements';
import { fetchPortalProgress, fetchPublishedExamNumbers } from '@/lib/portal-progress';
import { SKILLS } from '@/data/skills';
import SkillIcon from '@/components/site/SkillIcon';
import AppShell from '../components/AppShell';
import ExamSegments, { segmentState, type SegmentState } from './components/ExamSegments';

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
  if (!user) redirect(`/${locale}/login?next=/dashboard`);

  const plan = planFromMetadata(user.user_metadata);
  const hasPaidPlan = plan !== 'free';
  const [progress, published] = await Promise.all([
    fetchPortalProgress(user.id),
    fetchPublishedExamNumbers(),
  ]);

  const segmentLabels: Record<SegmentState, string> = {
    passed: t('seg_passed'),
    sat: t('seg_sat'),
    available: t('seg_available'),
    locked: t('seg_locked'),
    unpublished: t('seg_unpublished'),
  };

  const totalExams = SKILLS.reduce((n, s) => n + s.examCount, 0);
  const totalDone = SKILLS.reduce((n, s) => n + progress[s.slug].examsDone, 0);
  const meta = user.user_metadata ?? {};
  const firstName = String(meta.full_name ?? meta.name ?? '').trim().split(' ')[0];

  return (
    <AppShell
      locale={locale}
      email={user.email ?? ''}
      avatarUrl={String(meta.avatar_url ?? meta.picture ?? '')}
      active="overview"
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

          <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
            {SKILLS.map(skill => {
              const p = progress[skill.slug];
              const pub = published[skill.slug];
              const states = Array.from({ length: skill.examCount }, (_, i) =>
                segmentState(i + 1, p, pub, hasPaidPlan),
              );
              const nothingPublished = pub.size === 0;

              return (
                <a
                  key={skill.slug}
                  href={`/${locale}/dashboard/${skill.slug}`}
                  className="skill-card no-underline flex flex-col"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <SkillIcon skill={skill.slug} size="md" />
                    <div className="min-w-0 flex-1">
                      <h2
                        className="font-headline font-extrabold text-on-surface"
                        style={{ fontSize: '1.075rem', letterSpacing: '-0.015em' }}
                      >
                        {tSkills(`${skill.key}.name`)}
                      </h2>
                      <p className="text-xs text-outline mt-0.5">
                        {t('card_meta', { items: skill.itemCount, minutes: skill.durationMinutes })}
                      </p>
                    </div>
                    <span className="skill-card-arrow" aria-hidden="true">
                      <ArrowRight size={17} strokeWidth={2.2} />
                    </span>
                  </div>

                  <p className="text-[0.82rem] text-on-surface-variant mb-5" style={{ lineHeight: 1.6 }}>
                    {tSkills(`${skill.key}.tagline`)}
                  </p>

                  <div className="mt-auto">
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-xs font-bold text-on-surface-variant">
                        {t('card_progress', { done: p.examsDone, total: skill.examCount })}
                      </span>
                      {p.averagePct != null && (
                        <span
                          className="text-xs font-extrabold"
                          style={{ color: 'var(--color-primary)', fontVariantNumeric: 'tabular-nums' }}
                        >
                          {t('card_average', { pct: p.averagePct })}
                        </span>
                      )}
                    </div>

                    <ExamSegments count={skill.examCount} states={states} labels={segmentLabels} />

                    <p className="text-xs mt-3 flex items-center gap-1.5" style={{ color: 'var(--color-outline)' }}>
                      {/* Progress wins over "nothing published": once you have sat an exam,
                          telling you none are available reads as data loss. */}
                      {p.examsDone === 0 && nothingPublished ? (
                        <>
                          <Lock size={12} strokeWidth={2} />
                          {t('card_none_published')}
                        </>
                      ) : p.examsDone === 0 ? (
                        t('card_cta_start')
                      ) : p.examsDone >= skill.examCount ? (
                        t('card_cta_all_done')
                      ) : (
                        t('card_cta_continue', { number: p.nextExamNumber })
                      )}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>

          {!hasPaidPlan && (
            <aside className="upsell mt-8">
              <div className="min-w-0">
                <h2 className="font-headline font-extrabold text-white" style={{ fontSize: '1.05rem', letterSpacing: '-0.015em' }}>
                  {t('upsell_title')}
                </h2>
                <p className="text-[0.85rem] mt-1" style={{ color: 'rgba(255,255,255,0.72)', lineHeight: 1.65 }}>
                  {t('upsell_body', { total: totalExams })}
                </p>
              </div>
              <a href={`/${locale}/premium?vanaf=portaal`} className="upsell-cta no-underline">
                {t('upsell_cta')}
                <ArrowRight size={16} strokeWidth={2.4} />
              </a>
            </aside>
          )}
        </div>
      </div>

      <style>{`
        .skill-card { background:#fff; border:1.5px solid var(--color-surface-container-high); border-radius:18px; padding:20px; box-shadow:var(--shadow-card-md); transition:transform .22s cubic-bezier(0.22,1,0.36,1), box-shadow .22s ease, border-color .22s ease; }
        .skill-card:hover { transform:translateY(-3px); box-shadow:0 10px 30px rgba(0,43,109,0.13),0 2px 6px rgba(0,43,109,0.07); border-color:#b8cef5; }
        .skill-card:focus-visible { outline:2px solid var(--color-secondary-container); outline-offset:3px; }
        .skill-card:active { transform:translateY(-1px); }
        .skill-card-arrow { display:flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:9px; flex-shrink:0; background:rgba(0,43,109,0.06); color:var(--color-primary); transition:background .2s ease, color .2s ease; }
        .skill-card:hover .skill-card-arrow { background:var(--color-secondary-container); color:#fff; }
        .upsell { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:16px; padding:20px 22px; border-radius:18px; background:linear-gradient(135deg,#001d4e 0%,#002b6d 55%,#003580 100%); box-shadow:0 10px 30px rgba(0,27,78,0.22); }
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
