import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { planFromMetadata } from '@/lib/entitlements';
import { fetchPortalProgress } from '@/lib/portal-progress';
import { SKILLS } from '@/data/skills';
import SkillIcon from '@/components/site/SkillIcon';
import AppShell from '../../components/AppShell';
import LogoutButton from './LogoutButton';

export const metadata: Metadata = {
  title: 'Mijn account | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

/**
 * Account and totals. Deliberately thin: KNM's `ProfileView` mixed account settings with
 * gamification (XP, streaks) and topic mastery built on the flat KNM question pool. Rebuilding
 * that on the four-skill model is its own decision, so this page states what is true today —
 * who you are signed in as, what you have access to, and how many of the forty you have sat.
 */
export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('portal');
  const tSkills = await getTranslations('skills');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/dashboard/profiel`);

  const plan = planFromMetadata(user.user_metadata);
  const progress = await fetchPortalProgress(user.id);
  const meta = user.user_metadata ?? {};

  const totalExams = SKILLS.reduce((n, s) => n + s.examCount, 0);
  const totalDone = SKILLS.reduce((n, s) => n + progress[s.slug].examsDone, 0);
  const planLabel = t(`plan_${plan}` as 'plan_free');

  return (
    <AppShell
      locale={locale}
      email={user.email ?? ''}
      avatarUrl={String(meta.avatar_url ?? meta.picture ?? '')}
      active="profile"
    >
      <div className="px-5 py-7 sm:px-8 sm:py-10">
        <div className="max-w-2xl mx-auto">
          <h1
            className="font-headline font-extrabold text-on-surface mb-6"
            style={{ fontSize: 'clamp(1.5rem,3.2vw,1.95rem)', letterSpacing: '-0.03em' }}
          >
            {t('profile_title')}
          </h1>

          <section className="panel">
            <h2 className="panel-title">{t('profile_account')}</h2>
            <dl className="kv">
              <dt>{t('profile_email')}</dt>
              <dd>{user.email}</dd>
              <dt>{t('profile_plan')}</dt>
              <dd>{planLabel}</dd>
              <dt>{t('profile_exams_done')}</dt>
              <dd style={{ fontVariantNumeric: 'tabular-nums' }}>
                {t('stat_exams_value', { done: totalDone, total: totalExams })}
              </dd>
            </dl>
            <div className="mt-5">
              <LogoutButton />
            </div>
          </section>

          <section className="panel mt-5">
            <h2 className="panel-title">{t('profile_per_skill')}</h2>
            <ul className="flex flex-col gap-2.5">
              {SKILLS.map(s => {
                const p = progress[s.slug];
                return (
                  <li key={s.slug}>
                    <a href={`/${locale}/dashboard/${s.slug}`} className="skill-line no-underline">
                      <SkillIcon skill={s.slug} size="sm" />
                      <span className="flex-1 min-w-0 font-headline font-bold text-on-surface" style={{ fontSize: '0.9rem' }}>
                        {tSkills(`${s.key}.name`)}
                      </span>
                      <span className="text-xs font-bold text-on-surface-variant" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {t('stat_exams_value', { done: p.examsDone, total: s.examCount })}
                      </span>
                      <span className="text-xs font-extrabold" style={{ color: 'var(--color-primary)', minWidth: 38, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {p.averagePct != null ? `${p.averagePct}%` : '—'}
                      </span>
                      <ArrowRight size={15} strokeWidth={2.2} style={{ color: 'var(--color-outline)' }} />
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>

          {plan === 'free' && (
            <a href={`/${locale}/premium?vanaf=profiel`} className="premium-cta no-underline mt-5">
              {t('upsell_cta')}
              <ArrowRight size={16} strokeWidth={2.4} />
            </a>
          )}
        </div>
      </div>

      <style>{`
        .panel { background:#fff; border:1.5px solid var(--color-surface-container-high); border-radius:18px; padding:20px 22px; box-shadow:var(--shadow-card-md); }
        .panel-title { font-family:var(--font-headline); font-size:0.72rem; font-weight:800; letter-spacing:0.12em; text-transform:uppercase; color:var(--color-outline); margin-bottom:14px; }
        .kv { display:grid; grid-template-columns:auto 1fr; gap:10px 18px; align-items:baseline; }
        .kv dt { font-size:0.78rem; font-weight:700; color:var(--color-outline); }
        .kv dd { font-size:0.9rem; font-weight:600; color:var(--color-on-surface); overflow-wrap:anywhere; }
        .logout-btn { display:inline-flex; align-items:center; gap:8px; padding:9px 15px; border-radius:11px; border:1.5px solid var(--color-surface-container-high); background:var(--color-surface-container-low); font-family:inherit; font-size:0.82rem; font-weight:700; color:var(--color-on-surface-variant); cursor:pointer; transition:background .18s ease, border-color .18s ease; }
        .logout-btn:hover { background:var(--color-surface-container); border-color:var(--color-outline-variant); }
        .logout-btn:focus-visible { outline:2px solid var(--color-secondary-container); outline-offset:2px; }
        .skill-line { display:flex; align-items:center; gap:12px; padding:10px 12px; border-radius:12px; background:var(--color-surface-container-low); transition:background .18s ease; }
        .skill-line:hover { background:var(--color-surface-container); }
        .skill-line:focus-visible { outline:2px solid var(--color-secondary-container); outline-offset:2px; }
        .premium-cta { display:inline-flex; align-items:center; gap:8px; padding:12px 20px; border-radius:12px; font-size:0.87rem; font-weight:800; color:#fff; background:var(--gradient-btn-orange); box-shadow:var(--shadow-btn-orange); transition:transform .2s cubic-bezier(0.22,1,0.36,1), box-shadow .2s ease; }
        .premium-cta:hover { transform:translateY(-2px); box-shadow:var(--shadow-btn-orange-hover); }
        .premium-cta:focus-visible { outline:2px solid var(--color-primary); outline-offset:2px; }
        @media (prefers-reduced-motion: reduce) {
          .logout-btn, .skill-line, .premium-cta { transition:none; }
          .premium-cta:hover { transform:none; }
        }
      `}</style>
    </AppShell>
  );
}
