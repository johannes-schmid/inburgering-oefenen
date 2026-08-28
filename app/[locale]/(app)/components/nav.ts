import type { OnderdeelSlug } from '@/data/skills';

/**
 * Which portal page is current. A plain type in its own module so the shell (a client
 * component) and the pages (server components) can share it without either importing the
 * other — a type exported from a `'use client'` file drags the whole module into the server
 * graph.
 */
export type PortalNav =
  /** The portal overview at `/dashboard` — every module at once. */
  | 'overview'
  /** One module's own overview at `/dashboard/[level]` or `/dashboard/knm`. */
  | 'overview-module'
  | OnderdeelSlug
  | 'profile'
  /** KNM's lesmodules op `/leren`. */
  | 'leren'
  | 'woordkaarten'
  /** De lescursus van één taalonderdeel op `/dashboard/[level]/[skill]/leren`. */
  | 'lessen'
  /** De conceptenbibliotheek op `/dashboard/[level]/concepten`. */
  | 'concepten';
