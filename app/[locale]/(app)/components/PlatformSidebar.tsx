'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { LayoutDashboard, User, Mail, LogOut, UserPlus, BookText, Layers, ChevronRight } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import LogoMark from '@/components/site/LogoMark';
import SkillIcon from '@/components/site/SkillIcon';
import { SKILLS } from '@/data/skills';
import { FEATURES } from '@/lib/features';
import type { PortalNav } from './nav';

/** localStorage key for the KNM sub-menu's expanded state. */
const KNM_MENU_KEY = 'io_portal_knm_menu';

/**
 * The study portal's primary navigation: the overview, then one entry per exam onderdeel.
 *
 * These are **real links**, not `onViewChange` callbacks into a parent's `useState`: the
 * portal is now nested routes, so the URL names the page you are on, back works, and a skill
 * page is linkable.
 *
 * **Leren and woordkaarten came back on 2026-08-24** and are listed under KNM, not at the top
 * level. They were removed when this project forked from KNM because their A2 content did not
 * exist and the nav was advertising two dead ends — that is still true of A2, and it is why
 * they sit inside the onderdeel whose content they actually are. Both stay behind their
 * feature flags, so an environment with the content unseeded shows neither.
 */

interface Props {
  locale: string;
  email: string;
  avatarUrl?: string;
  active: PortalNav;
  isGuest?: boolean;
}

