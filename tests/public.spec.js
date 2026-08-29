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

  // Was a `test.fixme` until 2026-08-20, when the flag *emoji* came out of the language switcher —
  // the one place in the UI breaking the no-emoji rule. The flags came back on 2026-08-28 as inline
  // SVG (`components/site/LocaleFlag.tsx`), which is why this still passes: the rule is about
  // emoji, which render per-platform and are missing entirely on Windows, not about flags.
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

  test('carries B1 and KNM beside A2, each reachable from the picker', async ({ page }) => {
    await page.goto('/nl/oefenen');

    // B1 Lezen is an anonymous taster; B1 Schrijven/Spreken are free *with* an account, which
    // only holds because B1 exam 1 is `is_free`. KNM has no level in its URL at any depth.
    // `:visible` throughout: both flows are in the DOM at every width and the inactive one is
    // hidden by a media query, so a plain locator matches two nodes and a count assertion would
    // never reach zero.
    await page.getByRole('button', { name: /Taal B1/ }).first().click();
    await expect(page.locator('a[href="/nl/oefenen/b1/lezen"]:visible')).toHaveCount(1);
    for (const skill of ['schrijven', 'spreken']) {
      await expect(page.locator(`a[href="/nl/oefenexamen/b1/${skill}/1"]:visible`)).toHaveCount(1);
    }

    await page.getByRole('button', { name: /KNM/ }).first().click();
    await expect(page.locator('a[href="/nl/oefenen/knm"]:visible')).toHaveCount(1);
  });

  test('is a two-screen flow on a phone: examen first, onderdeel second', async ({ page }) => {
    // The desktop panel and the phone's second screen render from one data set, so this is the
    // only place the *flow* is pinned: on a phone nothing about the onderdelen is on screen
    // until an examen is chosen, and the back control returns to the choice.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/nl/oefenen');

    const lezen = page.locator('a[href="/nl/oefenen/lezen"]:visible');
    await expect(lezen).toHaveCount(0);
    await page.getByRole('button', { name: /Taal A2/ }).first().click();
    await expect(lezen).toHaveCount(1);

    await page.getByRole('button', { name: 'Examen' }).click();
    await expect(lezen).toHaveCount(0);
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
    // next.config.ts 308s the pre-B1 paths. The allowlist in that rule is what stops it matching
    // its own destination and looping, so this asserts the destination as well as the hop.
    const res = await page.goto('/nl/oefenexamen/lezen');
    expect(res?.status()).toBe(200);
    expect(page.url()).toContain('/nl/oefenexamen/a2/lezen');
  });

  /**
   * KNM's overview is a *static* sibling of `[level]`, because KNM carries no CEFR level.
   *
   * Both of these are regression pins for the same near-miss. The A2-implicit redirect in
   * next.config.ts used a negative lookahead whose `$` anchors against the whole path, so it
   * only ever excluded a value that ended the URL: `/oefenexamen/knm` was fine and
   * `/oefenexamen/knm/1` 308'd to `/oefenexamen/a2/knm/1`, which is not a route. The whole
   * onderdeel 404'd while `next build` listed both pages as present, and tsc was clean.
   */
  test('KNM lists ten slots at its own level-less URL', async ({ page }) => {
    const res = await page.goto('/nl/oefenexamen/knm');
    expect(res?.status()).toBe(200);
    expect(page.url()).toContain('/nl/oefenexamen/knm');

    await expect(page.locator('h1')).toBeVisible();
    const slots = page.locator('ul').filter({ has: page.locator('.exam-card') }).first().locator('> li');
    await expect(slots).toHaveCount(10);
  });

  test('a KNM exam URL is not rewritten into the A2 shape', async ({ page }) => {
    await page.goto('/nl/oefenexamen/knm/1');
    expect(page.url()).not.toContain('/oefenexamen/a2/knm');
  });
});

