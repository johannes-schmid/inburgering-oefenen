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
    '/dashboard/[skill]': '/dashboard/[skill]',
    '/dashboard/profiel': '/dashboard/profiel',
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
    '/oefenexamen/[skill]': '/oefenexamen/[skill]',
    '/oefenexamen/[skill]/[number]': '/oefenexamen/[skill]/[number]',
  },
});

export type Locale = (typeof routing.locales)[number];
