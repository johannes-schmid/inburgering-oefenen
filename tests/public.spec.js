// @ts-check
import { test, expect } from '@playwright/test';
import { MODULE_PRICE_CENTS, BUNDLE_PRICE_CENTS, euro } from '../lib/pricing';

/**
 * The public site: homepage, the free funnel's picker, the exam overviews, pricing, legal.
 *
 * Written per **onderdeel**, which is the shape of this product — the suite this replaces was
 * organised around KNM's seven topic pages and a flat question pool, neither of which exists.
 *
 * Assertions are on structure and on the promises the product makes (four onderdelen always
 * visible, a concrete price, the free tier's boundary), not on wording. Copy changes weekly and a
 * test that fails on a reworded heading trains people to ignore the suite.
 */

const SKILLS = ['lezen', 'luisteren', 'schrijven', 'spreken'];

test.describe('homepage', () => {
  test('renders the public chrome and the primary CTA into the funnel', async ({ page }) => {
    await page.goto('/nl');

    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();

    // The funnel's entry point. `/oefenen` is the only route the hero CTA may go to — sending it
    // straight at an exam would skip the taster that qualifies the visitor.
    await expect(page.locator('a[href="/nl/oefenen"]').first()).toBeVisible();
  });

  test('all four onderdelen are on the page', async ({ page }) => {
    await page.goto('/nl');
    // A hard product rule (CLAUDE.md): Schrijven and Spreken stay visible even while their content
    // is thinner than Lezen's. Dropping one from the homepage was how the fork first went wrong.
    for (const skill of SKILLS) {
      await expect(
        page.locator(`a[href*="/oefenexamen/a2/${skill}"]`).first(),
        `${skill} should be linked from the homepage`
      ).toBeVisible();
    }
  });

  test('no emoji in the page content', async ({ page }) => {
    await page.goto('/nl');
    // The page's own content, with the shared chrome removed. Not `locator('main')`: the public
    // pages have no `<main>` landmark at all (see the note in the chrome test below), so that
    // locator silently matches nothing and the assertion would pass on an empty string.
    const text = await page.evaluate(() => {
      const clone = document.body.cloneNode(true);
      clone.querySelectorAll('header, footer, nav, script, style').forEach(el => el.remove());
      return clone.innerText ?? clone.textContent ?? '';
    });
    // Design rule with a real cause: emoji render per-platform and cannot be brand-matched, so the
    // UI uses lucide icons. Pictographs only — this must not trip on ± or €.
    const emoji = text.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}]/u);
    expect(emoji, `found emoji: ${emoji?.[0]}`).toBeNull();
  });

  // KNOWN FINDING, awaiting the owner's call: the language switcher in `components/Nav.tsx` labels
  // the three locales with flag emoji. It breaks the no-emoji rule on every page, and
  // flags-for-languages is its own bug — a Union Jack is not "English" for most of its readers.
  // Swapping them for the NL / EN / AR text already beside them is a two-line change, but it is a
  // visible design decision, so it waits.
  test.fixme('no emoji in the site chrome either', async ({ page }) => {
    await page.goto('/nl');
    const chrome = await page.locator('header').innerText();
    expect(chrome.match(/[\u{1F1E6}-\u{1F1FF}]/u)).toBeNull();
  });

  // KNOWN FINDING: the public pages render no `<main>` landmark, so a screen-reader user has no
  // skip-to-content target and every "the page content" query has to reconstruct it by removing the
  // chrome. The portal's AppShell does have one. One element in `(main)/layout.tsx` fixes it.
  test.fixme('the public pages have a main landmark', async ({ page }) => {
    await page.goto('/nl');
    await expect(page.locator('main')).toHaveCount(1);
  });
});

test.describe('the free picker at /oefenen', () => {
  test('offers Lezen and Luisteren as an immediate taster', async ({ page }) => {
    await page.goto('/nl/oefenen');

    for (const skill of ['lezen', 'luisteren']) {
      await expect(page.locator(`a[href="/nl/oefenen/${skill}"]`)).toBeVisible();
    }
  });

  test('routes Schrijven and Spreken to the account-required exam, not to a dead end', async ({ page }) => {
    await page.goto('/nl/oefenen');

    // These two have no static taster (they need a rubric and a grader), so the card points at
    // exam 1, which is free *with* an account. It must not render as "Binnenkort" — that was a
    // dead end on the main CTA and is the bug this branch exists to prevent.
    for (const skill of ['schrijven', 'spreken']) {
      await expect(page.locator(`a[href="/nl/oefenexamen/a2/${skill}/1"]`)).toBeVisible();
    }
  });
});

