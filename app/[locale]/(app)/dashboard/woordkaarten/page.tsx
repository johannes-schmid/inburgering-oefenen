import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ownsKnm, planFromMetadata } from '@/lib/entitlements';
import { FEATURES } from '@/lib/features';
import AppShell from '../../components/AppShell';
import WoordkaartenClient from './WoordkaartenClient';
import { fetchPortalMenu } from '@/lib/portal-menu';

/**
 * The KNM woordkaarten, given a route of their own.
 *
 * `WoordkaartenView` came across with the fork and has been on disk, unrouted, since the KNM
 * dashboard SPA was replaced by nested routes — reachable only through a `useState` view that
 * no longer exists. This is the route it needed; the component is unchanged.
 *
 * The 366 cards are static (`data/woordkaarten.ts`) and `word_cards` in Supabase holds the
 * same set with its media. The component reads the static list, so the page renders with no
 * query — which is what makes it usable on a phone on mobile data.
 */
type Props = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
  title: 'KNM woordkaarten | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

export default async function WoordkaartenPage({ params }: Props) {
  const { locale } = await params;
  if (!FEATURES.woordkaarten) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/dashboard/woordkaarten`);

  const meta = user.user_metadata ?? {};

  const menu = await fetchPortalMenu();

  return (
    <AppShell
      locale={locale}
      email={user.email ?? ''}
      avatarUrl={String(meta.avatar_url ?? meta.picture ?? '')}
      active="woordkaarten"
      activeGroup="knm"
      menu={menu}
    >
      <div className="px-5 py-7 sm:px-8 sm:py-10">
        <div className="max-w-3xl mx-auto">
          {/* No <h1> here on purpose: `WoordkaartenView` draws its own "Woordkaarten" heading
              and lede, and a page header above it rendered the same thing twice. */}
          <WoordkaartenClient
            userId={user.id}
            plan={planFromMetadata(meta)}
            owns={ownsKnm(meta)}
            locale={locale}
          />
        </div>
      </div>
    </AppShell>
  );
}
