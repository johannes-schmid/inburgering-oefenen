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
 * NOTE — this file describes the offer, not the entitlement. The recurring machinery lives in
 * `/api/checkout-modules` (customer + `sequenceType: first`) and `lib/mollie-modules.ts` (grant +
 * subscription); entitlement is `lib/entitlements.ts`. `PRODUCTS` in `lib/api-constants.ts` is
 * now only read to describe *historic* one-off payments — nothing sells those tiers any more.
 */
import { LEVELS, SKILLS, getFormat, type Level, type SkillSlug } from '@/data/skills';
import { moduleId, type ModuleId } from './entitlements';

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

/**
 * The bundle discount as a whole percentage — 24.75% today, shown as 25%.
 *
 * Derived, never typed by hand: a "25%" that stops matching the prices beside it is a false price
 * claim, and the two numbers must move together if the owner reprices. Rounded down, so the stated
 * percentage is never larger than the discount actually given.
 */
export const BUNDLE_SAVING_PCT = Math.floor((BUNDLE_SAVING_CENTS / BUNDLE_LIST_PRICE_CENTS) * 100);

/** `1295` → `"12,95"`. Dutch decimal comma; pricing must always show a concrete number. */
export function euro(cents: number): string {
  return `€${(cents / 100).toFixed(2).replace('.', ',')}`;
}

/** A module is one skill at one level — `a2:lezen`. See lib/entitlements.ts. */
export type ModuleSlug = ModuleId;

export type ModuleOffer = {
  slug: ModuleSlug;
  level: Level;
  skill: SkillSlug;
  priceCents: number;
  /** Practice exams included — all of them for this skill at this level. */
  examCount: number;
  /** Total questions or tasks across those exams. `null` where the format is unverified. */
  itemCount: number | null;
  /** Rubric feedback on open answers only exists for the two open-scored skills. */
  hasRubricFeedback: boolean;
};

export const MODULES: ModuleOffer[] = LEVELS.flatMap(level =>
  SKILLS.map(skill => {
    const fmt = getFormat(level, skill.slug);
    return {
      slug: moduleId(level, skill.slug),
      level,
      skill: skill.slug,
      priceCents: MODULE_PRICE_CENTS,
      examCount: fmt.examCount,
      // Stays null rather than collapsing to 0: "0 vragen" on a pricing page is a false
      // claim about the product, whereas an em dash is an honest "not counted yet".
      itemCount: fmt.itemCount === null ? null : fmt.itemCount * fmt.examCount,
      hasRubricFeedback: skill.scoring === 'open',
    };
  }),
);

export function getModule(slug: string): ModuleOffer | undefined {
  return MODULES.find(m => m.slug === slug);
}

export function modulesForLevel(level: Level): ModuleOffer[] {
  return MODULES.filter(m => m.level === level);
}

/** Every practice exam at one level — what "alle oefenexamens" means in that level's copy. */
export function totalExamsForLevel(level: Level): number {
  return modulesForLevel(level).reduce((n, m) => n + m.examCount, 0);
}

/**
 * There is deliberately no `TOTAL_EXAMS` constant any more.
 *
 * It used to mean "every exam in the product" and equalled 40, which was both the catalogue
 * size and the number of exams that actually exist. Adding B1 silently made it 80 while forty
 * of those were empty slots, turning two pieces of marketing copy ("40 oefenexamens") into
 * claims about content nobody has written. Call `totalExamsForLevel(level)` and say which
 * level you are advertising.
 */


/* ── What a selection costs ───────────────────────────────────────────────── */

export type ModuleSelection = ModuleSlug[];

/**
 * Price for a set of modules, in cents.
 *
 * **The bundle is per level.** All four onderdelen of *one* level is the bundle price; the
 * discount does not compound across levels. Someone taking all eight pays two bundles.
 *
 * This is the arithmetic that quietly broke when B1 arrived: the old rule was
 * `selection.length === 4 → bundle`, which would have sold all four B1 modules at the A2
 * bundle price, and — worse — charged one bundle for a mixed basket of two A2 and two B1
 * modules that gets no discount at all under the stated offer.
 *
 * **Always compute this server-side.** The checkout route must never accept an amount from the
 * client: a posted total is a posted discount.
 */
export function priceForSelection(selection: ModuleSelection): number {
  const unique = uniqueValid(selection);
  if (unique.length === 0) return 0;

  let total = 0;
  for (const level of LEVELS) {
    const n = unique.filter(s => getModule(s)?.level === level).length;
    if (n === 0) continue;
    total += n === SKILLS.length ? BUNDLE_PRICE_CENTS : n * MODULE_PRICE_CENTS;
  }
  return total;
}

/** Undiscounted total, for showing what the bundle saves. */
export function listPriceForSelection(selection: ModuleSelection): number {
  return uniqueValid(selection).length * MODULE_PRICE_CENTS;
}

/** Only a complete level is discounted today; kept as a function so tiers can change here. */
export function savingForSelection(selection: ModuleSelection): number {
  return listPriceForSelection(selection) - priceForSelection(selection);
}

function uniqueValid(selection: ModuleSelection): ModuleSlug[] {
  return [...new Set(selection)].filter(s => MODULES.some(m => m.slug === s));
}

/**
 * Narrow an untrusted array of strings to real module ids.
 *
 * A bare skill slug is accepted and read as A2, matching `normaliseModule` in
 * lib/entitlements.ts — an older client (or a stale cached bundle) posting `['lezen']` must
 * still buy the thing it meant, not silently price to zero.
 */
export function parseSelection(raw: unknown): ModuleSelection {
  if (!Array.isArray(raw)) return [];
  const out: ModuleSlug[] = [];
  for (const x of raw) {
    if (typeof x !== 'string') continue;
    const candidate = (SKILL_SLUG_SET.has(x) ? moduleId('a2', x as SkillSlug) : x) as ModuleSlug;
    if (MODULES.some(m => m.slug === candidate)) out.push(candidate);
  }
  return [...new Set(out)];
}

const SKILL_SLUG_SET = new Set<string>(SKILLS.map(s => s.slug));
