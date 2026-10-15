import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { ownsKnm } from '@/lib/entitlements';
import { FEATURES } from '@/lib/features';
import { fetchPortalMenu } from '@/lib/portal-menu';
import { fetchKnmWordThemes, knmRoute, knmThemeOpen, knmWordThemePath } from '@/lib/lessons/track-routes';
import { WordProgressCard, type WordSideTheme } from '@/components/lessons/WordSideNav';
import CourseRoute from '@/components/lessons/CourseRoute';
import WordDeck from '@/components/lessons/WordDeck';
import CategoryMark from '@/components/horizon/CategoryMark';
import { closeTrail } from '@/lib/portal-crumbs';
import AppShell from '../../../components/AppShell';
import PortalCrumbs from '../../../components/PortalCrumbs';
import '@/app/glas-leerlaag.css';

type Props = { params: Promise<{ locale: string; thema: string }> };

export const metadata: Metadata = {
  title: 'KNM woordkaarten | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

/**
 * Één KNM-woordthema, met dezelfde deck als de woorden van A2 en B1 (eigenaar, 15-10).
 *
 * Het raster met zeven themakaarten is weg: de thema's staan in de cursusroute ernaast, net als
 * blok A van een taalcursus. Thema 1 is gratis met een account; de rest gaat zonder KNM-module
 * naar de pakkettenpagina.
 */
export default async function KnmWoordThemaPage({ params }: Props) {
  const { locale, thema } = await params;
  if (!FEATURES.woordkaarten) notFound();
  const id = Number(thema);
  if (!Number.isInteger(id)) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/dashboard/woordkaarten/${id}`);

  const meta = user.user_metadata ?? {};
  const owns = ownsKnm(meta);
  if (!knmThemeOpen(id, owns)) {
    redirect(`/${locale}/dashboard/pakketten?onderdeel=knm&vanaf=woorden-${id}`);
  }

  const [themes, menu, t] = await Promise.all([
    fetchKnmWordThemes(user.id),
    fetchPortalMenu(),
    getTranslations('portal'),
  ]);
  const current = themes.find(th => th.id === id);
  if (!current || current.words.length === 0) notFound();

  const route = await knmRoute({
    locale, userId: user.id, owns, open: 'woorden', currentTheme: id, wordThemes: themes,
  });

  const back = `/${locale}/dashboard/knm`;
  const openThemes = themes.filter(th => knmThemeOpen(th.id, owns));
  const sideThemes: WordSideTheme[] = openThemes.map(th => ({
    slug: `knm-${th.id}`,
    label: th.name,
    href: knmWordThemePath(locale, th.id),
    known: th.known,
    total: th.words.length,
    now: th.id === id,
  }));

  return (
    <AppShell
      locale={locale}
      email={user.email ?? ''}
      avatarUrl={String(meta.avatar_url ?? meta.picture ?? '')}
      active="woordkaarten"
      activeGroup="knm"
      menu={menu}
      course={
        <CourseRoute
          courseLabel="KNM"
          done={route.done}
          total={route.total}
          blocks={route.blocks}
          backHref={back}
          nextHref={back}
        />
      }
    >
      <div className="g-leer gl-shell">
        <div className="gt-page">
          <div className="gt-grid gt-solo">
            <main className="min-w-0">
              <section className="gl-page">
                <div className="gl-bar">
                  <div className="gl-crumbs">
                    <PortalCrumbs
                      trail={closeTrail(
                        [{ label: 'KNM', href: back }],
                        {
                          label: current.name,
                          siblings: openThemes.map(th => ({
                            label: th.name,
                            href: knmWordThemePath(locale, th.id),
                            current: th.id === id,
                          })),
                        },
                      )}
                    />
                  </div>
                </div>
                <div className="gl-in gl-wordhead">
                  <CategoryMark category="woorden" size={44} />
                  <div>
                    <h1 className="g-head gl-title">{current.name}</h1>
                    <p className="g-mono">{t('words_head')} · {t('words_theme_count', { n: current.words.length })}</p>
                  </div>
                </div>
              </section>

              <div className="wd-stage">
                <WordDeck words={current.words} userId={user.id} backHref={back} store="knm" />
              </div>
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
