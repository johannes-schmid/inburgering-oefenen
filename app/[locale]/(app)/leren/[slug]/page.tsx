import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { FEATURES } from '@/lib/features';
import { fetchPortalMenu } from '@/lib/portal-menu';
import AppShell from '../../components/AppShell';
import LerenThemaClient from './LerenThemaClient';

export const metadata: Metadata = {
  title: 'Lesmodule | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

/**
 * One KNM lesson theme, inside the portal chrome.
 *
 * This page **was** the client component itself, and it drew its own sidebar: a second copy of
 * the portal chrome, with its own `#dash-sidebar` rules and a bottom bar hard-coded to the
 * sidebar's old 248px width. Exactly the duplication CLAUDE.md records the shell existing to
 * prevent, and it had already drifted. The server half is now this file — the session and the
 * module menu, neither of which a client component can read — and the lesson itself stays
 * client-side for its audio, quiz and XP writes.
 */
export default async function LerenThemaPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!FEATURES.leren) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/leren/${slug}`);

  const meta = user.user_metadata ?? {};
  const menu = await fetchPortalMenu();

  return (
    <AppShell
      locale={locale}
      email={user.email ?? ''}
      avatarUrl={String(meta.avatar_url ?? meta.picture ?? '')}
      active="leren"
      activeGroup="knm"
      menu={menu}
    >
      <LerenThemaClient locale={locale} slug={slug} />
    </AppShell>
  );
}