test.describe('exam overviews', () => {
  for (const skill of SKILLS) {
    test(`${skill} lists ten slots and is public`, async ({ page }) => {
      const res = await page.goto(`/nl/oefenexamen/a2/${skill}`);
      expect(res?.status()).toBe(200);

      await expect(page.locator('h1')).toBeVisible();
      // Ten practice exams per (level, skill) — the product's shape, from data/skills.ts. Counted as
      // *slots*, not links: an unpublished exam renders as a dimmed card rather than an anchor, so
      // counting anchors would silently pass with one authored exam and nine holes.
      await expect(page.locator('ul > li a.exam-card, ul > li > div').first()).toBeVisible();
      const slots = page.locator('ul').filter({ has: page.locator('.exam-card') }).first().locator('> li');
      await expect(slots).toHaveCount(10);
    });
  }

  test('the level-less URL still resolves, via a permanent redirect', async ({ page }) => {
    // next.config.ts 308s the pre-B1 paths. The `(?!a2$|b1$)` guard in that rule is what stops it
    // matching its own destination and looping, so this asserts the destination as well as the hop.
    const res = await page.goto('/nl/oefenexamen/lezen');
    expect(res?.status()).toBe(200);
    expect(page.url()).toContain('/nl/oefenexamen/a2/lezen');
  });
});

test.describe('the exam player is gated', () => {
  test('an anonymous visitor is sent to login, even for the free exam', async ({ page }) => {
    // Exam 1 is free, but free means "free with an account": results have to be attributable for
    // progress and grading to mean anything.
    await page.goto('/nl/oefenexamen/a2/lezen/1');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('pricing', () => {
  test('states concrete amounts in euros, and they match lib/pricing.ts', async ({ page }) => {
    await page.goto('/nl/premium');
    // The rendered markup, not `innerText`: parts of the pricing table sit below a hydration
    // boundary, so `innerText` returns only what happens to be laid out at that moment.
    const html = await page.locator('body').innerHTML();

    // Sourced from the module the checkout also prices against, so the page and the payment cannot
    // quietly disagree — and these cannot go stale the way a hardcoded 19,95 did.
    expect(html).toContain(euro(MODULE_PRICE_CENTS));
    expect(html).toContain(euro(BUNDLE_PRICE_CENTS));
  });

  test('shows a payment trust badge near the checkout CTA', async ({ page }) => {
    await page.goto('/nl/premium');
    // iDEAL is the Dutch default and its absence measurably costs conversion here.
    await expect(page.getByText(/ideal/i).first()).toBeVisible();
  });
});

test.describe('legal pages exist and are indexable', () => {
  for (const path of ['privacybeleid', 'gebruiksvoorwaarden', 'terugbetalingsbeleid', 'contact', 'docent']) {
    test(path, async ({ page }) => {
      const res = await page.goto(`/nl/${path}`);
      expect(res?.status()).toBe(200);
      await expect(page.locator('h1')).toBeVisible();
    });
  }
});

test.describe('the disabled surfaces are actually disabled', () => {
  // `lib/features.ts` is the switch. Blog is *on* now, so it is asserted live rather than absent —
  // this test failing after a flag flip is the point of it.
  test('leren has no route at all', async ({ page }) => {
    const res = await page.goto('/nl/leren');
    expect(res?.status()).toBe(404);
  });

  test('oefenvragen sends the visitor to the live funnel', async ({ page }) => {
    // It used to serve a 200 with an empty topic list — indexable, contentless, and titled "KNM".
    // A redirect rather than a 404 so any inbound link to the KNM-era URL lands somewhere useful.
    await page.goto('/nl/oefenvragen');
    await expect(page).toHaveURL(/\/nl\/oefenen$/);
  });

  test('blog renders while its flag is on', async ({ page }) => {
    const res = await page.goto('/nl/blog');
    expect(res?.status()).toBe(200);
  });
});
