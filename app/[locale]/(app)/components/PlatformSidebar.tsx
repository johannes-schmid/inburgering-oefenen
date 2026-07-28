'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { ClipboardList, BookOpen, User, Mail, LogOut, UserPlus } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import LogoMark from '@/components/site/LogoMark';

type ActiveView = 'exams' | 'leren' | 'woordkaarten' | 'profile';

const NAV_ICONS = {
  exams: ClipboardList,
  leren: BookOpen,
  profile: User,
};

interface Props {
  locale: string;
  email: string;
  avatarUrl?: string;
  activeView: ActiveView;
  onViewChange?: (view: ActiveView) => void;
  isGuest?: boolean;
}

export default function PlatformSidebar({ locale, email, avatarUrl = '', activeView, onViewChange, isGuest = false }: Props) {
  const t = useTranslations('dashboard');
  const supabase = createClient();

  useEffect(() => {
    if (!document.querySelector('link[href*="Material+Symbols"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  function handleNav(view: ActiveView, e: React.MouseEvent) {
    if (onViewChange) {
      e.preventDefault();
      onViewChange(view);
    }
  }

  const navHref = (view: ActiveView) =>
    view === 'exams' ? `/${locale}/dashboard` : `/${locale}/dashboard?view=${view}`;

  return (
    <aside id="dash-sidebar">
      {/* Logo area */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <a href={`/${locale}/dashboard`} onClick={(e) => handleNav('exams', e)} className="flex items-center gap-2 w-full" style={{ textDecoration: 'none' }}>
          <LogoMark size={32} surface="dark" />
          <span className="text-xl font-extrabold tracking-tight font-headline" style={{ color: '#fff' }}>Inburgering Oefenen</span>
        </a>
        <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.45)', paddingLeft: 40 }}>{t('sidebar_subtitle')}</p>
        {isGuest && (
          <a href={`/${locale}`} className="text-xs mt-2 block" style={{ color: 'rgba(255,255,255,0.35)', paddingLeft: 40, textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}>{t('nav_back_home')}</a>
        )}
      </div>

      <nav className="flex-1 px-3 py-5 flex flex-col gap-0.5">
        {(['exams', 'leren', 'woordkaarten'] as const).map(id => {
          const Icon = id !== 'woordkaarten' ? NAV_ICONS[id as keyof typeof NAV_ICONS] : null;
          return (
            <a
              key={id}
              id={`nav-${id}`}
              href={navHref(id)}
              onClick={(e) => handleNav(id, e)}
              className={`nav-item${activeView === id ? ' active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
            >
              {Icon
                ? <Icon size={18} strokeWidth={activeView === id ? 2.5 : 1.8} />
                : <span className="material-symbols-outlined" style={{ fontSize: 20, lineHeight: 1, width: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontVariationSettings: activeView === id ? "'wght' 600" : "'wght' 300" }}>style</span>
              }
              <span>{t(`nav_${id}` as Parameters<typeof t>[0])}</span>
            </a>
          );
        })}
      </nav>

      <div className="px-3 py-3 flex flex-col gap-0.5" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <a
          id="nav-profile"
          href={navHref('profile')}
          onClick={(e) => handleNav('profile', e)}
          className={`nav-item${activeView === 'profile' ? ' active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
        >
          <User size={18} strokeWidth={activeView === 'profile' ? 2.5 : 1.8} />
          <span>{t('nav_profile')}</span>
        </a>
        <a href="/contact?from=dashboard" className="nav-item no-underline" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <Mail size={16} strokeWidth={1.8} />
          <span>{t('nav_contact')}</span>
        </a>
      </div>

      {isGuest ? (
        <div className="px-4 py-4 flex flex-col gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <a href={`/${locale}/register`} className="nav-item no-underline" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', background: 'rgba(254,118,44,0.18)', color: '#fe762c' }}>
            <UserPlus size={16} strokeWidth={1.8} />
            <span style={{ fontWeight: 700 }}>{t('guest_create_account')}</span>
          </a>
          <a href={`/${locale}/login`} className="nav-item no-underline" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <User size={16} strokeWidth={1.8} />
            <span>{t('guest_login')}</span>
          </a>
        </div>
      ) : (
        <div className="px-4 py-4 flex flex-col gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-2.5 px-1 py-1">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={avatarUrl} alt={email} referrerPolicy="no-referrer" />
              <AvatarFallback className="text-xs font-bold" style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}>{email.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>{email}</p>
          </div>
          <button onClick={handleLogout} className="nav-item" style={{ marginTop: 2 }}>
            <LogOut size={16} strokeWidth={1.8} />
            <span>{t('btn_logout')}</span>
          </button>
        </div>
      )}
    </aside>
  );
}
