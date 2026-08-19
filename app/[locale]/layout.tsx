import type { Metadata } from 'next';
import { Manrope, Public_Sans, Noto_Sans_Arabic } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
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
  openGraph: {
    siteName: 'Inburgering Oefenen',
    type: 'website',
    images: [{ url: 'https://inburgeringoefenen.nl/images/marieke-schipper.jpg', width: 800, height: 800, alt: 'Inburgering Oefenen — oefenexamens inburgering A2 van een NT2-docent' }],
  },
  twitter: { card: 'summary_large_image' },
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();
  const isRtl = locale === 'ar';

  return (
    <html
      lang={locale}
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`${manrope.variable} ${publicSans.variable} ${notoArabic.variable}`}
    >
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
