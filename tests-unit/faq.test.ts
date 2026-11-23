/**
 * De FAQ-hub (`data/faq.ts`). De regels die hier vastliggen zijn de regels die stil fout gaan: een
 * antwoord dat in één taal ontbreekt, een dubbel id (twee `<details>` met hetzelfde anker), een
 * verboden claim, en een sitemap die een `noindex`-pagina adverteert.
 */
import { describe, it, expect } from 'vitest';
import sitemap from '@/app/sitemap';
import { FAQ, FAQ_GROUPS, FAQ_INDEXED_LOCALES, FAQ_REVIEWED, faqLang } from '@/data/faq';
import { getGuideBySlug } from '@/data/guides/helpers';
import { getPostBySlug } from '@/data/blog-posts';
import { absUrl } from '@/lib/schema';

const texts = FAQ.flatMap(f => [f.q.nl, f.q.en, f.a.nl, f.a.en]);

describe('data/faq.ts', () => {
  it('has a Dutch and an English question and answer for every item', () => {
    for (const f of FAQ) {
      for (const lang of ['nl', 'en'] as const) {
        expect(f.q[lang]?.trim(), `${f.id}: q.${lang}`).toBeTruthy();
        expect(f.a[lang]?.trim(), `${f.id}: a.${lang}`).toBeTruthy();
        if (f.more) expect(f.more.label[lang]?.trim(), `${f.id}: more.label.${lang}`).toBeTruthy();
      }
    }
  });

  it('has unique ids, also against the group ids (both are anchors on the page)', () => {
    const ids = [...FAQ.map(f => f.id), ...FAQ_GROUPS.map(g => g.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses every group, and only groups that exist', () => {
    const known = new Set<string>(FAQ_GROUPS.map(g => g.id));
    for (const f of FAQ) expect(known.has(f.group), `${f.id}: unknown group ${f.group}`).toBe(true);
    for (const g of FAQ_GROUPS) {
      expect(FAQ.some(f => f.group === g.id), `group ${g.id} is empty`).toBe(true);
      expect(g.label.nl && g.label.en, `group ${g.id} label`).toBeTruthy();
    }
  });

  it('never claims that no AI was involved', () => {
    for (const text of texts) expect(text).not.toMatch(/geen AI|niet door AI|niet door een algoritme|no AI|without AI/i);
  });

  it('mentions 18/25 and 500 points only to say there is no official source', () => {
    for (const f of FAQ) {
      for (const lang of ['nl', 'en'] as const) {
        if (!/\b(18|19)\b.*\b25\b|\b500\b/.test(`${f.q[lang]} ${f.a[lang]}`)) continue;
        expect(f.a[lang], `${f.id}.${lang} states a pass mark`).toMatch(/geen van die twee getallen|no official source/i);
      }
    }
  });

  it('carries no emoji', () => {
    for (const text of texts) expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it('only cites https sources', () => {
    for (const f of FAQ) {
      if (!f.source) continue;
      expect(f.source.url, f.id).toMatch(/^https:\/\//);
      expect(f.source.label.trim(), f.id).toBeTruthy();
    }
  });

  it('links only to guides and posts that exist', () => {
    for (const f of FAQ) {
      if (!f.more) continue;
      if ('guide' in f.more) {
        const guide = getGuideBySlug(f.more.guide.section, f.more.guide.slug);
        expect(guide?.status, `${f.id}: guide ${f.more.guide.slug}`).toBe('reviewed');
      }
      if ('post' in f.more) expect(getPostBySlug(f.more.post), `${f.id}: post ${f.more.post}`).toBeDefined();
    }
  });

  it('falls back to English for a locale without its own text', () => {
    expect(faqLang('nl')).toBe('nl');
    expect(faqLang('en')).toBe('en');
    expect(faqLang('ar')).toBe('en');
  });
});

describe('the FAQ hub in the sitemap', () => {
  it('lists the indexed locales if and only if the page is reviewed', () => {
    const urls = sitemap().map(e => e.url);
    for (const locale of FAQ_INDEXED_LOCALES) {
      expect(urls.includes(absUrl(locale, 'veelgestelde-vragen')), `${locale} in sitemap`).toBe(FAQ_REVIEWED);
    }
    expect(urls.includes(absUrl('ar', 'veelgestelde-vragen'))).toBe(false);
    expect(FAQ_INDEXED_LOCALES).not.toContain('ar');
  });
});
