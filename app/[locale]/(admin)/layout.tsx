import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LogoutButton from './_components/LogoutButton';
import { AdminMobileNav } from './_components/AdminMobileNav';

export const metadata = {
  robots: 'noindex, nofollow',
};

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/admin-login`);
  }

  // Check allowlist
  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('email')
    .eq('email', user.email!)
    .maybeSingle();

  if (!adminRow) {
    redirect(`/${locale}/admin-login?error=not_admin`);
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
      />
      <div className="min-h-screen bg-surface flex">
        <AdminMobileNav locale={locale} userEmail={user.email!} />
        <AdminSidebar locale={locale} userEmail={user.email!} />
        <main className="flex-1 min-w-0 lg:ml-64 min-h-screen p-4 md:p-8 pt-18 lg:pt-8">
          {children}
        </main>
      </div>
    </>
  );
}

function AdminSidebar({ locale, userEmail }: { locale: string; userEmail: string }) {
  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-primary flex-col z-10">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🇳🇱</span>
          <span className="font-headline font-bold text-white text-sm leading-tight">
            KNM Admin
          </span>
        </div>
        <p className="text-white/50 text-xs truncate">{userEmail}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <NavItem href={`/${locale}/admin`} icon="dashboard" label="Dashboard" />
        <NavItem href={`/${locale}/admin/questions`} icon="quiz" label="Vragen" />
        <NavItem href={`/${locale}/admin/exams`} icon="assignment" label="Examens" />
        <NavItem href={`/${locale}/admin/leren`} icon="menu_book" label="Lessen" />
        <NavItem href={`/${locale}/admin/woordkaarten`} icon="style" label="Woordkaarten" />
        <div className="pt-3 mt-2 border-t border-white/10">
          <NavItem href={`/${locale}/admin/users`} icon="group" label="Gebruikers" />
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
  );
}

function NavItem({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
      {label}
    </a>
  );
}

