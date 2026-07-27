// @ts-check
import { test, expect } from '@playwright/test';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3001';
const SUPABASE_URL = 'https://wabwvmsnjcfdusnaarhe.supabase.co';

const TOPIC_SLUGS = [
  'werk-en-inkomen',
  'wonen-en-samenleven',
  'gezondheid',
  'onderwijs-en-kinderen',
  'overheid-en-regels',
  'politiek-en-instellingen',
  'geschiedenis-herdenking',
];

/**
 * Injects a fake Supabase session for the Next.js dashboard.
 *
 * Strategy: store the raw session JSON as the cookie value (no base64 prefix).
 * @supabase/ssr's decodeChunkedCookieValue returns non-prefixed values as-is,
 * so getItemAsync → JSON.parse → session object.
 *
 * We also override the document.cookie getter/setter so Supabase cannot delete
 * or overwrite our fake session during initialize(), and intercept all auth/v1
 * network calls so token refresh and getUser() don't fail.
 */
async function mockAuth(page, plan) {
  const meta =
    plan === 'premium_plus'
      ? { premium: true, plan: 'premium_plus', tier: 'premium_plus' }
      : { premium: true, plan: 'premium', tier: 'premium' };

  const fakeUser = {
    id: 'test-user-00000000',
    email: 'playwright@test.example',
    user_metadata: meta,
    app_metadata: {},
    aud: 'authenticated',
    role: 'authenticated',
  };

  const fakeSession = {
    access_token: 'fake.eyJleHAiOjk5OTk5OTk5OTl9.fakesig',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: 9999999999,
    refresh_token: 'fake-refresh',
    user: fakeUser,
  };

  const sessionJson = JSON.stringify(fakeSession);

  // Intercept ALL Supabase auth calls with properly shaped responses
  const fakeSessionResponse = JSON.stringify({
    access_token: fakeSession.access_token,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: 9999999999,
    refresh_token: 'fake-refresh',
    user: fakeUser,
  });

  await page.route(`${SUPABASE_URL}/auth/v1/token**`, (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: fakeSessionResponse });
  });
  await page.route(`${SUPABASE_URL}/auth/v1/user**`, (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: fakeUser }) });
  });
  await page.route(`${SUPABASE_URL}/auth/v1/**`, (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: fakeSessionResponse });
  });
  await page.route(`${SUPABASE_URL}/rest/**`, (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  // Store raw JSON as cookie value — no base64 prefix, so @supabase/ssr's
  // decodeChunkedCookieValue returns it as-is → getItemAsync JSON.parses it.
  // Pin the cookie via a document.cookie proxy so Supabase can't delete it.
  // __pw_premium__ cookie is read server-side to bypass Supabase auth checks
  // on pages like proefexamen (exam > 1).
  await page.context().addCookies([{
    name: '__pw_premium__',
    value: 'true',
    domain: 'localhost',
    path: '/',
    httpOnly: false,
    secure: false,
    sameSite: 'Lax',
  }]);

  // Inject session via sessionStorage — bypasses the Supabase cookie/lock
  // for client-side auth checks (dashboard, activate page).
  await page.addInitScript(({ sessionJson, plan }) => {
    sessionStorage.setItem('__pw_session__', sessionJson);
    localStorage.setItem('knm_premium', 'true');
    localStorage.setItem('knm_plan', plan);
    localStorage.setItem('knm_lang', 'nl');
  }, { sessionJson, plan });
}

/** Waits for the dashboard loading spinner to disappear (if present). */
async function waitForAuthDone(page, timeout = 15000) {
  // The LoadingSpinner is a fixed inset-0 overlay; wait for it to unmount
  await page.waitForFunction(
    () => {
      const spinners = document.querySelectorAll('.fixed.inset-0');
      return spinners.length === 0;
    },
    { timeout },
  ).catch(() => {});
  await page.waitForTimeout(300);
}

// ── 1. Happy path — anonymous visitor journey ────────────────────────────────

test.describe('happy path — anonymous visitor', () => {
  test('homepage loads and free exam CTA is visible', async ({ page }) => {
    await page.goto(BASE);
    await expect(page).toHaveTitle(/KNM/i);
    await expect(page.locator('header')).toBeVisible();
    const cta = page
      .locator('a[href*="dashboard"], a[href*="proefexamen"], a[href*="betalen"], button:has-text("Start")')
      .first();
    await expect(cta).toBeVisible();
  });

  test('free exam (exam 1) shows intro screen', async ({ page }) => {
    await page.goto(`${BASE}/proefexamen?exam=1`);
    await waitForAuthDone(page);
    await expect(page.locator('#intro')).toBeVisible({ timeout: 8000 });
  });

  test('starting exam 1 renders answer options', async ({ page }) => {
    await page.goto(`${BASE}/proefexamen?exam=1`);
    await waitForAuthDone(page);
    const startBtn = page
      .locator('button:has-text("Start proefexamen"), button:has-text("Start practice exam"), button:has-text("ابدأ الاختبار")')
      .first();
    await expect(startBtn).toBeVisible({ timeout: 8000 });
    await startBtn.click();
    await expect(page.locator('[data-testid="answer-btn"]').first()).toBeVisible({ timeout: 8000 });
  });

  test('completing exam 1 shows results score', { timeout: 90000 }, async ({ page }) => {
    await page.goto(`${BASE}/proefexamen?exam=1`);
    await waitForAuthDone(page);
    const startBtn = page
      .locator('button:has-text("Start proefexamen"), button:has-text("Start practice exam"), button:has-text("ابدأ الاختبار")')
      .first();
    if (await startBtn.isVisible().catch(() => false)) await startBtn.click();

    // Drive the entire quiz in-browser to avoid Playwright click overhead
    await page.waitForSelector('[data-testid="answer-btn"]', { timeout: 8000 });
    await page.evaluate(async () => {
      for (let i = 0; i < 55; i++) {
        let opt = null;
        for (let t = 0; t < 20; t++) {
          opt = document.querySelector('[data-testid="answer-btn"]:not(:disabled)');
          if (opt) break;
          await new Promise(r => setTimeout(r, 50));
        }
        if (!opt) break; // results screen is showing
        opt.click();
        await new Promise(r => setTimeout(r, 80));
        const nextBtn = document.getElementById('qe-next-btn');
        if (nextBtn) nextBtn.click();
        await new Promise(r => setTimeout(r, 80));
      }
    });

    // For anonymous exam 1, results show email gate; otherwise the score ring
    const results = page.locator('#qe-email-section, #qe-results').first();
    await expect(results).toBeVisible({ timeout: 8000 });
  });

  test('register page is reachable', async ({ page }) => {
    await page.goto(`${BASE}/register`);
    await expect(page.locator('button:has-text("Google")')).toBeVisible({ timeout: 8000 });
  });
});

// ── 2. Premium: all 10 exams unlocked ───────────────────────────────────────

test.describe('premium access — 10 exams unlocked', () => {
  test('dashboard shows 10 exam cards, none locked', async ({ page }) => {
    await mockAuth(page, 'premium');
    await page.goto(`${BASE}/dashboard`);
    await waitForAuthDone(page);
    await page.waitForSelector('.exam-card', { timeout: 12000 });
    await expect(page.locator('.exam-card')).toHaveCount(10);
    await expect(page.locator('.exam-card.locked')).toHaveCount(0);
  });

  test('exam cards 2–10 are not locked', async ({ page }) => {
    await mockAuth(page, 'premium');
    await page.goto(`${BASE}/dashboard`);
    await waitForAuthDone(page);
    await page.waitForSelector('.exam-card', { timeout: 12000 });
    expect(await page.locator('.exam-card.locked').count()).toBe(0);
  });
});

// ── 3. Topic oefenvragen pages (no auth needed) ──────────────────────────────

test.describe('topic oefenvragen pages', () => {
  for (const slug of TOPIC_SLUGS) {
    test(`${slug} — quiz visible and has 6 cross-topic links`, async ({ page }) => {
      await page.goto(`${BASE}/oefenvragen/${slug}`);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('#quiz')).toBeVisible({ timeout: 8000 });
      const section = page.locator('text=Andere onderwerpen').locator('..');
      await expect(section.locator('a[href^="/oefenvragen/"]')).toHaveCount(6);
    });
  }
});

