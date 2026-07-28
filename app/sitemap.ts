import type { MetadataRoute } from 'next';
import { SKILLS } from '@/data/skills';
import { FEATURES } from '@/lib/features';
import { getSortedPosts, getPostSlug, hasTranslation } from '@/data/blog-posts';

const BASE = 'https://inburgeringoefenen.nl';
const LOCALES = ['nl', 'en', 'ar'] as const;

const STATIC_PATHS: Record<typeof LOCALES[number], string[]> = {
  nl: ['', 'premium', 'docent', 'contact', 'privacybeleid', 'gebruiksvoorwaarden'],
  en: ['', 'premium', 'teacher', 'contact', 'privacybeleid', 'gebruiksvoorwaarden'],
  ar: ['', 'الباقة-المميزة', 'المعلمة', 'تواصل-معنا', 'privacybeleid', 'gebruiksvoorwaarden'],
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

  // One overview page per exam component (lezen / luisteren / schrijven / spreken)
  for (const skill of SKILLS) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${BASE}/${locale}/oefenexamen/${skill.slug}`,
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

  // Topic quizzes stay out of the sitemap until their A2 content exists.
  void FEATURES.oefenvragen;

  return entries;
}
