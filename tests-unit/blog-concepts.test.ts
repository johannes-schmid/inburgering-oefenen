/**
 * Een concept is een post die de docent nog niet heeft nagekeken. Hij mag op precies één plek
 * bestaan: zijn eigen URL. Alles wat posts opsomt (blogoverzicht, /gidsen, sitemap, llms.txt) leest
 * `getSortedPosts()`, dus dat is de ene plek waar de regel moet kloppen.
 */
import { describe, it, expect } from 'vitest';
import POSTS, { getSortedPosts, getPostBySlug, isPublished } from '@/data/blog-posts';
import sitemap from '@/app/sitemap';

const concepts = POSTS.filter(p => p.status === 'concept');

describe('blog concepts', () => {
  it('never lists a concept', () => {
    const listed = new Set(getSortedPosts().map(p => p.slug));
    for (const p of concepts) expect(listed.has(p.slug), `${p.slug} is listed`).toBe(false);
  });

  it('keeps a concept reachable on its own URL, so the docent can read it', () => {
    for (const p of concepts) expect(getPostBySlug(p.slug)?.slug).toBe(p.slug);
  });

  it('keeps every concept out of the sitemap', () => {
    const urls = sitemap().map(e => e.url);
    for (const p of concepts) {
      expect(urls.some(u => u.includes(`/blog/${p.slug}`)), `${p.slug} is in the sitemap`).toBe(false);
    }
  });

  it('treats a post without a status as published', () => {
    expect(POSTS.filter(isPublished).length).toBe(POSTS.length - concepts.length);
    expect(getSortedPosts().length).toBeGreaterThan(0);
  });

  it('never has a published post point its related cards at a concept', () => {
    const conceptSlugs = new Set(concepts.map(p => p.slug));
    for (const p of POSTS.filter(isPublished)) {
      for (const r of p.relatedPosts) expect(conceptSlugs.has(r.slug), `${p.slug} links to concept ${r.slug}`).toBe(false);
    }
  });
});

describe('landing pages in the sitemap', () => {
  it('lists herexamen and voorbeeldvragen in Dutch and English, never in Arabic', () => {
    const urls = sitemap().map(e => e.url);
    for (const tail of ['/nl/herexamen', '/en/retake-exam', '/nl/voorbeeldvragen', '/en/example-questions']) {
      expect(urls.some(u => u.endsWith(tail)), `${tail} missing`).toBe(true);
    }
    expect(urls.some(u => u.includes('/ar/') && /%D8%A5%D8%B9%D8%A7%D8%AF%D8%A9|إعادة-الامتحان|أسئلة-نموذجية/.test(u))).toBe(false);
  });
});
