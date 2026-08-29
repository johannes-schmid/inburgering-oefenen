/**
 * The upside the free taster pitches: where the score can get to with practice.
 *
 * Anchored on the score just achieved so it always reads as a real gain, and capped at 92 so
 * it never reads as a guarantee. It is a projection of *our* practice effect and not a DUO
 * norm — `SEO/facts.md` §9 forbids publishing a pass threshold, and nothing here states one.
 * The copy around it must stay conditional ("kan naar"), never predictive.
 */
export function projectSlaagkans(pct: number): number {
  return Math.min(92, Math.max(pct + 12, Math.round(pct * 0.55 + 47)));
}
