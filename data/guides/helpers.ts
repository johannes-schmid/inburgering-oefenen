/**
 * The guide registry's query surface.
 *
 * Named to mirror `data/blog-posts.ts:2233-2288` field for field, so the two content modules read
 * the same way. The one addition is the publication gate — `publishedGuides()` and everything
 * built on it are the only sanctioned way to list guides for a reader or a crawler.
 */
import { GUIDES } from './index';
import type { Guide, GuideSection, ResolvedGuide } from './types';

/** Content for one locale, Dutch as the fallback for every optional field. */
export function getGuideLocale(guide: Guide, locale: string): ResolvedGuide {
  const t = guide.translations?.[locale as 'en' | 'ar'];
  return {
    heroTitle: t?.heroTitle ?? guide.heroTitle,
    description: t?.description ?? guide.description,
    eyebrow: t?.eyebrow ?? guide.eyebrow,
    title: t?.title ?? guide.title,
    breadcrumb: t?.breadcrumb ?? guide.breadcrumb,
    dateLabel: t?.dateLabel ?? guide.dateLabel,
    heroSubtitle: t?.heroSubtitle ?? guide.heroSubtitle,
    heroImageAlt: t?.heroImageAlt ?? guide.heroImage?.alt ?? '',
    articleHtml: t?.articleHtml ?? guide.articleHtml,
    sidebarHtml: t?.sidebarHtml ?? guide.sidebarHtml,
    ctaTitle: t?.ctaTitle ?? guide.ctaTitle,
    ctaDesc: t?.ctaDesc ?? guide.ctaDesc,
    ctaLabel: t?.ctaLabel ?? guide.ctaLabel,
    faq: t?.faq ?? guide.faq,
  };
}

/**
 * Whether this locale has its own translated body. `nl` is always true (it is the source).
 * A locale without one is `noindex`ed rather than shipping a thin duplicate of the Dutch text.
 */
export function hasTranslation(guide: Guide, locale: string): boolean {
  if (locale === 'nl') return true;
  return Boolean(guide.translations?.[locale as 'en' | 'ar']?.articleHtml);
}

/**
 * Published means reviewed. Nothing else lists a guide to a reader or a crawler.
 *
 * Pillar first, then newest — a cluster reads top-down, and the pillar is the page the spokes
 * exist to support.
 */
export function publishedGuides(section?: GuideSection): Guide[] {
  return GUIDES
    .filter(g => g.status === 'reviewed')
    .filter(g => (section ? g.section === section : true))
    .sort((a, b) =>
      a.pillar === b.pillar
        ? b.datePublished.localeCompare(a.datePublished)
        : Number(b.pillar) - Number(a.pillar),
    );
}

/** How many published guides a section holds. Drives the hub's empty state. */
export function guideCount(section: GuideSection): number {
  return publishedGuides(section).length;
}

/**
 * Resolve by slug **within a section**, so `/knm/<slug-of-an-inburgering-guide>` 404s instead of
 * rendering the same guide under two URLs — which is a duplicate of our own making.
 */
export function getGuideBySlug(section: GuideSection, slug: string): Guide | undefined {
  return GUIDES.find(g => g.section === section && g.slug === slug);
}

/**
 * All (locale, slug) pairs for one section — `generateStaticParams`.
 *
 * Drafts are included: they must be reachable so the docent can review them. Their `noindex` and
 * their absence from the hub and the sitemap are what keep them unpublished.
 */
export function getAllGuideParams(section: GuideSection): { locale: string; slug: string }[] {
  const params: { locale: string; slug: string }[] = [];
  for (const guide of GUIDES) {
    if (guide.section !== section) continue;
    for (const locale of ['nl', 'en', 'ar'] as const) {
      params.push({ locale, slug: guide.slug });
    }
  }
  return params;
}

/**
 * The typed route object for a guide — **the only place a section maps to a URL.**
 *
 * There used to be four copies of this decision, all shaped
 * `section === 'inburgering' ? { '/inburgering/[slug]' } : { '/knm/[thema]' }`, in `GuideHub` and
 * three times in `GuideArticle`. Every one of them type-checks against a third section and sends
 * it to `/knm/[thema]` — a wrong page, not a build error. Adding `taalexamens` is what would have
 * triggered that, so the branch became a lookup instead.
 *
 * `hash` is threaded through the same switch rather than spread onto the result by the caller:
 * `{ ...guideHref(g), hash }` collapses the union into one widened member, which is exactly the
 * shape the typed `Link` must reject (it would permit `/knm/[thema]` with a `slug` param).
 *
 * The dynamic segment differs per section (`[slug]` vs `[thema]`) because the KNM route was named
 * for its content before the sections were a set; the param name is part of the route, so it stays.
 */
export type GuideRoute =
  | { pathname: '/inburgering/[slug]'; params: { slug: string }; hash?: string }
  | { pathname: '/knm/[thema]'; params: { thema: string }; hash?: string }
  | { pathname: '/taalexamens/[slug]'; params: { slug: string }; hash?: string };

/**
 * A `switch` and not a lookup table, because the return type must stay a **discriminated** union:
 * `next-intl`'s typed `Link` correlates `pathname` with the shape of `params`, so a widened
 * `{ pathname: A | B | C; params: Record<string, string> }` is rejected — correctly, since it would
 * permit `{ pathname: '/knm/[thema]', params: { slug } }`.
 *
 * The `never` default makes a fourth `GuideSection` a compile error here rather than a wrong URL.
 */
export function guideHref(guide: Pick<Guide, 'section' | 'slug'>, hash?: string): GuideRoute {
  switch (guide.section) {
    case 'inburgering':
      return { pathname: '/inburgering/[slug]', params: { slug: guide.slug }, hash };
    case 'knm':
      return { pathname: '/knm/[thema]', params: { thema: guide.slug }, hash };
    case 'taalexamens':
      return { pathname: '/taalexamens/[slug]', params: { slug: guide.slug }, hash };
    default: {
      const unreachable: never = guide.section;
      throw new Error(`Unhandled guide section: ${unreachable}`);
    }
  }
}

/** The hub a guide belongs to — its breadcrumb parent. */
export function hubHref(section: GuideSection): '/inburgering' | '/knm' | '/taalexamens' {
  return `/${section}` as const;
}

/** Sibling guides for the "lees ook" block. Drafts and unknown slugs are dropped, not rendered. */
export function relatedGuides(guide: Guide): Guide[] {
  return guide.related
    .map(slug => getGuideBySlug(guide.section, slug))
    .filter((g): g is Guide => Boolean(g) && g!.status === 'reviewed');
}

/**
 * The locales this guide may be indexed in — the hreflang set for its route.
 *
 * A guide is `noindex` in a locale it has no body for (see `hasTranslation`), and it used to still
 * advertise that URL as its hreflang alternative. Google treats an hreflang pointing at a
 * `noindex` page as a contradiction and can discount the whole cluster, so the locale is omitted
 * rather than claimed. An unreviewed guide is `noindex` everywhere and therefore claims nothing.
 *
 * Dutch is always in the list when the guide is published: it is the source and the `x-default`.
 */
export function indexableLocales(guide: Guide): readonly string[] {
  if (guide.status !== 'reviewed') return [];
  return (['nl', 'en', 'ar'] as const).filter(l => hasTranslation(guide, l));
}
