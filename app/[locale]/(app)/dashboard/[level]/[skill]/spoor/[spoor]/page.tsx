import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ownsModule } from '@/lib/entitlements';
import { getSkillAtLevel, isLevel } from '@/data/skills';
import { fetchSporen } from '@/lib/lessons/sporen-server';
import { isSpoor, nextInSpoor, spoorPath } from '@/lib/lessons/sporen';
import { lessonPath } from '@/lib/lessons/lessons';

type Props = { params: Promise<{ locale: string; level: string; skill: string; spoor: string }> };

export const metadata: Metadata = {
  title: 'Lessen | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

/**
 * Een spoor is geen scherm meer — het is een doorgang naar zijn eerstvolgende les.
 *
 * Tot 15-09 stond hier een raster modules met een totaalbalk erboven. Sinds het lespaneel het
 * héle spoor draagt — elke module een uitklapbare sectie, zie `spoorPanel` — zei dat scherm
 * precies hetzelfde als de kolom die er in de les naast staat, en dan is het een tussenstop
 * tussen twee klikken (beslissing eigenaar): je klikt "Bekijk de modules" en je bent in de les,
 * met alle modules ernaast. Exact dezelfde stap die `/spoor/[spoor]/[module]` op 03-09 al maakte.
 *
 * De route blijft bestaan en blijft dus een geldig doel — de leerroutekaart, de kruimels en het
 * lespaneel wijzen er heen. Hij redirect alleen.
 *
 * `nextInSpoor` en niet les 1: wie halverwege terugkomt wil verder, niet opnieuw beginnen.
 */
export default async function SpoorPage({ params }: Props) {
  const { locale, level: rawLevel, skill: slug, spoor: rawSpoor } = await params;
  if (!isLevel(rawLevel) || !isSpoor(rawSpoor)) notFound();
  const level = rawLevel;
  const spoor = rawSpoor;
  const skill = getSkillAtLevel(level, slug);
  if (!skill) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=${spoorPath(level, skill.slug, spoor)}`);

  const sporen = await fetchSporen(level, skill.slug, user.id);
  const current = sporen.find(s => s.slug === spoor);
  // Geen module met een vrijgegeven les = dit spoor bestaat hier niet. Zelfde gate als voorheen.
  if (!current || current.modules.length === 0) notFound();

  const next = nextInSpoor(current);
  if (!next) notFound();

  const owned = ownsModule(user.user_metadata ?? {}, level, skill.slug);
  if (!owned && !next.is_free) {
    redirect(
      `/${locale}/dashboard/pakketten?onderdeel=${level}:${skill.slug}&vanaf=spoor-${spoor}`,
    );
  }

  redirect(`/${locale}${lessonPath(level, skill.slug, next.slug)}`);
}
