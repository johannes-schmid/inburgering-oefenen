'use client';

import { useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import WoordkaartenView from '../components/WoordkaartenView';
import type { Plan } from '@/lib/entitlements';

/**
 * The thinnest possible client boundary around `WoordkaartenView`.
 *
 * That component takes a Supabase *client* instance as a prop, which a server component
 * cannot create. Rather than change its signature — it is inherited code that works — this
 * wrapper makes the one browser client it needs.
 */
export default function WoordkaartenClient({
  userId, plan, locale, owns,
}: { userId: string; plan: Plan; locale: string; owns: boolean }) {
  const supabase = useMemo(() => createClient(), []);
  return (
    <WoordkaartenView
      userId={userId}
      plan={plan}
      owns={owns}
      supabase={supabase}
      onGoToProfile={() => { window.location.href = `/${locale}/dashboard/profiel`; }}
    />
  );
}
