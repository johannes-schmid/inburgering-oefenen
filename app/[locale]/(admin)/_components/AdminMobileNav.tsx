'use client';

import { useState } from 'react';
import { ExternalLink, Menu, X } from 'lucide-react';
import LogoMark from '@/components/site/LogoMark';
import LogoutButton from './LogoutButton';
import AdminNav from './AdminNav';

interface Props {
  locale: string;
  userEmail: string;
}

export function AdminMobileNav({ locale, userEmail }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <header className="admin-topbar lg:hidden fixed top-0 left-0 right-0 z-30 h-14 flex items-center px-3 gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="admin-iconbtn"
          aria-label="Menu openen"
          aria-expanded={open}
        >
          <Menu size={20} aria-hidden />
        </button>
        <div className="admin-brand">
          <LogoMark size={24} />
          Beheer
        </div>
      </header>

      {/* Overlay */}
      {open && (
        <div
          className="admin-scrim lg:hidden fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-out drawer */}
      <aside
        className={`admin-side admin-drawer lg:hidden fixed top-0 left-0 h-full w-72 max-w-[85vw] flex flex-col z-50 rounded-e-g-lg`}
        data-open={open}
        aria-hidden={!open}
        inert={!open}
      >
        <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="admin-brand">
              <LogoMark size={28} />
              Beheer
            </div>
            <p className="admin-who mt-2 mb-0">{userEmail}</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="admin-iconbtn -mr-1" aria-label="Menu sluiten">
            <X size={18} aria-hidden />
          </button>
        </div>

        <AdminNav locale={locale} onNavigate={() => setOpen(false)} />

        <div className="px-3 pb-4 pt-2 flex flex-col gap-0.5 bg-surface-container-low">
          <a href={`/${locale}`} target="_blank" className="admin-navi admin-navi-quiet">
            <ExternalLink size={16} aria-hidden />
            Bekijk site
          </a>
          <LogoutButton locale={locale} />
        </div>
      </aside>
    </>
  );
}
