/**
 * Launch feature flags.
 *
 * The KNM platform shipped with a blog, free topic quizzes, long-form lesson modules and
 * vocabulary cards. All of that code is kept for the A2 product, but the content does not
 * exist yet — these flags keep those surfaces out of the nav, out of the sitemap, and
 * behind a "Binnenkort beschikbaar" state until their A2 content lands.
 *
 * Flip a flag to `true` once the corresponding content is authored.
 */
export const FEATURES = {
  blog: true,
  oefenvragen: false,
  // Both switched on 2026-08-24, when KNM's content moved across from knmoefenen.nl: seven
  // lesson modules (43 sections) and 366 woordkaarten, all authored and reviewed on that
  // platform. **They are KNM's, not the taalonderdelen's** — Lezen and Luisteren still have no
  // lesson content, which is why both surfaces are reached from the KNM module rather than
  // from the portal's top level.
  leren: true,
  woordkaarten: true,
} as const;

export type FeatureKey = keyof typeof FEATURES;

export function isEnabled(key: FeatureKey): boolean {
  return FEATURES[key];
}

/* ═══════════════════════════════════════════════════════════════════════════
 * `UNGATE_PAID_FEATURES` — every plan behaves as Compleet
 *
 * Turned on 2026-07-30 while the grader was being built, because the paid gate hid
 * the output that needed reviewing. Turned **off** again the same day once spend
 * controls existed: `lib/grading-limits.ts` rations grading by allowance rather
 * than by tier, which is the honest way round when the cost is per use.
 *
 * `canSeeExplanations()` in lib/entitlements.ts is the only reader. Set to `true`
 * to open everything up again for testing.
 * ═══════════════════════════════════════════════════════════════════════════ */
export const UNGATE_PAID_FEATURES = false;
