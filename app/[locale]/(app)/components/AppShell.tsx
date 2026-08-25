'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { LayoutDashboard, User } from 'lucide-react';
import PlatformSidebar from './PlatformSidebar';
import SkillIcon from '@/components/site/SkillIcon';
import LogoMark from '@/components/site/LogoMark';
import { SKILLS } from '@/data/skills';
import type { PortalNav } from './nav';

type Props = {
  locale: string;
  email: string;
  avatarUrl?: string;
  active?: PortalNav;
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
  isGuest = false,
  children,
}: Props) {
  const t = useTranslations('portal');
  const tSkills = useTranslations('skills');

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        body { font-family: var(--font-body); background: #f0f3f8; color: #191c1e; }
        h1,h2,h3,h4 { font-family: var(--font-headline); }
        #dash-sidebar { width:248px; flex-shrink:0; background:linear-gradient(180deg,#001d4e 0%,#002b6d 45%,#003580 100%); display:flex; flex-direction:column; height:100vh; position:sticky; top:0; box-shadow:4px 0 24px rgba(0,27,78,0.18); }
        #dash-main { flex:1; min-width:0; overflow-y:auto; height:100vh; background:#f0f3f8; }
        .nav-item { display:flex; align-items:center; gap:10px; padding:10px 14px; border-radius:10px; font-size:14px; font-weight:500; color:rgba(255,255,255,0.65); cursor:pointer; background:none; border:none; width:100%; text-align:left; font-family:inherit; text-decoration:none; transition:background .15s ease, color .15s ease; }
        .nav-item:hover { background:rgba(255,255,255,0.1); color:rgba(255,255,255,0.9); }
        .nav-item:focus-visible { outline:2px solid #fe762c; outline-offset:2px; }
        .nav-item:active { background:rgba(255,255,255,0.18); }
        .nav-item.active { background:rgba(255,255,255,0.15); color:#fff; font-weight:600; box-shadow:inset 0 0 0 1px rgba(255,255,255,0.12); }
        .nav-heading { margin:14px 14px 6px; font-size:10.5px; font-weight:800; letter-spacing:0.13em; text-transform:uppercase; color:rgba(255,255,255,0.38); }

        /* The nested rail under KNM. The 1px left border is the *only* place the portal chrome
           uses a line, and it is deliberate: this is a hierarchy cue, not a section boundary,
           and the no-line rule (§2) is about not sectioning with borders. A background tier
           shift cannot say "these two belong to the row above" on a navy sidebar that has no
           tiers to shift between. The admin sidebar's level sub-menu already draws it this way,
           so the two navigations stay one system. */
        .nav-sub { list-style:none; margin:2px 0 4px; padding:0 0 0 8px; margin-left:23px; border-left:1px solid rgba(255,255,255,0.15); display:flex; flex-direction:column; gap:2px; }
        .nav-subitem { padding:8px 12px; font-size:13px; }

        /* A row that is a link *and* a disclosure toggle. The highlight lives on the wrapper so
           both halves light up together — put it on the anchor and the chevron sits outside a
           highlighted pill, which reads as two separate rows. */
        .nav-row { display:flex; align-items:center; border-radius:10px; transition:background .15s ease; }
        .nav-row-link { flex:1; min-width:0; background:none; }
        .nav-row-link:hover, .nav-row-link.active { background:none; }
        .nav-row:hover { background:rgba(255,255,255,0.1); }
        .nav-row:hover .nav-row-link { color:rgba(255,255,255,0.9); }
        .nav-row.active { background:rgba(255,255,255,0.15); box-shadow:inset 0 0 0 1px rgba(255,255,255,0.12); }
        .nav-row.active .nav-row-link { color:#fff; font-weight:600; }
        /* "You are inside this onderdeel", not "this is the page you are on" — half the tint of
           .active and no inset ring, so the current child stays the strongest row. */
        .nav-row.within { background:rgba(255,255,255,0.07); }
        .nav-row.within .nav-row-link { color:rgba(255,255,255,0.85); font-weight:600; }

        /* 32px is the smallest square that still clears the 24px minimum touch target once the
           row's own padding is counted, without making the chevron look like a second button. */
        .nav-row-toggle { display:flex; align-items:center; justify-content:center; flex-shrink:0; width:32px; height:32px; margin-right:6px; border:none; background:none; border-radius:8px; color:rgba(255,255,255,0.5); cursor:pointer; padding:0; transition:background .15s ease, color .15s ease; }
        .nav-row-toggle:hover { background:rgba(255,255,255,0.12); color:#fff; }
        .nav-row-toggle:focus-visible { outline:2px solid #fe762c; outline-offset:2px; }
        .nav-row-toggle svg { transition:transform .18s cubic-bezier(0.22,1,0.36,1); }

        /* base-ui measures the panel and exposes its height as a custom property. A height of
           auto cannot be animated, and a hardcoded pixel value breaks the moment the list grows.
           (No backticks in this block: the whole stylesheet is a template literal.) */
        .nav-collapsible { overflow:hidden; transition:height .2s cubic-bezier(0.22,1,0.36,1); }
        .nav-collapsible[data-starting-style], .nav-collapsible[data-ending-style] { height:0; }
        .nav-collapsible[data-open] { height:var(--collapsible-panel-height); }
        /* Indented rows sit closer to the rail than to the icons above them, so the icon is a
           notch smaller too — matching the parent's 18px here made the child look like a peer. */
        .nav-subitem svg { flex-shrink:0; }
        #app-mobile-header { display:none; }
        #dash-bottom-bar { display:none; position:fixed; bottom:0; left:0; right:0; z-index:100; background:linear-gradient(180deg,#002266 0%,#001d4e 100%); border-top:1px solid rgba(255,255,255,0.08); box-shadow:0 -4px 20px rgba(0,27,78,0.3); padding-bottom:env(safe-area-inset-bottom); }
        .tab-item { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; padding:10px 2px 8px; background:none; border:none; cursor:pointer; color:rgba(255,255,255,0.45); font-size:10.5px; font-weight:700; font-family:inherit; text-decoration:none; transition:color .15s ease; }
        .tab-item.active { color:#fe762c; }
        .tab-item.active svg { color:#fe762c !important; }
        .tab-item:focus-visible { outline:2px solid #fe762c; outline-offset:-2px; }
        @media (max-width:768px) {
          #dash-sidebar { display:none !important; }
          #dash-main { height:auto; overflow-y:visible; padding-bottom:78px; }
          #app-mobile-header { display:flex !important; }
          #dash-bottom-bar { display:flex !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .nav-item, .tab-item, .nav-row, .nav-row-toggle, .nav-row-toggle svg, .nav-collapsible { transition:none; }
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
        <PlatformSidebar
          locale={locale}
          email={email}
          avatarUrl={avatarUrl}
          active={active}
          isGuest={isGuest}
        />
        <main id="dash-main">{children}</main>
      </div>

      <nav id="dash-bottom-bar" aria-label={t('nav_aria')}>
        <a href={`/${locale}/dashboard`} className={`tab-item${active === 'overview' ? ' active' : ''}`}>
          <LayoutDashboard size={21} strokeWidth={active === 'overview' ? 2.5 : 1.8} />
          <span>{t('nav_overview_short')}</span>
        </a>
        {SKILLS.map(skill => (
          <a
            key={skill.slug}
            href={`/${locale}/dashboard/${skill.slug}`}
            className={`tab-item${active === skill.slug ? ' active' : ''}`}
          >
            <SkillIcon skill={skill.slug} size="sm" variant="bare" onDark />
            <span>{tSkills(`${skill.key}.short`)}</span>
          </a>
        ))}
        {/* Six tabs at 390px is 65px each, which is tight but legible — the labels are all
            short ("Lezen", "KNM") and the icons carry the meaning. Adding a seventh would
            need this bar rethought, not squeezed. */}
        <a
          href={`/${locale}/dashboard/knm`}
          className={`tab-item${active === 'knm' ? ' active' : ''}`}
        >
          <SkillIcon skill="knm" size="sm" variant="bare" onDark />
          <span>{tSkills('knm.short')}</span>
        </a>
      </nav>
    </>
  );
}
