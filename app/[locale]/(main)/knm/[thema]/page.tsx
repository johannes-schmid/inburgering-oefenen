/**
 * One KNM kennisgids.
 *
 * `robots` gates on three things, all of which mean "do not index this":
 *   - `status !== 'reviewed'` — the docent has not reviewed it (owner's decision, 2026-08-19)
 *   - `!hasTranslation(...)` — this locale has no body of its own, so it would be a thin duplicate
 *   - `NOINDEX_SECTIONS` — the whole KNM section is noindex until the merge with knmoefenen.nl
 *     (owner's decision, 2026-11-03; see `data/guides/helpers.ts`)
 *
 * `indexableLocales()` folds all three into one list, so robots, hreflang and the sitemap agree.
 *
 * The page still renders in both states, because a draft that 404'd could not be reviewed.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { absUrl, alternatesFor, ogImageFor } from '@/lib/schema';
import { getGuideBySlug, getAllGuideParams, getGuideLocale, indexableLocales } from '@/data/guides/helpers';
import GuideArticle from '../../_components/GuideArticle';

type Props = { params: Promise<{ locale: string; thema: string }> };

export async function generateStaticParams() {
  // The dynamic segment is `[thema]` here and `[slug]` under /inburgering, so the shared helper's
  // key is renamed. The value is the same guide slug either way.
  return getAllGuideParams('knm').map(({ locale, slug }) => ({ locale, thema: slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, thema } = await params;
  const guide = getGuideBySlug('knm', thema);
  if (!guide) return {};
  const lg = getGuideLocale(guide, locale);
  const publishable = indexableLocales(guide).includes(locale);

  return {
    title: lg.title,
    description: lg.description,
    robots: { index: publishable, follow: true },
    alternates: alternatesFor(locale, `knm/${guide.slug}`, indexableLocales(guide)),
    openGraph: {
      images: ogImageFor(locale),
      type: 'article',
      title: lg.heroTitle,
      description: lg.description,
      url: absUrl(locale, `knm/${guide.slug}`),
      siteName: 'Inburgering Oefenen',
      publishedTime: guide.datePublished,
      modifiedTime: guide.dateModified,
    },
  };
}

export default async function KnmGuidePage({ params }: Props) {
  const { locale, thema } = await params;
  const guide = getGuideBySlug('knm', thema);
  if (!guide) notFound();
  setRequestLocale(locale);
  return <GuideArticle guide={guide} locale={locale} />;
}
