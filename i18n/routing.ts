import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['nl', 'en', 'ar'],
  defaultLocale: 'nl',
  localePrefix: 'always',

  /* next-intl zet zelf `Link: rel="alternate"`-headers, en die bouwt het uit dít bestand — dus
   * uit de statische segmenten alleen. Op `/en/practice-exam/a2/reading` leverde dat een
   * `hreflang="ar"` naar `.../a2/reading` mét de Nederlandse onderdeelnaam erin, en een
   * `x-default` zónder taalcode. Twee hreflang-verzamelingen die elkaar tegenspreken — die
   * header en de `<link rel="alternate">` uit `generateMetadata` — zijn erger dan één: Google
   * wantrouwt dan het hele cluster. Elke publieke pagina zet de hare zelf via `alternatesFor`
   * in `lib/schema.ts`, en die kent de vertaalde parameterwaarde wél. */
  alternateLinks: false,

  /* Vertaalde slugs — de enige bron voor het pad van een route per taal.
   *
   * Lees dit vóór je hier iets toevoegt, want de oude opmerking in dit bestand ("een slug per
   * taal geeft een 404 zodra de lezer van taal wisselt") klopte maar half, en dat verschil is
   * precies waar het misgaat:
   *
   *   - Een STATISCH segment mág per taal verschillen. `usePathname()` van next-intl geeft de
   *     interne routenaam terug ('/gidsen'), niet de zichtbare slug, dus de taalwissel in
   *     `components/Nav.tsx` zoekt zelf de goede slug op. Een bezoeker die de Nederlandse slug
   *     in een andere taal opvraagt krijgt een 308 naar de vertaalde variant — geen 404.
   *   - Een PARAMETERWAARDE vertaalt next-intl níét mee. `[slug]` van een gids of blogpost komt
   *     uit `useParams()` en wordt letterlijk in de andere taal ingevuld. Tot 15-09 was dat de
   *     reden om die waarden overal gelijk te houden; sindsdien vertalen we ze zelf, aan de
   *     rand, en is de taalwissel in `Nav.tsx` wat ze terugrekent (`translateParams`).
   *
   * Er zijn dus twee vertáálde parameterwaarden, elk met hun eigen tabel:
   *   - de gids- en blogslug — `i18n/content-slugs.ts`
   *   - de onderdeelnaam in `/oefenen/[skill]` en `/oefenexamen/[level]/[skill]` —
   *     `i18n/skill-slugs.ts`
   *
   * Beide worden uitgaand ingevuld door `fill()` in `paths.ts` en binnenkomend teruggerekend
   * door de route; een URL met de waarde in een andere taal blijft werken en krijgt een 308 uit
   * `proxy.ts`. Het niveau (`a2`, `b1`), `knm` en een examennummer zijn eigennamen van DUO of
   * getallen en blijven onvertaald.
   *
   * Nederlands verandert nergens: die URL's zijn geïndexeerd en ranken. */
  pathnames: {
    '/': '/',

    // ── Juridisch ────────────────────────────────────────────────────────────
    '/privacybeleid': {
      nl: '/privacybeleid',
      en: '/privacy-policy',
      ar: '/سياسة-الخصوصية',
    },
    '/gebruiksvoorwaarden': {
      nl: '/gebruiksvoorwaarden',
      en: '/terms-of-use',
      ar: '/شروط-الاستخدام',
    },
    '/terugbetalingsbeleid': {
      nl: '/terugbetalingsbeleid',
      en: '/refund-policy',
      ar: '/سياسة-الاسترداد',
    },
    '/contact': {
      nl: '/contact',
      en: '/contact',
      ar: '/تواصل-معنا',
    },

    /* `/uitschrijven` blijft bewust in élke taal Nederlands. De link staat in elke verstuurde
     * e-mail en in `unsubscribe`-headers die we niet meer kunnen herschrijven; een vertaalde
     * slug maakt van iedere oude mail een redirect-hop op de ene handeling die meteen moet
     * werken. */
    '/uitschrijven': '/uitschrijven',

    // ── Portaal en auth — geen SEO-oppervlak, dus onvertaald (besluit 15-09) ──
    '/login': '/login',
    '/dashboard': '/dashboard',
    '/dashboard/[level]/[skill]': '/dashboard/[level]/[skill]',
    // KNM's portal pages carry no level segment — see the KNM section in data/skills.ts.
    '/dashboard/knm': '/dashboard/knm',
    '/dashboard/woordkaarten': '/dashboard/woordkaarten',
    '/dashboard/profiel': '/dashboard/profiel',
    '/dashboard/pakketten': '/dashboard/pakketten',
    '/dashboard/analyse': '/dashboard/analyse',
    '/dashboard/fouten': '/dashboard/fouten',
    '/leren': '/leren',
    '/leren/[slug]': '/leren/[slug]',
    '/activate': '/activate',
    '/register': '/register',
    '/betaling-gelukt': '/betaling-gelukt',

    // ── Over ons ─────────────────────────────────────────────────────────────
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
    '/platform': {
      nl: '/platform',
      en: '/platform',
      ar: '/المنصة',
    },

    // ── Kennisgidsen ─────────────────────────────────────────────────────────
    /* Sectie-slug én gids-slug zijn vertaald. De tweede is een parameterwaarde, en die
     * vertaalt next-intl niet mee — dat doet `contentSlugParam` in `i18n/content-slugs.ts`,
     * aangeroepen vanuit `fill()` in `paths.ts` en vanuit `guideHref()`. */
    '/gidsen': {
      nl: '/gidsen',
      en: '/guides',
      ar: '/الأدلة',
    },
    '/inburgering': {
      nl: '/inburgering',
      en: '/civic-integration',
      ar: '/الاندماج',
    },
    '/inburgering/[slug]': {
      nl: '/inburgering/[slug]',
      en: '/civic-integration/[slug]',
      ar: '/الاندماج/[slug]',
    },
    /* KNM is de naam die DUO voert en die de kandidaat op zijn uitslag ziet staan. Een
     * vertaling ervan is geen betere URL, alleen een onherkenbare. */
    '/knm': '/knm',
    '/knm/[thema]': '/knm/[thema]',
    '/taalexamens': {
      nl: '/taalexamens',
      en: '/language-exams',
      ar: '/امتحانات-اللغة',
    },
    '/taalexamens/[slug]': {
      nl: '/taalexamens/[slug]',
      en: '/language-exams/[slug]',
      ar: '/امتحانات-اللغة/[slug]',
    },

    /* Tools and free-practice surfaces (2026-08-20).
     *
     * `/inburgering/tools/…` is its own segment so a tool can never collide with a guide slug.
     * The three below *are* static children of a `[slug]`/`[thema]` route and win over it, which
     * is well-defined App Router behaviour but implicit — `tests-unit/guides.test.ts` holds the
     * reserved-slug invariant that stops a guide being authored at one of these paths.
     *
     * Elke vertaling hieronder moet dus óók in die gereserveerde lijst staan, anders kan een
     * gids alsnog op `/en/civic-integration/tools/timeline` worden geschreven. */
    '/inburgering/tools/tijdlijn': {
      nl: '/inburgering/tools/tijdlijn',
      en: '/civic-integration/tools/timeline',
      ar: '/الاندماج/أدوات/الجدول-الزمني',
    },
    '/knm/woordenlijst': {
      nl: '/knm/woordenlijst',
      en: '/knm/glossary',
      ar: '/knm/قائمة-المفردات',
    },
    '/taalexamens/woordenlijst': {
      nl: '/taalexamens/woordenlijst',
      en: '/language-exams/glossary',
      ar: '/امتحانات-اللغة/قائمة-المفردات',
    },
    '/taalexamens/grammatica': {
      nl: '/taalexamens/grammatica',
      en: '/language-exams/grammar',
      ar: '/امتحانات-اللغة/قواعد-اللغة',
    },
    '/oefenvragen': {
      nl: '/oefenvragen',
      en: '/practice-questions',
      ar: '/أسئلة-تدريبية',
    },
    '/oefenvragen/[slug]': {
      nl: '/oefenvragen/[slug]',
      en: '/practice-questions/[slug]',
      ar: '/أسئلة-تدريبية/[slug]',
    },
    '/blog': {
      nl: '/blog',
      en: '/blog',
      ar: '/المدونة',
    },
    '/blog/[slug]': {
      nl: '/blog/[slug]',
      en: '/blog/[slug]',
      ar: '/المدونة/[slug]',
    },

    // ── De trechter ──────────────────────────────────────────────────────────
    /* `[skill]` is hier een vertáálde parameterwaarde — de enige in dit bestand. De route
     * ontvangt 'reading' of 'القراءة' en rekent die met `parseSkillParam` om naar 'lezen'
     * vóór er iets uit `data/skills.ts` wordt opgezocht. Zie `i18n/skill-slugs.ts`. */
    '/oefenen': {
      nl: '/oefenen',
      en: '/practice',
      ar: '/تدرب',
    },
    '/oefenen/[skill]': {
      nl: '/oefenen/[skill]',
      en: '/practice/[skill]',
      ar: '/تدرب/[skill]',
    },
    /* The B1 taster is nested and A2's is not, deliberately — the four A2 taster URLs are
       indexed and ranking, and re-pathing the funnel's entry point buys nothing a visitor can
       see. See the header of `oefenen/b1/[skill]/page.tsx`. */
    '/oefenen/b1/[skill]': {
      nl: '/oefenen/b1/[skill]',
      en: '/practice/b1/[skill]',
      ar: '/تدرب/b1/[skill]',
    },
    // KNM has no level at any depth, so its taster is a static sibling rather than a level
    // segment — the same shape as /oefenexamen/knm below.
    '/oefenen/knm': {
      nl: '/oefenen/knm',
      en: '/practice/knm',
      ar: '/تدرب/knm',
    },
    /* Het niveau-overzicht (25-09): de pagina voor "inburgering examen oefenen a2" — de
       zoekterm zit tussen de homepage en de vier onderdeelpagina's in, en had geen URL. De
       statische `knm`-broer schaduwt `[level]`, dus `/oefenexamen/knm` blijft van KNM. */
    '/oefenexamen/[level]': {
      nl: '/oefenexamen/[level]',
      en: '/practice-exam/[level]',
      ar: '/امتحان-تجريبي/[level]',
    },
    // The level is part of the path at both levels, including A2 — see the redirects in
    // next.config.ts that 301 the old A2-implicit URLs onto these.
    '/oefenexamen/[level]/[skill]': {
      nl: '/oefenexamen/[level]/[skill]',
      en: '/practice-exam/[level]/[skill]',
      ar: '/امتحان-تجريبي/[level]/[skill]',
    },
    '/oefenexamen/[level]/[skill]/[number]': {
      nl: '/oefenexamen/[level]/[skill]/[number]',
      en: '/practice-exam/[level]/[skill]/[number]',
      ar: '/امتحان-تجريبي/[level]/[skill]/[number]',
    },
    // KNM is not levelled, so its exams sit one segment shallower. The static `knm` segment
    // shadows `[level]`, which is what makes /oefenexamen/knm/3 mean exam 3 and not skill 3.
    '/oefenexamen/knm': {
      nl: '/oefenexamen/knm',
      en: '/practice-exam/knm',
      ar: '/امتحان-تجريبي/knm',
    },
    '/oefenexamen/knm/[number]': {
      nl: '/oefenexamen/knm/[number]',
      en: '/practice-exam/knm/[number]',
      ar: '/امتحان-تجريبي/knm/[number]',
    },
  },
});

export type Locale = (typeof routing.locales)[number];
