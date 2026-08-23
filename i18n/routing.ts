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
    /* Kennisgidsen — the two guide sections (M1, 2026-08-19).
     *
     * Slugs are NOT translated, deliberately. The locale switcher in `components/Nav.tsx` calls
     * `router.replace(pathname, { locale })` with the concrete path, so a per-locale slug
     * type-checks here and then 404s the moment a reader switches language. The blog already
     * obeys that; guides do too. */
    /* The two pages the header's four links point at (2026-08-22). Slugs are not translated,
       for the same reason the guides' are not: the locale switcher replaces the *current* path,
       and a per-locale slug 404s the moment a reader switches language. */
    '/platform': '/platform',
    '/gidsen': '/gidsen',
    '/inburgering': '/inburgering',
    '/inburgering/[slug]': '/inburgering/[slug]',
    '/knm': '/knm',
    '/knm/[thema]': '/knm/[thema]',
    '/taalexamens': '/taalexamens',
    '/taalexamens/[slug]': '/taalexamens/[slug]',
    /* Tools and free-practice surfaces (2026-08-20).
     *
     * `/inburgering/tools/…` is its own segment so a tool can never collide with a guide slug.
     * The three below *are* static children of a `[slug]`/`[thema]` route and win over it, which
     * is well-defined App Router behaviour but implicit — `tests-unit/guides.test.ts` holds the
     * reserved-slug invariant that stops a guide being authored at one of these paths.
     *
     * All of these render a placeholder and are `noindex` until they do something. */
    '/inburgering/tools/tijdlijn': '/inburgering/tools/tijdlijn',
    '/knm/woordenlijst': '/knm/woordenlijst',
    '/taalexamens/woordenlijst': '/taalexamens/woordenlijst',
    '/taalexamens/grammatica': '/taalexamens/grammatica',
    '/oefenen': '/oefenen',
    '/oefenen/[skill]': '/oefenen/[skill]',
    /* The B1 taster is nested and A2's is not, deliberately — the four A2 taster URLs are
       indexed and ranking, and re-pathing the funnel's entry point buys nothing a visitor can
       see. See the header of `oefenen/b1/[skill]/page.tsx`. */
    '/oefenen/b1/[skill]': '/oefenen/b1/[skill]',
    // The level is part of the path at both levels, including A2 — see the redirects in
    // next.config.ts that 301 the old A2-implicit URLs onto these.
    '/oefenexamen/[level]/[skill]': '/oefenexamen/[level]/[skill]',
    '/oefenexamen/[level]/[skill]/[number]': '/oefenexamen/[level]/[skill]/[number]',
  },
});

export type Locale = (typeof routing.locales)[number];
