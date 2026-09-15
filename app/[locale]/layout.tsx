import type { Metadata } from 'next';
import { Manrope, Public_Sans, Noto_Sans_Arabic } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
  weight: ['400', '600', '700', '800'],
});

const publicSans = Public_Sans({
  subsets: ['latin'],
  variable: '--font-public-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600'],
});

const notoArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  variable: '--font-noto-arabic',
  display: 'swap',
  weight: ['400', '600', '700'],
  /* Niet preloaden: 166 KB die op elke Nederlandse en Engelse pagina met hoge prioriteit
   * vóór de LCP binnenkwam. De variabele wordt overigens nergens in een stylesheet gelezen,
   * dus het bestand wordt zonder preload nooit opgehaald. */
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL('https://inburgeringoefenen.nl'),

  /* Search Console ownership.
   *
   * The property has never been verified, which is why no baseline of positions or impressions
   * exists (see docs/BASELINE.md). The token comes from the environment rather than the repo —
   * not because it is a secret (it is public in the page source by design) but because it is
   * per-property: a token committed here would be wrong for anyone else's Search Console, and
   * `undefined` renders no tag at all, which is the correct behaviour locally.
   *
   * Set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION in Vercel, then verify via the HTML-tag method. */
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.svg',
    apple: { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
  },
  /* Geen `images:` meer hier — die staat in `opengraph-image.tsx` ernaast.
   *
   * Hij stond hier wel, en hij kwam op bijna geen enkele pagina aan: Next vervangt dit hele
   * `openGraph`-object zodra een pagina er zelf een opgeeft, en 19 van de 22 deden dat zonder
   * `images`. Bovendien wees hij naar de foto van de docent met `800×800` erbij, terwijl dat
   * bestand 1376×768 is — de afmetingen die hier stonden waren dus ook niet waar.
   *
   * De bestandsconventie heeft dat probleem niet en geldt voor elke route hieronder. */
  openGraph: {
    siteName: 'Inburgering Oefenen',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
};

/**
 * De enige regel die niet mag wachten op `globals.css`. Zie de toelichting in de `<head>`.
 */
const CRITICAL_CSS = '.section-transition{height:76px}@media(min-width:640px){.section-transition{height:112px}}';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  /* Zonder deze aanroep leest next-intl de taal uit `headers()`, en dan is deze layout — en
   * daarmee élke pagina eronder — dynamisch: `no-store`, een render per request, en de
   * `(main)`-layout streamt nav en footer vóór de pagina-inhoud. Dat was 0,6 CLS en een LCP
   * van 7,5 s op de homepage. Een pagina die zélf `cookies()` leest (het portaal) blijft
   * gewoon dynamisch. */
  setRequestLocale(locale);

  const messages = await getMessages();
  const isRtl = locale === 'ar';

  return (
    <html
      lang={locale}
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`${manrope.variable} ${publicSans.variable} ${notoArabic.variable}`}
    >
      <head>
        {/* Kritieke CSS, bewust hier en niet in `globals.css`.
          *
          * `SectionTransition` ontleent zijn hoogte (76px, 112px vanaf `sm`) uitsluitend aan
          * `globals.css`, en die stylesheet is 62 KB en render-blocking. Tot hij binnen is heeft
          * het blok geen hoogtebeperking en neemt het zijn intrinsieke maat aan: **1215px in
          * plaats van 76px**. Zodra de stylesheet landt klapt het in, en omdat elke pagina op de
          * footer eindigt schuift dáár de hele footer mee omhoog. Dat was 0,616 CLS op élke
          * pagina van de site — in Lighthouse (mobiel, 4x CPU, traag 4G) veruit de grootste post,
          * en lokaal onzichtbaar omdat de stylesheet daar meteen binnen is.
          *
          * Een inline `style` op het element zelf lost het niet op: een inline hoogte wint van
          * `sm:h-[112px]` en bevriest het blok op de mobiele maat. Deze regel moet dus een
          * stylesheet zijn, en hij moet vóór de body geparsed zijn — vandaar hier.
          *
          * Blijft in sync met `components/horizon/SectionTransition.tsx` via
          * `tests-unit/critical-css.test.ts`. */}
        <style>{CRITICAL_CSS}</style>
        {/* De vier herkomsten van de analytics-tags. Ze laden pas na idle of eerste interactie
          * (zie `AnalyticsProviders`), maar de verbinding mag alvast staan. */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://scripts.clarity.ms" />
        <link rel="preconnect" href="https://connect.facebook.net" />
        <link rel="preconnect" href="https://region1.google-analytics.com" />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
