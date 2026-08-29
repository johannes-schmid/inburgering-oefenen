// @ts-check
import { test, expect } from '@playwright/test';

/**
 * The 10-question taster — the top of the funnel, and the only exam surface an anonymous visitor
 * can finish.
 *
 * Content is static (`data/free-practice.ts`) precisely so this renders with no database, which is
 * also what makes it testable without fixtures. The three things worth pinning are the ones that
 * are product decisions rather than implementation: feedback per question, the score withheld until
 * the e-mail step, and the skip link that must survive.
 */

/** Answer the visible question by clicking the first option, then advance. */
async function answerAndAdvance(page) {
  const options = page.locator('main button:not([aria-label])');
  await options.first().click();

  // Next is a button whose label changes on the last question, so it is found by position in the
  // card rather than by text — wording here is translated and has already been reworded twice.
  const next = page.locator('main button').last();
  await next.click();
}

test.describe('lezen taster', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/nl/oefenen/lezen');
    await page.locator('main button').last().click(); // "Begin met oefenen"
  });

  test('gives feedback on the answer before moving on', async ({ page }) => {
    await page.locator('main button:not([aria-label])').first().click();

    // The taster's whole pitch is per-question explanation, and it is what the paid Compleet tier
    // sells inside real exams. If this stops appearing the funnel has no argument left.
    await expect(page.locator('main')).toContainText(/goed|fout|uitleg/i, { timeout: 5000 });
  });

  test('withholds the score behind the e-mail step, and lets the visitor past it', async ({ page }) => {
    for (let i = 0; i < 10; i += 1) await answerAndAdvance(page);

    // The gate. The score renders behind a blur rather than being withheld from the DOM, so
    // what is asserted is that it is *unreadable and unreachable* — `.fp-locked` carries the
    // blur, `pointer-events: none` and `aria-hidden`, and losing any of those hands the number
    // to a cursor, a caret or a screen reader while the design still looks gated.
    const gate = page.locator('#fp-email');
    await expect(gate).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.fp-gauge')).toHaveClass(/fp-locked/);
    await expect(page.locator('.fp-head')).toHaveAttribute('aria-hidden', 'true');

    // The skip link is deliberate and documented: withholding a result the visitor earned, with no
    // way out, is coercive and mostly harvests junk addresses. Do not delete this test to make a
    // "stronger" gate pass — that decision belongs to the owner.
    await page.getByRole('button', { name: /zonder e-mail|liever niet/i }).click();
    await expect(page.locator('.fp-gauge')).not.toHaveClass(/fp-locked/);
    await expect(page.locator('main')).toContainText('%');
  });

  test('rejects an invalid address rather than sending it', async ({ page }) => {
    for (let i = 0; i < 10; i += 1) await answerAndAdvance(page);

    await page.locator('#fp-email').fill('not-an-email');
    await page.locator('form button[type="submit"]').click();
    await expect(page.locator('#fp-email-error')).toBeVisible();
    // Still gated: a failed submit must not reveal the score as a side effect.
    await expect(page.locator('.fp-gauge')).toHaveClass(/fp-locked/);
  });

  test('ends on a route into the paid exams', async ({ page }) => {
    for (let i = 0; i < 10; i += 1) await answerAndAdvance(page);
    await page.getByRole('button', { name: /zonder e-mail|liever niet/i }).click();

    // The exit is the portal itself: an anonymous visitor may browse it, and the account is
    // asked for at the oefenexamen. Scoped to `main` — the chrome links the exams anyway.
    await expect(page.locator('main a[href$="/dashboard"]').first()).toBeVisible();
  });
});

test.describe('luisteren taster', () => {
  test('ships playable audio with the DUO transport controls', async ({ page }) => {
    await page.goto('/nl/oefenen/luisteren');
    await page.locator('main button').last().click();

    // The mp3s are committed to the repo (public/audio/free-practice) so this works with no TTS
    // call and no storage bucket. A 404 here means the generator ran but the files were not added.
    const audio = page.locator('audio');
    await expect(audio).toHaveCount(1);
    const src = await audio.getAttribute('src');
    expect(src).toBeTruthy();
    const res = await page.request.get(src ?? '');
    expect(res.status()).toBe(200);

    // ⟲10 / play / 10⟳ — and no play-count limit, which is what makes it practice rather than a mock.
    await expect(page.locator('button[aria-label="-10s"]')).toBeVisible();
    await expect(page.locator('button[aria-label="+10s"]')).toBeVisible();
  });
});
