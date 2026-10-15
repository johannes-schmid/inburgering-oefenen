import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ownsKnm } from '@/lib/entitlements';
import { FEATURES } from '@/lib/features';
import { fetchKnmWordThemes, knmWordThemePath, nextKnmTheme } from '@/lib/lessons/track-routes';

type Props = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
  title: 'KNM woordkaarten | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

/**
 * Geen overzichtsscherm meer: een doorgang naar het eerstvolgende woordthema (eigenaar, 15-10).
 * Het raster met zeven themakaarten zei hetzelfde als de cursusroute ernaast — zelfde stap als
 * `/dashboard/[level]/[skill]/woorden`. De route blijft, want het KNM-scherm wijst ernaar.
 */
export default async function WoordkaartenPage({ params }: Props) {
  const { locale } = await params;
  if (!FEATURES.woordkaarten) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/dashboard/woordkaarten`);

  const next = nextKnmTheme(await fetchKnmWordThemes(user.id), ownsKnm(user.user_metadata ?? {}));
  if (!next) notFound();
  redirect(knmWordThemePath(locale, next.id));
}
