/**
 * Pricing — the single source of truth for what a module costs and what it contains.
 *
 * The product is sold as **one subscription per exam component**. Each module bundles the
 * three things that belong to that component: the 10 practice exams, the lessons, and the
 * vocabulary cards. Taking all four modules gives one of them free.
 *
 * Deliberately derived from `data/skills.ts` rather than restated: exam and item counts must
 * never drift from the taxonomy.
 *
 * NOTE — this file describes the offer, not the entitlement. Mollie recurring payments
 * (mandate + customer + recurring webhook) and per-module access control are not built yet;
 * `lib/api-constants.ts` still holds the one-off `premium` / `premium_plus` products that
 * the checkout routes use today. Wiring the module subscriptions through checkout is the
 * next piece of work.
 */
import { SKILLS, type SkillSlug } from '@/data/skills';

/** Price of a single module, per month, in cents. */
export const MODULE_PRICE_CENTS = 995;

/**
 * All four modules, per month.
 *
 * Set explicitly rather than derived as 3 × module. The owner priced the bundle at €29,95, which is
 * ten cents above three modules (€29,85) — so "vier voor de prijs van drie" is no longer literally
 * true and the copy says "bijna" instead. Deriving it would silently overrule the stated price;
 * rounding the module price to make the arithmetic work would overrule that instead.
 */
export const BUNDLE_PRICE_CENTS = 2995;

export const BUNDLE_LIST_PRICE_CENTS = MODULE_PRICE_CENTS * SKILLS.length;
export const BUNDLE_SAVING_CENTS = BUNDLE_LIST_PRICE_CENTS - BUNDLE_PRICE_CENTS;
/** How many modules the bundle effectively costs, for copy like "bijna drie van de vier". */
export const BUNDLE_PAID_MODULES = Math.round(BUNDLE_PRICE_CENTS / MODULE_PRICE_CENTS);

/** `1295` → `"12,95"`. Dutch decimal comma; pricing must always show a concrete number. */
export function euro(cents: number): string {
  return `€${(cents / 100).toFixed(2).replace('.', ',')}`;
}

export type ModuleSlug = SkillSlug;

export type ModuleOffer = {
  slug: ModuleSlug;
  priceCents: number;
  /** Practice exams included — all of them for this skill. */
  examCount: number;
  /** Total questions or tasks across those exams. */
  itemCount: number;
  /** Rubric feedback on open answers only exists for the two open-scored skills. */
  hasRubricFeedback: boolean;
};

export const MODULES: ModuleOffer[] = SKILLS.map(skill => ({
  slug: skill.slug,
  priceCents: MODULE_PRICE_CENTS,
  examCount: skill.examCount,
  itemCount: skill.itemCount * skill.examCount,
  hasRubricFeedback: skill.scoring === 'open',
}));

export function getModule(slug: string): ModuleOffer | undefined {
  return MODULES.find(m => m.slug === slug);
}

/** Every practice exam across all four modules. */
export const TOTAL_EXAMS = MODULES.reduce((n, m) => n + m.examCount, 0);


/* ── What a selection costs ───────────────────────────────────────────────── */

export type ModuleSelection = ModuleSlug[];

/**
 * Price for a set of modules, in cents.
 *
 * All four is the bundle price, not four times the module price — that is the whole offer. Any
 * other combination is simply per module.
 *
 * **Always compute this server-side.** The checkout route must never accept an amount from the
 * client: a posted total is a posted discount.
 */
export function priceForSelection(selection: ModuleSelection): number {
  const unique = [...new Set(selection)].filter(s => MODULES.some(m => m.slug === s));
  if (unique.length === 0) return 0;
  if (unique.length === SKILLS.length) return BUNDLE_PRICE_CENTS;
  return unique.length * MODULE_PRICE_CENTS;
}

/** Undiscounted total, for showing what the bundle saves. */
export function listPriceForSelection(selection: ModuleSelection): number {
  const unique = [...new Set(selection)].filter(s => MODULES.some(m => m.slug === s));
  return unique.length * MODULE_PRICE_CENTS;
}

/** Only the full set is discounted today; kept as a function so tiers can change in one place. */
export function savingForSelection(selection: ModuleSelection): number {
  return listPriceForSelection(selection) - priceForSelection(selection);
}

/** Narrow an untrusted array of strings to real module slugs. */
export function parseSelection(raw: unknown): ModuleSelection {
  if (!Array.isArray(raw)) return [];
  const valid = new Set(MODULES.map(m => m.slug as string));
  return [...new Set(raw.filter((x): x is string => typeof x === 'string' && valid.has(x)))] as ModuleSelection;
}