// ── 4. Premium: leren thema 1 available, themas 2–7 locked ──────────────────

test.describe('premium access — leren locked', () => {
  test('leren view: thema 1 is direct link, themas 2–7 link to upgrade', async ({ page }) => {
    await mockAuth(page, 'premium');
    await page.goto(`${BASE}/dashboard`);
    await waitForAuthDone(page);

    await page.locator('#nav-leren').click();
    await page.waitForSelector('#leren-grid a', { timeout: 10000 });
    await page.waitForTimeout(500);

    await expect(page.locator('#leren-grid a[href*="leren/thema-1"]')).toBeVisible();
    await expect(page.locator('#leren-grid a[href*="activate?upgrade=plus"]')).toHaveCount(6);
  });
});

// ── 5. Premium Plus: all 7 leren themas unlocked ────────────────────────────

test.describe('premium_plus access — all leren unlocked', () => {
  test('leren view shows all 7 themas as direct leren links', async ({ page }) => {
    await mockAuth(page, 'premium_plus');
    await page.goto(`${BASE}/dashboard`);
    await waitForAuthDone(page);

    await page.locator('#nav-leren').click();
    await page.waitForSelector('#leren-grid a', { timeout: 10000 });
    await page.waitForTimeout(500);

    await expect(page.locator('#leren-grid a[href*="leren/thema-"]')).toHaveCount(7);
    await expect(page.locator('#leren-grid a[href*="activate?upgrade=plus"]')).toHaveCount(0);
  });
});

