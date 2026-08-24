/**
 * The invariants a translated kennisgids has to keep, in CI rather than only in the script that
 * wrote it.
 *
 * `scripts/translate-guides.mjs` validates each unit before it writes the file, and that is the
 * right place for it — a broken unit is retried there for the price of one call. But the script is
 * not run again after someone edits a translation by hand, which is exactly what the header of each
 * generated file invites them to do. These are the two rules that a hand edit breaks silently.
 */
import { describe, it, expect } from 'vitest';
import { GUIDES } from '@/data/guides';
import { TRANSLATIONS } from '@/data/guides/translations';
import { getGuideLocale, publishedGuides, indexableLocales } from '@/data/guides/helpers';

const LOCALES = ['en', 'ar'] as const;

const headingIds = (html: string) => [...html.matchAll(/<h2 id="([^"]+)"/g)].map(m => m[1]);

describe('translated guides', () => {
  /**
   * The ids are keys, not text. `lib/guides/sections.ts` reads them off `articleHtml` to build the
   * step list on `/inburgering`, and `lib/guides/progress.ts` stores reading progress under them —
   * which is why they are identical across locales and why translating one splits a single
   * section's progress into three, and empties the step list on the translated hub. Nothing else in
   * the stack notices: the page renders, `tsc` passes, the screenshot looks right.
   */
  it('keeps the <h2 id> sequence identical to the Dutch in every locale', () => {
    for (const guide of GUIDES) {
      const dutch = headingIds(guide.articleHtml);
      for (const locale of LOCALES) {
        const body = guide.translations?.[locale]?.articleHtml;
        if (!body) continue;
        expect(headingIds(body), `${guide.slug} (${locale})`).toEqual(dutch);
      }
    }
  });

  /**
   * `fact()`, `factTwo()` and `docent()` in `data/guides/kit.ts` hardcode "Bron:", "geraadpleegd"
   * and "NT2-docent". A translated body that calls them is a page that looks entirely finished with
   * Dutch chrome in the middle of it — the localised twins (`factIn` and friends) exist for this.
   */
  it('never leaves Dutch fact-box or docent chrome in a translated body', () => {
    for (const guide of GUIDES) {
      for (const locale of LOCALES) {
        const t = guide.translations?.[locale];
        if (!t?.articleHtml) continue;
        const body = `${t.articleHtml}${t.sidebarHtml ?? ''}`;
        expect(body, `${guide.slug} (${locale}) still says "Bron:"`).not.toContain('Bron:');
        expect(body, `${guide.slug} (${locale}) still says "Bronnen:"`).not.toContain('Bronnen:');
        expect(body, `${guide.slug} (${locale}) still says "geraadpleegd"`).not.toContain('geraadpleegd');
        expect(body, `${guide.slug} (${locale}) still says "NT2-docent"`).not.toContain('NT2-docent');
      }
    }
  });

  /**
   * A registry entry with no body would be worse than no entry: `hasTranslation()` keys on
   * `articleHtml`, so the locale would stay `noindex` while every count and every hreflang list
   * claimed the translation existed.
   */
  it('registers no translation without a body', () => {
    for (const [slug, locales] of Object.entries(TRANSLATIONS)) {
      expect(GUIDES.some(g => g.slug === slug), `${slug} is not a guide`).toBe(true);
      for (const locale of LOCALES) {
        const t = locales[locale];
        if (!t) continue;
        expect(t.articleHtml?.trim(), `${slug}.${locale} has no articleHtml`).toBeTruthy();
        expect(t.title?.trim(), `${slug}.${locale} has no meta title`).toBeTruthy();
      }
    }
  });

  /**
   * The hreflang set and the indexability decision are the same fact, and they were not always: the
   * routes advertised all three locales unconditionally while `robots` marked the untranslated ones
   * `noindex`. An hreflang pointing at a `noindex` page is a contradiction that costs the cluster
   * the signal for the locales that *are* translated.
   */
  it('claims an hreflang alternative only for a locale it can actually serve', () => {
    for (const guide of publishedGuides()) {
      const claimed = indexableLocales(guide);
      expect(claimed, `${guide.slug} must always claim Dutch`).toContain('nl');
      for (const locale of LOCALES) {
        const hasBody = Boolean(guide.translations?.[locale]?.articleHtml);
        expect(claimed.includes(locale), `${guide.slug} (${locale})`).toBe(hasBody);
      }
    }
  });

  /** The meta description band is enforced per locale elsewhere; this pins the resolver itself. */
  it('resolves a translated locale to its own strings, not to the Dutch', () => {
    for (const guide of GUIDES) {
      for (const locale of LOCALES) {
        if (!guide.translations?.[locale]?.articleHtml) continue;
        const resolved = getGuideLocale(guide, locale);
        expect(resolved.articleHtml, `${guide.slug} (${locale})`).not.toBe(guide.articleHtml);
        expect(resolved.title, `${guide.slug} (${locale})`).not.toBe(guide.title);
      }
    }
  });
});
