/**
 * The article-cover invariants.
 *
 * A cover is drawn from three things the guide already carries — `section` picks the field,
 * `pillar` decides the sun, `slug` seeds the street — plus one stored decision, `coverGlyph`.
 * Both rules below are the kind that fail *visually*, on a page nobody re-checks after adding a
 * guide, and neither is a type error:
 *
 *  - A **duplicate glyph** makes a grid look like a rendering bug rather than a design. It has
 *    already happened once: `knm-examen` and `staatsinrichting-en-rechtsstaat` were both drawn as
 *    the colonnade, which is KNM's own mark. It was caught by looking at a mockup, which is not a
 *    process that scales to the next twenty guides.
 *  - A **glyph that is not in the sheet** renders nothing at all: `GLYPHS[glyph]` is `undefined`,
 *    React renders empty, and the cover comes out as a bare navy rectangle with a band. The type
 *    prevents that in TypeScript, but the sheet and the union are two lists in two files and this
 *    is what keeps them the same list.
 */
import { describe, it, expect } from 'vitest';
import { GUIDES } from '@/data/guides';
import { GLYPHS } from '@/components/horizon/coverGlyphs';

describe('article covers', () => {
  it('gives every guide a cover glyph', () => {
    for (const g of GUIDES) {
      expect(g.coverGlyph, `${g.slug} has no coverGlyph`).toBeTruthy();
    }
  });

  it('only uses glyphs that exist in the sheet', () => {
    for (const g of GUIDES) {
      expect(
        typeof GLYPHS[g.coverGlyph],
        `${g.slug} uses "${g.coverGlyph}", which is not drawn in coverGlyphs.tsx`,
      ).toBe('function');
    }
  });

  it('never gives two guides the same glyph', () => {
    const byGlyph = new Map<string, string[]>();
    for (const g of GUIDES) {
      byGlyph.set(g.coverGlyph, [...(byGlyph.get(g.coverGlyph) ?? []), g.slug]);
    }
    const clashes = [...byGlyph.entries()].filter(([, slugs]) => slugs.length > 1);
    expect(
      clashes.map(([glyph, slugs]) => `${glyph}: ${slugs.join(', ')}`),
      'two guides share a cover glyph',
    ).toEqual([]);
  });

  /* The sun is a hierarchy signal, not decoration: at most one lit cover per cluster. If a second
     pillar is ever wanted in a section, that is a design decision and this test should be the
     thing that forces the conversation. `guides.test.ts` already caps pillars per section; this
     states the *reason* in the covers' own terms. */
  it('lights at most one cover per section', () => {
    for (const section of ['inburgering', 'knm', 'taalexamens'] as const) {
      const lit = GUIDES.filter(g => g.section === section && g.pillar);
      expect(lit.length, `${section} has ${lit.length} sunlit covers`).toBeLessThanOrEqual(1);
    }
  });
});
