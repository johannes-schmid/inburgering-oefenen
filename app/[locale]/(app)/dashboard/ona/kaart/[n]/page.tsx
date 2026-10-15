import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, ChevronLeft, ChevronRight, ExternalLink, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import ValidationSeal from '@/components/glas/ValidationSeal';
import { ONA_CARD_COUNT, getOnaCard } from '@/data/ona/cards';
import { canOpenOnaCard, isOnaAvailable, isOnaReviewed } from '@/lib/ona/access';
import { fetchOnaEntry, fetchOnaPortfolio, fetchOnaState } from '@/lib/ona/server';
import { fetchPortalMenu } from '@/lib/portal-menu';
import AppShell from '../../../../components/AppShell';
import '@/app/glas-leerlaag.css';
import PortalCrumbs from '../../../../components/PortalCrumbs';
import CardEditor from './CardEditor';
import CourseRoute from '@/components/lessons/CourseRoute';
import { onaRoute } from '@/lib/lessons/track-routes';

/**
 * Eén resultaatkaart schrijven.
 *
 * Links de uitleg van de docent en de bewijzen, rechts de vragen. De vragen zijn die van DUO in
 * eigen woorden (`data/ona/cards.ts`), in dezelfde volgorde als op het officiële formulier, zodat
 * overzetten één-op-één gaat.
 */
type Props = { params: Promise<{ locale: string; n: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('ona');
  return { title: t('meta_title'), robots: { index: false, follow: false } };
}

export default async function OnaCardPage({ params }: Props) {
  const { locale, n } = await params;
  if (!isOnaAvailable()) notFound();
  const card = getOnaCard(Number(n));
  if (!card) notFound();

  const t = await getTranslations('ona');
  const tPortal = await getTranslations('portal');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/register?next=/${locale}/dashboard/ona/kaart/${card.number}`);
  const meta = user.user_metadata ?? {};

  const portfolio = await fetchOnaPortfolio(user.id);
  if (!portfolio) redirect(`/${locale}/dashboard/ona/start`);

  const open = canOpenOnaCard(meta, card.number);
  const [entry, menu, state] = await Promise.all([
    open ? fetchOnaEntry(portfolio.id, card.number) : Promise.resolve(null),
    fetchPortalMenu(),
    fetchOnaState(user.id),
  ]);

  const base = `/${locale}/dashboard/ona`;
  const prev = card.number > 1 ? card.number - 1 : null;
  const next = card.number < ONA_CARD_COUNT ? card.number + 1 : null;

  const route = await onaRoute({ locale, meta, state, open: 'portfolio', currentCard: card.number });

  return (
    <AppShell
      locale={locale}
      email={user.email ?? ''}
      avatarUrl={String(meta.avatar_url ?? meta.picture ?? '')}
      active="ona-portfolio"
      activeGroup="ona"
      menu={menu}
      course={
        <CourseRoute
          courseLabel="ONA"
          done={route.done}
          total={route.total}
          blocks={route.blocks}
          backHref={base}
        />
      }
    >
      <div className="g-leer gl-shell">
        <div className="max-w-6xl mx-auto ona">
          <PortalCrumbs
            trail={[
              { label: tPortal('crumb_overview'), href: `/${locale}/dashboard` },
              { label: t('name'), href: base },
              { label: `${card.number}. ${card.title}` },
            ]}
          />

          {!isOnaReviewed() && <p className="ona-notice" role="note">{t('draft_notice')}</p>}

          <header className="flex flex-wrap gap-4 items-end justify-between">
            <div className="flex gap-4 items-center min-w-0">
              <span className="ona-tile lg" aria-hidden>{card.number}</span>
              <div className="min-w-0">
                <p className="ona-sub" style={{ margin: 0 }}>
                  {t('card_of', { n: card.number, total: ONA_CARD_COUNT, beroep: portfolio.beroep })}
                </p>
                <h1 className="g-head gl-ona-h1">
                  {card.title}
                </h1>
              </div>
            </div>
            <nav className="ona-cardnav" aria-label={t('cards_title')}>
              <a className="ona-icon-btn" href={prev ? `${base}/kaart/${prev}` : undefined} aria-disabled={!prev} aria-label={t('prev_card')}>
                <ChevronLeft size={20} strokeWidth={2.2} className="rtl-flip" aria-hidden />
              </a>
              <a className="ona-icon-btn" href={next ? `${base}/kaart/${next}` : undefined} aria-disabled={!next} aria-label={t('next_card')}>
                <ChevronRight size={20} strokeWidth={2.2} className="rtl-flip" aria-hidden />
              </a>
            </nav>
          </header>

          {open ? (
            <CardEditor
              locale={locale}
              cardNo={card.number}
              nextCardNo={next}
              initialAnswers={entry?.answers ?? {}}
              initialEvidence={entry?.evidence ?? {}}
              initialStatus={entry?.status ?? 'concept'}
              initialFlags={entry?.aiFlags ?? null}
              initialCheckedAt={entry?.aiCheckedAt ?? null}
              initialUpdatedAt={entry?.updatedAt ?? null}
              aside={
                <>
                  <section className="ona-panel flex flex-col gap-3.5">
                    <h2 className="ona-h3">{t('about_title')}</h2>
                    <p className="ona-body" style={{ fontWeight: 600 }}>{card.goal}</p>
                    {card.uitleg.map((para, i) => <p key={i} className="ona-body">{para}</p>)}
                    <a href={card.duoPdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
                      {t('duo_pdf')}
                      <ExternalLink size={14} strokeWidth={2.2} aria-hidden />
                    </a>
                    {isOnaReviewed() && <ValidationSeal className="self-start">{t('validation')}</ValidationSeal>}
                  </section>
                </>
              }
            />
          ) : (
            <section className="ona-panel flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Lock size={20} strokeWidth={2.2} aria-hidden style={{ color: 'var(--color-primary)' }} />
                <h2 className="ona-h2">{t('locked_title')}</h2>
              </div>
              <p className="ona-body">{card.goal}</p>
              <p className="ona-muted">{t('locked_body')}</p>
              <div>
                <a className="ona-btn primary" href={`/${locale}/dashboard/pakketten?onderdeel=ona`}>
                  {t('locked_cta')}
                  <ArrowRight size={18} strokeWidth={2.2} className="rtl-flip" aria-hidden />
                </a>
              </div>
            </section>
          )}
        </div>
      </div>
    </AppShell>
  );
}
