import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['nl', 'en', 'ar'],
  defaultLocale: 'nl',
  localePrefix: 'always',

  // Translated slugs — mirrors components/slug-map.js exactly.
  // Keys are the internal route names; values are per-locale URL slugs.
  // New routes are added here as pages are migrated.
  pathnames: {
    '/': '/',
    '/privacybeleid': '/privacybeleid',
    '/gebruiksvoorwaarden': '/gebruiksvoorwaarden',
    '/terugbetalingsbeleid': '/terugbetalingsbeleid',
    /* Arabic has a translated slug here, like `/docent` and `/premium`.
     *
     * It was missing, and the effect was a page nobody could reach: `next.config.ts` 301s
     * `/ar/contact` to `/ar/تواصل-معنا`, and without this entry that slug matched no route, so
     * the Arabic contact page 404'd from every link in the footer. The sitemap listed the same
     * dead URL. Adding the mapping is what makes both resolve. */
    '/contact': {
      nl: '/contact',
      en: '/contact',
      ar: '/تواصل-معنا',
    },
    '/login': '/login',
    '/dashboard': '/dashboard',
    '/dashboard/[level]/[skill]': '/dashboard/[level]/[skill]',
    '/dashboard/profiel': '/dashboard/profiel',
    '/dashboard/pakketten': '/dashboard/pakketten',
    '/dashboard/analyse': '/dashboard/analyse',
    '/dashboard/fouten': '/dashboard/fouten',
    '/blog': '/blog',
    '/blog/[slug]': '/blog/[slug]',
    '/oefenvragen': '/oefenvragen',
    '/leren': '/leren',
    '/activate': '/activate',
    '/register': '/register',
    '/uitschrijven': '/uitschrijven',
    '/betaling-gelukt': '/betaling-gelukt',
    '/docent': {
      nl: '/docent',
      en: '/teacher',
      ar: '/المعلمة',
    },
    '/premium': {
      nl: '/premium',
      en: '/premium',
      ar: '/الباقة-المميزة',
    },
    '/oefenen': '/oefenen',
    '/oefenen/[skill]': '/oefenen/[skill]',
    // The level is part of the path at both levels, including A2 — see the redirects in
    // next.config.ts that 301 the old A2-implicit URLs onto these.
    '/oefenexamen/[level]/[skill]': '/oefenexamen/[level]/[skill]',
    '/oefenexamen/[level]/[skill]/[number]': '/oefenexamen/[level]/[skill]/[number]',
  },
});

export type Locale = (typeof routing.locales)[number];
