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
import { DEFAULT_LEVEL, isLevel, isSkillSlug, type Level, type SkillSlug } from '@/data/skills';

export type Plan = 'free' | 'premium' | 'premium_plus';

type Meta = { plan?: unknown; tier?: unknown; premium?: unknown } | null | undefined;

export function planFromMetadata(meta: Meta): Plan {
  const raw = (meta?.plan ?? meta?.tier) as string | undefined;
  if (raw === 'premium_plus' || raw === 'premium') return raw;
  if (meta?.premium === true) return 'premium';
  return 'free';
}

/** A free exam is open to anyone with an account; the rest need a paid plan. */
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
 * A module is one skill at one level: `a2:lezen`, `b1:spreken`.
 *
 * The level has to be part of the identity because the two levels are separately authored,
 * separately priced products. A bare `lezen` would grant B1 Lezen to every A2 customer the
 * moment B1 content ships — giving away the entire second catalogue to people who paid for
 * the first.
 */
export type ModuleId = `${Level}:${SkillSlug}`;

export function moduleId(level: Level, skill: SkillSlug): ModuleId {
  return `${level}:${skill}`;
}

export function parseModuleId(raw: string): { level: Level; skill: SkillSlug } | null {
  const [level, skill] = raw.split(':');
  if (!isLevel(level) || !isSkillSlug(skill)) return null;
  return { level, skill };
}

/**
 * Normalise one stored module string to a `ModuleId`.
 *
 * **A bare skill slug means A2**, because that is what it meant when it was written. Every
 * module sold before this change was an A2 module — the product had no other level — so
 * `['lezen','spreken']` in an existing customer's metadata is `['a2:lezen','a2:spreken']`.
 *
 * Done on read rather than by backfilling `auth.users.user_metadata`: the metadata is written
 * by the Mollie webhook, the reconcile cron and the cancel route, and a backfill would race
 * with all three. Reading is idempotent and cannot lose a purchase.
 */
export function normaliseModule(raw: string): ModuleId | null {
  if (isSkillSlug(raw)) return moduleId(DEFAULT_LEVEL, raw);
  return parseModuleId(raw) ? (raw as ModuleId) : null;
}

/**
 * Which exam components this account has bought, as normalised `level:skill` ids.
 *
 * Stored as `user_metadata.modules` because the product is sold per onderdeel. The legacy global
 * `plan` still grants everything: accounts that bought Professioneel or Compleet before modules
 * existed keep what they paid for, and a `plan` check is the fallback rather than the primary.
 * Do not delete it — it is somebody's purchase.
 */
export function modulesFromMetadata(meta: Meta): ModuleId[] {
  const raw = (meta as { modules?: unknown } | null | undefined)?.modules;
  if (!Array.isArray(raw)) return [];
  if (modulesExpired(meta)) return [];
  return raw
    .filter((x): x is string => typeof x === 'string')
    .map(normaliseModule)
    .filter((x): x is ModuleId => x !== null);
}

/**
 * After cancelling, access runs to the end of the period already paid for.
 *
 * `modules_until` is written by `/api/cancel-subscription` as the date the next charge would have
 * fallen. It is absent for an active subscriber, so this is `false` for everyone who has not
 * cancelled. Expiry is therefore a pure function of the metadata — no cron job has to run on the
 * right day for access to lapse, and a cron that failed to run cannot leave someone with free
 * access indefinitely.
 *
 * The raw list is still in `user_metadata.modules`, so resubscribing restores exactly what was
 * owned rather than making the candidate re-pick.
 */
export function modulesExpired(meta: Meta): boolean {
  const until = (meta as { modules_until?: unknown } | null | undefined)?.modules_until;
  if (typeof until !== 'string') return false;
  const ts = Date.parse(until);
  return Number.isFinite(ts) && ts < Date.now();
}

/** The modules the account bought, ignoring whether access has lapsed. For account/billing UI. */
export function purchasedModules(meta: Meta): ModuleId[] {
  const raw = (meta as { modules?: unknown } | null | undefined)?.modules;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is string => typeof x === 'string')
    .map(normaliseModule)
    .filter((x): x is ModuleId => x !== null);
}

/**
 * Does this account have paid access to one skill at one level?
 *
 * The legacy all-access `plan` check grants **both** levels. That is deliberate and it is a
 * real giveaway, but the alternative is worse: those accounts bought "alle oefenexamens" as
 * the offer was then worded, and retroactively fencing off half of what they can see today is
 * a support problem, not a revenue win. There are few enough of them to absorb.
 */
export function ownsModule(meta: Meta, level: Level, skill: SkillSlug): boolean {
  if (planFromMetadata(meta) !== 'free') return true; // legacy all-access purchase
  return modulesFromMetadata(meta).includes(moduleId(level, skill));
}
