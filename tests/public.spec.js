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

  // Was a `test.fixme` until 2026-08-20: the language switcher labelled the three locales with flag
  // emoji, the one place in the UI breaking the no-emoji rule. They are gone — flags-for-languages
  // was its own bug anyway (a Union Jack is not "English" for most of this site's readers), and
  // dropping them also bought header width. Now a live test so they cannot come back.
  test('no emoji in the site chrome either', async ({ page }) => {
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

test.describe('the kennisgids sections', () => {
  /* M1 shipped the IA before the content. Both hubs are live and indexable from day one, so what
   * matters is that neither is an empty page: each carries its own orientation, and the nav points
   * at both. A hub that 200s with no h1 is the failure mode. */
  for (const path of ['inburgering', 'knm']) {
    test(`/${path} is public and has a heading`, async ({ page }) => {
      const res = await page.goto(`/nl/${path}`);
      expect(res?.status()).toBe(200);
      await expect(page.locator('h1')).toBeVisible();
      // Orientation, not a "binnenkort" placeholder: the hub always renders its phase cards.
      expect(await page.locator('main ol > li').count()).toBeGreaterThanOrEqual(5);
    });
  }

  test('both hubs are reachable from the site chrome', async ({ page }) => {
    await page.goto('/nl');
    await expect(page.locator('footer a[href="/nl/inburgering"]')).toHaveCount(1);
    await expect(page.locator('footer a[href="/nl/knm"]')).toHaveCount(1);
  });

  test('the header groups both hubs and the blog under one content dropdown', async ({ page }) => {
    /* One content parent, not one top-level item per section — the pattern theorie.nl and IELTS
     * use. Pinning it because the alternative (a top-level item per section) is what a later edit
     * drifts back towards, and it grows the header by one item per milestone. */
    // The desktop bar only exists at `xl` — six items do not fit at `md`, where it used to live.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/nl');
    const nav = page.locator('nav[aria-label="Hoofdmenu"]');

    /* Five top-level entries: three content sections, Oefenexamens, Docent. MILESTONES §3's four
     * sections plus the docent page. Modules is deliberately *inside* the Oefenexamens dropdown
     * (owner's decision, 2026-08-20) — buying access and practising are one intent apart, and it
     * keeps the bar uncrowded. This pinned 4 under M1's single dropdown and 6 before Modules moved. */
    expect(await nav.locator(':scope > *').count()).toBe(5);

    // Each content section opens on hover — not click, which toggles it shut again — and holds its
    // own Gidsen/Tools groups. Asserted per section because the desktop panel and the mobile
    // drawer render from one definition, and a regression would drop a whole group silently.
    const sections = [
      { i: 0, links: ['/nl/inburgering', '/nl/blog', '/nl/inburgering/tools/tijdlijn'] },
      { i: 1, links: ['/nl/knm', '/nl/knm/woordenlijst'] },
      { i: 2, links: ['/nl/taalexamens', '/nl/taalexamens/woordenlijst', '/nl/taalexamens/grammatica'] },
      // Oefenexamens: the four onderdelen, then the way to unlock them. Premium is reachable from
      // the header only through here now, so if this link goes the money page loses its nav entry.
      { i: 3, links: ['/nl/premium'] },
    ];
    for (const { i, links } of sections) {
      await nav.getByRole('button').nth(i).hover();
      for (const href of links) {
        await expect(nav.locator(`a[href="${href}"]`)).toHaveCount(1);
      }
    }
  });

  test('the mobile drawer holds every section, each link once', async ({ page }) => {
    /* The drawer is the whole menu below `xl`, so it must be complete — and it renders every label
     * a second time from the same definition. In M1 that duplication shipped the Blog link twice
     * on mobile after it was removed once on desktop, caught only by reading a screenshot. */
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/nl');
    await page.getByRole('button', { name: /menu openen/i }).click();

    const drawer = page.locator('nav[aria-label="Mobiel menu"], header nav').last();
    for (const href of [
      '/nl/inburgering', '/nl/blog', '/nl/inburgering/tools/tijdlijn',
      '/nl/knm', '/nl/knm/woordenlijst',
      '/nl/taalexamens', '/nl/taalexamens/woordenlijst', '/nl/taalexamens/grammatica',
      '/nl/premium', '/nl/docent',
    ]) {
      await expect(drawer.locator(`a[href="${href}"]`), href).toHaveCount(1);
    }
  });

  test('a planned surface is reachable, noindex, and never a dead end', async ({ page }) => {
    /* The placeholder gate. These pages are announced in the nav before they work, so they must be
     * readable (the reader followed a menu item) and must not compete in search. */
    const res = await page.goto('/nl/inburgering/tools/tijdlijn');
    expect(res?.status()).toBe(200);
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots).toMatch(/noindex/);
    await expect(page.locator('h1')).toBeVisible();
    // It must offer somewhere real to go — the pillar, in this case.
    await expect(
      page.locator('a[href="/nl/inburgering/inburgering-stappenplan"]').first(),
    ).toBeVisible();
    // And carry no structured data, which would contradict its own robots tag.
    expect(await page.locator('script[type="application/ld+json"]').count()).toBe(0);
  });

  test('the published pillar is indexable and listed on its hub', async ({ page }) => {
    /* The positive half of the review gate. Until 2026-08-19 this slug was the draft fixture and
     * this test asserted noindex; the pillar is now reviewed, so the same URL must be indexable,
     * carry the reviewer line, and be reachable from its hub. The draft side of the gate is
     * pinned by tests-unit/guides.test.ts (no reviewed guide without reviewer + date) and will
     * regain an e2e case with M2's first draft spoke. */
    const res = await page.goto('/nl/inburgering/inburgering-stappenplan');
    expect(res?.status()).toBe(200);
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots ?? '').not.toMatch(/noindex/);
    await expect(page.locator('h1')).toBeVisible();
    await page.goto('/nl/inburgering');
    await expect(page.locator('a[href="/nl/inburgering/inburgering-stappenplan"]').first()).toBeVisible();
  });

  test('the sitemap lists the hubs and the published pillar', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    expect(xml).toContain('/nl/inburgering');
    expect(xml).toContain('/nl/knm');
    expect(xml).toContain('/nl/taalexamens');
    // Dutch only: the guide has no translations yet, and an untranslated locale is noindex.
    expect(xml).toContain('/nl/inburgering/inburgering-stappenplan');
    expect(xml).not.toContain('/en/inburgering/inburgering-stappenplan');
    // Planned surfaces are noindex, so advertising them would contradict their own meta tag.
    for (const slug of ['tijdlijn', 'woordenlijst', 'grammatica']) {
      expect(xml, `${slug} must not be in the sitemap`).not.toContain(slug);
    }
  });
});

