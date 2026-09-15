import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { ownsModule } from '@/lib/entitlements';
import { getSkillAtLevel, isLevel } from '@/data/skills';
import { themeLabel } from '@/data/lesson-themes';
import { fetchWordThemes } from '@/lib/lessons/words-server';
import { wordThemePath } from '@/lib/lessons/words';
import { fetchPortalMenu } from '@/lib/portal-menu';
import AppShell from '../../../../../components/AppShell';
import WordDeck from '../../../../_components/WordDeck';
import { wordsPanel } from '../../../../../components/nav';
import { closeTrail, skillTrail } from '@/lib/portal-crumbs';
import PortalCrumbs from '../../../../../components/PortalCrumbs';

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
  const tSkills = await getTranslations('skills');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/login?next=/dashboard/${level}/${skill.slug}/woorden/${theme}`);
  }

  const meta = user.user_metadata ?? {};
  if (!ownsModule(meta, level, skill.slug)) {
    redirect(`/${locale}/dashboard/pakketten?onderdeel=${level}:${skill.slug}&vanaf=woorden-${theme}`);
  }

  const [themes, menu] = await Promise.all([
    fetchWordThemes(level, skill.slug, user.id),
    fetchPortalMenu(),
  ]);
  const wordTheme = themes.find(th => th.slug === theme);
  if (!wordTheme || wordTheme.words.length === 0) notFound();

  /**
   * De tweede kolom: álle thema's van dit onderdeel.
   *
   * Hiermee verviel het themaraster (eigenaar, 15-09) — zie `wordsPanel`. Alle thema's worden
   * hier in één keer gelezen in plaats van alleen dit ene; dat is dezelfde query die het raster
   * deed, alleen staat hij nu naast de deck in plaats van ervoor.
   */
  const panel = wordsPanel(themes.filter(th => th.words.length > 0), {
    title: t('leerroute_woordenschat_title'),
    backHref: `/dashboard/${level}/${skill.slug}`,
    backLabel: tSkills(`${skill.key}.name`),
    sectionLabel: t('words_head'),
    themeHref: slug => wordThemePath(level, skill.slug, slug),
    themeLabel,
    currentTheme: wordTheme.slug,
  });

  /* Terug is het onderdeelscherm: het themaoverzicht bestaat niet meer, de kolom ernaast is
     wat het zei. */
  const back = `/${locale}/dashboard/${level}/${skill.slug}`;

  return (
    <AppShell
      locale={locale}
      email={user.email ?? ''}
      avatarUrl={String(meta.avatar_url ?? meta.picture ?? '')}
      active={skill.slug}
      activeGroup={level}
      menu={menu}
      learn={panel}
      isGuest={false}
    >
      <div className="px-5 py-7 sm:px-8 sm:py-10">
        <div className="max-w-3xl mx-auto">
          {/* Het kruimelpad draagt de andere thema's als zusjes. Op desktop staan ze in de
              kolom ernaast, maar die is er op een telefoon niet — en sinds het themaraster een
              doorgang is (15-09) was dit anders de enige deck waar je nog uit kon. */}
          <PortalCrumbs
            trail={closeTrail(
              skillTrail({
                locale, level, skill: skill.slug,
                overviewLabel: t('crumb_overview'),
                skillName: slug => tSkills(`${slug}.name`),
              }),
              {
                label: themeLabel(wordTheme.slug),
                siblings: themes
                  .filter(th => th.words.length > 0)
                  .map(th => ({
                    label: themeLabel(th.slug),
                    href: `/${locale}${wordThemePath(level, skill.slug, th.slug)}`,
                    current: th.slug === wordTheme.slug,
                  })),
              },
            )}
          />

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
