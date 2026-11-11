// @ts-check
import { test, expect } from '@playwright/test';

/**
 * De overdracht van de iOS-app naar de webview — en vooral wie er géén sessie mee krijgt.
 *
 * `/api/app-session` zet cookies op basis van wat het krijgt aangeleverd. Dat maakt de drie
 * weigeringen hieronder de beweringen die ertoe doen: zonder de app-kop niets, met verzonnen
 * tokens niets, en nooit een omleiding naar buiten de site.
 */
const ROUTE = '/api/app-session';

test('refuses a post without the app header', async ({ request }) => {
  const res = await request.post(ROUTE, {
    form: { access_token: 'x', refresh_token: 'y' },
    maxRedirects: 0,
  });
  expect(res.status()).toBe(403);
  expect(res.headers()['set-cookie'] ?? '').not.toContain('auth-token');
});

test('sends invented tokens to the login page without a session', async ({ request }) => {
  const res = await request.post(ROUTE, {
    headers: { 'X-App-Shell': 'ios' },
    form: { access_token: 'x', refresh_token: 'y' },
    maxRedirects: 0,
  });
  expect(res.status()).toBe(303);
  expect(res.headers()['location']).toMatch(/\/nl\/login\?error=app_session$/);
  expect(res.headers()['set-cookie'] ?? '').not.toContain('auth-token');
});

test('never redirects off-site', async ({ request }) => {
  const res = await request.post(ROUTE, {
    headers: { 'X-App-Shell': 'ios' },
    form: { access_token: 'x', refresh_token: 'y', next: '//evil.example' },
    maxRedirects: 0,
  });
  const location = res.headers()['location'] ?? '';
  expect(new URL(location).host).toBe(new URL(test.info().project.use.baseURL ?? 'http://localhost:3001').host);
});
