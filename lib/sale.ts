/**
 * De regels van de Black Friday-actie: wanneer hij loopt en wie hem krijgt.
 *
 * Eén plek voor drie lezers: de banner (toont hem), de kiezer en `/premium` (tonen de prijs), en
 * `/api/checkout-modules` (rekent hem). Ze moeten precies hetzelfde zeggen: een banner die 10%
 * belooft aan iemand die bij het afrekenen de volle prijs ziet, is een misleidende prijs.
 *
 * **Alleen voor wie niets open heeft.** Wie een module of een oud all-access-pakket heeft, ziet de
 * actie niet en krijgt hem niet — ook niet door de code te typen. Een lopend abonnement wijzigen
 * gaat via `/api/change-modules`, dat deze actie nooit toepast.
 */
import { BLACK_FRIDAY } from './black-friday';
import { findDiscountCode, type DiscountCode } from './discount-codes';
import { modulesFromMetadata, planFromMetadata } from './entitlements';

export { BLACK_FRIDAY };

type Meta = Record<string, unknown> | null | undefined;

const START = Date.parse(BLACK_FRIDAY.startsAt);
const END = Date.parse(BLACK_FRIDAY.endsAt);

export function isSaleActive(now: Date = new Date()): boolean {
  const t = now.getTime();
  return t >= START && t < END;
}

/** Geen enkel betaald onderdeel open: geen module, geen oud pakket. Verlopen telt als niets. */
export function isSaleEligible(meta: Meta): boolean {
  return planFromMetadata(meta as never) === 'free' && modulesFromMetadata(meta as never).length === 0;
}

export type TimeLeft = { days: number; hours: number; minutes: number; seconds: number };

export function saleTimeLeft(now: Date = new Date()): TimeLeft | null {
  const ms = END - now.getTime();
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

/** De actiecode, als hij voor dit account en dit moment geldt. */
export function saleDiscountFor(meta: Meta, now: Date = new Date()): DiscountCode | null {
  if (!isSaleActive(now) || !isSaleEligible(meta)) return null;
  return findDiscountCode(BLACK_FRIDAY.code, now);
}

/**
 * Welke korting de checkout rekent.
 *
 * - Een getypte code gaat voor; codes stapelen niet.
 * - De actiecode getypt door iemand die hem niet mag gebruiken is ongeldig, niet stil genegeerd.
 * - Zonder code krijgt wie in aanmerking komt de actie vanzelf.
 */
export function resolveCheckoutDiscount(
  typedCode: string,
  meta: Meta,
  now: Date = new Date(),
): { ok: true; discount: DiscountCode | null } | { ok: false } {
  const typed = typedCode.trim();
  if (!typed) return { ok: true, discount: saleDiscountFor(meta, now) };
  const found = findDiscountCode(typed, now);
  if (!found) return { ok: false };
  if (found.code === BLACK_FRIDAY.code && !isSaleEligible(meta)) return { ok: false };
  return { ok: true, discount: found };
}
