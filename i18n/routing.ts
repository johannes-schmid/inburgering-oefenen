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
    '/dashboard/analyse': '/dashboard/analyse',
    '/dashboard/fouten': '/dashboard/fouten',
    '/blog': '/blog',
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
  },
});

export type Locale = (typeof routing.locales)[number];
