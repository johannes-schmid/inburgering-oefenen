import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { ownsModule } from '@/lib/entitlements';
import { getSkillAtLevel, isLevel, levelLabel, LEVELS, SKILLS } from '@/data/skills';
import { themeLabel } from '@/data/lesson-themes';
import { fetchWordThemes } from '@/lib/lessons/words-server';
import { wordThemePath, wordsPath } from '@/lib/lessons/words';
import { fetchPortalMenu } from '@/lib/portal-menu';
import WordSideNav, { WordProgressCard, type WordSideTheme } from '@/components/lessons/WordSideNav';
import AppShell from '../../../../../components/AppShell';
import WordDeck from '../../../../_components/WordDeck';
import { closeTrail } from '@/lib/portal-crumbs';
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
  const tGrammar = await getTranslations('grammar');
  const shown = themes.filter(th => th.words.length > 0);
  const skillName = tSkills(`${skill.key}.name`);

  /**
   * De tweede kolom gaat over de woorden zelf (eigenaar, 11-10): hoeveel je er in dit onderdeel
   * kent en per thema hoe ver je bent. De cursusblokken staan op de les- en regelpagina's; hier
   * zouden ze lessen tellen naast een deck die woorden telt.
   */
  const sideThemes: WordSideTheme[] = shown.map(th => ({
    slug: th.slug,
    label: themeLabel(th.slug),
    href: `/${locale}${wordThemePath(level, skill.slug, th.slug)}`,
    known: th.known,
    total: th.words.length,
    now: th.slug === wordTheme.slug,
  }));

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
      isGuest={false}
    >
      <div className="px-5 py-6 sm:px-8 sm:py-8">
        <div className="gt-page">
          <div className="gt-grid">
          <aside className="gt-side-nav">
            <WordSideNav
              levels={LEVELS.map(l => ({
                key: l,
                label: t('level_section', { level: levelLabel(l) }),
                href: `/${locale}${wordsPath(l, skill.slug)}`,
                on: l === level,
              }))}
              skills={SKILLS.map(s => ({
                key: s.slug,
                label: tSkills(`${s.key}.short`),
                href: `/${locale}${wordsPath(level, s.slug)}`,
                on: s.slug === skill.slug,
              }))}
              themes={sideThemes}
              courseHref={back}
              labels={{ levelsAria: tGrammar('levels_aria'), skillsAria: tGrammar('skills_aria') }}
            />
          </aside>

          <main className="min-w-0">
            <section className="gh is-solo">
              <div className="gh-copy">
                {/* Het kruimelpad draagt de andere thema's als zusjes: op een telefoon is de
                    kolom ernaast er niet, en dan is dit de enige weg naar een ander thema. */}
                <div className="gh-crumbs">
                  <PortalCrumbs
                    trail={closeTrail(
                      [
                        { label: `${levelLabel(level)} ${skillName}`, href: back },
                      ],
                      {
                        label: themeLabel(wordTheme.slug),
                        siblings: shown.map(th => ({
                          label: themeLabel(th.slug),
                          href: `/${locale}${wordThemePath(level, skill.slug, th.slug)}`,
                          current: th.slug === wordTheme.slug,
                        })),
                      },
                    )}
                  />
                </div>
                <p className="gh-kick">{t('words_head')}</p>
                <h1 className="gh-title">{themeLabel(wordTheme.slug)}</h1>
                <p className="gh-learn">
                  {t('words_theme_count', { n: wordTheme.words.length })}
                </p>
              </div>
            </section>

            <div className="wd-stage">
              <WordDeck
                words={wordTheme.words}
                userId={user.id}
                backHref={back}
              />
            </div>
            {/* Op een telefoon staat de kolom er niet: de voortgang komt ná de kaarten, want die
                zijn waarvoor je hier bent. */}
            <div className="gt-mobile-course wd-mobile-prog">
              <WordProgressCard themes={sideThemes} />
            </div>
          </main>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
