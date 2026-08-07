// @ts-check
import { test, expect } from '@playwright/test';
import { available, skipReason, mintSession, applySession, setExamFree } from './helpers/session.mjs';

/**
 * The study portal, with a real session.
 *
 * What matters here is **entitlement**: which of the ten slots a given account may open. That is the
 * revenue boundary, and a bug is expensive in both directions — a locked free exam kills the funnel,
 * an unlocked paid one gives away the catalogue.
 *
 * ## The fixtures, and why they are B1
 * A gate can only be tested on an exam that has items in it: without content the player calls
 * `notFound()` before it ever reaches the entitlement check, and the test would pass for the wrong
 * reason. On a seeded database the exams that have content are B1 exam 1 of each onderdeel, which
 * ship **published and not free** — so those are the paid fixtures, and one of them is borrowed as
 * the free fixture for the length of the run. `setExamFree` restores it afterwards.
 *
 * Pure entitlement arithmetic (a bare `lezen` meaning A2, expiry maths, the bundle) is unit-tested
 * in `tests-unit/entitlements.test.ts`, where it needs no fixture at all. Only the wiring is here.
 */

test.skip(!available(), skipReason());

const FREE = '/nl/oefenexamen/b1/luisteren/1';
const PAID = '/nl/oefenexamen/b1/lezen/1';
const OTHER_PAID = '/nl/oefenexamen/b1/spreken/1';

/** @type {(() => Promise<void>) | null} */
let restoreFree = null;

test.beforeAll(async () => {
  if (!available()) return;
  restoreFree = await setExamFree('b1', 'luisteren', 1, true);
});

test.afterAll(async () => {
  if (restoreFree) await restoreFree();
});

test.describe('redirects', () => {
  test('the portal is closed to anonymous visitors', async ({ page }) => {
    for (const path of ['/nl/dashboard', '/nl/dashboard/profiel', '/nl/dashboard/a2/lezen']) {
      await page.goto(path);
      await expect(page, `${path} should redirect`).toHaveURL(/\/login/);
    }
  });

  test('the pre-B1 dashboard path still resolves', async ({ page, context }) => {
    // next.config.ts 308s `/dashboard/lezen` → `/dashboard/a2/lezen`. Signed in, because the
    // redirect is upstream of the auth check and an anonymous visit would only prove the login hop.
    const session = await mintSession('portal-free@test.local', { plan: 'free', modules: [] });
    await applySession(context, session);

    const res = await page.goto('/nl/dashboard/lezen');
    expect(res?.status()).toBe(200);
    expect(page.url()).toContain('/nl/dashboard/a2/lezen');
  });
});

test.describe('a free account', () => {
  test.beforeEach(async ({ context }) => {
    const session = await mintSession('portal-free@test.local', { plan: 'free', modules: [] });
    await applySession(context, session);
  });

  test('sees all four onderdelen on the dashboard', async ({ page }) => {
    await page.goto('/nl/dashboard');
    for (const skill of ['lezen', 'luisteren', 'schrijven', 'spreken']) {
      await expect(page.locator(`a[href*="/dashboard/a2/${skill}"]`).first(), skill).toBeVisible();
    }
  });

  test('opens the free exam', async ({ page }) => {
    await page.goto(FREE);
    await expect(page).not.toHaveURL(/\/login|\/premium/);
  });

  test('is sent to the upsell on a paid exam, not to an error', async ({ page }) => {
    // The redirect target matters as much as the block: a 404 here would lose the upsell, which is
    // the only reason a locked slot is visible at all. `?vanaf=` is what tells /premium which exam
    // the visitor came from.
    await page.goto(PAID);
    await expect(page).toHaveURL(/\/premium/);
  });
});

test.describe('a module purchase', () => {
  test('unlocks the bought onderdeel and nothing else', async ({ page, context }) => {
    const session = await mintSession('portal-module@test.local', {
      plan: 'free',
      modules: ['b1:lezen'],
    });
    await applySession(context, session);

    // This is the regression that mattered: the player gated on the legacy `plan` alone, so a
    // customer who had bought one module was bounced to /premium from every exam in it — while the
    // dashboard, which already read `ownsModule`, showed the module as owned.
    await page.goto(PAID);
    await expect(page).not.toHaveURL(/\/premium/);

    // And if this one also opened, the four modules would be one product sold four times.
    await page.goto(OTHER_PAID);
    await expect(page).toHaveURL(/\/premium/);
  });

  test('the ten slots in the dashboard agree with the player', async ({ page, context }) => {
    const session = await mintSession('portal-module@test.local', {
      plan: 'free',
      modules: ['b1:lezen'],
    });
    await applySession(context, session);

    // The two screens disagreed before: the per-skill page gated on "has any paid plan" while the
    // overview gated on module ownership, so an owned module's slots all rendered locked.
    await page.goto('/nl/dashboard/b1/lezen');
    await expect(page.locator('a[href*="/oefenexamen/b1/lezen/1"]')).toBeVisible();
  });

  test('access lapses by date after a cancellation', async ({ page, context }) => {
    // `modules_until` in the past means access has run out. Expiry is arithmetic rather than a cron
    // job precisely so a cron that failed to run cannot leave somebody paid-up forever.
    const session = await mintSession('portal-expired@test.local', {
      plan: 'free',
      modules: ['b1:lezen'],
      modules_until: '2020-01-01T00:00:00.000Z',
    });
    await applySession(context, session);

    await page.goto(PAID);
    await expect(page).toHaveURL(/\/premium/);
  });
});

test.describe('a legacy all-access plan', () => {
  test('still opens everything it was sold', async ({ page, context }) => {
    // These accounts bought "alle oefenexamens" before modules existed. Fencing them off now is a
    // support problem, not a revenue win — see the note on `ownsModule`.
    const session = await mintSession('portal-premium@test.local', { plan: 'premium_plus' });
    await applySession(context, session);

    await page.goto(OTHER_PAID);
    await expect(page).not.toHaveURL(/\/premium|\/login/);
  });
});
