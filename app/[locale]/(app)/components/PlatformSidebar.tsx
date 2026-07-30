'use client';

import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { LayoutDashboard, User, Mail, LogOut, UserPlus } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import LogoMark from '@/components/site/LogoMark';
import SkillIcon from '@/components/site/SkillIcon';
import { SKILLS } from '@/data/skills';
import type { PortalNav } from './nav';

/**
 * The study portal's primary navigation: the overview, then one entry per exam onderdeel.
 *
 * Two things that were here for KNM are deliberately gone. **Leren and woordkaarten** are
 * hidden — their A2 content does not exist, and `lib/features.ts` already flags them off, so
 * the nav was advertising two dead ends. And these are **real links**, not `onViewChange`
 * callbacks into a parent's `useState`: the portal is now nested routes, so the URL names the
 * page you are on, back works, and a skill page is linkable.
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