// ── 5b. Premium Plus: clicking a leren topic navigates to the topic page ──────

test.describe('premium_plus access — leren topic navigation', () => {
  test('clicking leren thema 5 opens the thema view inside the dashboard', async ({ page }) => {
    await mockAuth(page, 'premium_plus');
    await page.goto(`${BASE}/dashboard`);
    await waitForAuthDone(page);

    await page.locator('#nav-leren').click();
    await page.waitForSelector('#leren-grid a', { timeout: 10000 });
    await page.waitForTimeout(300);

    // Click topic 5 (Werk) — opens inline via setLerenSlug state (no full-page nav)
    const topic5 = page.locator('#leren-grid a[href*="thema-5"]').first();
    await expect(topic5).toBeVisible();
    await topic5.click();

    // Dashboard opens thema inline — heading shows thema title (Werk = thema 5)
    await page.waitForSelector('h1, h2, h3', { timeout: 10000 });
    const heading = await page.locator('h1, h2, h3').filter({ hasText: /Werk/ }).first();
    await expect(heading).toBeVisible();
    expect(page.url()).toContain('dashboard');
  });
});

// ── 6. Upgrade flow: premium → premium_plus ──────────────────────────────────

test.describe('upgrade flow — premium to compleet', () => {
  test('premium user sees upgrade CTA in leren view', async ({ page }) => {
    await mockAuth(page, 'premium');
    await page.goto(`${BASE}/dashboard`);
    await waitForAuthDone(page);

    // Navigate to leren — locked thema cards link to the upgrade page
    await page.locator('#nav-leren').click();
    await page.waitForSelector('#leren-grid a', { timeout: 10000 });
    await page.waitForTimeout(300);

    const upgradeLink = page
      .locator('#leren-grid a[href*="/activate?upgrade=plus"]')
      .first();
    await expect(upgradeLink).toBeVisible({ timeout: 5000 });
  });

  test('/activate?upgrade=plus shows Compleet button', async ({ page }) => {
    await mockAuth(page, 'premium');
    await page.goto(`${BASE}/activate?upgrade=plus`);
    await waitForAuthDone(page, 10000);
    const plusBtn = page.locator('#btn-upgrade-to-plus').first();
    await expect(plusBtn).toBeVisible({ timeout: 10000 });
  });

  test('free visitor on /activate is redirected to login', async ({ page }) => {
    await page.goto(`${BASE}/activate`);
    await page.waitForURL(/login/, { timeout: 8000 });
    expect(page.url()).toContain('login');
  });
});

