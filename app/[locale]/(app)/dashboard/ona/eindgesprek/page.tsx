import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Check, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ONA_CARDS } from '@/data/ona/cards';
import { ONA_GESPREK_MAX_QUESTIONS } from '@/data/ona/eindgesprek';
import { canOpenOnaCard, canStartOnaPractice, isOnaAvailable, isOnaReviewed } from '@/lib/ona/access';
import { fetchOnaState } from '@/lib/ona/server';
import { isAnswered } from '@/lib/ona/rules';
import { fetchPortalMenu } from '@/lib/portal-menu';
import AppShell from '../../../components/AppShell';
import '@/app/glas-leerlaag.css';
import PortalCrumbs from '../../../components/PortalCrumbs';
import Practice from './Practice';

/**
 * Het eindgesprek oefenen: vragen over wat de kandidaat zelf op zijn kaarten schreef.
 * Geen cijfer en geen "geslaagd" — dat beslist alleen DUO, en het zou de route naar AI-Act
 * hoog-risico opschuiven (CLAUDE.md §2).
 */
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('ona');
  return { title: t('meta_title'), robots: { index: false, follow: false } };
}

export default async function OnaPracticePage({ params }: Props) {
  const { locale } = await params;
  if (!isOnaAvailable()) notFound();

  const t = await getTranslations('ona');
  const tPortal = await getTranslations('portal');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/register?next=/${locale}/dashboard/ona/eindgesprek`);
  const meta = user.user_metadata ?? {};

  const [state, menu] = await Promise.all([fetchOnaState(user.id), fetchPortalMenu()]);
  if (!state.portfolio) redirect(`/${locale}/dashboard/ona/start`);

  const byNo = new Map(state.entries.map(e => [e.cardNo, e]));
  const cards = ONA_CARDS.map(card => ({
    number: card.number,
    title: card.title,
    available: canOpenOnaCard(meta, card.number)
      && card.prompts.some(p => isAnswered(byNo.get(card.number)?.answers[p.id])),
  }));

  return (
    <AppShell
      locale={locale}
      email={user.email ?? ''}
      avatarUrl={String(meta.avatar_url ?? meta.picture ?? '')}
      active="ona-eindgesprek"
      activeGroup="ona"
      menu={menu}
    >
      <div className="g-leer gl-shell">
        <div className="max-w-6xl mx-auto ona">
          <PortalCrumbs
            trail={[
              { label: tPortal('crumb_overview'), href: `/${locale}/dashboard` },
              { label: t('name'), href: `/${locale}/dashboard/ona` },
              { label: t('gesprek_title') },
            ]}
          />
          {!isOnaReviewed() && <p className="ona-notice" role="note">{t('draft_notice')}</p>}
          <header>
            <h1 className="g-head gl-ona-h1">
              {t('gesprek_title')}
            </h1>
            <p className="ona-body" style={{ marginTop: 8, maxWidth: '62ch', color: 'var(--color-on-surface-variant)' }}>
              {t('gesprek_body')}
            </p>
          </header>

          <div className="ona-split wide-left">
            <Practice
              locale={locale}
              cards={cards}
              canStart={canStartOnaPractice(meta, state.practice.count)}
              maxQuestions={ONA_GESPREK_MAX_QUESTIONS}
            />
            <aside className="ona-panel tier flex flex-col gap-3">
              <h2 className="ona-h3">{t('after_title')}</h2>
              <ul className="ona-checks">
                <li><Check size={18} strokeWidth={2.4} className="ok" aria-hidden /><span>{t('after_1')}</span></li>
                <li><X size={18} strokeWidth={2.4} className="hint" aria-hidden /><span>{t('after_2')}</span></li>
              </ul>
              <p className="ona-muted">{t('after_ai')}</p>
            </aside>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
