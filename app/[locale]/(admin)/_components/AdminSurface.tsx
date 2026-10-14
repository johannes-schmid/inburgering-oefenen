'use client';

import { useEffect } from 'react';

/**
 * Zet `data-surface="admin"` op <html> zolang de beheerschil staat.
 *
 * De Glas-tokens van /admin (`app/admin-glas.css`) hangen aan `.admin-glas` op de schil, maar
 * base-ui port lades, popovers en selects naar <body> — buiten die schil. Zonder dit attribuut
 * zouden ze in de oude huid openen. Bij het verlaten van /admin gaat het attribuut weer weg.
 */
export default function AdminSurface() {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.surface = 'admin';
    return () => {
      delete root.dataset.surface;
    };
  }, []);
  return null;
}
