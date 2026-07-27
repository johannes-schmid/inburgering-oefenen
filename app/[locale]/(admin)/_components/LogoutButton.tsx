'use client';

import { createClient } from '@/lib/supabase/client';

export default function LogoutButton({ locale }: { locale: string }) {
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = `/${locale}/admin-login`;
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors px-3 py-2 rounded-xl hover:bg-white/10"
    >
      <span className="material-symbols-outlined text-[18px]">logout</span>
      Uitloggen
    </button>
  );
}
