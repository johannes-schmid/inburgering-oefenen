import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Check, ExternalLink, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ONA_CARDS, ONA_INFO_URL } from '@/data/ona/cards';
import { canOpenOnaCard, isOnaAvailable } from '@/lib/ona/access';
import { fetchOnaState } from '@/lib/ona/server';
import { duoCheck, isAnswered } from '@/lib/ona/rules';
import { fetchPortalMenu } from '@/lib/portal-menu';
import AppShell from '../../../components/AppShell';
import PortalCrumbs from '../../../components/PortalCrumbs';
import PrintButton from './PrintButton';

/**
 * Inleveren bij DUO: de drie controles van DUO, de stappen in Mijn Inburgering, en een
 * afdrukbare lijst van de eigen antwoorden om over te zetten op de officiële kaarten.
 *
 * We maken géén ingevuld DUO-formulier na: het formulier is van het ministerie, en de kandidaat
 * hoort het zelf in te vullen. Dit is zijn eigen tekst, per vraag, in de volgorde van het formulier.
 */
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('ona');
  return { title: t('meta_title'), robots: { index: false, follow: false } };
}

export default async function OnaSubmitPage({ params }: Props) {
  const { locale } = await params;
  if (!isOnaAvailable()) notFound();

  const t = await getTranslations('ona');
  const tPortal = await getTranslations('portal');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/register?next=/${locale}/dashboard/ona/inleveren`);
  const meta = user.user_metadata ?? {};

  const [state, menu] = await Promise.all([fetchOnaState(user.id), fetchPortalMenu()]);
  if (!state.portfolio) redirect(`/${locale}/dashboard/ona/start`);

  const check = duoCheck(state.entries);
  const byNo = new Map(state.entries.map(e => [e.cardNo, e]));
  const steps = ['inl_step_1', 'inl_step_2', 'inl_step_3', 'inl_step_4'] as const;

  return (
    <AppShell
      locale={locale}
      email={user.email ?? ''}
      avatarUrl={String(meta.avatar_url ?? meta.picture ?? '')}
      active="ona-inleveren"
      activeGroup="ona"
      menu={menu}
    >
      <div className="px-5 py-7 sm:px-8 sm:py-10">
        <div className="max-w-4xl mx-auto ona">
          <PortalCrumbs
            trail={[
              { label: tPortal('crumb_overview'), href: `/${locale}/dashboard` },
              { label: t('name'), href: `/${locale}/dashboard/ona` },
              { label: t('inl_title') },
            ]}
          />

          <section className="ona-panel flex flex-col gap-4 ona-noprint">
            <h1 style={{ fontFamily: 'var(--font-headline)', fontWeight: 800, fontSize: 'clamp(1.75rem, 3.4vw, 2.35rem)', lineHeight: 1.1, letterSpacing: '-0.02em', color: 'var(--color-primary)', margin: 0 }}>
              {t('inl_title')}
            </h1>
            <ul className="ona-checks">
              <Row ok={check.allAnswered} label={t('check_answered')}
                extra={check.allAnswered ? null : t('check_answered_open', { n: check.cardsOpen.length })} okLabel={t('check_ok')} notOkLabel={t('check_not_ok')} />
              <Row ok={check.beroepFlags === 0} label={t('check_beroep')}
                extra={check.beroepFlags === 0 ? null : t('check_beroep_flags', { n: check.beroepFlags })} okLabel={t('check_ok')} notOkLabel={t('check_not_ok')} />
              <Row ok={check.evidenceComplete} label={t('check_evidence')}
                extra={check.evidenceComplete ? null : t('check_evidence_missing', { n: check.evidenceMissing.length })} okLabel={t('check_ok')} notOkLabel={t('check_not_ok')} />
            </ul>
            {check.evidenceMissing.length > 0 && (
              <ul className="ona-muted" style={{ margin: 0, paddingInlineStart: '1.25rem' }}>
                {check.evidenceMissing.map(m => <li key={`${m.cardNo}-${m.label}`}>{m.cardNo}. {m.label}</li>)}
              </ul>
            )}
            <p className={`ona-notice${check.ready ? ' info' : ''}`} role="status">{check.ready ? t('ready_yes') : t('ready_no')}</p>
          </section>

          <section className="ona-panel tier flex flex-col gap-3 ona-noprint">
            <p className="ona-body">{t('inl_body')}</p>
            <ol style={{ margin: 0, paddingInlineStart: '1.25rem' }} className="flex flex-col gap-2">
              {steps.map(k => <li key={k} className="ona-body">{t(k)}</li>)}
            </ol>
            <div className="ona-links">
              <a href={ONA_INFO_URL} target="_blank" rel="noopener noreferrer">
                {t('duo_link_cards')}
                <ExternalLink size={15} strokeWidth={2.2} aria-hidden />
              </a>
            </div>
          </section>

          <section className="ona-panel flex flex-col gap-5">
            <div className="flex flex-wrap justify-between items-baseline gap-3">
              <h2 className="ona-h2">{t('answers_title')}: {state.portfolio.beroep}</h2>
              <PrintButton label={t('print_cta')} />
            </div>
            {ONA_CARDS.filter(card => canOpenOnaCard(meta, card.number)).map(card => {
              const entry = byNo.get(card.number);
              return (
                <article key={card.number} className="ona-print-card" lang="nl">
                  <h3 className="ona-h3">{card.number}. {card.title}</h3>
                  {card.prompts.map(p => (
                    <div key={p.id}>
                      <p className="ona-muted" style={{ fontWeight: 600, marginTop: '0.6rem' }}>{p.label}</p>
                      <p className="ona-answer" style={isAnswered(entry?.answers[p.id]) ? undefined : { color: 'var(--color-on-surface-variant)', fontStyle: 'italic' }}>
                        {isAnswered(entry?.answers[p.id]) ? entry!.answers[p.id].trim() : t('unanswered')}
                      </p>
                    </div>
                  ))}
                </article>
              );
            })}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ ok, label, extra, okLabel, notOkLabel }: {
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
