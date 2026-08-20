/**
 * The KNM hub. MOFU: KNM is the planned fifth onderdeel (M3), and this is where its kennisgidsen
 * will live. Renders the same `GuideHub` as `/inburgering`.
 *
 * Carries no availability claim and nothing about knmoefenen.nl — that domain stays a ranking
 * asset until the KNM pages rank here, and a redirect promise on this page would pre-empt a
 * decision nobody has taken.
 */
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { absUrl, alternatesFor } from '@/lib/schema';
import GuideHub from '../_components/GuideHub';

type Props = { params: Promise<{ locale: string }> };

export async function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'guides.knm' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    alternates: alternatesFor(locale, 'knm'),
    openGraph: {
      type: 'website',
      title: t('meta_title'),
      description: t('meta_description'),
      url: absUrl(locale, 'knm'),
      siteName: 'Inburgering Oefenen',
    },
  };
}

export default async function KnmHubPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <GuideHub section="knm" locale={locale} />;
}
