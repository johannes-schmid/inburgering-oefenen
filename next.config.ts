import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,

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

      // AR translated route redirects
      { source: '/ar/premium',  destination: '/ar/%D8%A7%D9%84%D8%A8%D8%A7%D9%82%D8%A9-%D8%A7%D9%84%D9%85%D9%85%D9%8A%D8%B2%D8%A9', permanent: true },
      { source: '/ar/docent',   destination: '/ar/%D8%A7%D9%84%D9%85%D8%B9%D9%84%D9%85%D8%A9', permanent: true },
      { source: '/ar/contact',  destination: '/ar/%D8%AA%D9%88%D8%A7%D8%B5%D9%84-%D9%85%D8%B9%D9%86%D8%A7', permanent: true },
    ];
  },

};

export default withNextIntl(nextConfig);
