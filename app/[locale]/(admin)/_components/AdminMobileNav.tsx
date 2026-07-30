'use client';

import { useState } from 'react';
import LogoMark from '@/components/site/LogoMark';
import LogoutButton from './LogoutButton';

interface Props {
  locale: string;
  userEmail: string;
}

function NavItem({ href, icon, label, onClick }: { href: string; icon: string; label: string; onClick?: () => void }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
      {label}
    </a>
  );
}

export function AdminMobileNav({ locale, userEmail }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-primary flex items-center px-4 gap-3">
        <button
          onClick={() => setOpen(true)}
          className="text-white/70 hover:text-white p-1 -ml-1"
          aria-label="Menu openen"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>
        <div className="flex items-center gap-2">
          <LogoMark size={22} surface="dark" />
          <span className="font-headline font-bold text-white text-sm">Admin</span>
        </div>
      </header>

      {/* Overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-out drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-primary flex flex-col z-50 transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LogoMark size={24} surface="dark" />
              <span className="font-headline font-bold text-white text-sm">Admin</span>
            </div>
            <p className="text-white/50 text-xs truncate">{userEmail}</p>
          </div>
          <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavItem href={`/${locale}/admin`} icon="dashboard" label="Dashboard" onClick={() => setOpen(false)} />
          <NavItem href={`/${locale}/admin/questions`} icon="quiz" label="Vragen" onClick={() => setOpen(false)} />
          <NavItem href={`/${locale}/admin/exams`} icon="assignment" label="Examens" onClick={() => setOpen(false)} />
          <NavItem href={`/${locale}/admin/opgaven`} icon="edit_note" label="Opgaven" onClick={() => setOpen(false)} />
          <NavItem href={`/${locale}/admin/rubrics`} icon="checklist" label="Rubrieken" onClick={() => setOpen(false)} />
          <NavItem href={`/${locale}/admin/beoordeling`} icon="rate_review" label="Beoordelen" onClick={() => setOpen(false)} />
          <NavItem href={`/${locale}/admin/leren`} icon="menu_book" label="Lessen" onClick={() => setOpen(false)} />
          <NavItem href={`/${locale}/admin/woordkaarten`} icon="style" label="Woordkaarten" onClick={() => setOpen(false)} />
          <div className="pt-3 mt-2 border-t border-white/10">
            <NavItem href={`/${locale}/admin/users`} icon="group" label="Gebruikers" onClick={() => setOpen(false)} />
          </div>
        </nav>

        <div className="p-4 border-t border-white/10 space-y-1">
          <a
            href={`/${locale}`}
            target="_blank"
            className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors px-3 py-2 rounded-xl hover:bg-white/10"
          >
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            Bekijk site
          </a>
          <LogoutButton locale={locale} />
        </div>
      </aside>
    </>
  );
}
