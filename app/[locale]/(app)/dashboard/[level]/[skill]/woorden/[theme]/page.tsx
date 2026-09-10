import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { ownsModule } from '@/lib/entitlements';
import { getSkillAtLevel, isLevel } from '@/data/skills';
import { themeLabel } from '@/data/lesson-themes';
import { fetchWordTheme } from '@/lib/lessons/words-server';
import { wordsPath } from '@/lib/lessons/words';
import { fetchPortalMenu } from '@/lib/portal-menu';
import AppShell from '../../../../../components/AppShell';
import WordDeck from '../../../../_components/WordDeck';

type Props = { params: Promise<{ locale: string; level: string; skill: string; theme: string }> };

export const metadata: Metadata = {
  title: 'Woordkaarten oefenen | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

/**
 * Één thema oefenen. De pagina is de schil; `WordDeck` is het enige clientstuk in de leerlaag.
 *
 * De poort staat hier en niet op het overzicht — zelfde plek als bij een les die niet gratis is:
 * zonder module gaat het naar de pakkettenpagina met `vanaf` erin, zodat de picker het juiste
 * onderdeel voorselecteert.
 */
export default async function WoordThemaPage({ params }: Props) {
  const { locale, level: rawLevel, skill: slug, theme } = await params;
  if (!isLevel(rawLevel)) notFound();
  const level = rawLevel;
  const skill = getSkillAtLevel(level, slug);
  if (!skill) notFound();

  const t = await getTranslations('portal');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/login?next=/dashboard/${level}/${skill.slug}/woorden/${theme}`);
  }

  const meta = user.user_metadata ?? {};
  if (!ownsModule(meta, level, skill.slug)) {
    redirect(`/${locale}/dashboard/pakketten?onderdeel=${level}:${skill.slug}&vanaf=woorden-${theme}`);
  }

  const [wordTheme, menu] = await Promise.all([
    fetchWordTheme(level, skill.slug, theme, user.id),
    fetchPortalMenu(),
  ]);
  if (!wordTheme || wordTheme.words.length === 0) notFound();

  const back = `/${locale}${wordsPath(level, skill.slug)}`;

  return (
    <AppShell
      locale={locale}
      email={user.email ?? ''}
      avatarUrl={String(meta.avatar_url ?? meta.picture ?? '')}
      active={skill.slug}
      activeGroup={level}
      menu={menu}
      isGuest={false}
    >
      <div className="px-5 py-7 sm:px-8 sm:py-10">
        <div className="max-w-3xl mx-auto">
          <header className="skill-head wd-head">
            <p className="wd-kicker">{t('words_head')}</p>
            <h1>{themeLabel(wordTheme.slug)}</h1>
          </header>

          <WordDeck
            words={wordTheme.words}
            userId={user.id}
            backHref={back}
          />
        </div>
      </div>
    </AppShell>
  );
}