export default function PlatformSidebar({ locale, email, avatarUrl = '', active, isGuest = false }: Props) {
  const t = useTranslations('portal');
  const tSkills = useTranslations('skills');
  const tNav = useTranslations('nav');

  /** Whether KNM has any child surface to nest. Both are behind their own feature flag. */
  const knmHasChildren = FEATURES.leren || FEATURES.woordkaarten;
  /**
   * Are we somewhere inside KNM, on the parent or on one of its two children?
   *
   * The parent row needs a state of its own for this, distinct from `active`. Without it, the
   * lesson and woordkaarten pages left *no* onderdeel marked in the sidebar — the candidate
   * could see which page they were on but not which module it belonged to, which is the one
   * thing the nesting exists to say. It is a softer tint than `.active`, because there is only
   * ever one current page and the child is it.
   */
  const inKnm = active === 'knm' || active === 'leren' || active === 'woordkaarten';

  /**
   * Whether the KNM sub-menu is expanded, remembered across pages.
   *
   * Every portal page is a server component, so this sidebar remounts on every navigation —
   * plain `useState` would snap the menu shut the moment you clicked one of its own children,
   * which is the one interaction it exists for. It is stored in `localStorage`, like the
   * kennisgids reading progress: a per-viewer convenience that never leaves the browser, so no
   * consent banner and nothing extra on the request.
   *
   * It **starts open when you are inside KNM** and closed otherwise, so the first render is
   * already right and there is no flash of the wrong state before the effect runs. Reading
   * storage during render would cost a hydration mismatch on every portal page.
   */
  const [knmExpanded, setKnmExpanded] = useState(inKnm);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(KNM_MENU_KEY);
      // Being *on* a KNM page always wins over a stored "closed": collapsing the menu that
      // contains the current page would hide where you are.
      if (stored !== null && !inKnm) setKnmExpanded(stored === '1');
    } catch {
      // Private mode, blocked site data — the menu just keeps its default. A nav sub-menu must
      // never be able to break the page it decorates.
    }
  }, [inKnm]);

  useEffect(() => {
    try {
      window.localStorage.setItem(KNM_MENU_KEY, knmExpanded ? '1' : '0');
    } catch { /* see above */ }
  }, [knmExpanded]);
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <aside id="dash-sidebar">
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <a href={`/${locale}/dashboard`} className="flex items-center gap-2 w-full no-underline">
          <LogoMark size={32} surface="dark" />
          <span className="text-xl font-extrabold tracking-tight font-headline" style={{ color: '#fff' }}>
            Inburgering Oefenen
          </span>
        </a>
        <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.45)', paddingLeft: 40 }}>
          {t('sidebar_subtitle')}
        </p>
      </div>

      <nav className="flex-1 px-3 py-5 flex flex-col gap-0.5 overflow-y-auto">
        <a
          href={`/${locale}/dashboard`}
          className={`nav-item${active === 'overview' ? ' active' : ''}`}
        >
          <LayoutDashboard size={18} strokeWidth={active === 'overview' ? 2.5 : 1.8} />
          <span>{t('nav_overview')}</span>
        </a>

        <p className="nav-heading">{t('nav_section_onderdelen')}</p>

        {SKILLS.map(skill => (
          <a
            key={skill.slug}
            href={`/${locale}/dashboard/${skill.slug}`}
            className={`nav-item${active === skill.slug ? ' active' : ''}`}
          >
            <SkillIcon skill={skill.slug} size="sm" variant="bare" onDark />
            <span>{tSkills(`${skill.key}.name`)}</span>
          </a>
        ))}

        {/* KNM last, and with no level in its href — `/dashboard/knm` is a real route, while
            the four above are redirected to their A2 path by next.config.ts.

            Its two study surfaces are **nested underneath it**, not listed as a second
            top-level section with a "KNM LESMODULES" heading of their own. They belong to this
            onderdeel: the heading made them read as a peer of ONDERDELEN — a second thing the
            portal offers — when they are what the KNM module contains, beside its ten exams.

            **The row is a link and the chevron is a separate trigger** — shadcn's
            `SidebarMenuAction` shape, not `sidebar-07`'s, where the whole button is the
            `CollapsibleTrigger`. Making the whole row toggle is the tidier markup and it takes
            away KNM's own dashboard, which is the page the row is *for* (owner's instruction,
            2026-08-25). Two targets in one row is the cost of keeping both. */}
        <Collapsible open={knmExpanded} onOpenChange={setKnmExpanded}>
          <div className={`nav-row${active === 'knm' ? ' active' : inKnm ? ' within' : ''}`}>
            <a
              href={`/${locale}/dashboard/knm`}
              aria-current={active === 'knm' ? 'page' : undefined}
              className="nav-item nav-row-link"
            >
              <SkillIcon skill="knm" size="sm" variant="bare" onDark />
              <span>{tSkills('knm.name')}</span>
            </a>

            {knmHasChildren && (
              <CollapsibleTrigger
                aria-label={knmExpanded ? tNav('knm_collapse') : tNav('knm_expand')}
                className="nav-row-toggle"
              >
                {/* ChevronRight rotated 90°, exactly as the shadcn sidebar draws it — the
                    rotation is what makes one glyph carry both states. */}
                <ChevronRight
                  size={15}
                  strokeWidth={2.2}
                  aria-hidden
                  style={{ transform: knmExpanded ? 'rotate(90deg)' : 'none' }}
                />
              </CollapsibleTrigger>
            )}
          </div>

          {knmHasChildren && (
            <CollapsibleContent className="nav-collapsible">
              <ul className="nav-sub">
                {FEATURES.leren && (
                  <li>
                    <a
                      href={`/${locale}/leren`}
                      aria-current={active === 'leren' ? 'page' : undefined}
                      className={`nav-item nav-subitem${active === 'leren' ? ' active' : ''}`}
                    >
                      <BookText size={16} strokeWidth={active === 'leren' ? 2.4 : 1.8} />
                      <span>{tNav('knm_leren')}</span>
                    </a>
                  </li>
                )}
                {FEATURES.woordkaarten && (
                  <li>
                    <a
                      href={`/${locale}/dashboard/woordkaarten`}
                      aria-current={active === 'woordkaarten' ? 'page' : undefined}
                      className={`nav-item nav-subitem${active === 'woordkaarten' ? ' active' : ''}`}
                    >
                      <Layers size={16} strokeWidth={active === 'woordkaarten' ? 2.4 : 1.8} />
                      <span>{tNav('knm_woordkaarten')}</span>
                    </a>
                  </li>
                )}
              </ul>
            </CollapsibleContent>
          )}
        </Collapsible>

      </nav>

      <div className="px-3 py-3 flex flex-col gap-0.5" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <a
          href={`/${locale}/dashboard/profiel`}
          className={`nav-item${active === 'profile' ? ' active' : ''}`}
        >
          <User size={18} strokeWidth={active === 'profile' ? 2.5 : 1.8} />
          <span>{t('nav_profile')}</span>
        </a>
        <a href={`/${locale}/contact?from=dashboard`} className="nav-item">
          <Mail size={16} strokeWidth={1.8} />
          <span>{t('nav_contact')}</span>
        </a>
      </div>

      {isGuest ? (
        <div className="px-4 py-4 flex flex-col gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <a
            href={`/${locale}/register`}
            className="nav-item"
            style={{ background: 'rgba(254,118,44,0.18)', color: '#fe762c', fontWeight: 700 }}
          >
            <UserPlus size={16} strokeWidth={1.8} />
            <span>{t('guest_create_account')}</span>
          </a>
          <a href={`/${locale}/login`} className="nav-item">
            <User size={16} strokeWidth={1.8} />
            <span>{t('guest_login')}</span>
          </a>
        </div>
      ) : (
        <div className="px-4 py-4 flex flex-col gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-2.5 px-1 py-1">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={avatarUrl} alt={email} referrerPolicy="no-referrer" />
              <AvatarFallback className="text-xs font-bold" style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}>
                {email.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>{email}</p>
          </div>
          <button onClick={handleLogout} className="nav-item" style={{ marginTop: 2 }} type="button">
            <LogOut size={16} strokeWidth={1.8} />
            <span>{t('btn_logout')}</span>
          </button>
        </div>
      )}
    </aside>
  );
}