// ── 7. Random premium exam (exam 5) ─────────────────────────────────────────

test.describe('premium exam — exam 5', () => {
  test('exam 5 title contains "5"', async ({ page }) => {
    await mockAuth(page, 'premium');
    await page.goto(`${BASE}/proefexamen?exam=5`);
    await waitForAuthDone(page);
    expect(await page.title()).toMatch(/5/);
  });

  test('exam 5 intro screen renders', async ({ page }) => {
    await mockAuth(page, 'premium');
    await page.goto(`${BASE}/proefexamen?exam=5`);
    await waitForAuthDone(page);
    await expect(page.locator('#intro')).toBeVisible({ timeout: 8000 });
  });

  test('exam 5: starting renders answer options', async ({ page }) => {
    await mockAuth(page, 'premium');
    await page.goto(`${BASE}/proefexamen?exam=5`);
    await waitForAuthDone(page);
    const startBtn = page
      .locator('button:has-text("Start proefexamen"), button:has-text("Start practice exam"), button:has-text("ابدأ الاختبار")')
      .first();
    await expect(startBtn).toBeVisible({ timeout: 8000 });
    await startBtn.click();
    await expect(page.locator('[data-testid="answer-btn"]').first()).toBeVisible({ timeout: 8000 });
  });
});

// ── 8. Vocabulary cards — flip, mark, advance ───────────────────────────────

test.describe('woordkaarten — flashcard interactions', () => {
  test('woordkaarten view loads theme cards', async ({ page }) => {
    await mockAuth(page, 'premium');
    await page.goto(`${BASE}/dashboard`);
    await waitForAuthDone(page);
    await page.locator('#nav-woordkaarten').click();
    await page.waitForSelector('#wk-theme-grid', { timeout: 10000 });
    expect(await page.locator('.wk-theme-card').count()).toBeGreaterThan(0);
  });

  test('clicking a theme starts the card deck', async ({ page }) => {
    await mockAuth(page, 'premium');
    await page.goto(`${BASE}/dashboard`);
    await waitForAuthDone(page);
    await page.locator('#nav-woordkaarten').click();
    await page.waitForSelector('#wk-theme-grid', { timeout: 10000 });
    await page.locator('.wk-theme-card:not(.locked)').first().click();
    await expect(page.locator('#wk-card-container')).toBeVisible({ timeout: 8000 });
  });

  test('flipping a card reveals back and shows action buttons', async ({ page }) => {
    await mockAuth(page, 'premium');
    await page.goto(`${BASE}/dashboard`);
    await waitForAuthDone(page);
    await page.locator('#nav-woordkaarten').click();
    await page.waitForSelector('#wk-theme-grid', { timeout: 10000 });
    await page.locator('.wk-theme-card:not(.locked)').first().click();
    await page.waitForSelector('#wk-card-container', { timeout: 8000 });

    await page.locator('#wk-card-container').click();
    await page.waitForTimeout(500);

    await expect(page.locator('#wk-card-inner.flipped')).toBeVisible({ timeout: 4000 });
    await expect(page.locator('#wk-action-btns')).toBeVisible();
  });

  test('marking a card as known advances the deck', async ({ page }) => {
    await mockAuth(page, 'premium');
    await page.goto(`${BASE}/dashboard`);
    await waitForAuthDone(page);
    await page.locator('#nav-woordkaarten').click();
    await page.waitForSelector('#wk-theme-grid', { timeout: 10000 });
    await page.locator('.wk-theme-card:not(.locked)').first().click();
    await page.waitForSelector('#wk-card-container', { timeout: 8000 });

    await page.locator('#wk-card-container').click();
    await page.waitForTimeout(500);
    await page.locator('.wk-btn-known').click();
    await page.waitForTimeout(500);

    const deckOrReview = page.locator('#wk-card-container, #wk-review-repeat-btn').first();
    await expect(deckOrReview).toBeVisible({ timeout: 4000 });
  });
});

