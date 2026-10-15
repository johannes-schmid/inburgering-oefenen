'use client';

import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LogoutButton({ locale }: { locale: string }) {
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = `/${locale}/admin-login`;
  }

  return (
    <button type="button" onClick={handleLogout} className="admin-navi admin-navi-quiet w-full">
      <LogOut size={16} aria-hidden />
      Uitloggen
    </button>
  );
}
