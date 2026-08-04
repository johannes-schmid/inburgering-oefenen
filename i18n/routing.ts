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
    '/contact': '/contact',
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
    '/proefexamen': '/proefexamen',
    '/oefenen': '/oefenen',
    '/oefenen/[skill]': '/oefenen/[skill]',
    // The level is part of the path at both levels, including A2 — see the redirects in
    // next.config.ts that 301 the old A2-implicit URLs onto these.
    '/oefenexamen/[level]/[skill]': '/oefenexamen/[level]/[skill]',
    '/oefenexamen/[level]/[skill]/[number]': '/oefenexamen/[level]/[skill]/[number]',
  },
});

export type Locale = (typeof routing.locales)[number];
