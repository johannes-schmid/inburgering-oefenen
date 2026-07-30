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
  leren: false,
  woordkaarten: false,
} as const;

export type FeatureKey = keyof typeof FEATURES;

export function isEnabled(key: FeatureKey): boolean {
  return FEATURES[key];
}

/* ═══════════════════════════════════════════════════════════════════════════
 * `UNGATE_PAID_FEATURES` — every plan behaves as Compleet (€19,95)
 *
 * Rubric feedback and per-question explanations are visible to free and
 * Professioneel accounts too. Turned on 2026-07-30 because the paid gate hid
 * exactly the output that needed reviewing while the grader was being built, and
 * then **deployed to production in that state as a deliberate decision by the
 * owner** the same day, having been told what it costs:
 *
 *   Compleet's only distinguishing feature is this feedback. While the flag is
 *   `true` there is nothing to buy at €19,95 over Professioneel, and anyone who
 *   buys it later will already have seen it free.
 *
 * It stays a single flag rather than deleted checks so restoring the paywall is
 * one line. `canSeeExplanations()` in lib/entitlements.ts is the only reader —
 * set this to `false` and the gate is back everywhere at once.
 * ═══════════════════════════════════════════════════════════════════════════ */
export const UNGATE_PAID_FEATURES = true;
