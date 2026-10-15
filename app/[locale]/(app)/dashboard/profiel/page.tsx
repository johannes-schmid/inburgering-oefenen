import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, Check, ClipboardList, LogOut, Mail, Package, TriangleAlert } from 'lucide-react';
import { SettingsList, SettingsRow } from '@/components/glas';
import { createClient } from '@/lib/supabase/server';
import { modulesExpired, planFromMetadata } from '@/lib/entitlements';
import { fetchPortalProgress } from '@/lib/portal-progress';
import { LEVELS, SKILLS, levelLabel, skillsAtLevel } from '@/data/skills';
import CategoryMark from '@/components/horizon/CategoryMark';
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
      <div className="g-page g-page-narrow">
        <header className="g-ph">
          <h1>{t('profile_title')}</h1>
        </header>

        <div className="g-prof">
          {/* Het account als één gegroepeerde lijst (§G5 "settings as one grouped list"). */}
          <section className="g-card g-card-wide" aria-labelledby="prof-account">
            <div className="g-card-h"><h2 id="prof-account">{t('profile_account')}</h2></div>
            <SettingsList>
              <SettingsRow
                icon={<Mail />}
                title={t('profile_email')}
                control={<span className="g-set-val">{user.email}</span>}
              />
              <SettingsRow
                icon={<Package />}
                title={t('profile_plan')}
                control={<span className="g-set-val">{planLabel}</span>}
              />
              <SettingsRow
                icon={<ClipboardList />}
                title={t('profile_exams_done')}
                control={
                  <span className="g-set-val g-tnum">
                    {t('stat_exams_value', { done: totalDone, total: totalExams })}
                  </span>
                }
              />
              <SettingsRow
                icon={<LogOut className="rtl-flip" />}
                title={t('btn_logout')}
                control={<LogoutButton />}
              />
            </SettingsList>
          </section>

          {(subscriptions.length > 0 || modulesUntil) && (
            <section className="g-card" aria-labelledby="prof-sub">
              <div className="g-card-h">
                <h2 id="prof-sub">Abonnement</h2>
                {subscriptions.length > 0 && (
                  <span className="g-bdg g-bdg-goed"><Check aria-hidden />{t('glas.sub_active')}</span>
                )}
              </div>

              {subscriptions.length > 0 ? (
                <>
                  <dl className="g-kv">
                    <dt>Per maand</dt>
                    <dd>{euro(monthlyCents)}</dd>
                    {nextPayment && (
                      <>
                        <dt>Volgende afschrijving</dt>
                        <dd>{formatDutchDate(nextPayment)}</dd>
                      </>
                    )}
                  </dl>
                  <p className="g-mp-small">
                    Wordt automatisch verlengd via SEPA-incasso. Opzeggen kan elke maand; je houdt
                    toegang tot het einde van de periode die je al betaald hebt.
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    <a href={`/${locale}/dashboard/pakketten?vanaf=profiel`} className="g-btn g-btn-ghost g-btn-sm">
                      {t('upsell_cta')}
                    </a>
                    <CancelSubscription accessHint={nextPayment ? formatDutchDate(nextPayment) : null} />
                  </div>
                </>
              ) : (
                // Cancelled but still inside the paid period. Stated plainly, with the end date,
                // because "je bent opgezegd" alone reads as "your access is gone" and it is not.
                <p className={`g-notice${accessLapsed ? ' g-notice-fout' : ''}`}>
                  <TriangleAlert aria-hidden />
                  <span>
                    Je abonnement is opgezegd{canceledAt ? ` op ${formatDutchDate(canceledAt.slice(0, 10))}` : ''}.{' '}
                    {accessLapsed
                      ? <b>Je toegang is verlopen.</b>
                      : `Je houdt toegang tot ${formatDutchDate(modulesUntil!)}.`}{' '}
                    <a href={`/${locale}/dashboard/pakketten`}>Opnieuw starten</a>
                  </span>
                </p>
              )}
            </section>
          )}

          <section
            className={`g-card${subscriptions.length > 0 || modulesUntil ? '' : ' g-card-wide'}`}
            aria-labelledby="prof-skills"
          >
            <div className="g-card-h"><h2 id="prof-skills">{t('profile_per_skill')}</h2></div>
            <ul className="flex flex-col gap-1 list-none m-0 p-0">
              {activeLevels.flatMap(level => skillsAtLevel(level).map(s => {
                const p = progress[level][s.slug];
                const pct = s.examCount > 0 ? Math.round((p.examsDone / s.examCount) * 100) : 0;
                return (
                  <li key={`${level}:${s.slug}`}>
                    <a href={`/${locale}/dashboard/${level}/${s.slug}`} className="g-skl">
                      <CategoryMark category={s.slug} size={36} />
                      <span className="g-skl-t">
                        <span className="g-skl-row">
                          <b>
                            {tSkills(`${s.key}.name`)}
                            {activeLevels.length > 1 && <small>{levelLabel(level)}</small>}
                          </b>
                          <span className="g-tnum">
                            {t('stat_exams_value', { done: p.examsDone, total: s.examCount })}
                            {' · '}
                            {p.averagePct != null ? `${p.averagePct}%` : '—'}
                          </span>
                        </span>
                        <span className="g-prog" aria-hidden><i style={{ width: `${pct}%` }} /></span>
                      </span>
                    </a>
                  </li>
                );
              }))}
            </ul>
          </section>
        </div>

        {plan === 'free' && (
          <a href={`/${locale}/dashboard/pakketten?vanaf=profiel`} className="g-btn g-btn-oranje mt-5">
            {t('upsell_cta')}
            <ArrowRight strokeWidth={2.4} className="rtl-flip" aria-hidden />
          </a>
        )}
      </div>
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
