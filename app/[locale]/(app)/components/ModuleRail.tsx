'use client';

import { useTranslations } from 'next-intl';
import { LayoutDashboard, LogOut, Mail, UserPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import LogoMark from '@/components/site/LogoMark';
import CategoryMark from '@/components/horizon/CategoryMark';
import type { PortalMenu, PortalMenuGroup } from '@/lib/portal-menu';
import type { PortalNav } from './nav';

/**
 * The module rail: **which module am I in.**
 *
 * The portal's navigation is two columns as of 2026-08-27 (owner's decision, from the
 * "Studieportaal Navigatie" rough draft). This narrow navy strip carries the modules — the
 * levels, KNM, and ONA once it exists — and the light panel beside it carries what is *inside*
 * the selected one. The previous single sidebar had to hold both axes at once, which is why it
 * needed collapsible groups; with the axes split, the second column never shows two modules and
 * nothing has to fold away.
 *
 * Switching module is one click here and it lands on that module's **overview** — where you
 * stand and what is next — rather than on one of its onderdelen. A rail tile that jumped
 * straight to Lezen would make Lezen mean "A2" in the one place that must not be ambiguous.
 */

interface Props {
  locale: string;
  email: string;
  avatarUrl?: string;
  active: PortalNav;
  activeGroup: string | null;
  menu: PortalMenu | null;
  isGuest?: boolean;
}

export default function ModuleRail({
  locale, email, avatarUrl = '', active, activeGroup, menu, isGuest = false,
}: Props) {
  const t = useTranslations('portal');
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  // Owned first, then the rest — the same order the panel and the tab bar use, so a module does
  // not move between navigations.
  const groups: PortalMenuGroup[] = [...(menu?.owned ?? []), ...(menu?.available ?? [])];
  const onOverview = active === 'overview' || active === 'profile';

  return (
    <aside id="dash-rail" aria-label={t('nav_modules')}>
      <a href={`/${locale}/dashboard`} className="rail-logo" aria-label="Inburgering Oefenen">
        <LogoMark size={38} surface="light" />
      </a>

      {/* Overzicht is a rail tile rather than a row in the panel, because it belongs to no
          module: without it, standing on the portal overview would leave every tile unmarked
          and the panel showing a module you are not in. */}
      <a
        href={`/${locale}/dashboard`}
        aria-current={active === 'overview' ? 'page' : undefined}
        className={`rail-item${active === 'overview' ? ' on' : ''}`}
      >
        <LayoutDashboard size={19} strokeWidth={active === 'overview' ? 2.4 : 1.9} />
        <span className="rail-tag">{t('nav_overview_short')}</span>
        <span className="rail-rule" />
      </a>

      <span className="rail-sep" aria-hidden />

      {groups.map(group => {
        const on = !onOverview && activeGroup === group.id;
        return (
          <a
            key={group.id}
            href={`/${locale}${group.href}`}
            aria-current={on ? 'page' : undefined}
            className={`rail-item${on ? ' on' : ''}${group.owned ? '' : ' dim'}`}
          >
            {/* A level is its own two characters — no mark is more recognisable than "A2".
                KNM has an official category mark and uses it. */}
            {group.badge
              ? <span className="rail-badge">{group.badge}</span>
              : <CategoryMark category="knm" size={22} tone={on ? 'light' : 'dark'} />}
            {!group.badge && <span className="rail-tag">{group.label}</span>}
            <span className="rail-rule" />
          </a>
        );
      })}

      {/* ONA is announced and nothing is built. It is drawn here so the rail states the whole
          traject the brand claims — and it is deliberately not a link and visibly dimmer, so
          the rail cannot promise a page that does not exist. When it ships it becomes a group
          in `lib/portal-menu.ts` like any other and this block goes away. */}
      <span className="rail-item soon" aria-disabled="true">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
        {/* Not translated: ONA is a proper noun, DUO's own abbreviation. */}
        <span className="rail-tag">ONA</span>
      </span>

      <div className="rail-foot">
        <a
          href={`/${locale}/contact?from=dashboard`}
          className="rail-item"
          aria-label={t('nav_contact')}
        >
          <Mail size={18} strokeWidth={1.9} aria-hidden />
        </a>

        {isGuest ? (
          <>
            <a
              href={`/${locale}/register`}
              className="rail-item accent"
              aria-label={t('guest_create_account')}
            >
              <UserPlus size={18} strokeWidth={2} aria-hidden />
            </a>
            <a href={`/${locale}/login`} className="rail-item" aria-label={t('guest_login')}>
              <LogOut size={18} strokeWidth={1.9} style={{ transform: 'scaleX(-1)' }} aria-hidden />
            </a>
          </>
        ) : (
          <>
            {/* The avatar is the link to the account page — it is the one tile that identifies
                *whose* portal this is, which the old sidebar showed as a row with the address
                beside it. The address does not fit a 68px rail and is on the account page. */}
            <a
              href={`/${locale}/dashboard/profiel`}
              aria-current={active === 'profile' ? 'page' : undefined}
              className={`rail-item${active === 'profile' ? ' on' : ''}`}
              aria-label={t('nav_profile')}
              title={email}
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src={avatarUrl} alt="" referrerPolicy="no-referrer" />
                <AvatarFallback
                  className="text-[10px] font-bold"
                  style={{ background: 'rgba(255,255,255,0.20)', color: '#fff' }}
                >
                  {email.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="rail-rule" />
            </a>
            <button onClick={handleLogout} type="button" className="rail-item" aria-label={t('btn_logout')}>
              <LogOut size={18} strokeWidth={1.9} aria-hidden />
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