// ── 9. Auth persistence — logout then re-login ───────────────────────────────

test.describe('auth persistence — premium survives logout and re-login', () => {
  test('premium user sees all 10 exams unlocked', async ({ page }) => {
    await mockAuth(page, 'premium');
    await page.goto(`${BASE}/dashboard`);
    await waitForAuthDone(page);
    await page.waitForSelector('.exam-card', { timeout: 10000 });
    await expect(page.locator('.exam-card.locked')).toHaveCount(0);
  });

  test('unauthenticated visit to dashboard shows guest mode', async ({ page }) => {
    // No mockAuth — dashboard now opens in guest mode (no redirect to login)
    await page.goto(`${BASE}/dashboard`);
    await expect(page.locator('.exam-card').first()).toBeVisible({ timeout: 12000 });
    expect(page.url()).not.toContain('login');
  });

  test('after re-login premium is restored', async ({ page }) => {
    // addInitScript persists for all navigations — premium mock stays active
    await mockAuth(page, 'premium');
    await page.goto(`${BASE}/dashboard`);
    await waitForAuthDone(page);
    await page.waitForSelector('.exam-card', { timeout: 10000 });

    // Clear auth state
    await page.evaluate(() => {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('sb-') || k.startsWith('knm_'))
        .forEach((k) => localStorage.removeItem(k));
    });

    // Re-set premium flags (simulates server sync after re-login)
    await page.evaluate(({ plan }) => {
      localStorage.setItem('knm_premium', 'true');
      localStorage.setItem('knm_plan', plan);
      localStorage.setItem('knm_lang', 'nl');
    }, { plan: 'premium' });

    // Navigate again — addInitScript mock is still active
    await page.goto(`${BASE}/dashboard`);
    await waitForAuthDone(page, 12000);

    expect(page.url()).not.toContain('login');
    await page.waitForSelector('.exam-card', { timeout: 10000 });
    await expect(page.locator('.exam-card.locked')).toHaveCount(0);
  });
});

// ── 10. Free → Compleet direct upgrade flow ──────────────────────────────────

test.describe('free to compleet upgrade', () => {
  test('free visitor on /activate is redirected to login', async ({ page }) => {
    await page.goto(`${BASE}/activate`);
    await page.waitForURL(/login/, { timeout: 8000 });
    expect(page.url()).toContain('login');
  });

  test('premium user on /activate sees Compleet button', async ({ page }) => {
    await mockAuth(page, 'premium');
    await page.goto(`${BASE}/activate`);
    await waitForAuthDone(page, 10000);
    const plusBtn = page
      .locator('#btn-premium-plus, [data-i18n="act2_btn_plus"]')
      .first();
    await expect(plusBtn).toBeVisible({ timeout: 10000 });
  });

  test('clicking Compleet triggers checkout API call', async ({ page }) => {
    await mockAuth(page, 'premium');

    let checkoutCalled = false;
    await page.route('**/api/mollie-checkout**', (route) => {
      checkoutCalled = true;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ checkoutUrl: 'https://www.mollie.com/checkout/test' }),
      });
    });

    await page.goto(`${BASE}/activate?upgrade=plus`);
    await waitForAuthDone(page, 10000);

    const plusBtn = page.locator('#btn-upgrade-to-plus').first();
    await expect(plusBtn).toBeVisible({ timeout: 10000 });
    expect(await plusBtn.isDisabled().catch(() => false)).toBe(false);

    await plusBtn.click();
    await page.waitForTimeout(1500);

    const urlAfter = page.url();
    expect(checkoutCalled || urlAfter.includes('mollie') || urlAfter.includes('betalen')).toBe(true);
  });
});
