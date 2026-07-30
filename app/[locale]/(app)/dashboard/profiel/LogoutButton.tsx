'use client';

import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

export default function LogoutButton() {
  const t = useTranslations('portal');

  return (
    <button
      type="button"
      className="logout-btn"
      onClick={async () => {
        await createClient().auth.signOut();
        window.location.href = '/';
      }}
    >
      <LogOut size={16} strokeWidth={2.1} />
      {t('btn_logout')}
    </button>
  );
}
