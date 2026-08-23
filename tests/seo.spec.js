// @ts-check
import { test, expect } from '@playwright/test';

/**
 * The on-page SEO rules from `SEO/README.md`, as tests.
 *
 * These are in the suite rather than in a checklist because they are the failures nobody notices:
 * a duplicated meta description or a canonical pointing at the wrong locale costs traffic silently
 * for months. Every rule here is one a human reviewer has already missed at least once.
 */

const PAGES = [
  '/nl',
  '/nl/oefenen',
  '/nl/oefenexamen/a2/lezen',
  '/nl/oefenexamen/a2/luisteren',
  '/nl/oefenexamen/a2/schrijven',
  '/nl/oefenexamen/a2/spreken',
  '/nl/premium',
  '/nl/docent',
  '/nl/inburgering',
  '/nl/knm',
  '/nl/taalexamens',
];

test.describe('metadata', () => {
  test('every indexable page has a 140–160 character description', async ({ page }) => {
    const problems = [];
    for (const path of PAGES) {
      await page.goto(path);
      const desc = await page.locator('meta[name="description"]').getAttribute('content');
      if (!desc) {
        problems.push(`${path}: no description`);
      } else if (desc.length < 140 || desc.length > 160) {
        problems.push(`${path}: ${desc.length} chars`);
      }
    }
    expect(problems, problems.join('\n')).toEqual([]);
  });

  test('titles and descriptions are unique across pages', async ({ page }) => {
    const titles = new Map();
    const descs = new Map();
    // Collected rather than asserted in the loop, so one run reports every collision instead of
    // stopping at the first.
    const collisions = [];

    for (const path of PAGES) {
      await page.goto(path);
      const title = await page.title();
      const desc = (await page.locator('meta[name="description"]').getAttribute('content')) ?? '';
      // Four exam overviews built from one template is exactly where duplication happens, and
      // Search Console only reports it as "duplicate meta description" weeks later.
      if (titles.has(title)) collisions.push(`title shared: ${titles.get(title)} + ${path}`);
      if (descs.has(desc)) collisions.push(`description shared: ${descs.get(desc)} + ${path}`);
      titles.set(title, path);
      descs.set(desc, path);
    }

    expect(collisions, collisions.join('\n')).toEqual([]);
  });

  test('the canonical points at the page it is on, in its own locale', async ({ page }) => {
    for (const path of ['/nl', '/nl/premium', '/en', '/en/premium']) {
      await page.goto(path);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical, `${path} canonical`).toBeTruthy();
      const locale = path.split('/')[1];
      expect(canonical, `${path} canonical should stay in /${locale}`).toContain(`/${locale}`);
    }
  });

  test('hreflang covers all three locales plus x-default', async ({ page }) => {
    await page.goto('/nl');
    for (const lang of ['nl', 'en', 'ar', 'x-default']) {
      await expect(page.locator(`link[rel="alternate"][hreflang="${lang}"]`)).toHaveCount(1);
    }
  });

  test('no h1 splits a sentence with a <br>', async ({ page }) => {
    for (const path of PAGES) {
      await page.goto(path);
      const brs = await page.locator('h1 br').count();
      expect(brs, `${path} h1 contains a <br>`).toBe(0);
    }
  });
});

test.describe('crawlability', () => {
  test('the sitemap serves and lists the exam overviews', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    const xml = await res.text();
    expect(xml).toContain('/oefenexamen/a2/lezen');
    /* B1 joined the sitemap on 2026-08-23, when the docent signed its content off — but only the
       three onderdelen that have any. B1 Luisteren's format is unverified (`itemCount === null`,
       `data/skills.ts`), its overview is `noindex`, and a sitemap entry for a noindex URL is the
       contradiction this assertion exists to catch. The overview page's `robots` and this loop are
       gated on the same fact; that is what stops them drifting. */
    for (const skill of ['lezen', 'schrijven', 'spreken']) {
      expect(xml).toContain(`/oefenexamen/b1/${skill}`);
    }
    expect(xml).not.toContain('/oefenexamen/b1/luisteren');

    // The free B1 taster, derived from B1 Lezen exam 1. Lezen only — see `lib/free-practice-b1.ts`.
    expect(xml).toContain('/oefenen/b1/lezen');
    expect(xml).not.toContain('/oefenen/b1/luisteren');
  });

  test('admin is noindex', async ({ page }) => {
    await page.goto('/nl/admin-login');
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots).toMatch(/noindex/);
  });
});