test.describe('the exam player is gated', () => {
  test('an anonymous visitor is sent to register, even for the free exam', async ({ page }) => {
    // Exam 1 is free, but free means "free with an account": results have to be attributable for
    // progress and grading to mean anything. The player is the conversion wall — the portal
    // around it is browsable without an account, so this redirect goes to /register, not /login.
    await page.goto('/nl/oefenexamen/a2/lezen/1');
    await expect(page).toHaveURL(/\/register\?next=/);
  });

  test('the portal itself is browsable without an account', async ({ page }) => {
    await page.goto('/nl/dashboard');
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.locator('a[href*="/register"]').first()).toBeVisible();
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

  test('the header is four plain links, and both landing pages carry what it dropped',
    async ({ page }) => {
      /* The bar became four plain links on 2026-08-22 (owner's decision): Platform · Gidsen ·
       * Prijzen · Over ons, no dropdowns. The panels that went away were a site-wide internal
       * link to ~20 destinations, so this test is really two: the bar is four links, **and** the
       * two pages behind them carry what the panels used to. A regression on the second half is
       * invisible — every page still renders, the links are simply gone from the site. */
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/nl');
      const nav = page.locator('nav[aria-label="Hoofdmenu"]');
      expect(await nav.locator(':scope > *').count()).toBe(4);
      for (const href of ['/nl/platform', '/nl/gidsen', '/nl/premium', '/nl/docent']) {
        await expect(nav.locator(`a[href="${href}"]`), href).toHaveCount(1);
      }
      // No dropdown left in the bar.
      await expect(nav.getByRole('button')).toHaveCount(0);

      // Platform: the four onderdelen, the taster, the tool and the money page.
      await page.goto('/nl/platform');
      for (const href of [
        '/nl/oefenexamen/a2/lezen', '/nl/oefenexamen/a2/luisteren',
        '/nl/oefenexamen/a2/schrijven', '/nl/oefenexamen/a2/spreken',
        '/nl/oefenen', '/nl/taalexamens', '/nl/inburgering/tools/tijdlijn', '/nl/premium',
      ]) {
        await expect(page.locator(`main a[href="${href}"]`).first(), href).toBeVisible();
      }
      /* B1 is live and linked since 2026-08-23 — it could not be while it was `noindex` behind
         the docent's review gate, because a link from here would have handed a crawler exactly
         the pages we told it to ignore. The two genuinely unbuilt tracks are still not links,
         which is the part of this assertion that still has teeth. */
      await expect(page.getByText('Taalexamens B1')).toBeVisible();
      await expect(page.locator('main a[href*="/knm/oefenexamen"]')).toHaveCount(0);

      // Gidsen: every published guide, the three hubs and the blog.
      await page.goto('/nl/gidsen');
      for (const href of [
        '/nl/inburgering/moet-ik-inburgeren', '/nl/inburgering/welke-wet-en-welke-route',
        '/nl/inburgering/inburgering-stappenplan', '/nl/inburgering/wat-kost-inburgeren',
        '/nl/inburgering', '/nl/taalexamens', '/nl/knm', '/nl/blog',
      ]) {
        await expect(page.locator(`main a[href="${href}"]`).first(), href).toBeVisible();
      }
    });

  test('the mobile drawer is the same four links plus the CTA', async ({ page }) => {
    /* The drawer is the whole menu below `menu:`. It renders from the same array as the bar, which
     * is what stops the M1 bug where a link was removed on desktop and shipped twice on mobile. */
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/nl');
    await page.getByRole('button', { name: /menu openen/i }).click();

    const drawer = page.locator('nav[aria-label="Mobiel menu"], header nav').last();
    for (const href of ['/nl/platform', '/nl/gidsen', '/nl/premium', '/nl/docent', '/nl/login']) {
      await expect(drawer.locator(`a[href="${href}"]`), href).toHaveCount(1);
    }
    // The CTA at the bottom, where the thumb is.
    await expect(drawer.locator('a[href="/nl/oefenen"]').last()).toBeVisible();
  });

  test('a planned surface is reachable, noindex, and never a dead end', async ({ page }) => {
    /* The placeholder gate. These pages are announced in the nav before they work, so they must be
     * readable (the reader followed a menu item) and must not compete in search. */
    const res = await page.goto('/nl/knm/woordenlijst');
    expect(res?.status()).toBe(200);
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots).toMatch(/noindex/);
    await expect(page.locator('h1')).toBeVisible();
    // It must offer somewhere real to go.
    await expect(page.locator('a[href="/nl/oefenen"]').first()).toBeVisible();
    // And carry no structured data, which would contradict its own robots tag.
    expect(await page.locator('script[type="application/ld+json"]').count()).toBe(0);
  });

  test('the tijdlijn tool is indexable, static-first, and asks nothing before it explains itself', async ({ page }) => {
    /* This one replaced its own placeholder. It is the opposite case: a real page that must be
     * indexable, because the whole SEO play is that DUO's equivalent wizard is noindex. */
    const res = await page.goto('/nl/inburgering/tools/tijdlijn');
    expect(res?.status()).toBe(200);
    /* An indexable page emits **no** robots tag at all, so this asserts absence and only reads the
     * content when a tag exists. Waiting for the element instead just times out — which is what the
     * first version of this test did, and it is a good reminder that "not noindex" and "has a robots
     * tag saying index" are different assertions. */
    const robotsCount = await page.locator('meta[name="robots"]').count();
    if (robotsCount > 0) {
      const robots = await page.locator('meta[name="robots"]').first().getAttribute('content');
      expect(robots ?? '').not.toMatch(/noindex/);
    }

    // The landmark is in the server HTML, not conditional on hydration.
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();

    // The privacy promise is on the page, not in a footer: it is the reason people trust it.
    await expect(page.getByText(/DigiD/i).first()).toBeVisible();

    // It owns a WebApplication node and never grows a rating — the tool has no reviews.
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.join(' ')).toContain('WebApplication');
    expect(blocks.join(' ')).not.toContain('aggregateRating');

    // The wizard opens on the reader's own action, and the first question is answerable.
    await page.getByRole('button', { name: /Maak mijn tijdlijn/i }).click();
    await expect(page.getByText(/Vraag 1 van/)).toBeVisible();
  });

  test('the published pillar is indexable and listed on its hub', async ({ page }) => {
    /* The positive half of the review gate. Until 2026-08-19 this slug was the draft fixture and
     * this test asserted noindex; the pillar is now reviewed, so the same URL must be indexable,
     * carry the reviewer line, and be reachable from its hub. The draft side of the gate is
     * pinned by tests-unit/guides.test.ts (no reviewed guide without reviewer + date) and will
     * regain an e2e case with M2's first draft spoke. */
    const res = await page.goto('/nl/inburgering/inburgering-stappenplan');
    expect(res?.status()).toBe(200);
    /* An indexable page emits **no** robots tag at all, so this asserts absence and only reads the
     * content when a tag exists. Waiting for the element instead just times out — which is what the
     * first version of this test did, and it is a good reminder that "not noindex" and "has a robots
     * tag saying index" are different assertions. */
    const robotsCount = await page.locator('meta[name="robots"]').count();
    if (robotsCount > 0) {
      const robots = await page.locator('meta[name="robots"]').first().getAttribute('content');
      expect(robots ?? '').not.toMatch(/noindex/);
    }
    await expect(page.locator('h1')).toBeVisible();
    await page.goto('/nl/inburgering');
    /* Attached, not visible: since 2026-08-22 the hub is a three-fase `tablist` and the pillar sits
     * in the closed fase 3, so only one fase's links are on screen at a time. The link must still be
     * in the document — that is what a pillar-cluster hub is *for* — and the fase-switching test
     * below owns the reader-facing half. */
    await expect(page.locator('a[href="/nl/inburgering/inburgering-stappenplan"]').first()).toBeAttached();
  });

  test('the four Inburgering guides are published and listed on their hub', async ({ page }) => {
    /* The cluster shipped 2026-08-20 as the "Inburgeren" dropdown's four entries. Pinned as a set
     * rather than one by one, because the failure this guards against is one of them silently
     * dropping out — a menu item that 404s, or a guide flipped back to `draft` and still linked
     * from every page's header. The header side is pinned by the section list above; this test
     * owns the guides themselves. The order is the order a reader needs them in. */
    const SPOKES = [
      'moet-ik-inburgeren',
      'welke-wet-en-welke-route',
      'inburgering-stappenplan',
      'wat-kost-inburgeren',
    ];

    for (const slug of SPOKES) {
      const res = await page.goto(`/nl/inburgering/${slug}`);
      expect(res?.status(), slug).toBe(200);
      const robots = await page.locator('meta[name="robots"]').getAttribute('content');
      expect(robots ?? '', slug).not.toMatch(/noindex/);
      // A reviewed guide always names its reviewer — that line is the USP made visible.
      await expect(page.getByText(/Marieke Schipper/i).first(), slug).toBeVisible();
    }

    await page.goto('/nl/inburgering');
    for (const slug of SPOKES) {
      /* Every guide keeps a plain, hash-free link from its hub even while its fase is closed. This
       * is the assertion that caught the redesign rendering only the open fase's panel, which had
       * left two of the four guides with no internal link from the page that exists to link them. */
      await expect(
        page.locator(`a[href="/nl/inburgering/${slug}"]`).first(),
        `${slug} on the hub`,
      ).toBeAttached();
    }
  });

  test('the hub is a route in three fasen, and switching one shows its steps', async ({ page }) => {
    /* The reader-facing half of the hub. Three things, all of them things a later redesign could
     * quietly drop: the three fasen exist as real tabs, exactly one is open at a time, and opening
     * a fase reveals *its* guides rather than leaving the previous fase's on screen. Asserted on
     * structure and hrefs, never on the fase labels, which are copy. */
    await page.goto('/nl/inburgering');

    const tabs = page.locator('[role="tab"]');
    await expect(tabs).toHaveCount(3);
    await expect(page.locator('[role="tab"][aria-selected="true"]')).toHaveCount(1);

    // Fase 1's guides are the visible ones; fase 3's pillar is present but not on screen.
    const pillar = page.locator('a[href="/nl/inburgering/inburgering-stappenplan"]').first();
    await expect(page.locator('a[href="/nl/inburgering/moet-ik-inburgeren"]').first()).toBeVisible();
    await expect(pillar).toBeHidden();

    // Open the third fase; its guide becomes visible and fase 1's steps go away.
    await tabs.nth(2).click();
    await expect(pillar).toBeVisible();
    await expect(page.locator('a[href="/nl/inburgering/moet-ik-inburgeren"]').first()).toBeHidden();
    await expect(page.locator('[role="tab"][aria-selected="true"]')).toHaveCount(1);
  });

  test('a guide shows its own sections and its place in the route', async ({ page }) => {
    /* The article side of the redesign. The outline in the sidebar is derived from the guide's own
     * `<h2 id>`s, so this pins that the derivation actually produced links and that each one points
     * at a heading that exists — a jump to a missing anchor is silent in the browser. */
    await page.goto('/nl/inburgering/moet-ik-inburgeren');

    // The compact fase strip marks exactly one fase as the current step.
    await expect(page.locator('[aria-current="step"]')).toHaveCount(1);

    const nav = page.locator('nav[aria-label="De stappen in deze gids"]');
    await expect(nav).toBeVisible();
    const links = nav.locator('a[href^="#"]');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(2);

    for (let i = 0; i < count; i++) {
      const hash = await links.nth(i).getAttribute('href');
      await expect(page.locator(`h2${hash}`), `heading for ${hash}`).toHaveCount(1);
    }
  });

  test('the sitemap lists the hubs and every translated guide', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    expect(xml).toContain('/nl/inburgering');
    expect(xml).toContain('/nl/knm');
    expect(xml).toContain('/nl/taalexamens');
    /* All four Inburgering guides carry English and Arabic bodies since 2026-08-20, so all three
     * locales belong in the sitemap. Until then this asserted the opposite — Dutch only — because
     * a locale without its own body is noindex and advertising it would contradict that tag.
     * **That rule still holds.** If a future guide ships Dutch-first, its `en`/`ar` URLs must be
     * absent here, and this list is where that gets caught. */
    for (const slug of [
      'inburgering-stappenplan', 'moet-ik-inburgeren',
      'welke-wet-en-welke-route', 'wat-kost-inburgeren',
    ]) {
      for (const locale of ['nl', 'en', 'ar']) {
        expect(xml, `${locale}/${slug}`).toContain(`/${locale}/inburgering/${slug}`);
      }
    }
    // The tijdlijn tool is a real, indexable page and must be advertised.
    for (const locale of ['nl', 'en', 'ar']) {
      expect(xml, `${locale} tijdlijn`).toContain(`/${locale}/inburgering/tools/tijdlijn`);
    }
    // The remaining planned surfaces are noindex, so listing them would contradict their meta tag.
    for (const slug of ['woordenlijst', 'grammatica']) {
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
      await page.click('button[aria-label="Taal"]');
      await page.click('[role="menuitem"]:has-text("English")');
      await expect(page).toHaveURL(expected);
    });
  }
});

test.describe('the disabled surfaces are actually disabled', () => {
  // `lib/features.ts` is the switch. Blog is *on* now, so it is asserted live rather than absent —
  // this test failing after a flag flip is the point of it.
  /**
   * `leren` and `woordkaarten` were flipped on 2026-08-24 with KNM's content, so this pair
   * asserts the *new* truth: they are real pages behind an account, not 404s.
   *
   * The flag still turns them off — both pages call `notFound()` when it is false — so the
   * gate is intact; what changed is which side of it we are on. This test failing after a flag
   * flip is the point of it.
   */
  test('leren is live and requires an account', async ({ page }) => {
    await page.goto('/nl/leren');
    await expect(page).toHaveURL(/\/login/);
  });

  test('woordkaarten is live and requires an account', async ({ page }) => {
    await page.goto('/nl/dashboard/woordkaarten');
    await expect(page).toHaveURL(/\/login/);
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
