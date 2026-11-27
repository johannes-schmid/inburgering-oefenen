'use client';

import { useEffect, useState } from 'react';
import { isSaleActive, isSaleEligible } from './sale';

/**
 * Mag deze bezoeker de Black Friday-actie zien? `null` zolang dat nog niet vaststaat.
 *
 * Een anonieme bezoeker mag altijd. Pas als er een Supabase-sessiecookie staat, wordt de client
 * lazy geladen om `user_metadata` te lezen: de meeste bezoekers van de publieke site hebben geen
 * sessie, en de Supabase-client is 64 KB die ze dan niet hoeven te laden (zie `(main)/layout.tsx`).
 *
 * Bewust `null` en niet `false`/`true` tijdens het laden: wie premium is, mag de actie ook geen
 * fractie van een seconde zien flitsen.
 */
/** Eén sessie-opvraag per pagina, hoeveel prijzen er ook staan. */
let lookup: Promise<boolean> | null = null;

export function useSaleOffer(): boolean | null {
  const [eligible, setEligible] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const settle = (v: boolean) => { if (!cancelled) setEligible(v); };

    if (!isSaleActive()) { settle(false); return; }
    if (!/(?:^|;\s*)sb-[^=]*-auth-token/.test(document.cookie)) { settle(true); return; }

    lookup ??= import('./supabase/client')
      .then(({ createClient }) => createClient().auth.getSession())
      .then(({ data }) => isSaleEligible(data.session?.user.user_metadata ?? {}))
      .catch(() => false);
    lookup.then(settle);

    return () => { cancelled = true; };
  }, []);

  return eligible;
}
