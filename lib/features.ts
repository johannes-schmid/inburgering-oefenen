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
