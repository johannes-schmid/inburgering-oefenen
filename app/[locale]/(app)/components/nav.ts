import type { OnderdeelSlug } from '@/data/skills';

/**
 * Which portal page is current. A plain type in its own module so the shell (a client
 * component) and the pages (server components) can share it without either importing the
 * other — a type exported from a `'use client'` file drags the whole module into the server
 * graph.
 */
export type PortalNav = 'overview' | OnderdeelSlug | 'profile' | 'leren' | 'woordkaarten';
