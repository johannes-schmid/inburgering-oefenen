import type { MetadataRoute } from 'next';
import { DEFAULT_LEVEL, SKILLS } from '@/data/skills';
import { hasFreePractice } from '@/data/free-practice';
import { FEATURES } from '@/lib/features';
import { getSortedPosts, getPostSlug, hasTranslation } from '@/data/blog-posts';
import { publishedGuides, hasTranslation as guideHasTranslation } from '@/data/guides/helpers';

const BASE = 'https://inburgeringoefenen.nl';
const LOCALES = ['nl', 'en', 'ar'] as const;

/**
 * `/docent`, `/premium` and `/contact` have translated Arabic slugs (`i18n/routing.ts`);
 * everything else keeps the Dutch one at every locale.
 *
 * The Arabic contact URL listed here was a 404 until 2026-08-19: the slug was right, but
 * `routing.ts` had no per-locale mapping for `/contact`, so nothing served it. The router now
 * defines it. If an entry here ever needs a slug the router does not know, the bug is the
 * missing route — do not "fix" it by listing the Dutch path instead.
 */
const STATIC_PATHS: Record<typeof LOCALES[number], string[]> = {
  nl: ['', 'premium', 'docent', 'contact', 'privacybeleid', 'gebruiksvoorwaarden', 'terugbetalingsbeleid'],
  en: ['', 'premium', 'teacher', 'contact', 'privacybeleid', 'gebruiksvoorwaarden', 'terugbetalingsbeleid'],
  ar: ['', 'الباقة-المميزة', 'المعلمة', 'تواصل-معنا', 'privacybeleid', 'gebruiksvoorwaarden', 'terugbetalingsbeleid'],
};

const TODAY = new Date().toISOString().split('T')[0];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    for (const path of STATIC_PATHS[locale]) {
      const url = path ? `${BASE}/${locale}/${path}` : `${BASE}/${locale}`;
      entries.push({ url, changeFrequency: 'monthly', priority: path === '' ? 1.0 : 0.8, lastModified: TODAY });
    }
  }

  /* The free funnel: the picker and the tasters behind it.
   *
   * These were indexable, linked from the homepage's primary CTA and absent from the sitemap —
   * the entry point of the whole funnel was the one thing not submitted.
   *
   * The tasters are gated on `hasFreePractice`: Schrijven and Spreken have no set yet, their
   * pages `redirect()` to the picker and return `robots: { index: false }`. Same reasoning as
   * the `hasTranslation()` gate on blog posts below — never advertise a URL whose own meta tag
   * tells Google to ignore it.
   */
  for (const locale of LOCALES) {
    entries.push({ url: `${BASE}/${locale}/oefenen`, changeFrequency: 'weekly', priority: 0.9, lastModified: TODAY });
    for (const skill of SKILLS) {
      if (!hasFreePractice(skill.slug)) continue;
      entries.push({
        url: `${BASE}/${locale}/oefenen/${skill.slug}`,
        changeFrequency: 'monthly',
        priority: 0.8,
        lastModified: TODAY,
      });
    }
  }

  // One overview page per exam component (lezen / luisteren / schrijven / spreken).
  //
  // A2 only. The B1 pages exist and resolve, but every one of their forty slots is
  // "Binnenkort" — submitting forty empty grids spends crawl budget on pages that answer
  // nothing, and their `robots` meta is `noindex` anyway (see the overview page), so listing
  // them here would only contradict it. They join the sitemap when the docent publishes.
  for (const skill of SKILLS) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${BASE}/${locale}/oefenexamen/${DEFAULT_LEVEL}/${skill.slug}`,
        changeFrequency: 'weekly',
        priority: 0.9,
        lastModified: TODAY,
      });
    }
  }

  if (FEATURES.blog) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${BASE}/${locale}/blog`,
        changeFrequency: 'weekly',
        priority: 0.7,
        lastModified: TODAY,
      });
    }

    // Only locales with a translated body — the rest are noindex, so listing them would
    // advertise URLs we are telling Google to ignore.
    for (const post of getSortedPosts()) {
      for (const locale of LOCALES) {
        if (!hasTranslation(post, locale)) continue;
        entries.push({
          url: `${BASE}/${locale}/blog/${getPostSlug(post, locale)}`,
          changeFrequency: 'monthly',
          priority: 0.7,
          lastModified: post.dateModified,
        });
      }
    }
  }

  /* Kennisgidsen: the two hubs, and the guides inside them.
   *
   * The hubs are listed unconditionally — they carry their own orienting content whether or not a
   * guide has been reviewed yet, so they are never an empty page (see `_components/GuideHub.tsx`).
   *
   * The guides are gated twice, and both gates mean "this URL is noindex, so do not advertise it":
   * `publishedGuides()` drops anything the docent has not reviewed, and `guideHasTranslation()`
   * drops a locale with no body of its own. Same rule as the blog block above.
   */
  for (const section of ['inburgering', 'knm', 'taalexamens'] as const) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${BASE}/${locale}/${section}`,
        changeFrequency: 'weekly',
        priority: 0.9,
        lastModified: TODAY,
      });
    }
  }

  for (const guide of publishedGuides()) {
    for (const locale of LOCALES) {
      if (!guideHasTranslation(guide, locale)) continue;
      entries.push({
        url: `${BASE}/${locale}/${guide.section}/${guide.slug}`,
        changeFrequency: 'monthly',
        priority: 0.8,
        lastModified: guide.dateModified,
      });
    }
  }

  /* The tijdlijn tool. Listed at the same priority as a hub: it is a real, indexable page that
   * answers a large informational intent nobody else answers interactively — DUO's own step-by-step
   * wizard is `noindex`. `weekly` because the rules file changes under it, not the copy. */
  for (const locale of LOCALES) {
    entries.push({
      url: `${BASE}/${locale}/inburgering/tools/tijdlijn`,
      changeFrequency: 'weekly',
      priority: 0.9,
      lastModified: TODAY,
    });
  }

  // Topic quizzes stay out of the sitemap until their A2 content exists.
  void FEATURES.oefenvragen;

  /* `data/planned-surfaces.ts` — the woordenlijst and grammatica pages — is
   * deliberately **not** iterated here. Those routes are `noindex` until they do something, and a
   * sitemap entry for a noindex URL is a contradiction we tell Google to resolve for us. They are
   * absent by never being added, which is stronger than being filtered out: there is no condition
   * here to get inverted later. `tests/public.spec.js` asserts their absence. */

  return entries;
}
