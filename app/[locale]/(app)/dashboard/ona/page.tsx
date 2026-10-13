import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, Check, ExternalLink, Pencil, Printer, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ownsOna } from '@/lib/entitlements';
import { ExamMark, ValidationChip } from '@/components/horizon';
import { ONA_CARDS, ONA_CARD_COUNT, ONA_INFO_URL } from '@/data/ona/cards';
import { canOpenOnaCard, isOnaAvailable, isOnaReviewed } from '@/lib/ona/access';
import { fetchOnaState } from '@/lib/ona/server';
import { cardProgress, duoCheck, nextCardNo } from '@/lib/ona/rules';
import { fetchTraject } from '@/lib/portal-traject';
import { fetchPortalMenu } from '@/lib/portal-menu';
import AppShell from '../../components/AppShell';
import PortalCrumbs from '../../components/PortalCrumbs';

/**
 * ONA in het portaal — het overzicht van het portfolio.
 *
 * Drie lagen, net als elke module: de kop (beroep, termijn, voortgang), de route in drie stappen
 * (schrijven → inleveren-check → eindgesprek oefenen) en de acht kaarten. ONA heeft geen
 * oefenexamens, dus er is geen examenstrook; de kaarten nemen die plek in.
 *
 * Een gast mag kijken, zoals overal in het portaal; de muur zit bij het opslaan. Een ingelogde
 * kandidaat zonder beroep gaat eerst naar `/start`: zonder beroep is er niets in te vullen.
 */
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('ona');
  return { title: t('meta_title'), robots: { index: false, follow: false } };
}

