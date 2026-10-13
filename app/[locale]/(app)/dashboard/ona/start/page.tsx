import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { isOnaAvailable } from '@/lib/ona/access';
import { fetchOnaPortfolio } from '@/lib/ona/server';
import { fetchPortalMenu } from '@/lib/portal-menu';
import AppShell from '../../../components/AppShell';
import PortalCrumbs from '../../../components/PortalCrumbs';
import StartForm from './StartForm';

/**
 * De eerste stap van ONA: moet je het wel doen, en zo ja, over welk beroep?
 *
 * De vrijstellingsvragen zijn regels, geen model: ze volgen inburgeren.nl (vrijstelling ONA,
 * geraadpleegd 13-10-2026) en wat `SEO/facts.md` en de tijdlijn al zeggen. Wie vrijgesteld lijkt,
 * krijgt de link naar DUO — en mag toch doorgaan, want alleen DUO beslist over een vrijstelling.
 */
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('ona');
  return { title: t('meta_title'), robots: { index: false, follow: false } };
}

export default async function OnaStartPage({ params }: Props) {
  const { locale } = await params;
  if (!isOnaAvailable()) notFound();

  const t = await getTranslations('ona');
  const tPortal = await getTranslations('portal');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const meta = user?.user_metadata ?? {};
  const [portfolio, menu] = await Promise.all([
    user ? fetchOnaPortfolio(user.id) : Promise.resolve(null),
    fetchPortalMenu(),
  ]);

  return (
    <AppShell
      locale={locale}
      email={user?.email ?? ''}
      avatarUrl={String(meta.avatar_url ?? meta.picture ?? '')}
      active="overview-module"
      activeGroup="ona"
      menu={menu}
      isGuest={!user}
    >
      <div className="px-5 py-7 sm:px-8 sm:py-10">
        <div className="max-w-3xl mx-auto ona">
          <PortalCrumbs
            trail={[
              { label: tPortal('crumb_overview'), href: `/${locale}/dashboard` },
              { label: t('name'), href: `/${locale}/dashboard/ona` },
              { label: portfolio ? t('beroep_update') : t('start_title') },
            ]}
          />
          <StartForm
            locale={locale}
            isGuest={!user}
            initialBeroep={portfolio?.beroep ?? ''}
            initialRoute={portfolio?.route ?? 'onbekend'}
            hasPortfolio={!!portfolio}
          />
        </div>
      </div>
    </AppShell>
  );
}
