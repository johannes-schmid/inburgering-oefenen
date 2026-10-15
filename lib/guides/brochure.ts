/**
 * De gegevens op de omslag van een gids-brochure, op één plek samengesteld: de kaart in `/gidsen`
 * en pagina 1 van de PDF tonen dezelfde omslag, en twee plekken die elk hun eigen "versie" of
 * "nagekeken door" uitrekenen lopen uit elkaar.
 *
 * De versie is de datum van de laatste review, niet `dateModified`: de omslag belooft dat de
 * docent déze tekst heeft gelezen, en dat is de datum waarop dat gebeurde.
 */
import { getTranslations } from 'next-intl/server';
import { getGuideLocale } from '@/data/guides/helpers';
import { langTag } from '@/lib/site';
import type { Guide } from '@/data/guides/types';
import type { BrochureCoverData } from '@/components/guides/BrochureCover';

export async function brochureCover(guide: Guide, locale: string): Promise<BrochureCoverData> {
  const t = await getTranslations({ locale, namespace: 'guides' });
  const tS = await getTranslations({ locale, namespace: 'gidsen' });
  const lg = getGuideLocale(guide, locale);
  const date = new Date(guide.reviewedOn ?? guide.dateModified).toLocaleDateString(langTag(locale), {
    month: 'long',
    year: 'numeric',
  });
  return {
    title: lg.heroTitle,
    subtitle: lg.heroSubtitle,
    kind: t('brochure_kind', { section: tS(`sec_${guide.section}`) }),
    reviewer: t('brochure_reviewed', { name: guide.reviewedBy ?? '' }),
    role: t('author_role'),
    version: t('brochure_version', { date }),
    section: guide.section,
    pillar: guide.pillar,
    slug: guide.slug,
  };
}
