/**
 * De vertaalde gids- en blogslug.
 *
 * `i18n/content-slugs.ts` staat náást de inhoud in plaats van erin — dat is een bewuste keuze
 * (de tabel mag `data/guides/index.ts` niet de browserbundel in trekken) met één prijs: de twee
 * kunnen uit elkaar lopen zonder dat er iets faalt. Een gids zonder rij krijgt stil zijn
 * Nederlandse slug in elke taal terug; een rij zonder gids is een dode vertaling die nergens
 * meer naar wijst. Deze test is wat die prijs betaalt.
 */
import { describe, it, expect } from 'vitest';
import { GUIDES } from '@/data/guides';
import POSTS from '@/data/blog-posts';
import { CONTENT_SLUGS, contentSlugParam, parseContentSlug } from '@/i18n/content-slugs';
import { routing } from '@/i18n/routing';

const NL_SLUGS = [...GUIDES.map(g => g.slug), ...POSTS.map(p => p.slug)];

describe('de tabel dekt de inhoud', () => {
  it('geeft elke gids en elke blogpost een rij', () => {
    const missing = NL_SLUGS.filter(slug => !CONTENT_SLUGS[slug]);
    expect(missing).toEqual([]);
  });

  it('laat geen rij achter zonder gids of blogpost', () => {
    const orphans = Object.keys(CONTENT_SLUGS).filter(slug => !NL_SLUGS.includes(slug));
    expect(orphans).toEqual([]);
  });

  it('vertaalt naar elke niet-Nederlandse taal', () => {
    for (const slug of NL_SLUGS) {
      for (const locale of routing.locales.filter(l => l !== 'nl')) {
        expect(contentSlugParam(slug, locale), `${slug} → ${locale}`).not.toBe(slug);
      }
    }
  });
});

describe('de slugs zijn bruikbaar als URL', () => {
  it('claimt geen slug twee keer, over alle talen heen', () => {
    /* Een dubbele slug is geen typefout maar een pagina die de andere overschrijft:
     * `getGuideBySlug` en `getPostBySlug` zoeken op de eerste die past. */
    const seen = new Map<string, string>();
    for (const slug of NL_SLUGS) {
      for (const locale of routing.locales) {
        const value = contentSlugParam(slug, locale);
        const owner = seen.get(value);
        expect(owner ?? slug, `"${value}" is van zowel ${owner} als ${slug}`).toBe(slug);
        seen.set(value, slug);
      }
    }
  });

  it('bevat geen spaties, hoofdletters of schuine strepen', () => {
    for (const slug of NL_SLUGS) {
      for (const locale of routing.locales) {
        const value = contentSlugParam(slug, locale);
        expect(value, value).not.toMatch(/[\s/?#]/);
        expect(value, value).toBe(value.toLowerCase());
      }
    }
  });
});

describe('parseContentSlug', () => {
  it('rekent elke taal terug naar de Nederlandse slug', () => {
    for (const slug of NL_SLUGS) {
      for (const locale of routing.locales) {
        expect(parseContentSlug(contentSlugParam(slug, locale))).toBe(slug);
      }
    }
  });

  it('accepteert de percent-gecodeerde Arabische slug', () => {
    /* `nextUrl.pathname` in `proxy.ts` is gecodeerd; zonder de decodering in
     * `parseContentSlug` viel elke Arabische gids-URL buiten de tabel. */
    for (const slug of NL_SLUGS) {
      const ar = contentSlugParam(slug, 'ar');
      expect(parseContentSlug(encodeURIComponent(ar))).toBe(slug);
    }
  });

  it('laat een onbekende waarde met rust', () => {
    /* `/knm/woordenlijst` en `/oefenvragen/[slug]` passen op dezelfde vorm maar niet op deze
     * tabel. `canonicalContentPath` leunt erop dat die `undefined` terugkrijgt. */
    expect(parseContentSlug('woordenlijst')).toBeUndefined();
    expect(parseContentSlug('grammatica')).toBeUndefined();
  });
});
