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

/**
 * `searchParams` is here only for `?fase=` — which of the three fasen the route opens on. It is a
 * deep-link convenience (the strip on a guide page links back with it), never state the page writes
 * back: switching fase on the hub is a `tablist`, not a navigation. See `RouteReader`.
 *
 * Reading `searchParams` normally opts a route out of static generation. It costs nothing here:
 * every `[locale]` route in this app already builds as dynamic (`ƒ`), so the hub was never
 * prerendered to begin with. `generateStaticParams` stays for the locale enumeration.
 */
type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ fase?: string }>;
};

export async function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
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

export default async function InburgeringHubPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { fase } = await searchParams;
  setRequestLocale(locale);
  return <GuideHub section="inburgering" locale={locale} fase={fase} />;
}
