// @ts-check
import { test, expect } from '@playwright/test';
import { available, skipReason, mintSession, applySession, allowlistAdmin } from './helpers/session.mjs';

/**
 * The admin surfaces — and mostly, who cannot reach them.
 *
 * Admin access is not a separate credential: anyone signs in with the same Google account and the
 * `(admin)` layout then checks the `admin_users` allowlist. That makes "a signed-in customer is
 * still not an admin" the assertion that matters, and it is one no amount of manual clicking
 * covers, because whoever is testing is always on the allowlist.
 */

test.skip(!available(), skipReason());

const ADMIN = 'playwright-admin@test.local';
const CUSTOMER = 'playwright-customer@test.local';

test.describe('access', () => {
  test('anonymous is sent to the admin login', async ({ page }) => {
    await page.goto('/nl/admin');
    await expect(page).toHaveURL(/\/admin-login/);
  });

  test('a signed-in account that is not on the allowlist is bounced', async ({ page, context }) => {
    const session = await mintSession(CUSTOMER, { plan: 'premium_plus' });
    await applySession(context, session);

    await page.goto('/nl/admin/questions');
    // With `?error=not_admin`, so the login page can say something true. It cannot distinguish
    // "wrong account" from "not an admin", and shouldn't.
    await expect(page).toHaveURL(/\/admin-login\?error=not_admin/);
  });

  test('the admin login lives outside the admin layout', async ({ page }) => {
    // `/admin-login` is in `(auth)`, not `(admin)`. If it ever moves, the admin layout's redirect
    // points at a page inside itself and loops until the browser gives up.
    const res = await page.goto('/nl/admin-login');
    expect(res?.status()).toBe(200);
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
  });
});

test.describe('as an allowlisted admin', () => {
  test.beforeEach(async ({ context }) => {
    await allowlistAdmin(ADMIN);
    const session = await mintSession(ADMIN, {});
    await applySession(context, session);
  });

  test('the content screen is the single item surface, per level', async ({ page }) => {
    await page.goto('/nl/admin/questions?niveau=a2');
    await expect(page.locator('h1')).toBeVisible();

    // Four skill tabs, because `questions` and `open_tasks` are merged here. The three screens this
    // replaced must stay gone — a second editor is a second place to break the option-reconciliation
    // rules.
    await expect(page.locator('[role="tab"]')).toHaveCount(4);

    for (const dead of ['/nl/admin/content', '/nl/admin/opgaven', '/nl/admin/leren']) {
      const res = await page.goto(dead);
      expect(res?.status(), `${dead} should be gone`).toBe(404);
    }
  });

  test('the level in the URL is what the screen shows', async ({ page }) => {
    // Not a `useState` filter: a level has to be linkable and survive a reload, and the sidebar
    // sub-menu is what sets it.
    await page.goto('/nl/admin/questions?niveau=b1');
    await expect(page.locator('body')).toContainText(/niveau b1/i);

    await page.goto('/nl/admin/exams?niveau=b1');
    await expect(page.locator('body')).toContainText(/niveau b1/i);
  });

  test('the per-item editors the drawer links to still exist', async ({ page }) => {
    // The drawer defers option labels, correctness and the form schema to these. They were nearly
    // deleted along with the list pages that used to own them.
    for (const path of ['/nl/admin/questions/new', '/nl/admin/opgaven/new']) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(200);
    }
  });
});

test.describe('the money-spending routes refuse anonymous callers', () => {
  // Each of these costs real credits per call — ElevenLabs, or a model through the gateway. Two of
  // them had no authentication at all until recently, reachable by anyone who knew the path.
  const ROUTES = [
    '/api/admin/draft-content',
    '/api/admin/upload-image',
    '/api/generate-question-audio',
    '/api/generate-stimulus-audio',
    '/api/admin/run-eval',
  ];

  for (const route of ROUTES) {
    test(route, async ({ request }) => {
      const res = await request.post(route, { data: {} });
      expect([401, 403], `${route} answered ${res.status()}`).toContain(res.status());
    });
  }
});
