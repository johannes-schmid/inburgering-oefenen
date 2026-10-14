'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { LayoutDashboard, Plus, User } from 'lucide-react';
import PortalSidebar from './PortalSidebar';
import LearnPanel from './LearnPanel';
import CategoryMark from '@/components/horizon/CategoryMark';
import LogoMark from '@/components/site/LogoMark';
import type { PortalMenu } from '@/lib/portal-menu';
import type { LearnPanelData, PortalNav } from './nav';

type Props = {
  locale: string;
  email: string;
  avatarUrl?: string;
  active?: PortalNav;
  /**
   * Which module group the current page belongs to — `a2`, `b1` or `knm`.
   *
   * Separate from `active` because the two say different things: `active` is the row you are
   * on, `activeGroup` is the module it lives in. Without it the sidebar could mark the current
   * onderdeel but not the module containing it, which is the one thing the nesting exists to
   * say — and a level-less `active` would have to guess A2, filing every B1 page under A2.
   */
  activeGroup?: string | null;
  /**
   * The candidate's own cursus, built by `fetchPortalMenu()` on the server.
   *
   * Passed in rather than fetched here because the sidebar is a client component: it can read
   * neither the session nor the database. Every server page that renders this shell awaits it.
   * When it is absent — the two unrouted KNM-shaped leftovers, `/dashboard/analyse` and
   * `/dashboard/fouten`, are client components and cannot — the sidebar falls back to the
   * offer-only shape rather than to a second, flat copy of the nav.
   */
  menu?: PortalMenu | null;
  /**
   * De tweede kolom, en alleen binnen een lesmodule of de conceptenbibliotheek.
   *
   * Weglaten is de regel: de chrome is één zijbalk. Zie `LearnPanelData` in `nav.ts`.
   */
  learn?: LearnPanelData | null;
  isGuest?: boolean;
  children: ReactNode;
};

/**
 * De chrome van het studieportaal, in Glas (glas.html §09b): een glazen zijbalk die op het veld
 * "Licht" zweeft, en op mobiel een glazen kopbalk plus een zwevende tabbalk.
 *
 * Elke portaalpagina wikkelt zichzelf hierin in plaats van dat de layout het doet, omdat de
 * examenspeler dezelfde chrome nodig heeft onder een ander routesegment. De vorm staat in
 * `app/glas-portal.css`; hier staat alleen de opbouw. De id's (`#dash-side`, `#dash-main`,
 * `#dash-panel`, `#dash-bottom-bar`) blijven, want de printregels en de KNM-lespagina lezen ze.
 *
 * **Eén zijbalk, en een tweede kolom alleen waar er een tweede as is** (beslissing eigenaar,
 * 29-08). Zie `PortalSidebar` en `LearnPanel`.
 */
export default function AppShell({
  locale,
  email,
  avatarUrl = '',
  active = 'overview',
  activeGroup = null,
  menu = null,
  learn = null,
  isGuest = false,
  children,
}: Props) {
  const t = useTranslations('portal');
  const tSkills = useTranslations('skills');

  /**
   * The bottom bar's onderdeel tabs: every module the account owns, flattened across levels
   * and capped at four. `menu` is null only on the two unrouted client-component leftovers, and
   * the bar then falls back to Overzicht plus the offer — the same reduced shape as the
   * sidebar, rather than a second, fuller navigation that contradicts it.
   */
  const ownedItems = (menu?.owned ?? []).flatMap(g => g.items).filter(i => i.owned);
  const tabs = ownedItems.slice(0, 4).map(item => ({
    key: `${item.level ?? 'knm'}-${item.slug}`,
    slug: item.slug,
    href: item.href,
    active: active === item.slug && (item.level === null ? activeGroup === 'knm' || !activeGroup : activeGroup === item.level || !activeGroup),
    // A level-less short label would print "Lezen" twice for somebody who owns both levels.
    label: item.level
      ? `${tSkills(`${item.messageKey}.short`)} ${item.level.toUpperCase()}`
      : tSkills(`${item.messageKey}.short`),
  }));
  const showExtend = (menu?.available.length ?? 1) > 0 || ownedItems.length > tabs.length;
  const onOverview = active === 'overview' || active === 'overview-module';

  return (
    <div className="g-portal">
      {/* De totale breedte van de chrome, gelezen door alles wat ernaast moet staan — de vaste
          onderbalk van de KNM-lespagina is de huidige gebruiker. Zijbalk 280 + 12 marge, plus
          het lespaneel (268 + 12) als dat er is. */}
      <style>{`:root { --portal-chrome-w: ${learn ? '572px' : '292px'}; } @media (max-width:768px) { :root { --portal-chrome-w: 0px; } }`}</style>
      <div className="g-portal-bg" aria-hidden />

      <header id="app-mobile-header" className="g-mhead">
        <a href={`/${locale}/dashboard`} className="g-mhead-logo">
          <LogoMark size={30} />
          <span>Inburgering Oefenen</span>
        </a>
        {/* The tab bar is full at five, so the account link lives here on mobile. */}
        <a
          href={`/${locale}/dashboard/profiel`}
          className={`g-mhead-me${active === 'profile' ? ' g-on' : ''}`}
          aria-label={t('nav_profile')}
          aria-current={active === 'profile' ? 'page' : undefined}
        >
          <User size={18} strokeWidth={2.1} aria-hidden />
        </a>
      </header>

      <div id="dash-layout">
        <PortalSidebar
          locale={locale}
          email={email}
          avatarUrl={avatarUrl}
          active={active}
          activeGroup={activeGroup}
          menu={menu}
          isGuest={isGuest}
        />
        {learn && <LearnPanel locale={locale} data={learn} />}
        <main id="dash-main">{children}</main>
      </div>

      {/* The mobile bar carries the same rule as the sidebar: it lists **your cursus**, not the
          catalogue — the owned onderdelen across every module, flattened and capped at four.
          `label` carries the level for a taalonderdeel, which is what stops A2 Lezen and B1
          Lezen being two identical tabs. Anything past the cap is reachable through Overzicht. */}
      <nav id="dash-bottom-bar" aria-label={t('nav_aria')}>
        {/* A module's own overview has no tab of its own; it marks Overzicht instead. */}
        <a
          href={`/${locale}/dashboard`}
          aria-current={active === 'overview' ? 'page' : undefined}
          className={`g-tab${onOverview ? ' g-on' : ''}`}
        >
          <span className="g-tab-ic" aria-hidden><LayoutDashboard strokeWidth={2.1} /></span>
          <span>{t('nav_overview_short')}</span>
        </a>

        {tabs.map(tab => (
          <a
            key={tab.key}
            href={`/${locale}${tab.href}`}
            aria-current={tab.active ? 'page' : undefined}
            className={`g-tab${tab.active ? ' g-on' : ''}`}
          >
            <span className="g-tab-mark" aria-hidden>
              <CategoryMark category={tab.slug} size={36} />
            </span>
            <span>{tab.label}</span>
          </a>
        ))}

        {/* The offer gets a tab only when there is something left to sell. */}
        {showExtend && (
          <a href={`/${locale}/dashboard/pakketten?vanaf=tabbar`} className="g-tab">
            <span className="g-tab-plus" aria-hidden><Plus strokeWidth={2.6} /></span>
            <span>{t('nav_extend_short')}</span>
          </a>
        )}
      </nav>
    </div>
  );
}
