import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ownsModule } from '@/lib/entitlements';
import { getSkillAtLevel, isLevel } from '@/data/skills';
import { fetchWordThemes } from '@/lib/lessons/words-server';
import { nextTheme, wordThemePath } from '@/lib/lessons/words';

type Props = { params: Promise<{ locale: string; level: string; skill: string }> };

export const metadata: Metadata = {
  title: 'Woordkaarten | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

/**
 * De woordkaarten zijn geen overzichtsscherm meer — dit is een doorgang naar het eerstvolgende
 * thema.
 *
 * Tot 15-09 stond hier een raster themakaarten met een totaalbalk erboven. Sinds het lespaneel
 * álle thema's draagt (zie `wordsPanel`) zei dat scherm hetzelfde als de kolom die ernaast
 * staat zodra je een deck opent, en dan is het een tussenstop tussen twee klikken (beslissing
 * eigenaar). Dezelfde stap als bij `/spoor/[spoor]` en `/spoor/[spoor]/[module]`.
 *
 * De route blijft bestaan — de leerroutekaart en de kruimels wijzen er heen — en redirect.
 *
 * **De poort staat nu hier en niet meer alleen op de deck.** Er is geen gratis thema, dus een
 * kandidaat zonder de module kwam via dit scherm sowieso niet verder dan de eerste klik; die
 * gaat nu meteen naar het aanbod, met dezelfde `vanaf=` die de deck zelf ook meegaf.
 */
export default async function WoordenPage({ params }: Props) {
  const { locale, level: rawLevel, skill: slug } = await params;
  if (!isLevel(rawLevel)) notFound();
  const level = rawLevel;
  const skill = getSkillAtLevel(level, slug);
  if (!skill) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/dashboard/${level}/${skill.slug}/woorden`);

  const meta = user.user_metadata ?? {};
  if (!ownsModule(meta, level, skill.slug)) {
    redirect(`/${locale}/dashboard/pakketten?onderdeel=${level}:${skill.slug}&vanaf=woorden`);
  }

  const themes = await fetchWordThemes(level, skill.slug, user.id);
  const next = nextTheme(themes);
  if (!next) notFound();

  redirect(`/${locale}${wordThemePath(level, skill.slug, next.slug)}`);
}
