import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { modulesExpired, planFromMetadata } from '@/lib/entitlements';
import { fetchPortalProgress } from '@/lib/portal-progress';
import { LEVELS, SKILLS, levelLabel, skillsAtLevel } from '@/data/skills';
import SkillIcon from '@/components/site/SkillIcon';
import AppShell from '../../components/AppShell';
import LogoutButton from './LogoutButton';
import CancelSubscription from './CancelSubscription';
import { listLiveSubscriptions } from '@/lib/subscriptions';
import { euro } from '@/lib/pricing';
import { fetchPortalMenu } from '@/lib/portal-menu';

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

  // Read live from Mollie rather than from metadata — see lib/subscriptions.ts. Returns [] when
  // Mollie is unreachable, which hides the section rather than showing a wrong billing state.
  const customerId = typeof meta.mollie_customer_id === 'string' ? meta.mollie_customer_id : null;
  const subscriptions = customerId ? await listLiveSubscriptions(customerId) : [];
  const monthlyCents = subscriptions.reduce((n, s) => n + s.amountCents, 0);
  const nextPayment = subscriptions
    .map(s => s.nextPaymentDate)
    .filter((d): d is string => Boolean(d))
    .sort()[0];
  const canceledAt = typeof meta.subscription_canceled_at === 'string' ? meta.subscription_canceled_at : null;
  const modulesUntil = typeof meta.modules_until === 'string' ? meta.modules_until : null;

  // Same predicate the entitlement check uses, so the page can never claim access the app denies.
  const accessLapsed = modulesExpired(meta);

  // Levels the candidate has actually touched, plus A2 which is always listed. Totals count
  // only those, so "3 van de 40" does not silently become "3 van de 80" the day B1 slots exist.
  const activeLevels = LEVELS.filter(
    l => l === 'a2' || SKILLS.some(s => progress[l][s.slug].examsDone > 0),
  );
  const totalExams = activeLevels.reduce(
    (n, l) => n + skillsAtLevel(l).reduce((m, s) => m + s.examCount, 0), 0);
  const totalDone = activeLevels.reduce(
    (n, l) => n + SKILLS.reduce((m, s) => m + progress[l][s.slug].examsDone, 0), 0);
  const planLabel = t(`plan_${plan}` as 'plan_free');

  const menu = await fetchPortalMenu();

  return (
    <AppShell
      locale={locale}
      email={user.email ?? ''}
      avatarUrl={String(meta.avatar_url ?? meta.picture ?? '')}
      active="profile"
      menu={menu}
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

          {(subscriptions.length > 0 || modulesUntil) && (
            <section className="panel mt-5">
              <h2 className="panel-title">Abonnement</h2>

              {subscriptions.length > 0 ? (
                <>
                  <dl className="kv">
                    <dt>Per maand</dt>
                    <dd style={{ fontVariantNumeric: 'tabular-nums' }}>{euro(monthlyCents)}</dd>
                    {nextPayment && (
                      <>
                        <dt>Volgende afschrijving</dt>
                        <dd style={{ fontVariantNumeric: 'tabular-nums' }}>{formatDutchDate(nextPayment)}</dd>
                      </>
                    )}
                  </dl>
                  <p className="sub-note">
                    Wordt automatisch verlengd via SEPA-incasso. Opzeggen kan elke maand; je houdt
                    toegang tot het einde van de periode die je al betaald hebt.
                  </p>
                  <div className="mt-4">
                    <CancelSubscription accessHint={nextPayment ? formatDutchDate(nextPayment) : null} />
                  </div>
                </>
              ) : (
                // Cancelled but still inside the paid period. Stated plainly, with the end date,
                // because "je bent opgezegd" alone reads as "your access is gone" and it is not.
                <p className="sub-note">
                  Je abonnement is opgezegd{canceledAt ? ` op ${formatDutchDate(canceledAt.slice(0, 10))}` : ''}.{' '}
                  {accessLapsed
                    ? 'Je toegang is verlopen.'
                    : `Je houdt toegang tot ${formatDutchDate(modulesUntil!)}.`}{' '}
                  <a href={`/${locale}/dashboard/pakketten`}>Opnieuw starten</a>
                </p>
              )}
            </section>
          )}

          <section className="panel mt-5">
            <h2 className="panel-title">{t('profile_per_skill')}</h2>
            <ul className="flex flex-col gap-2.5">
              {activeLevels.flatMap(level => skillsAtLevel(level).map(s => {
                const p = progress[level][s.slug];
                return (
                  <li key={`${level}:${s.slug}`}>
                    <a href={`/${locale}/dashboard/${level}/${s.slug}`} className="skill-line no-underline">
                      <SkillIcon skill={s.slug} size="sm" />
                      <span className="flex-1 min-w-0 font-headline font-bold text-on-surface" style={{ fontSize: '0.9rem' }}>
                        {tSkills(`${s.key}.name`)}
                        {activeLevels.length > 1 && (
                          <span className="text-[0.65rem] font-bold uppercase tracking-wider text-outline ml-1.5">
                            {levelLabel(level)}
                          </span>
                        )}
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
              }))}
            </ul>
          </section>

          {plan === 'free' && (
            <a href={`/${locale}/dashboard/pakketten?vanaf=profiel`} className="premium-cta no-underline mt-5">
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
        .sub-note { margin-top:12px; font-size:0.78rem; line-height:1.6; color:var(--color-on-surface-variant); }
        .sub-note a { color:var(--color-secondary); font-weight:700; text-decoration:underline; }
        .cancel-link { background:none; border:0; padding:0; font:inherit; font-size:0.8rem; font-weight:700; color:var(--color-outline); text-decoration:underline; cursor:pointer; }
        .cancel-link:hover { color:var(--color-on-surface); }
        .cancel-link:focus-visible { outline:2px solid var(--color-secondary); outline-offset:3px; border-radius:3px; }
        .cancel-confirm { padding:14px 16px; border-radius:13px; background:var(--color-surface-container-low); border:1.5px solid var(--color-surface-container-high); }
        .cancel-q { margin:0 0 10px; font-size:0.83rem; font-weight:700; color:var(--color-on-surface); }
        .cancel-actions { display:flex; flex-wrap:wrap; gap:9px; }
        .cancel-yes { display:inline-flex; align-items:center; gap:7px; padding:9px 15px; border-radius:11px; border:1.5px solid var(--color-error, #b3261e); background:#fff; font:inherit; font-size:0.8rem; font-weight:700; color:var(--color-error, #b3261e); cursor:pointer; }
        .cancel-yes:disabled { opacity:0.55; cursor:default; }
        .cancel-no { padding:9px 15px; border-radius:11px; border:1.5px solid var(--color-surface-container-high); background:var(--color-surface-container); font:inherit; font-size:0.8rem; font-weight:700; color:var(--color-on-surface); cursor:pointer; }
        .cancel-yes:focus-visible, .cancel-no:focus-visible { outline:2px solid var(--color-secondary); outline-offset:2px; }
        .cancel-done { margin:0; font-size:0.83rem; font-weight:700; color:var(--color-on-surface); }
        .cancel-error { display:flex; align-items:center; gap:7px; margin:10px 0 0; font-size:0.8rem; color:var(--color-error, #b3261e); }
        .cancel-spin { animation:cancel-rotate 900ms linear infinite; }
        @keyframes cancel-rotate { to { transform:rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .cancel-spin { animation:none; } }
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

/** `2026-08-31` → `31 augustus 2026`. Mollie returns plain dates, so no timezone shifting. */
function formatDutchDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const months = [
    'januari', 'februari', 'maart', 'april', 'mei', 'juni',
    'juli', 'augustus', 'september', 'oktober', 'november', 'december',
  ];
  return `${d} ${months[m - 1]} ${y}`;
}
