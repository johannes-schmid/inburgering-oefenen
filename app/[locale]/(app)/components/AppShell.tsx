'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { LayoutDashboard, Plus, User } from 'lucide-react';
import ModuleRail from './ModuleRail';
import ModulePanel from './ModulePanel';
import CategoryMark from '@/components/horizon/CategoryMark';
import LogoMark from '@/components/site/LogoMark';
import type { PortalMenu } from '@/lib/portal-menu';
import type { PortalNav } from './nav';

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
  isGuest?: boolean;
  children: ReactNode;
};

/**
 * The study portal chrome: navy sidebar on desktop, bottom tab bar on mobile.
 *
 * Every portal page wraps itself in this rather than the layout owning it, because the exam
 * player needs the same chrome while living under a different route segment. The styles are
 * here and only here — the KNM version duplicated the same block in `AppShell` and in
 * `dashboard/page.tsx`, and the two had already drifted apart (different `#dash-main`
 * backgrounds, and only one of them styled the tab bar).
 */
export default function AppShell({
  locale,
  email,
  avatarUrl = '',
  active = 'overview',
  activeGroup = null,
  menu = null,
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
    active: active === item.slug,
    // A level-less short label would print "Lezen" twice for somebody who owns both levels.
    label: item.level
      ? `${tSkills(`${item.messageKey}.short`)} ${item.level.toUpperCase()}`
      : tSkills(`${item.messageKey}.short`),
  }));
  const showExtend = (menu?.available.length ?? 1) > 0 || ownedItems.length > tabs.length;

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        /* The chrome's total width, read by anything that has to sit beside it — the lesson
           page's fixed bottom bar is the current caller. Rail + panel, in one place, so the two
           cannot drift the way the old hard-coded 248px did. */
        :root { --portal-chrome-w: 280px; }
        body { font-family: var(--font-body); background: #f0f3f8; color: #191c1e; }
        h1,h2,h3,h4 { font-family: var(--font-headline); }
        /* ── The chrome is two columns as of 2026-08-27 ─────────────────────────────
           A narrow navy **rail** (which module) and a light **panel** (where in it). The
           previous single sidebar carried both axes and needed collapsible groups to do it;
           split, the panel never shows two modules and nothing folds away. The panel is light
           on purpose (owner's variant A): with the rail carrying the brand, a second navy
           column made the two axes read as one block. */
        #dash-rail { width:84px; flex-shrink:0; background:linear-gradient(180deg,#001d4e 0%,#002b6d 55%,#003580 100%); display:flex; flex-direction:column; align-items:center; gap:4px; padding:14px 0 12px; height:100vh; position:sticky; top:0; color:#fff; }
        .rail-logo { display:flex; margin-bottom:8px; border-radius:11px; }
        .rail-logo:focus-visible { outline:2px solid #fe762c; outline-offset:3px; }
        .rail-sep { width:34px; height:1px; background:rgba(255,255,255,0.14); margin:5px 0 4px; }

        /* A rail tile is an icon over its name. It is **70px wide, not 48**, because the tag has
           to fit inside the tile: at 48 the Dutch "OVERZICHT" ran past both edges and rendered
           clipped, which reads as a broken tile rather than as a long word. The tag wraps rather
           than truncating, so a longer translation grows the tile instead of losing letters. */
        .rail-item { position:relative; width:70px; min-height:48px; padding:6px 4px 5px; border-radius:12px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; color:rgba(255,255,255,0.62); text-decoration:none; transition:background .15s ease, color .15s ease; }
        .rail-item:hover { background:rgba(255,255,255,0.10); color:#fff; }
        .rail-item:focus-visible { outline:2px solid #fe762c; outline-offset:2px; }
        .rail-badge { font-family:var(--font-headline); font-weight:800; font-size:13px; line-height:1; letter-spacing:0.01em; }
        .rail-tag { font-size:8px; font-weight:800; letter-spacing:0.03em; text-transform:uppercase; opacity:0.8; line-height:1.2; text-align:center; max-width:100%; overflow-wrap:anywhere; }
        .rail-rule { width:16px; height:2.5px; border-radius:2px; background:transparent; }
        /* The current module is the one white tile in the rail — the same inversion the logo
           uses, so "this is where you are" and "this is us" are drawn the same way. */
        .rail-item.on { background:#fff; color:#002b6d; box-shadow:0 5px 14px rgba(0,20,60,0.34); }
        .rail-item.on .rail-rule { background:#fe762c; }
        .rail-item.on .rail-tag { opacity:0.85; }
        /* Not bought: on the rail, findable and visibly not yours. */
        .rail-item.dim { color:rgba(255,255,255,0.38); }
        .rail-item.dim:hover { color:rgba(255,255,255,0.75); }
        /* Announced and not built. Not a link, and dimmer than "not bought" — the rail must not
           promise a page that does not exist. */
        .rail-item.soon { color:rgba(255,255,255,0.26); cursor:default; }
        .rail-item.soon:hover { background:none; color:rgba(255,255,255,0.26); }
        .rail-item.accent { background:rgba(254,118,44,0.20); color:#fe762c; }
        .rail-item.accent:hover { background:rgba(254,118,44,0.30); color:#fff; }
        .rail-item button, button.rail-item { border:none; cursor:pointer; font-family:inherit; }
        .rail-foot { margin-top:auto; display:flex; flex-direction:column; align-items:center; gap:4px; padding-top:8px; }

        #dash-panel { width:196px; flex-shrink:0; height:100vh; position:sticky; top:0; display:flex; flex-direction:column; padding:16px 10px 10px; background:var(--color-surface,#fff); box-shadow:1px 0 0 rgba(0,43,109,0.08); }
        .panel-head { padding:0 8px 12px; }
        .panel-title { font-family:var(--font-headline); font-weight:800; font-size:14.5px; letter-spacing:-0.02em; color:#191c1e; line-height:1.25; }
        .panel-sub { font-size:11px; color:#6b7683; margin-top:2px; line-height:1.4; }
        .panel-nav { display:flex; flex-direction:column; gap:1px; overflow-y:auto; }
        .panel-head-label { font-size:9.5px; font-weight:800; letter-spacing:0.13em; text-transform:uppercase; color:#7c8794; margin:12px 10px 4px; }
        /* Rows carry a real ink colour, not a tint of the background. They were #5b6570 at 100%
           and the unowned ones a 50% alpha of it, which on a near-white panel is roughly 2.4:1 —
           legible on a big screen at full brightness and nowhere else. */
        .panel-row { position:relative; display:flex; align-items:center; gap:9px; padding:7px 9px 7px 11px; border-radius:9px; font-size:13px; font-weight:500; color:#3f4750; text-decoration:none; transition:background .15s ease, color .15s ease; }
        .panel-row:hover { background:rgba(0,43,109,0.05); color:#191c1e; }
        .panel-row:focus-visible { outline:2px solid #fe762c; outline-offset:2px; }
        /* The current page is a **marked** row, not a filled navy slab. A solid block the width
           of the panel put a second dark mass beside the rail and read as a banner rather than
           as "you are here"; the tint plus the orange leading rule says the same thing at a
           fraction of the weight, and leaves the rail as the only dark surface. */
        .panel-row.on { background:rgba(0,43,109,0.08); color:#002b6d; font-weight:700; }
        .panel-row.on:hover { background:rgba(0,43,109,0.11); color:#002b6d; }
        .panel-row.on::before { content:''; position:absolute; left:3px; top:8px; bottom:8px; width:3px; border-radius:2px; background:#fe762c; }
        .panel-row.dim { color:#8a939e; }
        .panel-row.dim:hover { color:#3f4750; }
        .panel-lb { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .panel-n { font-size:11px; font-variant-numeric:tabular-nums; color:#6b7683; flex-shrink:0; }
        .panel-row.on .panel-n { color:#002b6d; }
        .panel-mk { width:20px; height:20px; border-radius:6px; flex-shrink:0; display:flex; align-items:center; justify-content:center; background:rgba(0,43,109,0.08); }
        .panel-row.on .panel-mk { background:rgba(0,43,109,0.14); }
        /* A category mark draws its own tile, so the wrapper must not draw a second one. */
        .panel-mk.bare { background:none; }
        .panel-row.on .panel-mk.bare { background:none; }
        .panel-cta { margin-top:auto; display:flex; align-items:center; gap:9px; padding:9px 10px; border-radius:9px; background:rgba(254,118,44,0.12); color:#a24000; font-weight:700; font-size:12.5px; text-decoration:none; transition:background .15s ease; }
        .panel-cta:hover { background:rgba(254,118,44,0.2); }
        .panel-cta:focus-visible { outline:2px solid #fe762c; outline-offset:2px; }
        .panel-plus { width:24px; height:24px; border-radius:7px; background:#fe762c; color:#fff; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

        #dash-main { flex:1; min-width:0; overflow-y:auto; height:100vh; background:#f0f3f8; }
        #app-mobile-header { display:none; }
        #dash-bottom-bar { display:none; position:fixed; bottom:0; left:0; right:0; z-index:100; background:linear-gradient(180deg,#002266 0%,#001d4e 100%); border-top:1px solid rgba(255,255,255,0.08); box-shadow:0 -4px 20px rgba(0,27,78,0.3); padding-bottom:env(safe-area-inset-bottom); }
        .tab-item { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; padding:10px 2px 8px; background:none; border:none; cursor:pointer; color:rgba(255,255,255,0.45); font-size:10.5px; font-weight:700; font-family:inherit; text-decoration:none; transition:color .15s ease; }
        .tab-item.active { color:#fe762c; }
        .tab-item.active svg { color:#fe762c !important; }
        /* The category marks draw their own tile and cannot be recoloured, so the current tab
           is carried by the label and by an orange rule along the bar's own edge — which is
           also the clearer signal at 65px wide. */
        .tab-item { position:relative; }
        .tab-item.active::before { content:''; position:absolute; top:0; left:14px; right:14px; height:2.5px; border-radius:0 0 2px 2px; background:#fe762c; }
        .tab-plus { width:21px; height:21px; border-radius:7px; background:#fe762c; color:#fff; display:flex; align-items:center; justify-content:center; }
        .tab-item:focus-visible { outline:2px solid #fe762c; outline-offset:-2px; }
        @media (max-width:768px) {
          :root { --portal-chrome-w: 0px; }
          #dash-rail, #dash-panel { display:none !important; }
          #dash-main { height:auto; overflow-y:visible; padding-bottom:78px; }
          #app-mobile-header { display:flex !important; }
          #dash-bottom-bar { display:flex !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .rail-item, .panel-row, .panel-cta, .tab-item { transition:none; }
        }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#c4c6d2; border-radius:3px; }
      `}</style>

      <header
        id="app-mobile-header"
        className="sticky top-0 z-50 items-center justify-between gap-3 px-4 py-3"
        style={{ background: 'linear-gradient(135deg,#001d4e,#002b6d)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <a href={`/${locale}/dashboard`} className="flex items-center gap-2 no-underline">
          <LogoMark size={28} surface="dark" />
          <span className="text-base font-extrabold tracking-tight font-headline" style={{ color: '#fff' }}>
            Inburgering Oefenen
          </span>
        </a>
        {/* The tab bar is full at five, so the account link lives here on mobile. */}
        <a
          href={`/${locale}/dashboard/profiel`}
          className="flex items-center justify-center no-underline"
          aria-label={t('nav_profile')}
          style={{
            width: 34,
            height: 34,
            borderRadius: 11,
            background: active === 'profile' ? 'rgba(254,118,44,0.22)' : 'rgba(255,255,255,0.12)',
            color: active === 'profile' ? '#fe762c' : '#fff',
          }}
        >
          <User size={18} strokeWidth={2.1} />
        </a>
      </header>

      <div id="dash-layout" className="flex">
        <ModuleRail
          locale={locale}
          email={email}
          avatarUrl={avatarUrl}
          active={active}
          activeGroup={activeGroup}
          menu={menu}
          isGuest={isGuest}
        />
        <ModulePanel locale={locale} active={active} activeGroup={activeGroup} menu={menu} />
        <main id="dash-main">{children}</main>
      </div>

      {/* The mobile bar carries the same rule as the sidebar: it lists **your cursus**, not the
          catalogue. It used to be Overzicht plus the four taalonderdelen plus KNM regardless of
          what the account had bought — so on a phone the two navigations disagreed about what
          the product even contains, and five of the six tabs led to a locked page.

          The onderdelen shown are the *owned* ones across every module, flattened: a phone has
          no room for a module level and a candidate who owns A2 Lezen and KNM wants both in the
          bar, not a level picker on the way to each. `label` therefore carries the level for a
          taalonderdeel, which is what stops A2 Lezen and B1 Lezen being two identical tabs.

          Four is the cap. Six tabs at 390px is 65px each, which is tight but legible; adding a
          seventh needs this bar rethought, not squeezed. Anything past the cap is reachable
          through Overzicht, which is always the first tab. */}
      <nav id="dash-bottom-bar" aria-label={t('nav_aria')}>
        {/* A module's own overview has no tab of its own — there is no rail on a phone and the
            bar is full at five. It marks Overzicht instead, which is the page it is reached
            from and the nearest thing to an ancestor the bar can name. */}
        <a
          href={`/${locale}/dashboard`}
          className={`tab-item${active === 'overview' || active === 'overview-module' ? ' active' : ''}`}
        >
          <LayoutDashboard size={21} strokeWidth={active === 'overview' ? 2.5 : 1.8} />
          <span>{t('nav_overview_short')}</span>
        </a>

        {tabs.map(tab => (
          <a
            key={tab.key}
            href={`/${locale}${tab.href}`}
            aria-current={tab.active ? 'page' : undefined}
            className={`tab-item${tab.active ? ' active' : ''}`}
          >
            <CategoryMark category={tab.slug} size={21} tone="dark" />
            <span>{tab.label}</span>
          </a>
        ))}

        {/* The offer gets a tab only when there is something left to sell. For an account that
            owns everything this would be a permanent dead end in the primary navigation. */}
        {showExtend && (
          <a href={`/${locale}/dashboard/pakketten?vanaf=tabbar`} className="tab-item">
            <span className="tab-plus" aria-hidden><Plus size={15} strokeWidth={3} /></span>
            <span>{t('nav_extend_short')}</span>
          </a>
        )}
      </nav>
    </>
  );
}
