/**
 * The Taalexamens hub. MOFU: the four taalonderdelen explained, per level.
 *
 * M1 deliberately left this section out of the menu because its per-onderdeel guides are M4 work
 * and an empty section is thin content twice over. It exists now because the owner asked for
 * `docs/MILESTONES.html` §3's structure (2026-08-20) **and** because the section turned out not to
 * be empty: `lezen-examen-inburgering-a2` and `luisteren-examen-inburgering-a2` already exist as
 * blog posts, so two of the four onderdeel guides are effectively written. `GuideHub`'s
 * `HUB_POSTS.taalexamens` surfaces them; M4 links them rather than writing competing pages.
 *
 * Renders the same `GuideHub` as `/inburgering` and `/knm`, with four orienting cards instead of
 * five — one per onderdeel rather than one per phase.
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
  const t = await getTranslations({ locale, namespace: 'guides.taalexamens' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    alternates: alternatesFor(locale, 'taalexamens'),
    openGraph: {
      type: 'website',
      title: t('meta_title'),
      description: t('meta_description'),
      url: absUrl(locale, 'taalexamens'),
      siteName: 'Inburgering Oefenen',
    },
  };
}

export default async function TaalexamensHubPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <GuideHub section="taalexamens" locale={locale} />;
}
