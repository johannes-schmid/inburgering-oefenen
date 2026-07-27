'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import PlatformSidebar from './PlatformSidebar';

type Props = {
  locale: string;
  email: string;
  activeView?: 'exams' | 'leren' | 'woordkaarten' | 'profile';
  children: ReactNode;
};

export default function AppShell({ locale, email, activeView = 'exams', children }: Props) {
  const t = useTranslations('dashboard');

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        body { font-family: var(--font-public-sans), 'Public Sans', sans-serif; background: #f0f3f8; color: #191c1e; }
        h1,h2,h3,h4 { font-family: var(--font-manrope), 'Manrope', sans-serif; }
        #dash-sidebar { width:248px; flex-shrink:0; background:linear-gradient(180deg,#001d4e 0%,#002b6d 45%,#003580 100%); border-right:none; display:flex; flex-direction:column; height:100vh; position:sticky; top:0; box-shadow:4px 0 24px rgba(0,27,78,0.18); }
        #dash-main { flex:1; min-width:0; overflow-y:auto; height:100vh; background:#f0f3f8; }
        .nav-item { display:flex; align-items:center; gap:10px; padding:10px 14px; border-radius:10px; font-size:14px; font-weight:500; color:rgba(255,255,255,0.65); cursor:pointer; transition:background .15s,color .15s; background:none; border:none; width:100%; text-align:left; font-family:inherit; text-decoration:none; }
        .nav-item:hover { background:rgba(255,255,255,0.1); color:rgba(255,255,255,0.9); }
        .nav-item.active { background:rgba(255,255,255,0.15); color:#fff; font-weight:600; box-shadow:inset 0 0 0 1px rgba(255,255,255,0.12); }
        #app-mobile-header { display:none; }
        @media (max-width:768px) {
          #dash-sidebar { display:none !important; }
          #dash-main { height:auto; overflow-y:visible; }
          #app-mobile-header { display:flex !important; }
        }
      `}</style>

      <header
        id="app-mobile-header"
        className="sticky top-0 z-50 items-center gap-3 px-4 py-3"
        style={{ background: 'linear-gradient(135deg,#001d4e,#002b6d)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <a href={`/${locale}/dashboard`} className="flex items-center gap-2" style={{ textDecoration: 'none', color: '#fff' }}>
          <ArrowLeft size={18} strokeWidth={2.2} />
          <span className="text-sm font-bold font-headline">{t('btn_back_to_dashboard')}</span>
        </a>
      </header>

      <div id="dash-layout" className="flex">
        <PlatformSidebar locale={locale} email={email} activeView={activeView} />
        <main id="dash-main">{children}</main>
      </div>
    </>
  );
}
