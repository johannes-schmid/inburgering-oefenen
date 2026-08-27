import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,

  /* `sharp` is a native module and must stay outside the server bundle.
   *
   * It is on Next's own default external list, and that was not enough: on production
   * `/api/admin/upload-image` answered **500 to every request, including a GET** — a GET on a
   * route with only a POST handler is a 405 if the module loaded at all, so the module itself was
   * failing to initialise. Every other admin route 401'd correctly, and the only import they do not
   * share is this one. Nothing local sees it: `next build` and `next dev` both resolve sharp fine.
   *
   * Listing it explicitly is the documented fix and costs nothing. If an image upload ever 500s
   * again, check this line before anything in the route. */
  serverExternalPackages: ['sharp'],

  /* …and the native binary has to be *copied into* the function, which is a second problem.
   *
   * With sharp external, the upload route got as far as loading it and then died on
   * `libvips-cpp.so.8.18.3: cannot open shared object file`. `@img/sharp-linux-x64` holds the
   * `.node` addon; the shared library lives in a *sibling* package, `@img/sharp-libvips-linux-x64`,
   * and the addon dlopens it at runtime. Nothing in the source says so, so Next's file tracing
   * cannot see it and leaves it out of the bundle — the addon then looks for a file that was never
   * deployed. The two packages are also pinned in `optionalDependencies`, because the copy inside
   * `next/node_modules` is an older pair (sharp 0.34 / libvips 1.2) and matching majors is not
   * optional here: the addon names the exact `.so` version it needs.
   *
   * Local development never sees any of this — macOS resolves its own darwin pair from
   * `node_modules` with no bundling involved. */
  outputFileTracingIncludes: {
    '/api/admin/upload-image': [
      './node_modules/@img/sharp-linux-x64/**',
      './node_modules/@img/sharp-libvips-linux-x64/**',
    ],
  },

  // There is deliberately NO `env:` block here. It used to map
  //   NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SUPABASE_SERVICE_KEY
  // which inlined the service-role key into every browser bundle — the leak recorded in
  // CLAUDE.md. Even the corrected version was a hazard: it silently overrode a correctly-set
  // NEXT_PUBLIC_SUPABASE_URL with `undefined` on any environment that only defined the
  // non-public names. The browser client reads NEXT_PUBLIC_SUPABASE_URL and
  // NEXT_PUBLIC_SUPABASE_ANON_KEY directly; set those, and nothing else.

  async redirects() {
    return [
      // www → apex
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.inburgeringoefenen.nl' }],
        destination: 'https://inburgeringoefenen.nl/:path*',
        permanent: true,
      },
      // Root → default locale
      { source: '/', destination: '/nl', permanent: true },
      // Renamed routes
      { source: '/upgrade', destination: '/nl/premium', permanent: true },
      // Docent has a translated slug for EN
      { source: '/en/docent', destination: '/en/teacher', permanent: true },

      /* `/proefexamen` was the KNM flat-question player, deleted in M0 (2026-08-19).
       *
       * It rendered an untranslated "KNM Proefexamen N" heading over what is now A2 content,
       * carried a second `PASS_THRESHOLD_PCT`, and was reachable and crawlable while nothing on
       * the site linked to it. The free funnel it duplicated is `/oefenen`, so that is where
       * anything still holding the old URL — an old e-mail, an index entry — lands. */
      { source: '/:locale(nl|en|ar)/proefexamen', destination: '/:locale/oefenen', permanent: true },
      { source: '/proefexamen', destination: '/nl/oefenen', permanent: true },

      // ── A2-implicit URLs → the levelled shape ────────────────────────────
      // Every exam URL used to omit the level and mean A2. Those paths are indexed and
      // linked from e-mails already sent, so they 301 rather than 404.
      //
      // **The pattern is an allowlist of the four taalonderdelen, not a negative lookahead.**
      //
      // It used to be `:skill((?!a2$|b1$)[^/]+)`, and that guard is subtly wrong: the `$`
      // anchors against the *whole remaining path*, not against the segment, so it only ever
      // excluded a value that ended the URL. The two-segment rule below therefore had no
      // working guard at all — it was saved only by the levelled URLs having one more segment
      // than it matches. KNM is the case that exposed it: `/oefenexamen/knm/1` is exactly the
      // two-segment legacy shape, so it 308'd to `/oefenexamen/a2/knm/1`, which is not a route.
      // The whole onderdeel 404'd while the build output listed it as present.
      //
      // An allowlist cannot have that failure mode. These four slugs are the only ones that
      // ever appeared in an unlevelled URL, so naming them is also the honest description of
      // what is being preserved — and a fifth onderdeel can never accidentally match it.
      // Redirects are matched *before* the App Router, so a static `knm` segment shadowing
      // `[level]` does not save these; the pattern has to be right here.
      {
        source: '/:locale(nl|en|ar)/oefenexamen/:skill(lezen|luisteren|schrijven|spreken)',
        destination: '/:locale/oefenexamen/a2/:skill',
        permanent: true,
      },
      {
        source: '/:locale(nl|en|ar)/oefenexamen/:skill(lezen|luisteren|schrijven|spreken)/:number(\\d+)',
        destination: '/:locale/oefenexamen/a2/:skill/:number',
        permanent: true,
      },
      {
        source: '/:locale(nl|en|ar)/dashboard/:skill(lezen|luisteren|schrijven|spreken)',
        destination: '/:locale/dashboard/a2/:skill',
        permanent: true,
      },

      // AR translated route redirects
      { source: '/ar/premium',  destination: '/ar/%D8%A7%D9%84%D8%A8%D8%A7%D9%82%D8%A9-%D8%A7%D9%84%D9%85%D9%85%D9%8A%D8%B2%D8%A9', permanent: true },
      { source: '/ar/docent',   destination: '/ar/%D8%A7%D9%84%D9%85%D8%B9%D9%84%D9%85%D8%A9', permanent: true },
      { source: '/ar/contact',  destination: '/ar/%D8%AA%D9%88%D8%A7%D8%B5%D9%84-%D9%85%D8%B9%D9%86%D8%A7', permanent: true },
    ];
  },

};

export default withNextIntl(nextConfig);
