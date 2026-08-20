/**
 * One Taalexamens kennisgids — the per-onderdeel guides of M4.
 *
 * **There are no taalexamens guides yet, and that is the correct state.** The route exists so M4
 * is authoring with no plumbing left in it: adding a file to `data/guides/` with
 * `section: 'taalexamens'` publishes here, on the hub and in the sitemap with no code change.
 * Until then every slug 404s, which is what it should do.
 *
 * Identical to `/inburgering/[slug]` and `/knm/[thema]`; the same two gates decide `robots`.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { absUrl, alternatesFor } from '@/lib/schema';
import { getGuideBySlug, getAllGuideParams, getGuideLocale, hasTranslation } from '@/data/guides/helpers';
import GuideArticle from '../../_components/GuideArticle';

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  return getAllGuideParams('taalexamens');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const guide = getGuideBySlug('taalexamens', slug);
  if (!guide) return {};
  const lg = getGuideLocale(guide, locale);
  const publishable = guide.status === 'reviewed' && hasTranslation(guide, locale);

  return {
    title: guide.title,
    description: lg.description,
    robots: { index: publishable, follow: true },
    alternates: alternatesFor(locale, `taalexamens/${guide.slug}`),
    openGraph: {
      type: 'article',
      title: lg.heroTitle,
      description: lg.description,
      url: absUrl(locale, `taalexamens/${guide.slug}`),
      siteName: 'Inburgering Oefenen',
      publishedTime: guide.datePublished,
      modifiedTime: guide.dateModified,
    },
  };
}

export default async function TaalexamensGuidePage({ params }: Props) {
  const { locale, slug } = await params;
  const guide = getGuideBySlug('taalexamens', slug);
  if (!guide) notFound();
  setRequestLocale(locale);
  return <GuideArticle guide={guide} locale={locale} />;
}