test.describe('the language switcher', () => {
  /* It did nothing on every dynamic route until 2026-08-19: `usePathname()` returns the template
   * ('/blog/[slug]') and `router.replace` was called without `params`, so the select changed and
   * the URL did not. Nothing caught it, on five blog posts and both tasters. Pinned per route
   * shape — static, one dynamic segment, three of them, and a translated slug. */
  for (const [path, expected] of [
    ['/nl/premium', /\/en\/premium$/],
    ['/nl/blog/inburgeringsexamen-a2-uitleg', /\/en\/blog\/inburgeringsexamen-a2-uitleg$/],
    ['/nl/oefenexamen/a2/spreken', /\/en\/oefenexamen\/a2\/spreken$/],
    ['/nl/inburgering/inburgering-stappenplan', /\/en\/inburgering\/inburgering-stappenplan$/],
    // The 2026-08-20 routes: a hub, a nested tool, and a static child that shadows a [slug] route.
    ['/nl/taalexamens', /\/en\/taalexamens$/],
    ['/nl/inburgering/tools/tijdlijn', /\/en\/inburgering\/tools\/tijdlijn$/],
    ['/nl/knm/woordenlijst', /\/en\/knm\/woordenlijst$/],
  ]) {
    test(`switches locale on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.selectOption('select[aria-label="Taal"]', 'en');
      await expect(page).toHaveURL(expected);
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
