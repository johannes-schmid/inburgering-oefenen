/**
 * Invariants of the kennisgids registry.
 *
 * These are the rules a guide file can break silently. A wrong `status` publishes unreviewed
 * content; a description outside 140–160 characters gets rewritten by Google; a `related` slug
 * that resolves to nothing renders an empty sidebar block. None of it fails a build.
 */
import { describe, it, expect } from 'vitest';
import { GUIDES } from '@/data/guides';
import { PLANNED_SURFACES, reservedSlugs } from '@/data/planned-surfaces';
import {
  publishedGuides,
  guideCount,
  getGuideBySlug,
  getGuideLocale,
  hasTranslation,
  relatedGuides,
} from '@/data/guides/helpers';

describe('the guide registry', () => {
  it('has a unique slug per section', () => {
    const seen = new Set<string>();
    for (const g of GUIDES) {
      const key = `${g.section}/${g.slug}`;
      expect(seen.has(key), `duplicate guide ${key}`).toBe(false);
      seen.add(key);
    }
  });

  it('uses url-safe lowercase slugs', () => {
    for (const g of GUIDES) {
      expect(g.slug, g.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('keeps meta titles at 60 characters or fewer', () => {
    for (const g of GUIDES) {
      expect(g.title.length, `${g.slug}: "${g.title}" is ${g.title.length}`).toBeLessThanOrEqual(60);
    }
  });

  it('keeps meta descriptions between 140 and 160 characters, in every locale it declares', () => {
    for (const g of GUIDES) {
      for (const locale of ['nl', 'en', 'ar'] as const) {
        if (locale !== 'nl' && !g.translations?.[locale]) continue;
        const n = getGuideLocale(g, locale).description.length;
        expect(n, `${g.slug} (${locale}) is ${n} characters`).toBeGreaterThanOrEqual(140);
        expect(n, `${g.slug} (${locale}) is ${n} characters`).toBeLessThanOrEqual(160);
      }
    }
  });
});

describe('the review gate', () => {
  it('never publishes a guide without a named reviewer and a review date', () => {
    for (const g of GUIDES) {
      if (g.status !== 'reviewed') continue;
      expect(g.reviewedBy, `${g.slug} is reviewed but names no reviewer`).toBeTruthy();
      expect(g.reviewedOn, `${g.slug} is reviewed but has no review date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('lists only reviewed guides', () => {
    for (const g of publishedGuides()) {
      expect(g.status).toBe('reviewed');
    }
    expect(publishedGuides().length).toBe(GUIDES.filter(g => g.status === 'reviewed').length);
  });

  it('counts per section, and the two counts add up', () => {
    expect(guideCount('inburgering') + guideCount('knm')).toBe(publishedGuides().length);
  });

  it('sorts the pillar first', () => {
    for (const section of ['inburgering', 'knm'] as const) {
      const list = publishedGuides(section);
      const firstSpoke = list.findIndex(g => !g.pillar);
      if (firstSpoke === -1) continue;
      expect(list.slice(firstSpoke).some(g => g.pillar), `a pillar follows a spoke in ${section}`).toBe(false);
    }
  });

  it('has at most one pillar per section', () => {
    for (const section of ['inburgering', 'knm'] as const) {
      expect(GUIDES.filter(g => g.section === section && g.pillar).length).toBeLessThanOrEqual(1);
    }
  });
});

describe('cross-links', () => {
  it('resolves every related guide slug within its own section', () => {
    for (const g of GUIDES) {
      for (const slug of g.related) {
        expect(getGuideBySlug(g.section, slug), `${g.slug} → ${slug} resolves to nothing`).toBeDefined();
      }
    }
  });

  it('never links a guide to itself', () => {
    for (const g of GUIDES) {
      expect(g.related).not.toContain(g.slug);
    }
  });

  it('drops drafts from the rendered related list', () => {
    for (const g of GUIDES) {
      for (const sibling of relatedGuides(g)) {
        expect(sibling.status).toBe('reviewed');
      }
    }
  });

  it('sends every CTA to a route that exists', () => {
    for (const g of GUIDES) {
      expect(['/oefenen', '/premium', '/docent']).toContain(g.ctaHref);
    }
  });
});

describe('translations', () => {
  it('treats Dutch as always present and a bodyless locale as absent', () => {
    for (const g of GUIDES) {
      expect(hasTranslation(g, 'nl')).toBe(true);
      for (const locale of ['en', 'ar'] as const) {
        expect(hasTranslation(g, locale)).toBe(Boolean(g.translations?.[locale]?.articleHtml));
      }
    }
  });

  it('falls back to the Dutch body rather than rendering nothing', () => {
    for (const g of GUIDES) {
      for (const locale of ['nl', 'en', 'ar'] as const) {
        expect(getGuideLocale(g, locale).articleHtml.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('route collisions', () => {
  /* `/knm/woordenlijst` is a static route and `/knm/[thema]` is its dynamic sibling. In the App
   * Router the static segment wins, so a guide authored with slug `woordenlijst` would be written,
   * pass every other test here, appear on its hub and in the sitemap — and serve the placeholder
   * page instead of itself. Nothing else in the stack notices. Hence a test rather than a comment.
   *
   * The reserved set is derived from `data/planned-surfaces.ts`, so registering a new placeholder
   * reserves its slug automatically. */
  it('never authors a guide at a slug a static route already serves', () => {
    for (const g of GUIDES) {
      const reserved = reservedSlugs(g.section);
      expect(reserved, `${g.section}/${g.slug} collides with a static route`).not.toContain(g.slug);
    }
  });

  it('keeps every planned surface pointing at a section that exists', () => {
    for (const s of PLANNED_SURFACES) {
      expect(['inburgering', 'knm', 'taalexamens']).toContain(s.section);
      // The last path segment must be the declared slug, or the reserved-slug test guards nothing.
      expect(s.href.endsWith(`/${s.slug}`), `${s.href} does not end in /${s.slug}`).toBe(true);
    }
  });

  it('gives every planned surface somewhere else to go', () => {
    // A placeholder with no onward links is a dead end, which is the one thing it must not be.
    for (const s of PLANNED_SURFACES) {
      expect(s.related.length, `${s.href} has no related links`).toBeGreaterThan(0);
    }
  });
});

describe('sourcing discipline', () => {
  /* `SEO/facts.md` §9 is an explicit do-not-publish list. The two entries every competitor states
   * and none can source are the raw pass norm and the "500 punten" threshold. A guide asserting
   * either would be the one claim on the site that cannot be defended. */
  it('states neither the unsourceable pass norm nor the 500-punten threshold', () => {
    for (const g of GUIDES) {
      const body = [g.articleHtml, g.sidebarHtml, ...g.faq.flatMap(f => [f.q, f.a])].join(' ');
      expect(body, `${g.slug} states a raw pass norm`).not.toMatch(/1[89]\s*(van de|\/)\s*25/i);
      expect(body, `${g.slug} states the 500-punten threshold`).not.toMatch(/500\s*punten/i);
    }
  });

  it('wraps every guide body claim that cites a source in a fact box with a consulted-on date', () => {
    for (const g of GUIDES) {
      const boxes = g.articleHtml.match(/class="fact-box"/g)?.length ?? 0;
      const sources = g.articleHtml.match(/fact-box-source/g)?.length ?? 0;
      expect(sources, `${g.slug}: ${boxes} fact boxes but ${sources} sources`).toBe(boxes);
      for (const m of g.articleHtml.matchAll(/class="fact-box-source">([\s\S]*?)<\/p>/g)) {
        expect(m[1], `${g.slug}: a fact box has no consulted-on date`).toMatch(/geraadpleegd \d{2}-\d{2}-\d{4}/);
        expect(m[1], `${g.slug}: a fact box has no source link`).toMatch(/href="https:\/\//);
      }
    }
  });
});