export default async function OnaOverviewPage({ params }: Props) {
  const { locale } = await params;
  if (!isOnaAvailable()) notFound();

  const t = await getTranslations('ona');
  const tPortal = await getTranslations('portal');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isGuest = !user;
  const meta = user?.user_metadata ?? {};

  const state = await fetchOnaState(user?.id ?? null);
  if (user && !state.portfolio) redirect(`/${locale}/dashboard/ona/start`);

  const [menu, traject] = await Promise.all([
    fetchPortalMenu(),
    user ? fetchTraject(user.email, locale) : Promise.resolve(null),
  ]);

  const owns = ownsOna(meta);
  const reviewed = isOnaReviewed();
  const byNo = new Map(state.entries.map(e => [e.cardNo, e]));
  const progress = ONA_CARDS.map(card => ({ card, p: cardProgress(card, byNo.get(card.number)) }));
  const done = progress.filter(x => x.p.status === 'klaar').length;
  const busy = progress.filter(x => x.p.status === 'concept');
  const next = nextCardNo(state.entries);
  const check = duoCheck(state.entries);
  const beroep = state.portfolio?.beroep ?? null;

  const base = `/${locale}/dashboard/ona`;

  return (
    <AppShell
      locale={locale}
      email={user?.email ?? ''}
      avatarUrl={String(meta.avatar_url ?? meta.picture ?? '')}
      active="overview-module"
      activeGroup="ona"
      menu={menu}
      isGuest={isGuest}
    >
      <div className="px-5 py-7 sm:px-8 sm:py-10">
        <div className="max-w-5xl mx-auto ona">
          <PortalCrumbs
            trail={[
              { label: tPortal('crumb_overview'), href: `/${locale}/dashboard` },
              { label: t('name') },
            ]}
          />

          {!reviewed && (
            <p className="ona-notice" role="note">{t('draft_notice')}</p>
          )}
          {state.portfolio?.route === 'map' && (
            <p className="ona-notice info" role="note">{t('map_notice')}</p>
          )}

          <section className="ona-panel">
            <div className="ona-top">
              <div className="ona-title">
                <ExamMark track="ona" size={64} />
                <div className="min-w-0">
                  <h1>{t('name')}</h1>
                  <p>{t('tagline')}</p>
                </div>
              </div>
              {beroep && (
                <dl className="ona-facts">
                  <dt>{t('fact_beroep')}</dt>
                  <dt>{traject?.termijnEnd ? t('fact_termijn') : ''}</dt>
                  <dd>
                    {beroep}
                    <a href={`${base}/start`}>{t('fact_change')}</a>
                  </dd>
                  <dd>{traject?.termijnEnd ?? ''}</dd>
                </dl>
              )}
            </div>

            {!isGuest && (
              <div className="ona-progress">
                <div className="ona-progress-row">
                  <strong>{t('progress', { done, total: ONA_CARD_COUNT })}</strong>
                  {busy[0] && <span className="ona-sub">{t('progress_busy', { n: busy[0].card.number })}</span>}
                </div>
                <div
                  className="ona-segs"
                  role="img"
                  aria-label={t('progress_aria', {
                    done, busy: busy.length, empty: ONA_CARD_COUNT - done - busy.length,
                  })}
                >
                  {progress.map(({ card, p }) => <span key={card.number} data-s={p.status} />)}
                </div>
              </div>
            )}
          </section>

          {isGuest ? (
            <section className="ona-panel ona-step" style={{ background: 'var(--color-surface-container-lowest)' }}>
              <h2 className="ona-h2">{t('guest_title')}</h2>
              <p className="ona-body">{t('guest_body')}</p>
              <div>
                <a className="ona-btn primary" href={`/${locale}/register?next=/${locale}/dashboard/ona/start`}>
                  {t('guest_cta')}
                  <ArrowRight size={18} strokeWidth={2.2} className="rtl-flip" aria-hidden />
                </a>
              </div>
            </section>
          ) : (
            <section className="ona-panel">
              <div className="ona-headrow">
                <h2 className="ona-h2">{t('route_title')}</h2>
                <span className="ona-sub">{t('route_sub')}</span>
              </div>
              <ol className="ona-route">
                <li className="ona-step">
                  <div className="ona-step-head">
                    <span className="ona-num" aria-hidden>1</span>
                    <h3 className="ona-h3">{t('step1_title')}</h3>
                  </div>
                  <p className="ona-muted">{t('step1_body')}</p>
                  <div className="ona-cta-row">
                    {next ? (
                      <a
                        className="ona-btn primary"
                        href={canOpenOnaCard(meta, next) ? `${base}/kaart/${next}` : `/${locale}/dashboard/pakketten?onderdeel=ona`}
                      >
                        {canOpenOnaCard(meta, next) ? t('step1_cta', { n: next }) : t('locked_cta')}
                        <ArrowRight size={18} strokeWidth={2.2} className="rtl-flip" aria-hidden />
                      </a>
                    ) : (
                      <a className="ona-btn secondary" href="#kaarten">{t('step1_cta_done')}</a>
                    )}
                  </div>
                </li>
                <li className="ona-step">
                  <div className="ona-step-head">
                    <span className="ona-num" aria-hidden>2</span>
                    <h3 className="ona-h3">{t('step2_title')}</h3>
                  </div>
                  <p className="ona-muted">{t('step2_body')}</p>
                  <ul className="ona-checks">
                    <CheckRow ok={check.allAnswered} label={t('check_answered')}
                      extra={check.allAnswered ? null : t('check_answered_open', { n: check.cardsOpen.length })}
                      okLabel={t('check_ok')} notOkLabel={t('check_not_ok')} />
                    <CheckRow ok={check.beroepFlags === 0} label={t('check_beroep')}
                      extra={check.beroepFlags === 0 ? null : t('check_beroep_flags', { n: check.beroepFlags })}
                      okLabel={t('check_ok')} notOkLabel={t('check_not_ok')} />
                    <CheckRow ok={check.evidenceComplete} label={t('check_evidence')}
                      extra={check.evidenceComplete ? null : t('check_evidence_missing', { n: check.evidenceMissing.length })}
                      okLabel={t('check_ok')} notOkLabel={t('check_not_ok')} />
                  </ul>
                  <div className="ona-cta-row">
                    <a className="ona-btn secondary" href={`${base}/inleveren`}>
                      {t('step2_cta')}
                      <ArrowRight size={18} strokeWidth={2.2} className="rtl-flip" aria-hidden />
                    </a>
                  </div>
                </li>
                <li className="ona-step">
                  <div className="ona-step-head">
                    <span className="ona-num" aria-hidden>3</span>
                    <h3 className="ona-h3">{t('step3_title')}</h3>
                  </div>
                  <p className="ona-muted">{t('step3_body')}</p>
                  <p className="ona-muted">{t('step3_count', { n: state.practice.count })}</p>
                  <div className="ona-cta-row">
                    <a className="ona-btn secondary" href={`${base}/eindgesprek`}>
                      {t('step3_cta')}
                      <ArrowRight size={18} strokeWidth={2.2} className="rtl-flip" aria-hidden />
                    </a>
                  </div>
                </li>
              </ol>
            </section>
          )}

          <section id="kaarten" className="flex flex-col gap-4">
            <div className="ona-headrow" style={{ marginBottom: 0 }}>
              <h2 className="ona-h2">{t('cards_title')}</h2>
              <span className="ona-sub">{beroep ? t('cards_sub', { beroep }) : t('cards_sub_guest')}</span>
            </div>
            {!owns && !isGuest && <p className="ona-notice info" role="note">{t('free_banner')}</p>}
            <div className="ona-grid">
              {progress.map(({ card, p }) => {
                const open = canOpenOnaCard(meta, card.number);
                const status = open ? p.status : 'locked';
                const href = isGuest
                  ? `/${locale}/register?next=/${locale}/dashboard/ona/start`
                  : open ? `${base}/kaart/${card.number}` : `/${locale}/dashboard/pakketten?onderdeel=ona`;
                const metaLine = !open
                  ? card.goal
                  : p.status === 'klaar'
                    ? t('card_meta_klaar')
                    : p.status === 'concept'
                      ? [t('card_meta_concept', { answered: p.answered, total: p.total }),
                        p.flags > 0 ? t('card_meta_flags', { n: p.flags }) : null].filter(Boolean).join('. ')
                      : t('card_meta_leeg', { total: p.total });
                return (
                  <a
                    key={card.number}
                    href={href}
                    className={`ona-card${next === card.number && open && !isGuest ? ' is-next' : ''}${open ? '' : ' is-locked'}`}
                  >
                    <div className="ona-card-top">
                      <span className="ona-tile" aria-hidden>{card.number}</span>
                      {!isGuest && (
                        <span className="ona-status" data-s={status}>
                          {status === 'klaar' && <Check size={14} strokeWidth={2.6} aria-hidden />}
                          {status === 'concept' && <Pencil size={13} strokeWidth={2.2} aria-hidden />}
                          {t(`status_${status}`)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3>{card.title}</h3>
                      <p>{isGuest ? card.goal : metaLine}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>

          <section className="ona-pair">
            <div className="ona-panel tier">
              <h2 className="ona-h3">{t('help_title')}</h2>
              <ul className="ona-checks">
                <li><Check size={18} strokeWidth={2.4} className="ok" aria-hidden /><span>{t('help_1')}</span></li>
                <li><Check size={18} strokeWidth={2.4} className="ok" aria-hidden /><span>{t('help_2')}</span></li>
                <li><X size={18} strokeWidth={2.4} className="hint" aria-hidden /><span>{t('help_3')}</span></li>
              </ul>
              {reviewed && <ValidationChip className="self-start">{t('validation')}</ValidationChip>}
            </div>
            <div className="ona-panel tier">
              <h2 className="ona-h3">{t('duo_title')}</h2>
              <p className="ona-body" style={{ color: 'var(--color-on-surface-variant)' }}>{t('duo_body')}</p>
              <div className="ona-links">
                <a href={ONA_INFO_URL} target="_blank" rel="noopener noreferrer">
                  {t('duo_link_cards')}
                  <ExternalLink size={15} strokeWidth={2.2} aria-hidden />
                </a>
                {!isGuest && (
                  <a href={`${base}/inleveren`}>
                    {t('duo_link_print')}
                    <Printer size={15} strokeWidth={2.2} aria-hidden />
                  </a>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function CheckRow({ ok, label, extra, okLabel, notOkLabel }: {
  ok: boolean; label: string; extra: string | null; okLabel: string; notOkLabel: string;
}) {
  return (
    <li>
      {ok
        ? <Check size={18} strokeWidth={2.4} className="ok" role="img" aria-label={okLabel} />
        : <X size={18} strokeWidth={2.4} className="no" role="img" aria-label={notOkLabel} />}
      <span>{label}{extra && <span className="hint"> {extra}</span>}</span>
    </li>
  );
}
