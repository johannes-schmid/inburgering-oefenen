// @ts-check
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 45000,
  retries: 0,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3001',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    // Force Dutch locale so i18n.js doesn't redirect to /en/ on first load
    locale: 'nl-NL',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
