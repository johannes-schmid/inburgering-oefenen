/**
 * The Inburgering hub. TOFU: the orientation phase, where ~80% of the search volume sits.
 *
 * Thin on purpose — metadata and params only. Everything rendered, including the JSON-LD and the
 * zero-guide state, lives in `_components/GuideHub.tsx`, which `/knm` renders too.
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
  const t = await getTranslations({ locale, namespace: 'guides.inburgering' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    alternates: alternatesFor(locale, 'inburgering'),
    openGraph: {
      type: 'website',
      title: t('meta_title'),
      description: t('meta_description'),
      url: absUrl(locale, 'inburgering'),
      siteName: 'Inburgering Oefenen',
    },
  };
}

export default async function InburgeringHubPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <GuideHub section="inburgering" locale={locale} />;
}
