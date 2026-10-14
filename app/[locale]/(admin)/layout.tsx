/* De CSS van het portaal en /admin. Bewust niet in `globals.css`: dan zou elke publieke
   pagina hem render-blocking meeladen. Zie de kop van `app/portal.css`. */
import '@/app/portal.css';
import '@/app/admin-glas.css';
import type { ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LogoMark from '@/components/site/LogoMark';
import LogoutButton from './_components/LogoutButton';
import { AdminMobileNav } from './_components/AdminMobileNav';
import AdminNav from './_components/AdminNav';
import AdminSurface from './_components/AdminSurface';

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
    <div className="admin-glas min-h-screen flex">
      <AdminSurface />
      <AdminMobileNav locale={locale} userEmail={user.email!} />
      <AdminSidebar locale={locale} userEmail={user.email!} />
      <main className="flex-1 min-w-0 lg:ml-64 min-h-screen p-4 md:p-8 pt-18 lg:pt-8">
        {children}
      </main>
    </div>
  );
}

function AdminSidebar({ locale, userEmail }: { locale: string; userEmail: string }) {
  return (
    <aside className="admin-side hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col z-10">
      <div className="px-5 pt-6 pb-3">
        <a href={`/${locale}/admin`} className="admin-brand">
          <LogoMark size={28} />
          Beheer
        </a>
        <p className="admin-who mt-2 mb-0">{userEmail}</p>
      </div>

      <AdminNav locale={locale} />

      <div className="px-3 pb-4 pt-2 flex flex-col gap-0.5 bg-surface-container-low">
        <a href={`/${locale}`} target="_blank" className="admin-navi admin-navi-quiet">
          <ExternalLink size={16} aria-hidden />
          Bekijk site
        </a>
        <LogoutButton locale={locale} />
      </div>
    </aside>
  );
}


