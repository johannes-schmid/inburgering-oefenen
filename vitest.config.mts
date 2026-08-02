import { defineConfig } from 'vitest/config';

/**
 * Unit tests for pure logic only — pricing, rubric maths, script parsing, entitlements.
 *
 * Playwright (`npm run test:e2e`) stays the browser suite. The two answer different questions and
 * are deliberately separate: a rounding rule in `lib/pricing.ts` should not need a browser to
 * check, and a redirect should not be asserted without one.
 *
 * `tests/` is Playwright's directory and is excluded by the `include` glob below — vitest would
 * otherwise try to run specs written against `@playwright/test`.
 *
 * `.mts` rather than `.ts`: Vite loads the config natively as CommonJS otherwise and warns about
 * the ESM syntax.
 */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    include: ['tests-unit/**/*.test.ts'],
  },
});
