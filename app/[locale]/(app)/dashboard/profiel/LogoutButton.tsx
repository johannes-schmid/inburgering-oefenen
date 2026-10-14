'use client';

import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

export default function LogoutButton() {
  const t = useTranslations('portal');

  return (
    <button
      type="button"
      className="g-btn g-btn-ghost g-btn-sm"
      onClick={async () => {
        await createClient().auth.signOut();
        window.location.href = '/';
      }}
    >
      {t('btn_logout')}
    </button>
  );
}
