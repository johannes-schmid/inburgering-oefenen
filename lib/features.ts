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
 * ⚠️  TEMPORARY — REVERT BEFORE LAUNCH
 *
 * `UNGATE_PAID_FEATURES` makes every plan behave as Compleet (€19,95): rubric
 * feedback and per-question explanations are visible to free and Professioneel
 * accounts too. Turned on 2026-07-30 at the owner's request, because the paid
 * gate hid exactly the output that needed reviewing while the grader was being
 * built.
 *
 * **Shipping with this `true` gives the Compleet tier away for free.** It is a
 * single flag rather than deleted checks precisely so that it is one line to
 * find and one line to undo — `canSeeExplanations()` in lib/entitlements.ts is
 * the only reader. Set it back to `false` before the first paid customer.
 * ═══════════════════════════════════════════════════════════════════════════ */
export const UNGATE_PAID_FEATURES = true;
