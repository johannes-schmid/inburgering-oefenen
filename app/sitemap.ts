import type { MetadataRoute } from 'next';
import { SKILLS } from '@/data/skills';
import { FEATURES } from '@/lib/features';

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

  // Blog and topic-quiz pages stay out of the sitemap until their A2 content exists.
  // When these flags flip, add their slug loops here.
  void FEATURES.blog;
  void FEATURES.oefenvragen;

  return entries;
}
