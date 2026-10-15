import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ownsKnm } from '@/lib/entitlements';
import { FEATURES } from '@/lib/features';
import { THEMAS } from '@/data/leren';
import { fetchThemesDone } from '@/lib/lessons/track-routes';

type Props = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
  title: 'KNM lesmodules | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

/**
 * Geen lijst meer: een doorgang naar de eerstvolgende lesmodule (eigenaar, 15-10). De zeven
 * thema's staan in de cursusroute naast elke lespagina, dus een index erboven was een tussenstop.
 * Thema 1 is open voor iedereen met een account; zonder module blijft het daar.
 */
export default async function LerenIndexPage({ params }: Props) {
  const { locale } = await params;
  if (!FEATURES.leren) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/leren`);

  const owns = ownsKnm(user.user_metadata ?? {});
  const done = await fetchThemesDone(user.id);
  const open = owns ? THEMAS : THEMAS.slice(0, 1);
  const next = open.find(th => !done.has(th.id)) ?? open[0];
  if (!next) notFound();
  redirect(`/${locale}/leren/${next.slug}`);
}
