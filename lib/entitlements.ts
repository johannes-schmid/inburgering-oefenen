/**
 * What a signed-in user is allowed to open.
 *
 * The payment routes (`mollie-webhook`, `payment-status`, `reconcile-payments`) all write
 * `user_metadata.plan`. Several read sites inherited from KNM read `user_metadata.tier`,
 * which nothing has written since the fork — so a paying user was being treated as free and
 * bounced to `/activate`. `plan` is the source of truth here; `tier` is read only as a
 * fallback for accounts that predate the rename.
 */
export type Plan = 'free' | 'premium' | 'premium_plus';

type Meta = { plan?: unknown; tier?: unknown; premium?: unknown } | null | undefined;

export function planFromMetadata(meta: Meta): Plan {
  const raw = (meta?.plan ?? meta?.tier) as string | undefined;
  if (raw === 'premium_plus' || raw === 'premium') return raw;
  if (meta?.premium === true) return 'premium';
  return 'free';
}

/** Exam 1 of every skill is free; the rest need a paid plan. */
export function canOpenExam(plan: Plan, isFree: boolean): boolean {
  return isFree || plan !== 'free';
}

/** Per-question explanations and rubric feedback are the Compleet tier. */
export function canSeeExplanations(plan: Plan): boolean {
  return plan === 'premium_plus';
}
