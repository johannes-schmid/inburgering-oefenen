import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ownsModule } from '@/lib/entitlements';
import { getSkillAtLevel, isLevel } from '@/data/skills';
import { fetchGrammarStep } from '@/lib/lessons/grammar-server';
import { grammarStepPath, isFreeTopic, nextTopic, topicPath } from '@/lib/lessons/grammar';

type Props = { params: Promise<{ locale: string; level: string; skill: string }> };

export const metadata: Metadata = {
  title: 'Grammatica | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

/**
 * Stap 2 is geen scherm — het is een doorgang naar het onderwerp waar je verdergaat.
 *
 * Dezelfde rol als `/spoor/[spoor]` had (15-09): de hele stap staat in de zijkaart van elk
 * onderwerp, dus een tweede overzicht ervan zou een tussenstop tussen twee klikken zijn. De
 * leerroutekaart, de kruimels en de oude `/spoor/taalregels`-links wijzen hierheen.
 *
 * Het eerste onderwerp dat nog niet af is, en zonder pakket onderwerp 1 — het enige dat dan
 * open is. Vanaf daar wijst de zijkaart naar het aanbod.
 */
export default async function GrammarStepPage({ params }: Props) {
  const { locale, level: rawLevel, skill: slug } = await params;
  if (!isLevel(rawLevel)) notFound();
  const level = rawLevel;
  const skill = getSkillAtLevel(level, slug);
  if (!skill) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=${grammarStepPath(level, skill.slug)}`);

  const step = await fetchGrammarStep(level, skill.slug, user.id);
  const next = nextTopic(step);
  if (!next) notFound();

  const owned = ownsModule(user.user_metadata ?? {}, level, skill.slug);
  const target = owned || isFreeTopic(next.n) ? next.n : 1;
  redirect(`/${locale}${topicPath(level, skill.slug, target)}`);
}
