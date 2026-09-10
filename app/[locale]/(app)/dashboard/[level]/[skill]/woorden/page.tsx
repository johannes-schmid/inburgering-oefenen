import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ownsModule } from '@/lib/entitlements';
import { getSkillAtLevel, isLevel } from '@/data/skills';
import { themeLabel } from '@/data/lesson-themes';
import { CategoryMark } from '@/components/horizon';
import { fetchWordThemes } from '@/lib/lessons/words-server';
import { themeTotals, wordThemePath, wordsPath } from '@/lib/lessons/words';
import { fetchPortalMenu } from '@/lib/portal-menu';
import { closeTrail, skillTrail } from '@/lib/portal-crumbs';
import { SPOREN, spoorPath } from '@/lib/lessons/sporen';
import PortalCrumbs from '../../../../components/PortalCrumbs';
import AppShell from '../../../../components/AppShell';

type Props = { params: Promise<{ locale: string; level: string; skill: string }> };

export const metadata: Metadata = {
  title: 'Woordkaarten | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

/**
 * De woordkaarten van één onderdeel: een raster van thema's met de voortgang erin.
 *
 * Dit is stap 1 van de leerroute op het onderdeelscherm, en het is de A2/B1-tegenhanger van het
 * KNM-woordkaartenscherm. De vorm is bewust dezelfde als daar — een balk met de totale voortgang
 * boven een raster van themakaarten — omdat een kandidaat die van KNM naar A2 loopt hetzelfde
 * scherm hoort te vinden.
 *
 * **De poort staat op de deck, niet hier.** Hetzelfde als bij `leren`: het overzicht mag een gast
 * en een niet-betalende kandidaat laten zien wát er is, want dat is wat er te koop is. Openen kan
 * pas met de module.
 */
export default async function WoordenPage({ params }: Props) {
  const { locale, level: rawLevel, skill: slug } = await params;
  if (!isLevel(rawLevel)) notFound();
  const level = rawLevel;
  const skill = getSkillAtLevel(level, slug);
  if (!skill) notFound();

  const t = await getTranslations('portal');
  const tSkills = await getTranslations('skills');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/dashboard/${level}/${skill.slug}/woorden`);

  const meta = user.user_metadata ?? {};
  const owned = ownsModule(meta, level, skill.slug);

  const [themes, menu] = await Promise.all([
    fetchWordThemes(level, skill.slug, user.id),
    fetchPortalMenu(),
  ]);
  const totals = themeTotals(themes);

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
        <div className="max-w-5xl mx-auto">
          {/* De woordkaarten zijn stap 1 van de leerroute, dus de zusjes zijn de andere twee
              stappen — hetzelfde menu als op een spoorscherm, van de andere kant bekeken. */}
          <PortalCrumbs
            trail={closeTrail(
              skillTrail({
                locale, level, skill: skill.slug,
                overviewLabel: t('crumb_overview'),
                skillName: slug => tSkills(`${slug}.name`),
              }),
              {
                label: t('words_head'),
                siblings: [
                  {
                    label: t('leerroute_woordenschat_title'),
                    href: `/${locale}${wordsPath(level, skill.slug)}`,
                    current: true,
                  },
                  ...SPOREN.map(sl => ({
                    label: t(sl === 'taalregels'
                      ? 'leerroute_grammatica_title'
                      : 'leerroute_strategie_title'),
                    href: `/${locale}${spoorPath(level, skill.slug, sl)}`,
                  })),
                ],
              },
            )}
          />

          <header className="skill-head">
            <h1>{t('words_head')}</h1>
            <p>{t('words_intro')}</p>
          </header>

          {themes.length === 0 ? (
            <p className="panel">{t('words_empty')}</p>
          ) : (
            <>
              {/* De totaalbalk, zoals op KNM: één regel die zegt hoe ver je bent over alle thema's. */}
              <section className="panel wt-total">
                <span className="wt-total-mark">
                  <CategoryMark category="woorden" size={40} />
                </span>
                <span className="wt-total-body">
                  <span className="wt-total-head">{t('words_total')}</span>
                  <span className="wt-total-bar" aria-hidden>
                    <span style={{ width: `${totals.pct}%` }} />
                  </span>
                  <span className="wt-total-sub">
                    {t('words_total_sub', { known: totals.known, total: totals.total })}
                  </span>
                </span>
                <span className="wt-total-pct">{totals.pct}%</span>
              </section>

              <div className="wt-grid">
                {themes.map((theme, i) => {
                  const href = owned ? `/${locale}${wordThemePath(level, skill.slug, theme.slug)}` : undefined;
                  const Root = href ? 'a' : 'div';
                  return (
                    <Root
                      key={theme.slug}
                      {...(href ? { href } : {})}
                      className={`leer-card wt-card${href ? '' : ' is-locked'}`}
                    >
                      <span className="lc-cap">
                        <span className="lc-chip">{t('words_theme_n', { n: i + 1 })}</span>
                        <span className="lc-mark" aria-hidden="true">
                          <CategoryMark category="woorden" size={112} tone="dark" bare />
                        </span>
                      </span>
                      <span className="lc-body">
                        <span className="lc-copy">
                          <span className="lc-title">{themeLabel(theme.slug)}</span>
                          <span className="lc-blurb">
                            {t('words_theme_count', { n: theme.words.length })}
                          </span>
                        </span>

                        <span className="wt-prog" aria-hidden>
                          <span style={{ width: `${theme.pct}%` }} />
                        </span>

                        <span className="wt-foot">
                          <span className="wt-foot-n">
                            {t('words_known_of', { known: theme.known, total: theme.words.length })}
                          </span>
                          <span className="wt-foot-go">
                            {href ? (
                              <>
                                {theme.touched > 0 ? t('words_continue') : t('words_start')}
                                <ArrowRight size={14} strokeWidth={2.4} className="rtl-flip" />
                              </>
                            ) : (
                              <>
                                <Lock size={13} strokeWidth={2.2} />
                                {t('words_locked')}
                              </>
                            )}
                          </span>
                        </span>
                      </span>
                    </Root>
                  );
                })}
              </div>

              {!owned && (
                <a
                  href={`/${locale}/dashboard/pakketten?onderdeel=${level}:${skill.slug}&vanaf=woorden`}
                  className="wt-upsell"
                >
                  {t('words_upsell', { skill: tSkills(`${skill.key}.name`) })}
                  <ArrowRight size={15} strokeWidth={2.4} className="rtl-flip" />
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
