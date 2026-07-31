/**
 * What a signed-in user is allowed to open.
 *
 * The payment routes (`mollie-webhook`, `payment-status`, `reconcile-payments`) all write
 * `user_metadata.plan`. Several read sites inherited from KNM read `user_metadata.tier`,
 * which nothing has written since the fork — so a paying user was being treated as free and
 * bounced to `/activate`. `plan` is the source of truth here; `tier` is read only as a
 * fallback for accounts that predate the rename.
 */
import { UNGATE_PAID_FEATURES } from './features';

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

/**
 * Per-question explanations and rubric feedback are the Compleet tier.
 *
 * `UNGATE_PAID_FEATURES` short-circuits this while the grading work is being reviewed — see the
 * warning on that flag in lib/features.ts. This function is its only reader, so turning the gate
 * back on is a one-line change here-adjacent, not an audit of every surface.
 */
export function canSeeExplanations(plan: Plan): boolean {
  if (UNGATE_PAID_FEATURES) return true;
  return plan === 'premium_plus';
}


/* ── Per-module access ────────────────────────────────────────────────────── */

/**
 * Which exam components this account has bought.
 *
 * Stored as `user_metadata.modules`, a list of skill slugs, because the product is sold per
 * onderdeel. The legacy global `plan` still grants everything: accounts that bought Professioneel or
 * Compleet before modules existed keep what they paid for, and a `plan` check is the fallback rather
 * than the primary. Do not delete it — it is somebody's purchase.
 */
export function modulesFromMetadata(meta: Meta): string[] {
  const raw = (meta as { modules?: unknown } | null | undefined)?.modules;
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === 'string');
}

/** Does this account have paid access to one skill? */
export function ownsModule(meta: Meta, skill: string): boolean {
  if (planFromMetadata(meta) !== 'free') return true; // legacy all-access purchase
  return modulesFromMetadata(meta).includes(skill);
}
