/**
 * Free grammar explanations for the taalexamens. Static child of `/taalexamens/[slug]`.
 *
 * A thin wrapper: everything is in `data/planned-surfaces.ts` (what it will be) and
 * `_components/PlannedSurface.tsx` (how it renders). **`robots: index: false` is the load-bearing
 * line here** — the page has no content yet, so it must not compete on the domain's behalf. It is
 * also absent from `app/sitemap.ts`, by never being added rather than by being filtered out.
 */
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { absUrl, alternatesFor } from '@/lib/schema';
import { getPlannedSurface } from '@/data/planned-surfaces';
import PlannedSurface from '../../_components/PlannedSurface';

const HREF = '/taalexamens/grammatica' as const;
const PATH = 'taalexamens/grammatica';

type Props = { params: Promise<{ locale: string }> };

export async function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'planned.grammatica' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    // Not yet built → not indexable. `follow` so the links onward still carry.
    robots: { index: false, follow: true },
    alternates: alternatesFor(locale, PATH),
    openGraph: {
      type: 'website',
      title: t('meta_title'),
      description: t('meta_description'),
      url: absUrl(locale, PATH),
      siteName: 'Inburgering Oefenen',
    },
  };
}

export default async function GrammaticaPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PlannedSurface surface={getPlannedSurface(HREF)} locale={locale} />;
}
