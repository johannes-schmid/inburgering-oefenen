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
 * The study portal chrome: navy sidebar on desktop, bottom tab bar on mobile.
 *
 * Every portal page wraps itself in this rather than the layout owning it, because the exam
 * player needs the same chrome while living under a different route segment. The styles are
 * here and only here — the KNM version duplicated the same block in `AppShell` and in
 * `dashboard/page.tsx`, and the two had already drifted apart (different `#dash-main`
 * backgrounds, and only one of them styled the tab bar).
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
        /* De totale breedte van de chrome, gelezen door alles wat ernaast moet staan — de
           vaste onderbalk van de KNM-lespagina is de huidige gebruiker. Hij verandert mee met
           het lespaneel, want dat is er niet altijd. */
        :root { --portal-chrome-w: ${learn ? '464px' : '256px'}; }
        body { font-family: var(--font-body); background: #f0f3f8; color: #191c1e; }
        h1,h2,h3,h4 { font-family: var(--font-headline); }

        /* ── Eén navy zijbalk ────────────────────────────────────────────────────────
           Terug naar één kolom op 29-08 (eigenaar, naar de mockup). Twee vaste kolommen
           droegen twee assen op elke pagina terwijl er op de meeste maar één te zeggen valt;
           de modules klappen hier uit en het lespaneel komt er alleen bij binnen een cursus. */
        #dash-side { width:256px; flex-shrink:0; background:linear-gradient(180deg,#001d4e 0%,#002b6d 55%,#003580 100%); display:flex; flex-direction:column; height:100vh; position:sticky; top:0; color:#fff; padding:16px; }
        .side-logo { display:flex; align-items:center; gap:8px; padding:0 6px 14px; color:#fff; text-decoration:none; font-family:var(--font-headline); font-weight:700; font-size:14px; line-height:1.2; letter-spacing:-0.01em; }
        .side-logo:focus-visible { outline:2px solid #fe762c; outline-offset:3px; border-radius:11px; }
        .side-scroll { flex:1; min-height:0; overflow-y:auto; display:flex; flex-direction:column; gap:1px; }
        .side-label { font-size:10px; font-weight:800; letter-spacing:0.14em; text-transform:uppercase; color:rgba(255,255,255,0.45); margin:14px 12px 6px; }

        .side-row { position:relative; display:flex; align-items:center; gap:12px; width:100%; padding:10px 12px; border-radius:12px; font-size:14px; font-weight:500; color:rgba(255,255,255,0.72); text-decoration:none; background:none; border:none; font-family:inherit; text-align:left; cursor:pointer; transition:background .15s ease, color .15s ease; }
        .side-row:hover { background:rgba(255,255,255,0.10); color:#fff; }
        .side-row:focus-visible { outline:2px solid #fe762c; outline-offset:2px; }
        /* De huidige pagina is de ene lichte rij — dezelfde inversie als het logo, zodat "hier
           ben je" en "dit zijn wij" op dezelfde manier getekend zijn. */
        .side-row.on { background:rgba(255,255,255,0.14); color:#fff; font-weight:600; box-shadow:inset 0 0 0 1px rgba(255,255,255,0.10); }
        .side-row.dim { color:rgba(255,255,255,0.42); }
        .side-row.dim:hover { color:rgba(255,255,255,0.78); }
        .side-row.accent { background:rgba(254,118,44,0.20); color:#fe762c; }
        .side-row.accent:hover { background:rgba(254,118,44,0.30); color:#fff; }
        .side-row.sub { padding:6px 12px; border-radius:8px; font-size:0.8rem; font-weight:500; gap:10px; }
        .side-lb { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .side-ic { width:20px; height:20px; border-radius:7px; flex-shrink:0; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.12); }
        /* Een category mark tekent zijn eigen tegel, dus de wikkel mag er geen tweede tekenen. */
        .side-ic.bare { background:none; }
        .side-tag { font-size:9.5px; font-weight:800; letter-spacing:0.09em; text-transform:uppercase; color:rgba(255,255,255,0.42); flex-shrink:0; }
        /* De voortgangsrail: hoe ver door de tien oefenexamens, en niets anders. Eén as in de
           chrome — een gemiddelde erbij zou een cijfer zijn waar je niet vanaf komt. */
        .side-rail { width:34px; height:4px; border-radius:3px; background:rgba(255,255,255,0.18); flex-shrink:0; overflow:hidden; display:block; }
        .side-rail > span { display:block; height:100%; border-radius:3px; background:#fe762c; }

        .side-group { display:flex; flex-direction:column; gap:1px; }
        .side-mod { display:flex; align-items:center; border-radius:12px; color:rgba(255,255,255,0.9); transition:background .15s ease; }
        .side-mod:hover { background:rgba(255,255,255,0.08); }
        /* Drie toestanden, en ze moeten verschillen: 'on' is de modulepagina zelf, 'within' is
           "je zit ergens in deze module". Zonder 'within' bleef er bij een lespagina géén
           module gemarkeerd — het enige wat het nesten te zeggen heeft. */
        .side-mod.within { background:rgba(255,255,255,0.08); }
        .side-mod.on { background:rgba(255,255,255,0.15); box-shadow:inset 0 0 0 1px rgba(255,255,255,0.12); }
        .side-mod-link { flex:1; min-width:0; display:flex; align-items:center; gap:12px; padding:10px 4px 10px 12px; color:inherit; text-decoration:none; font-size:14px; font-weight:600; letter-spacing:0; }
        .side-mod-link:focus-visible { outline:2px solid #fe762c; outline-offset:2px; border-radius:10px; }
        .side-badge { width:22px; height:22px; border-radius:7px; flex-shrink:0; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.16); font-family:var(--font-headline); font-weight:800; font-size:11.5px; letter-spacing:0.01em; }
        .side-badge.mark { background:none; }
        .side-chev { display:flex; align-items:center; justify-content:center; width:28px; height:32px; margin-right:4px; border:none; background:none; color:rgba(255,255,255,0.55); cursor:pointer; border-radius:8px; transition:transform .18s cubic-bezier(0.22,1,0.36,1), color .15s ease; }
        .side-chev:hover { color:#fff; background:rgba(255,255,255,0.10); }
        .side-chev:focus-visible { outline:2px solid #fe762c; outline-offset:2px; }
        .side-group.open .side-chev { transform:rotate(90deg); }
        /* De 1px-rail is de enige lijn in de portaalchrome en is bewust: de geen-lijnenregel
           gaat over niet *secties maken* met randen, en een navy zijbalk heeft geen
           achtergrondtrappen om mee te zeggen "deze horen bij de rij hierboven". */
        .side-sub { display:flex; flex-direction:column; gap:2px; margin:2px 0 4px 26px; padding-left:8px; border-left:1px solid rgba(255,255,255,0.15); }
        .side-mod.soon { color:rgba(255,255,255,0.3); cursor:default; padding-right:10px; }
        .side-mod.soon:hover { background:none; }

        .side-cta { margin-top:10px; display:flex; align-items:center; gap:12px; padding:10px 12px; border-radius:12px; background:rgba(254,118,44,0.18); color:#ffd9c2; font-weight:600; font-size:14px; text-decoration:none; transition:background .15s ease; }
        .side-cta:hover { background:rgba(254,118,44,0.3); color:#fff; }
        .side-cta:focus-visible { outline:2px solid #fe762c; outline-offset:2px; }
        .side-plus { width:20px; height:20px; border-radius:6px; background:#fe762c; color:#fff; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .side-foot { margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.12); display:flex; flex-direction:column; gap:1px; }

        /* ── Het lespaneel: alleen binnen een cursus of de conceptenbibliotheek ────────── */
        #dash-panel { width:208px; flex-shrink:0; height:100vh; position:sticky; top:0; display:flex; flex-direction:column; padding:16px 10px 12px; background:var(--color-surface,#fff); box-shadow:1px 0 0 rgba(0,43,109,0.08); overflow-y:auto; }
        .lp-back { display:flex; align-items:center; gap:6px; padding:0 8px; font-size:11.5px; font-weight:700; color:#6b7683; text-decoration:none; }
        .lp-back:hover { color:#002b6d; }
        .lp-title { font-family:var(--font-headline); font-weight:700; font-size:14px; letter-spacing:-0.02em; color:#191c1e; line-height:1.3; padding:6px 8px 10px; }
        .lp-nav { display:flex; flex-direction:column; gap:10px; }
        .lp-sec { display:flex; flex-direction:column; gap:1px; }
        .lp-sec-head { display:flex; align-items:center; justify-content:space-between; gap:6px; font-size:10px; font-weight:800; letter-spacing:0.11em; text-transform:uppercase; color:#7c8794; margin:4px 9px 3px; }
        .lp-letter { display:inline-flex; align-items:center; justify-content:center; width:15px; height:15px; border-radius:5px; margin-right:5px; background:rgba(0,43,109,0.09); color:#002b6d; font-size:9px; }
        .lp-n { font-variant-numeric:tabular-nums; letter-spacing:0; }
        .lp-row { position:relative; display:flex; align-items:center; gap:9px; padding:6px 12px; border-radius:8px; font-size:0.8rem; font-weight:500; color:#3f4750; text-decoration:none; transition:background .15s ease, color .15s ease; }
        .lp-row:hover { background:rgba(0,43,109,0.05); color:#191c1e; }
        .lp-row:focus-visible { outline:2px solid #fe762c; outline-offset:2px; }
        .lp-row.on { background:rgba(0,43,109,0.08); color:#002b6d; font-weight:700; }
        .lp-row.on::before { content:''; position:absolute; left:2px; top:7px; bottom:7px; width:3px; border-radius:2px; background:#fe762c; }
        .lp-row.dim { color:#8a939e; }
        .lp-gap { width:15px; flex-shrink:0; }
        .lp-mark { width:15px; height:15px; border-radius:5px; flex-shrink:0; display:flex; align-items:center; justify-content:center; background:rgba(0,43,109,0.07); color:#a24000; }
        .lp-lb { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

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
        [dir="rtl"] .side-sub { margin:2px 26px 4px 0; padding:0 8px 0 0; border-left:none; border-right:1px solid rgba(255,255,255,0.14); }
        [dir="rtl"] .side-group.open .side-chev { transform:rotate(90deg) scaleX(-1); }
        [dir="rtl"] .lp-row.on::before { left:auto; right:2px; }
        @media (max-width:768px) {
          :root { --portal-chrome-w: 0px; }
          #dash-side, #dash-panel { display:none !important; }
          #dash-main { height:auto; overflow-y:visible; padding-bottom:78px; }
          #app-mobile-header { display:flex !important; }
          #dash-bottom-bar { display:flex !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .side-row, .side-mod, .side-chev, .side-cta, .lp-row, .tab-item { transition:none; }
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
        {/* A module's own overview has no tab of its own — there is no sidebar on a phone and
            the bar is full at five. It marks Overzicht instead, which is the page it is reached
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
