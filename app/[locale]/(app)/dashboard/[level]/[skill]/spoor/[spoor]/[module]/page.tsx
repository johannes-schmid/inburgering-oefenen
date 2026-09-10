import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ownsModule } from '@/lib/entitlements';
import { getSkillAtLevel, isLevel } from '@/data/skills';
import { fetchSporen } from '@/lib/lessons/sporen-server';
import { isSpoor, modulePath, nextInModule, spoorPath } from '@/lib/lessons/sporen';
import { lessonPath } from '@/lib/lessons/lessons';

type Props = {
  params: Promise<{ locale: string; level: string; skill: string; spoor: string; module: string }>;
};

export const metadata: Metadata = {
  title: 'Module | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

/**
 * Een module is geen scherm meer — hij is een doorgang naar zijn eerstvolgende les.
 *
 * Tot 03-09 stond hier een overzicht: de titel, de voortgangsbalk, een "beginnen"-kaart en de
 * lessenlijst. Sinds de modulekolom in de chrome staat (`ModulePanel`) zei dat scherm precies
 * hetzelfde als de kolom ernaast, en dan is het een tussenstop tussen twee klikken die niets
 * toevoegt (beslissing eigenaar, 03-09): je kiest een module en je bent in de les.
 *
 * De route blijft bestaan en blijft dus een geldig doel — het spooroverzicht, de kruimels, de
 * moduleswitcher en de "volgende module"-kaart wijzen er allemaal heen. Hij redirect alleen.
 *
 * `nextInModule` en niet les 1: wie halverwege terugkomt wil verder, niet opnieuw beginnen.
 * Een les die niet van jou is stuurt naar het aanbod, met dezelfde `vanaf=` die de lespagina
 * zelf ook meegeeft.
 */
export default async function ModulePage({ params }: Props) {
  const { locale, level: rawLevel, skill: slug, spoor: rawSpoor, module: moduleSlug } = await params;
  if (!isLevel(rawLevel) || !isSpoor(rawSpoor)) notFound();
  const level = rawLevel;
  const spoor = rawSpoor;
  const skill = getSkillAtLevel(level, slug);
  if (!skill) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/login?next=${modulePath(level, skill.slug, spoor, moduleSlug)}`);
  }

  const sporen = await fetchSporen(level, skill.slug, user.id);
  const current = sporen.find(s => s.slug === spoor);
  const mod = current?.modules.find(m => m.slug === moduleSlug);
  if (!current || !mod) notFound();

  const next = nextInModule(mod);
  // Een lege module hoort niet te bestaan, maar als hij bestaat is het spoor de enige plek waar
  // hij nog iets kan zeggen — niet een 404 midden in een cursus.
  if (!next) redirect(`/${locale}${spoorPath(level, skill.slug, spoor)}`);

  const owned = ownsModule(user.user_metadata ?? {}, level, skill.slug);
  if (!owned && !next.is_free) {
    redirect(
      `/${locale}/dashboard/pakketten?onderdeel=${level}:${skill.slug}&vanaf=leren-${next.slug}`,
    );
  }

  redirect(`/${locale}${lessonPath(level, skill.slug, next.slug)}`);
}
